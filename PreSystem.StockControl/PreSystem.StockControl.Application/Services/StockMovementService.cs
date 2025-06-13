#pragma warning disable IDE0290
using PreSystem.StockControl.Application.DTOs;
using PreSystem.StockControl.Application.DTOs.Filters;
using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Domain.Entities;
using PreSystem.StockControl.Domain.Interfaces.Repositories;
using Microsoft.Extensions.Logging;

namespace PreSystem.StockControl.Application.Services
{
    // Implementação do serviço de movimentações de estoque
    public class StockMovementService : IStockMovementService
    {
        private readonly IStockMovementRepository _movementRepository;
        private readonly IStockAlertRepository _alertRepository;
        private readonly IComponentRepository _componentRepository;
        private readonly IAlertManagerService _alertManager;
        private readonly IUserContextService _userContextService;
        private readonly ILogger<StockMovementService> _logger;

        public StockMovementService(
            IStockMovementRepository movementRepository,
            IStockAlertRepository alertRepository,
            IComponentRepository componentRepository,
            IAlertManagerService alertManager,
            IUserContextService userContextService,
            ILogger<StockMovementService> logger)
        {
            _movementRepository = movementRepository;
            _alertRepository = alertRepository;
            _componentRepository = componentRepository;
            _alertManager = alertManager;
            _userContextService = userContextService;
            _logger = logger;
        }

        // Registra uma nova movimentação com base no DTO
        public async Task<StockMovementDto> RegisterMovementAsync(StockMovementCreateDto dto)
        {
            try
            {
                // Recupera o ID do usuário logado via token JWT
                var userId = _userContextService.GetCurrentUserId();

                // Cria uma nova movimentação de estoque com os dados fornecidos
                var movement = new StockMovement
                {
                    ComponentId = dto.ComponentId,
                    MovementType = dto.MovementType,
                    QuantityChanged = dto.Quantity,
                    PerformedAt = DateTime.UtcNow,
                    PerformedBy = _userContextService.GetCurrentUsername() ?? "System",
                    UserId = userId
                };

                await _movementRepository.AddAsync(movement);

                // Após registrar a movimentação, busca o componente para atualizar estoque
                var component = await _componentRepository.GetByIdAsync(dto.ComponentId);
                if (component != null)
                {
                    // Atualiza o estoque do componente
                    if (dto.MovementType == "Entrada")
                    {
                        component.QuantityInStock += dto.Quantity;
                    }
                    else if (dto.MovementType == "Saida")
                    {
                        // Verifica se há estoque suficiente
                        if (component.QuantityInStock < dto.Quantity)
                        {
                            throw new InvalidOperationException($"Estoque insuficiente. Disponível: {component.QuantityInStock}");
                        }
                        component.QuantityInStock -= dto.Quantity;
                    }

                    component.UpdatedAt = DateTime.UtcNow;
                    await _componentRepository.UpdateAsync(component);

                    // Verificar alertas após movimentação
                    await _alertManager.CheckAndUpdateAlertsForComponentAsync(component.Id);

                    _logger.LogInformation(
                        "Movimentação registrada: ComponenteId={ComponentId}, Tipo={Tipo}, Quantidade={Quantidade}, NovoEstoque={NovoEstoque}",
                        dto.ComponentId, dto.MovementType, dto.Quantity, component.QuantityInStock);
                }

                // Recupera a movimentação criada com os relacionamentos
                var createdMovement = await _movementRepository.GetByIdAsync(movement.Id);

                // Validação para evitar null reference
                if (createdMovement == null)
                {
                    throw new InvalidOperationException("Erro ao recuperar movimentação criada");
                }

                return MapToDto(createdMovement);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao registrar movimentação para ComponenteId={ComponentId}", dto.ComponentId);
                throw;
            }
        }

        // Retorna todas as movimentações baseadas nos parâmetros
        public async Task<IEnumerable<StockMovementDto>> GetAllMovementsAsync(StockMovementQueryParameters parameters)
        {
            var movements = await _movementRepository.GetAllAsync();

            // Aplica filtros
            if (parameters.ComponentId.HasValue)
                movements = movements.Where(m => m.ComponentId == parameters.ComponentId.Value);

            if (!string.IsNullOrEmpty(parameters.MovementType))
                movements = movements.Where(m => m.MovementType == parameters.MovementType);

            // CORRIGIDO: Usar StartDate e EndDate ao invés de FromDate e ToDate
            if (parameters.StartDate.HasValue)
                movements = movements.Where(m => m.PerformedAt >= parameters.StartDate.Value);

            if (parameters.EndDate.HasValue)
                movements = movements.Where(m => m.PerformedAt <= parameters.EndDate.Value);

            // Ordenação e paginação
            movements = movements
                .OrderByDescending(m => m.PerformedAt)
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize);

