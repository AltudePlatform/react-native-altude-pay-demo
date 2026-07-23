using Microsoft.AspNetCore.Mvc;
using AltudePay.Backend.Models;
using AltudePay.Backend.Services;

namespace AltudePay.Backend.Controllers;

[ApiController]
[Route("api/balance")]
[Produces("application/json")]
public class WalletController : ControllerBase
{
    private readonly ISolanaService _solanaService;
    private readonly ILogger<WalletController> _logger;

    public WalletController(ISolanaService solanaService, ILogger<WalletController> logger)
    {
        _solanaService = solanaService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the SOL and USDC balance for a wallet address.
    /// </summary>
    /// <param name="wallet">Solana wallet public key (Base58)</param>
    /// <returns>SOL and USDC balances</returns>
    [HttpGet("{wallet}")]
    [ProducesResponseType(typeof(BalanceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetBalance(string wallet)
    {
        if (string.IsNullOrWhiteSpace(wallet))
            return BadRequest(new { error = "Wallet address is required" });

        if (wallet.Length < 32 || wallet.Length > 44)
            return BadRequest(new { error = "Invalid wallet address format" });

        try
        {
            var balance = await _solanaService.GetBalancesAsync(wallet);
            return Ok(balance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching balance for {Wallet}", wallet);
            return StatusCode(500, new { error = "Failed to fetch balance", details = ex.Message });
        }
    }
}
