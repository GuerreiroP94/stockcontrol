using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PreSystem.StockControl.Application.DTOs;
using PreSystem.StockControl.Application.Interfaces.Services;

namespace PreSystem.StockControl.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class GroupHierarchyController : ControllerBase
    {
        private readonly IGroupHierarchyService _hierarchyService;
        private readonly ILogger<GroupHierarchyController> _logger;

        public GroupHierarchyController(
            IGroupHierarchyService hierarchyService,
            ILogger<GroupHierarchyController> logger)
        {
            _hierarchyService = hierarchyService;
            _logger = logger;
        }

        // GET: api/grouphierarchy/full
        [HttpGet("full")]
        public async Task<ActionResult<GroupHierarchyResponseDto>> GetFullHierarchy()
        {
            var hierarchy = await _hierarchyService.GetFullHierarchyAsync();
            return Ok(hierarchy);
        }

        #region Groups

        // GET: api/grouphierarchy/groups
        [HttpGet("groups")]
        public async Task<ActionResult<IEnumerable<HierarchyItemDto>>> GetAllGroups()
        {
            var groups = await _hierarchyService.GetAllGroupsAsync();
            return Ok(groups);
        }

        // GET: api/grouphierarchy/groups/5
        [HttpGet("groups/{id}")]
        public async Task<ActionResult<HierarchyItemDto>> GetGroup(int id)
        {
            var group = await _hierarchyService.GetGroupByIdAsync(id);
            if (group == null) return NotFound();
            return Ok(group);
        }

        // POST: api/grouphierarchy/groups
        [HttpPost("groups")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> CreateGroup([FromBody] HierarchyItemCreateDto dto)
        {
            var result = await _hierarchyService.CreateGroupAsync(dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(GetGroup), new { id = result.Item?.Id }, result);
        }

        // PUT: api/grouphierarchy/groups/5
        [HttpPut("groups/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> UpdateGroup(int id, [FromBody] HierarchyItemCreateDto dto)
        {
            var result = await _hierarchyService.UpdateGroupAsync(id, dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // DELETE: api/grouphierarchy/groups/5
        [HttpDelete("groups/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> DeleteGroup(int id)
        {
            var result = await _hierarchyService.DeleteGroupAsync(id);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        #endregion

        #region Devices

        // GET: api/grouphierarchy/devices
        [HttpGet("devices")]
        public async Task<ActionResult<IEnumerable<ComponentDeviceDto>>> GetAllDevices()
        {
            var devices = await _hierarchyService.GetAllDevicesAsync();
            return Ok(devices);
        }

        // GET: api/grouphierarchy/devices/filtered?groupId=1
        [HttpGet("devices/filtered")]
        public async Task<ActionResult<IEnumerable<ComponentDeviceDto>>> GetFilteredDevices([FromQuery] int? groupId)
        {
            var devices = await _hierarchyService.GetFilteredDevicesAsync(groupId);
            return Ok(devices);
        }

        // GET: api/grouphierarchy/groups/1/devices
        [HttpGet("groups/{groupId}/devices")]
        public async Task<ActionResult<IEnumerable<ComponentDeviceDto>>> GetDevicesByGroup(int groupId)
        {
            var devices = await _hierarchyService.GetDevicesByGroupIdAsync(groupId);
            return Ok(devices);
        }

        // GET: api/grouphierarchy/devices/5
        [HttpGet("devices/{id}")]
        public async Task<ActionResult<ComponentDeviceDto>> GetDevice(int id)
        {
            var device = await _hierarchyService.GetDeviceByIdAsync(id);
            if (device == null) return NotFound();
            return Ok(device);
        }

        // POST: api/grouphierarchy/groups/1/devices
        [HttpPost("groups/{groupId}/devices")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> CreateDevice(int groupId, [FromBody] HierarchyItemCreateDto dto)
        {
            var result = await _hierarchyService.CreateDeviceAsync(groupId, dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(GetDevice), new { id = result.Item?.Id }, result);
        }

        // PUT: api/grouphierarchy/devices/5
        [HttpPut("devices/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> UpdateDevice(int id, [FromBody] HierarchyItemCreateDto dto)
        {
            var result = await _hierarchyService.UpdateDeviceAsync(id, dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // DELETE: api/grouphierarchy/devices/5
        [HttpDelete("devices/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> DeleteDevice(int id)
        {
            var result = await _hierarchyService.DeleteDeviceAsync(id);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        #endregion

        #region Values

        // GET: api/grouphierarchy/values
        [HttpGet("values")]
        public async Task<ActionResult<IEnumerable<ComponentValueDto>>> GetAllValues()
        {
            var values = await _hierarchyService.GetAllValuesAsync();
            return Ok(values);
        }

        // GET: api/grouphierarchy/values/filtered?groupId=1&deviceId=2
        [HttpGet("values/filtered")]
        public async Task<ActionResult<IEnumerable<ComponentValueDto>>> GetFilteredValues([FromQuery] int? groupId, [FromQuery] int? deviceId)
        {
            var values = await _hierarchyService.GetFilteredValuesAsync(groupId, deviceId);
            return Ok(values);
        }

        // GET: api/grouphierarchy/devices/1/values
        [HttpGet("devices/{deviceId}/values")]
        public async Task<ActionResult<IEnumerable<ComponentValueDto>>> GetValuesByDevice(int deviceId)
        {
            var values = await _hierarchyService.GetValuesByDeviceIdAsync(deviceId);
            return Ok(values);
        }

        // GET: api/grouphierarchy/values/5
        [HttpGet("values/{id}")]
        public async Task<ActionResult<ComponentValueDto>> GetValue(int id)
        {
            var value = await _hierarchyService.GetValueByIdAsync(id);
            if (value == null) return NotFound();
            return Ok(value);
        }

        // POST: api/grouphierarchy/devices/1/values
        [HttpPost("devices/{deviceId}/values")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> CreateValue(int deviceId, [FromBody] HierarchyItemCreateDto dto)
        {
            var result = await _hierarchyService.CreateValueAsync(deviceId, dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(GetValue), new { id = result.Item?.Id }, result);
        }

        // PUT: api/grouphierarchy/values/5
        [HttpPut("values/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> UpdateValue(int id, [FromBody] HierarchyItemCreateDto dto)
        {
            var result = await _hierarchyService.UpdateValueAsync(id, dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // DELETE: api/grouphierarchy/values/5
        [HttpDelete("values/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> DeleteValue(int id)
        {
            var result = await _hierarchyService.DeleteValueAsync(id);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        #endregion

        #region Packages

        // GET: api/grouphierarchy/packages
        [HttpGet("packages")]
        public async Task<ActionResult<IEnumerable<ComponentPackageDto>>> GetAllPackages()
        {
            var packages = await _hierarchyService.GetAllPackagesAsync();
            return Ok(packages);
        }

        // GET: api/grouphierarchy/packages/filtered?groupId=1&deviceId=2&valueId=3
        [HttpGet("packages/filtered")]
        public async Task<ActionResult<IEnumerable<ComponentPackageDto>>> GetFilteredPackages(
            [FromQuery] int? groupId,
            [FromQuery] int? deviceId,
            [FromQuery] int? valueId)
        {
            var packages = await _hierarchyService.GetFilteredPackagesAsync(groupId, deviceId, valueId);
            return Ok(packages);
        }

        // GET: api/grouphierarchy/values/1/packages
        [HttpGet("values/{valueId}/packages")]
        public async Task<ActionResult<IEnumerable<ComponentPackageDto>>> GetPackagesByValue(int valueId)
        {
            var packages = await _hierarchyService.GetPackagesByValueIdAsync(valueId);
            return Ok(packages);
        }

        // GET: api/grouphierarchy/packages/5
        [HttpGet("packages/{id}")]
        public async Task<ActionResult<ComponentPackageDto>> GetPackage(int id)
        {
            var package = await _hierarchyService.GetPackageByIdAsync(id);
            if (package == null) return NotFound();
            return Ok(package);
        }

        // POST: api/grouphierarchy/values/1/packages
        [HttpPost("values/{valueId}/packages")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> CreatePackage(int valueId, [FromBody] HierarchyItemCreateDto dto)
        {
            var result = await _hierarchyService.CreatePackageAsync(valueId, dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(GetPackage), new { id = result.Item?.Id }, result);
        }

        // PUT: api/grouphierarchy/packages/5
        [HttpPut("packages/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> UpdatePackage(int id, [FromBody] HierarchyItemCreateDto dto)
        {
            var result = await _hierarchyService.UpdatePackageAsync(id, dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // DELETE: api/grouphierarchy/packages/5
        [HttpDelete("packages/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<HierarchyOperationResult>> DeletePackage(int id)
        {
            var result = await _hierarchyService.DeletePackageAsync(id);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // POST: api/grouphierarchy/debug-database
        [HttpPost("debug-database")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult> DebugDatabase()
        {
            try
            {
                _logger.LogInformation("🔍 INICIANDO DEBUG DO BANCO DE DADOS");

                var debugInfo = new
                {
                    timestamp = DateTime.UtcNow,
                    database_tests = new List<object>()
                };

                // TESTE 1: Verificar conexão com banco
                try
                {
                    var allGroups = await _hierarchyService.GetAllGroupsAsync();
                    debugInfo.database_tests.Add(new
                    {
                        test = "GetAllGroups",
                        success = true,
                        count = allGroups.Count(),
                        message = "Conexão com banco OK"
                    });
                    _logger.LogInformation("✅ Teste GetAllGroups: {Count} grupos encontrados", allGroups.Count());
                }
                catch (Exception ex)
                {
                    debugInfo.database_tests.Add(new
                    {
                        test = "GetAllGroups",
                        success = false,
                        error = ex.Message,
                        message = "Erro ao conectar com banco ou consultar grupos"
                    });
                    _logger.LogError(ex, "❌ Erro no teste GetAllGroups");
                }

                // TESTE 2: Verificar se a tabela ComponentGroups existe
                try
                {
                    // Usar o service para tentar uma operação mais básica
                    var testResult = await _hierarchyService.GetGroupByIdAsync(999999); // ID que não existe
                    debugInfo.database_tests.Add(new
                    {
                        test = "GetGroupById_NonExistent",
                        success = true,
                        result = testResult,
                        message = "Tabela ComponentGroups existe e é acessível"
                    });
                    _logger.LogInformation("✅ Teste GetGroupById: Tabela existe");
                }
                catch (Exception ex)
                {
                    debugInfo.database_tests.Add(new
                    {
                        test = "GetGroupById_NonExistent",
                        success = false,
                        error = ex.Message,
                        message = "Problema com tabela ComponentGroups"
                    });
                    _logger.LogError(ex, "❌ Erro no teste GetGroupById");
                }

                // TESTE 3: Testar criação simples
                try
                {
                    var testGroupName = $"DEBUG_TEST_{DateTime.UtcNow:yyyyMMdd_HHmmss}";
                    var createDto = new HierarchyItemCreateDto { Name = testGroupName };

                    _logger.LogInformation("🔍 Tentando criar grupo de teste: {Name}", testGroupName);
                    var createResult = await _hierarchyService.CreateGroupAsync(createDto);

                    debugInfo.database_tests.Add(new
                    {
                        test = "CreateGroup_Test",
                        success = createResult.Success,
                        group_name = testGroupName,
                        result = createResult,
                        message = createResult.Success ? "Criação funcionou!" : $"Criação falhou: {createResult.Message}"
                    });

                    if (createResult.Success)
                    {
                        _logger.LogInformation("✅ Grupo de teste criado com sucesso: {Name}", testGroupName);
                    }
                    else
                    {
                        _logger.LogError("❌ Falha ao criar grupo de teste: {Message}", createResult.Message);
                    }
                }
                catch (Exception ex)
                {
                    debugInfo.database_tests.Add(new
                    {
                        test = "CreateGroup_Test",
                        success = false,
                        error = ex.Message,
                        stack_trace = ex.StackTrace,
                        message = "Exceção na criação de grupo"
                    });
                    _logger.LogError(ex, "❌ Exceção no teste CreateGroup");
                }

                _logger.LogInformation("🔍 DEBUG DO BANCO CONCLUÍDO");
                return Ok(debugInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ ERRO CRÍTICO no debug do banco");
                return StatusCode(500, new
                {
                    error = "Erro crítico no debug",
                    message = ex.Message,
                    stack_trace = ex.StackTrace
                });
            }
        }

        #endregion
    }
}