            return movements.Select(MapToDto);
        }

        // Retorna uma movimentação por ID
        public async Task<StockMovementDto?> GetMovementByIdAsync(int id)
        {
            var movement = await _movementRepository.GetByIdAsync(id);
            return movement == null ? null : MapToDto(movement);
        }

        // Retorna movimentações de um componente específico
        public async Task<IEnumerable<StockMovementDto>> GetByComponentIdAsync(int componentId)
        {
            var movements = await _movementRepository.GetByComponentIdAsync(componentId);
            return movements.Select(MapToDto);
        }

        // Registra múltiplas movimentações de uma vez (movimentação em massa)
        public async Task<BulkMovementResultDto> RegisterBulkMovementsAsync(BulkStockMovementDto dto)
        {
            var result = new BulkMovementResultDto
            {
                TotalMovements = dto.Movements.Count,
                SuccessCount = 0,
                ErrorCount = 0,
                Errors = new List<string>(),
                AlertsGenerated = new List<int>()
            };

            // Coletar IDs únicos dos componentes afetados
            var affectedComponentIds = new HashSet<int>();

            try
            {
                foreach (var movement in dto.Movements)
                {
                    try
                    {
                        // Busca o componente para validação
                        var component = await _componentRepository.GetByIdAsync(movement.ComponentId);
                        if (component == null)
                        {
                            result.Errors.Add($"Componente ID {movement.ComponentId} não encontrado");
                            result.ErrorCount++;
                            continue;
                        }

                        // Valida se há estoque suficiente para saída
                        if (movement.MovementType == "Saida" && movement.Quantity > component.QuantityInStock)
                        {
                            result.Errors.Add($"Estoque insuficiente para o componente {component.Name}. Disponível: {component.QuantityInStock}, Solicitado: {movement.Quantity}");
                            result.ErrorCount++;
                            continue;
                        }

                        // Cria a movimentação
                        var stockMovement = new StockMovement
                        {
                            ComponentId = movement.ComponentId,
                            MovementType = movement.MovementType,
                            QuantityChanged = movement.Quantity,
                            PerformedAt = DateTime.UtcNow,
                            PerformedBy = _userContextService.GetCurrentUsername() ?? "System",
                            UserId = _userContextService.GetCurrentUserId()
                        };

                        await _movementRepository.AddAsync(stockMovement);

                        // Atualiza o estoque do componente
                        if (movement.MovementType == "Entrada")
                        {
                            component.QuantityInStock += movement.Quantity;
                        }
                        else if (movement.MovementType == "Saida")
                        {
                            component.QuantityInStock -= movement.Quantity;
                        }

                        component.UpdatedAt = DateTime.UtcNow;
                        await _componentRepository.UpdateAsync(component);

                        // Adicionar à lista de componentes afetados
                        affectedComponentIds.Add(movement.ComponentId);

                        result.SuccessCount++;

                        _logger.LogInformation(
                            "Movimentação em massa registrada: ComponenteId={ComponentId}, Tipo={Tipo}, Quantidade={Quantidade}",
                            movement.ComponentId, movement.MovementType, movement.Quantity);
                    }
                    catch (Exception ex)
                    {
                        result.Errors.Add($"Erro ao processar componente {movement.ComponentId}: {ex.Message}");
                        result.ErrorCount++;
                        _logger.LogError(ex, "Erro ao processar movimentação em massa para ComponenteId={ComponentId}", movement.ComponentId);
                    }
                }

                // Verificar alertas para todos os componentes afetados
                foreach (var componentId in affectedComponentIds)
                {
                    await _alertManager.CheckAndUpdateAlertsForComponentAsync(componentId);
                }

                result.Success = result.ErrorCount == 0;
                result.Message = result.Success
                    ? $"{result.SuccessCount} movimentações registradas com sucesso"
                    : $"{result.SuccessCount} movimentações registradas, {result.ErrorCount} erros encontrados";

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro geral ao processar movimentações em massa");
                result.Success = false;
                result.Message = "Erro ao processar movimentações em massa";
                result.Errors.Add(ex.Message);
                return result;
            }
        }
        // Registra movimentações em massa com suporte a baixa parcial
        public async Task<PartialStockResultDto> RegisterBulkMovementsPartialAsync(BulkStockMovementWithPartialDto dto)
        {
            var result = new PartialStockResultDto
            {
                Success = true,
                TotalRequested = 0,
                TotalProcessed = 0
            };

            // Coletar IDs únicos dos componentes afetados
            var affectedComponentIds = new HashSet<int>();
            var adjustedMovements = new List<StockMovementCreateDto>();

            try
            {
                foreach (var movement in dto.Movements)
                {
                    var component = await _componentRepository.GetByIdAsync(movement.ComponentId);
                    if (component == null)
                    {
                        result.Warnings.Add($"Componente ID {movement.ComponentId} não encontrado");
                        continue;
                    }

                    result.TotalRequested += movement.Quantity;

                    if (movement.MovementType == "Saida")
                    {
                        var available = component.QuantityInStock;
                        var toProcess = dto.AllowPartial
                            ? Math.Min(movement.Quantity, available)
                            : movement.Quantity;

                        if (available == 0 && movement.Quantity > 0)
                        {
                            result.PartialMovements.Add(new PartialMovementDto
                            {
                                ComponentId = movement.ComponentId,
                                ComponentName = component.Name,
                                Requested = movement.Quantity,
                                Processed = 0,
                                Available = 0,
                                Status = "unavailable"
                            });
                            result.Warnings.Add($"{component.Name}: Estoque zerado. Necessário comprar {movement.Quantity} unidades.");

                            if (!dto.AllowPartial)
                            {
                                result.Success = false;
                                result.Warnings.Add($"Operação cancelada: {component.Name} não tem estoque disponível.");
                                return result;
                            }
                        }
                        else if (available < movement.Quantity)
                        {
                            if (dto.AllowPartial)
                            {
                                adjustedMovements.Add(new StockMovementCreateDto
                                {
                                    ComponentId = movement.ComponentId,
                                    MovementType = movement.MovementType,
                                    Quantity = available
                                });
                                result.TotalProcessed += available;
                                result.PartialMovements.Add(new PartialMovementDto
                                {
                                    ComponentId = movement.ComponentId,
                                    ComponentName = component.Name,
                                    Requested = movement.Quantity,
                                    Processed = available,
                                    Available = available,
                                    Status = "partial"
                                });
                                result.Warnings.Add(
                                    $"{component.Name}: Estoque parcial. Baixa de {available} de {movement.Quantity} solicitadas. " +
                                    $"Estoque zerado! Necessário comprar {movement.Quantity - available} unidades."
                                );
                                affectedComponentIds.Add(movement.ComponentId);
                            }
                            else
                            {
                                result.Success = false;
                                result.Warnings.Add($"Estoque insuficiente para {component.Name}. Disponível: {available}, Solicitado: {movement.Quantity}");
                                return result;
                            }
                        }
                        else
                        {
                            adjustedMovements.Add(new StockMovementCreateDto
                            {
                                ComponentId = movement.ComponentId,
                                MovementType = movement.MovementType,
                                Quantity = movement.Quantity
                            });
                            result.TotalProcessed += movement.Quantity;
                            result.PartialMovements.Add(new PartialMovementDto
                            {
                                ComponentId = movement.ComponentId,
                                ComponentName = component.Name,
                                Requested = movement.Quantity,
                                Processed = movement.Quantity,
                                Available = available,
                                Status = "full"
                            });
                            affectedComponentIds.Add(movement.ComponentId);
                        }
                    }
                    else
                    {
                        // Entrada sempre processa total
                        adjustedMovements.Add(new StockMovementCreateDto
                        {
                            ComponentId = movement.ComponentId,
                            MovementType = movement.MovementType,
                            Quantity = movement.Quantity
                        });
                        result.TotalProcessed += movement.Quantity;
                        affectedComponentIds.Add(movement.ComponentId);
                    }
                }

                // Processar apenas movimentações válidas
                if (adjustedMovements.Any())
                {
                    foreach (var movement in adjustedMovements)
                    {
                        try
                        {
                            await RegisterMovementAsync(movement);
                        }
                        catch (Exception ex)
                        {
                            result.Success = false;
                            result.Warnings.Add($"Erro ao processar componente {movement.ComponentId}: {ex.Message}");
                        }
                    }
                }

                // Verificar e gerar alertas para componentes afetados
                foreach (var componentId in affectedComponentIds)
                {
                    await _alertManager.CheckAndUpdateAlertsForComponentAsync(componentId);
                }

                // Adicionar mensagem final se houver componentes sem estoque
                if (result.Warnings.Any())
                {
                    result.Warnings.Add("\n⚠️ Para verificar componentes sem estoque e gerar relatório de compra, acesse a página de Alertas.");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar movimentações em massa com suporte parcial");
                result.Success = false;
                result.Warnings.Add($"Erro geral: {ex.Message}");
                return result;
            }
        }

        // Método privado para mapear Entity para DTO
        private StockMovementDto MapToDto(StockMovement movement)
        {
            return new StockMovementDto
            {
                Id = movement.Id,
                ComponentId = movement.ComponentId,
                ComponentName = movement.Component?.Name ?? "Unknown",
                MovementType = movement.MovementType,
                Quantity = movement.QuantityChanged,
                MovementDate = movement.PerformedAt,
                PerformedBy = movement.PerformedBy,
                UserId = movement.UserId,
                UserName = movement.User?.Name ?? movement.PerformedBy
            };
        }
    }
}
