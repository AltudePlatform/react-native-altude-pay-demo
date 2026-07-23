using Solnet.Programs;
using Solnet.Rpc;
using Solnet.Rpc.Builders;
using Solnet.Rpc.Types;
using Solnet.Wallet;
using AltudePay.Backend.Models;

namespace AltudePay.Backend.Services;

public interface ISolanaService
{
    Task<PaymentCreateResponse> CreatePaymentTransactionAsync(PaymentCreateRequest request);
    Task<PaymentSendResponse> BroadcastTransactionAsync(string base64SignedTransaction);
}

public class SolanaService : ISolanaService
{
    private readonly IRpcClient _rpcClient;
    private readonly ILogger<SolanaService> _logger;
    private readonly string _usdcMint;

    private const string DevnetUsdcMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
    private const int UsdcDecimals = 6;

    public SolanaService(ILogger<SolanaService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _usdcMint = configuration["Solana:UsdcMint"] ?? DevnetUsdcMint;
        _rpcClient = ClientFactory.GetClient(Cluster.DevNet);
    }

    public async Task<PaymentCreateResponse> CreatePaymentTransactionAsync(PaymentCreateRequest request)
    {
        var mint = string.IsNullOrWhiteSpace(request.Mint) ? _usdcMint : request.Mint;

        _logger.LogInformation(
            "Creating unsigned payment transaction: {Sender} -> {Recipient} {Amount} USDC",
            request.SenderAddress, request.RecipientAddress, request.Amount);

        var blockHashResult = await _rpcClient.GetRecentBlockHashAsync();
        if (!blockHashResult.WasSuccessful)
            throw new InvalidOperationException($"Failed to get recent blockhash: {blockHashResult.RawRpcResponse}");

        var recentBlockHash = blockHashResult.Result.Value.Blockhash;

        var senderPublicKey = new PublicKey(request.SenderAddress);
        var recipientPublicKey = new PublicKey(request.RecipientAddress);
        var mintPublicKey = new PublicKey(mint);

        var senderAta = AssociatedTokenAccountProgram.DeriveAssociatedTokenAccount(senderPublicKey, mintPublicKey);
        var recipientAta = AssociatedTokenAccountProgram.DeriveAssociatedTokenAccount(recipientPublicKey, mintPublicKey);

        var amountInSmallestUnit = (ulong)(request.Amount * (decimal)Math.Pow(10, UsdcDecimals));

        var recipientAtaInfo = await _rpcClient.GetAccountInfoAsync(recipientAta.Key, Commitment.Confirmed);
        bool recipientAtaExists = recipientAtaInfo.WasSuccessful && recipientAtaInfo.Result?.Value != null;

        var builder = new TransactionBuilder()
            .SetRecentBlockHash(recentBlockHash)
            .SetFeePayer(senderPublicKey);

        if (!recipientAtaExists)
        {
            builder.AddInstruction(
                AssociatedTokenAccountProgram.CreateAssociatedTokenAccount(
                    senderPublicKey,
                    recipientPublicKey,
                    mintPublicKey));
        }

        builder.AddInstruction(
            TokenProgram.TransferChecked(
                senderAta,
                recipientAta,
                amountInSmallestUnit,
                UsdcDecimals,
                senderPublicKey,
                mintPublicKey));

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
}
