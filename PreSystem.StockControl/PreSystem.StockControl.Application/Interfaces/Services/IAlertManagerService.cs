namespace PreSystem.StockControl.Application.Interfaces.Services
{
    public interface IAlertManagerService
    {
        Task CheckAndUpdateAlertsForComponentAsync(int componentId);
        Task CheckAndUpdateAllAlertsAsync();
        Task GenerateMissingAlertsAsync();
    }
}