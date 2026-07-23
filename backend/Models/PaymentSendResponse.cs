namespace AltudePay.Backend.Models;

public class PaymentSendResponse
{
    public string Signature { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Error { get; set; }
}
