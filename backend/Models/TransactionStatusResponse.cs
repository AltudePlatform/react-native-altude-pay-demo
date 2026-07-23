namespace AltudePay.Backend.Models;

public class TransactionStatusResponse
{
    public string Signature { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool Confirmed { get; set; }
    public string? Error { get; set; }
    public long? Slot { get; set; }
}
