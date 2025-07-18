﻿using PreSystem.StockControl.Application.DTOs;
using PreSystem.StockControl.Domain.Entities;

namespace PreSystem.StockControl.Application.Interfaces.Services
{
    public interface IUserService
    {
        // Autenticação
        Task<User?> AuthenticateAsync(UserLoginDto loginDto);

        // Cadastro
        Task<UserResponseDto> CreateUserAsync(UserCreateDto dto);

        // Consulta
        Task<List<UserResponseDto>> GetAllUsersAsync();
        Task<UserResponseDto?> GetUserByIdAsync(int id);

        // Atualização de papel
        Task<bool> UpdateUserRoleAsync(int userId, string newRole);

        // Atualização de usuário por admin
        Task<bool> UpdateUserByAdminAsync(int id, UserUpdateDto dto);

        // Deletar usuário
        Task<bool> DeleteUserAsync(int id);

        /// <summary>
        /// Valida se a senha fornecida corresponde à senha atual do usuário
        /// </summary>
        /// <param name="userId">ID do usuário</param>
        /// <param name="password">Senha a ser validada</param>
        /// <returns>True se a senha estiver correta, false caso contrário</returns>
        Task<bool> ValidatePasswordAsync(int userId, string password);

    }
}
