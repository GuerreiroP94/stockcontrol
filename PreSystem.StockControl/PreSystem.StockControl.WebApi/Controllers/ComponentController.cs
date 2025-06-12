using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PreSystem.StockControl.Application.DTOs;
using PreSystem.StockControl.Application.DTOs.Filters;
using PreSystem.StockControl.Application.Interfaces.Services;

namespace PreSystem.StockControl.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ComponentController : ControllerBase
    {
        private readonly IComponentService _componentService;
        private readonly ILogger<ComponentController> _logger;

        public ComponentController(IComponentService componentService, ILogger<ComponentController> logger)
        {
            _componentService = componentService;
            _logger = logger;
        }

        // GET: api/Component
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ComponentDto>>> GetAll([FromQuery] ComponentFilterDto filter)
        {
            var components = await _componentService.GetAllComponentsAsync(filter);
            return Ok(components);
        }

        // GET: api/Component/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ComponentDto>> GetById(int id)
        {
            var component = await _componentService.GetComponentByIdAsync(id);
            if (component == null) return NotFound();

            return Ok(component);
        }

        // POST: api/Component
        [HttpPost]
        public async Task<ActionResult<ComponentDto>> Create([FromBody] ComponentCreateDto dto)
        {
            var created = await _componentService.AddComponentAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // PUT: api/Component/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<ComponentDto>> Update(int id, [FromBody] ComponentCreateDto dto)
        {
            var updated = await _componentService.UpdateComponentAsync(id, dto);
            if (updated == null) return NotFound();

            return Ok(updated);
        }

        // DELETE: api/Component/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _componentService.DeleteComponentAsync(id);
            if (!deleted) return NotFound();

            return NoContent();
        }

        // DELETE: api/Component/bulk (Exclusão múltipla)
        [HttpDelete("bulk")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteMultiple([FromBody] List<int> componentIds)
        {
            if (componentIds == null || !componentIds.Any())
            {
                return BadRequest("Nenhum componente selecionado");
            }

            var success = await _componentService.DeleteMultipleComponentsAsync(componentIds);

            if (success)
            {
                return NoContent();
            }
            else
            {
                return StatusCode(500, new { message = "Erro ao deletar componentes" });
            }
        }
    }
}