namespace AltudePay.Backend.Models;

public class PaymentCreateResponse
{
    /// <summary>
    /// Base64-encoded unsigned serialized transaction.
    /// </summary>
    public string UnsignedTransaction { get; set; } = string.Empty;

    public string SenderAddress { get; set; } = string.Empty;
    public string RecipientAddress { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Mint { get; set; } = string.Empty;
}
