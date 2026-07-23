using System.ComponentModel.DataAnnotations;

namespace AltudePay.Backend.Models;

public class PaymentSendRequest
{
    /// <summary>
    /// Base64-encoded signed serialized transaction.
    /// </summary>
    [Required]
    public string SignedTransaction { get; set; } = string.Empty;
}
