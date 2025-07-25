﻿using PreSystem.StockControl.Application.DTOs;
using PreSystem.StockControl.Application.DTOs.Filters;

namespace PreSystem.StockControl.Application.Interfaces.Services
{
    // Interface que define os métodos disponíveis no serviço de movimentações
    public interface IStockMovementService
    {
        // Registra uma nova movimentação
        Task<StockMovementDto> RegisterMovementAsync(StockMovementCreateDto dto);

        // Retorna todas as movimentações
        Task<IEnumerable<StockMovementDto>> GetAllMovementsAsync(StockMovementQueryParameters parameters);

        // Retorna uma movimentação por ID
        Task<StockMovementDto?> GetMovementByIdAsync(int id);

        // Retorna movimentações de um componente específico
        Task<IEnumerable<StockMovementDto>> GetByComponentIdAsync(int componentId);

        // Registra movimentações em massa
        Task<BulkMovementResultDto> RegisterBulkMovementsAsync(BulkStockMovementDto dto);

        // Registra movimentações em massa com suporte a baixa parcial
        Task<PartialStockResultDto> RegisterBulkMovementsPartialAsync(BulkStockMovementWithPartialDto dto);
    }
}