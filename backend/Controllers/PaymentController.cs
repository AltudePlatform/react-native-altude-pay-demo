using Microsoft.AspNetCore.Mvc;
using AltudePay.Backend.Models;
using AltudePay.Backend.Services;

namespace AltudePay.Backend.Controllers;

[ApiController]
[Route("api/payment")]
[Produces("application/json")]
public class PaymentController : ControllerBase
{
    private readonly ISolanaService _solanaService;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(ISolanaService solanaService, ILogger<PaymentController> logger)
    {
        _solanaService = solanaService;
        _logger = logger;
    }

    /// <summary>
    /// Creates an unsigned USDC transfer transaction for the mobile client.
    /// </summary>
    [HttpPost("create")]
    [ProducesResponseType(typeof(PaymentCreateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreatePayment([FromBody] PaymentCreateRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var response = await _solanaService.CreatePaymentTransactionAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment transaction");
            return StatusCode(500, new { error = "Failed to create transaction", details = ex.Message });
        }
    }

    /// <summary>
    /// Broadcasts a signed transaction to Solana and returns the signature.
    /// </summary>
    [HttpPost("send")]
    [ProducesResponseType(typeof(PaymentSendResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SendPayment([FromBody] PaymentSendRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var response = await _solanaService.BroadcastTransactionAsync(request.SignedTransaction);

            if (!response.Success)
                return BadRequest(new { error = response.Error });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting transaction");
            return StatusCode(500, new { error = "Failed to broadcast transaction", details = ex.Message });
        }
    }
}
