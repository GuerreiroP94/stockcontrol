using Microsoft.AspNetCore.Mvc;
using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Application.DTOs;
using PreSystem.StockControl.Application.DTOs.Filters;
using Microsoft.AspNetCore.Authorization;

namespace PreSystem.StockControl.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StockAlertController : ControllerBase
    {
        private readonly IStockAlertService _alertService;
        private readonly IAlertManagerService _alertManager;

        public StockAlertController(
            IStockAlertService alertService,
            IAlertManagerService alertManager)
        {
            _alertService = alertService;
            _alertManager = alertManager;
        }

        // GET: api/StockAlert
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StockAlertDto>>> GetAll([FromQuery] StockAlertQueryParameters parameters)
        {
            var alerts = await _alertService.GetAllAlertsAsync(parameters);
            return Ok(alerts);
        }

        // GET: api/StockAlert/component/{componentId}
        [HttpGet("component/{componentId}")]
        public async Task<ActionResult<IEnumerable<StockAlertDto>>> GetByComponent(int componentId)
        {
            var alerts = await _alertService.GetAlertsByComponentIdAsync(componentId);
            return Ok(alerts);
        }

        // GET: api/StockAlert/purchase-list
        [HttpGet("purchase-list")]
        public async Task<ActionResult<PurchaseListDto>> GetPurchaseList()
        {
            var purchaseList = await _alertService.GetPurchaseListAsync();
            return Ok(purchaseList);
        }

        // POST: api/StockAlert/generate-missing
        [HttpPost("generate-missing")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult> GenerateMissingAlerts()
        {
            try
            {
                await _alertManager.GenerateMissingAlertsAsync();

                // Buscar o total de alertas após gerar
                var alerts = await _alertService.GetAllAlertsAsync(new StockAlertQueryParameters { PageSize = 1000 });
                var totalAlerts = alerts.Count();

                return Ok(new
                {
                    success = true,
                    message = "Alertas gerados com sucesso",
                    totalAlerts = totalAlerts
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erro ao gerar alertas",
                    error = ex.Message
                });
            }
        }

        // POST: api/StockAlert/recalculate-all
        [HttpPost("recalculate-all")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult> RecalculateAllAlerts()
        {
            try
            {
                await _alertManager.CheckAndUpdateAllAlertsAsync();

                // Buscar o total de alertas após recalcular
                var alerts = await _alertService.GetAllAlertsAsync(new StockAlertQueryParameters { PageSize = 1000 });
                var totalAlerts = alerts.Count();

                return Ok(new
                {
                    success = true,
                    message = "Alertas recalculados com sucesso",
                    totalAlerts = totalAlerts
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Erro ao recalcular alertas",
                    error = ex.Message
                });
            }
        }
    }
}