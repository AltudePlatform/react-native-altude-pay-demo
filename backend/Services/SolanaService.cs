using Solnet.Programs;
using Solnet.Rpc;
using Solnet.Rpc.Builders;
using Solnet.Rpc.Models;
using Solnet.Rpc.Types;
using Solnet.Wallet;
using AltudePay.Backend.Models;

namespace AltudePay.Backend.Services;

public interface ISolanaService
{
    Task<BalanceResponse> GetBalancesAsync(string walletAddress);
    Task<PaymentCreateResponse> CreatePaymentTransactionAsync(PaymentCreateRequest request);
    Task<PaymentSendResponse> BroadcastTransactionAsync(string base64SignedTransaction);
    Task<TransactionStatusResponse> GetTransactionStatusAsync(string signature);
}

public class SolanaService : ISolanaService
{
    private readonly IRpcClient _rpcClient;
    private readonly ILogger<SolanaService> _logger;
    private readonly string _usdcMint;

    // USDC mint on Solana Devnet
    private const string DevnetUsdcMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
    private const int UsdcDecimals = 6;

    public SolanaService(ILogger<SolanaService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _usdcMint = configuration["Solana:UsdcMint"] ?? DevnetUsdcMint;
        _rpcClient = ClientFactory.GetClient(Cluster.DevNet);
    }

    public async Task<BalanceResponse> GetBalancesAsync(string walletAddress)
    {
        _logger.LogInformation("Fetching balances for {Wallet}", walletAddress);

        var response = new BalanceResponse { WalletAddress = walletAddress };

        // SOL balance
        var solBalanceResult = await _rpcClient.GetBalanceAsync(walletAddress, Commitment.Confirmed);
        if (solBalanceResult.WasSuccessful)
        {
            // Balance is in lamports; 1 SOL = 1,000,000,000 lamports
            response.SolBalance = (decimal)solBalanceResult.Result.Value / 1_000_000_000m;
        }

        // USDC balance via token accounts
        var tokenAccountsResult = await _rpcClient.GetTokenAccountsByOwnerAsync(
            walletAddress,
            _usdcMint,
            null,
            Commitment.Confirmed);

        if (tokenAccountsResult.WasSuccessful && tokenAccountsResult.Result?.Value != null)
        {
            foreach (var account in tokenAccountsResult.Result.Value)
            {
                var tokenInfo = account.Account?.Data?.Parsed?.Info;
                if (tokenInfo?.Mint == _usdcMint)
                {
                    if (decimal.TryParse(
                        tokenInfo.TokenAmount?.UiAmountString,
                        System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out var usdcAmount))
                    {
                        response.UsdcBalance += usdcAmount;
                    }
                }
            }
        }

        return response;
    }

    public async Task<PaymentCreateResponse> CreatePaymentTransactionAsync(PaymentCreateRequest request)
    {
        var mint = string.IsNullOrWhiteSpace(request.Mint) ? _usdcMint : request.Mint;

        _logger.LogInformation(
            "Creating payment transaction: {Sender} -> {Recipient} {Amount} USDC",
            request.SenderAddress, request.RecipientAddress, request.Amount);

        // Get recent blockhash
        var blockHashResult = await _rpcClient.GetRecentBlockHashAsync();
        if (!blockHashResult.WasSuccessful)
            throw new InvalidOperationException($"Failed to get recent blockhash: {blockHashResult.RawRpcResponse}");

        var recentBlockHash = blockHashResult.Result.Value.Blockhash;

        var senderPublicKey = new PublicKey(request.SenderAddress);
        var recipientPublicKey = new PublicKey(request.RecipientAddress);
        var mintPublicKey = new PublicKey(mint);

        // Derive associated token accounts
        var senderAta = AssociatedTokenAccountProgram.DeriveAssociatedTokenAccount(senderPublicKey, mintPublicKey);
        var recipientAta = AssociatedTokenAccountProgram.DeriveAssociatedTokenAccount(recipientPublicKey, mintPublicKey);

        // Convert USDC amount (with 6 decimals) to smallest unit
        var amountInSmallestUnit = (ulong)(request.Amount * (decimal)Math.Pow(10, UsdcDecimals));

        // Check if recipient ATA exists; if not, include create instruction
        var recipientAtaInfo = await _rpcClient.GetAccountInfoAsync(recipientAta.Key, Commitment.Confirmed);
        bool recipientAtaExists = recipientAtaInfo.WasSuccessful && recipientAtaInfo.Result?.Value != null;

        var builder = new TransactionBuilder()
            .SetRecentBlockHash(recentBlockHash)
            .SetFeePayer(senderPublicKey);

        // Create recipient ATA if it doesn't exist
        if (!recipientAtaExists)
        {
            builder.AddInstruction(
                AssociatedTokenAccountProgram.CreateAssociatedTokenAccount(
                    senderPublicKey,
                    recipientPublicKey,
                    mintPublicKey));
        }

        // Transfer instruction
        builder.AddInstruction(
            TokenProgram.TransferChecked(
                senderAta,
                recipientAta,
                amountInSmallestUnit,
                UsdcDecimals,
                senderPublicKey,
                mintPublicKey));

        // Compile the unsigned message
        var messageBytes = builder.CompileMessage();
        var base64Transaction = Convert.ToBase64String(messageBytes);

        return new PaymentCreateResponse
        {
            UnsignedTransaction = base64Transaction,
            SenderAddress = request.SenderAddress,
            RecipientAddress = request.RecipientAddress,
            Amount = request.Amount,
            Mint = mint
        };
    }

    public async Task<PaymentSendResponse> BroadcastTransactionAsync(string base64SignedTransaction)
    {
        _logger.LogInformation("Broadcasting signed transaction");

        byte[] txBytes;
        try
        {
            txBytes = Convert.FromBase64String(base64SignedTransaction);
        }
        catch (FormatException ex)
        {
            _logger.LogError(ex, "Invalid base64 transaction");
            return new PaymentSendResponse { Success = false, Error = "Invalid base64 encoding" };
        }

        var result = await _rpcClient.SendTransactionAsync(txBytes, skipPreflight: false, Commitment.Confirmed);

        if (result.WasSuccessful)
        {
            _logger.LogInformation("Transaction broadcast successful: {Signature}", result.Result);
            return new PaymentSendResponse
            {
                Success = true,
                Signature = result.Result
            };
        }

        var errorMessage = result.Reason ?? result.RawRpcResponse;
        _logger.LogWarning("Transaction broadcast failed: {Error}", errorMessage);
        return new PaymentSendResponse
        {
            Success = false,
            Error = errorMessage
        };
    }

    public async Task<TransactionStatusResponse> GetTransactionStatusAsync(string signature)
    {
        _logger.LogInformation("Getting transaction status for {Signature}", signature);

        var result = await _rpcClient.GetTransactionAsync(signature, Commitment.Confirmed);

        if (!result.WasSuccessful)
        {
            return new TransactionStatusResponse
            {
                Signature = signature,
                Status = "not_found",
                Confirmed = false,
                Error = result.Reason
            };
        }

        if (result.Result == null)
        {
            return new TransactionStatusResponse
            {
                Signature = signature,
                Status = "pending",
                Confirmed = false
            };
        }

        var tx = result.Result;
        bool hasError = tx.Meta?.Error != null;

        return new TransactionStatusResponse
        {
            Signature = signature,
            Status = hasError ? "failed" : "confirmed",
            Confirmed = !hasError,
            Slot = (long?)tx.Slot,
            Error = hasError ? tx.Meta?.Error?.ToString() : null
        };
    }
}
