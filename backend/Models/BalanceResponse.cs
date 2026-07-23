namespace AltudePay.Backend.Models;

public class BalanceResponse
{
    public string WalletAddress { get; set; } = string.Empty;
    public decimal SolBalance { get; set; }
    public decimal UsdcBalance { get; set; }
}
