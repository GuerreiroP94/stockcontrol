namespace PreSystem.StockControl.Application.DTOs
{
    public class PartialStockResultDto
    {
        public bool Success { get; set; }
        public int TotalRequested { get; set; }
        public int TotalProcessed { get; set; }
        public List<PartialMovementDto> PartialMovements { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }

    public class PartialMovementDto
    {
        public int ComponentId { get; set; }
        public string ComponentName { get; set; } = string.Empty;
        public int Requested { get; set; }
        public int Processed { get; set; }
        public int Available { get; set; }
        public string Status { get; set; } = string.Empty; // "full", "partial", "unavailable"
    }

    public class BulkStockMovementWithPartialDto : BulkStockMovementDto
    {
        public bool AllowPartial { get; set; } = false;
    }
}