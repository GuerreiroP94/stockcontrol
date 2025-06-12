namespace PreSystem.StockControl.Application.DTOs
{
    public class PurchaseListDto
    {
        public List<PurchaseListItemDto> Items { get; set; } = new();
        public decimal TotalValue { get; set; }
        public int TotalItems { get; set; }
    }

    public class PurchaseListItemDto
    {
        public string ComponentName { get; set; } = string.Empty;  
        public string Group { get; set; } = string.Empty;
        public string? Device { get; set; }
        public string? Value { get; set; }
        public string? Package { get; set; }
        public string? InternalCode { get; set; }
        public List<string> Environments { get; set; } = new();
        public int MaximumMinimumQuantity { get; set; }
        public int SuggestedPurchase { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }
}