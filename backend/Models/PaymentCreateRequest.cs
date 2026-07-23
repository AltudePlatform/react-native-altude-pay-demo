using System.ComponentModel.DataAnnotations;

namespace AltudePay.Backend.Models;

public class PaymentCreateRequest
{
    [Required]
    public string SenderAddress { get; set; } = string.Empty;

    [Required]
    public string RecipientAddress { get; set; } = string.Empty;

    [Required]
    [Range(0.000001, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }

    /// <summary>
    /// SPL token mint address. Defaults to USDC on Devnet.
    /// </summary>
    public string? Mint { get; set; }

    public string? Memo { get; set; }
}
