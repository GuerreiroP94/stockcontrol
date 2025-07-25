﻿using BCrypt.Net;
using PreSystem.StockControl.Application.DTOs;
using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Domain.Entities;
using PreSystem.StockControl.Domain.Interfaces.Repositories;


namespace PreSystem.StockControl.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public UserService(IUserRepository userRepository, IUserContextService userContextService)
        {
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        // Método para autenticar o login do usuário
        public async Task<User?> AuthenticateAsync(UserLoginDto loginDto)
        {
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);
            if (user == null)
                return null;

            bool isValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);
            return isValid ? user : null;
        }

        // Método para criar um novo usuário com senha criptografada
        public async Task<UserResponseDto> CreateUserAsync(UserCreateDto dto)
        {
            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role
            };

            await _userRepository.AddAsync(user);

            return new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };
        }

        // Retorna todos os usuários cadastrados
        public async Task<List<UserResponseDto>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();

            return users.Select(u => new UserResponseDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            }).ToList();
        }

        // Retorna um usuário pelo ID
        public async Task<UserResponseDto?> GetUserByIdAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return null;

            return new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };
        }

        // Atualiza o papel do usuário
        public async Task<bool> UpdateUserRoleAsync(int id, string newRole)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            // Impede que o usuário altere o próprio papel
            var currentUserId = _userContextService.GetCurrentUserId();
            if (currentUserId == user.Id)
                throw new InvalidOperationException("Você não pode alterar seu próprio papel.");

            user.Role = newRole;
            await _userRepository.UpdateAsync(user);
            return true;
        }
        public async Task<bool> UpdateUserByAdminAsync(int id, UserUpdateDto dto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            user.Name = dto.Name;
            user.Email = dto.Email;

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }

            await _userRepository.UpdateAsync(user);
            return true;
        }

        /// <summary>
        /// Valida se a senha fornecida corresponde à senha atual do usuário
        /// </summary>
        /// <param name="userId">ID do usuário para validação</param>
        /// <param name="password">Senha em texto plano a ser verificada</param>
        /// <returns>True se a senha estiver correta, false caso contrário</returns>
        /// <exception cref="InvalidOperationException">Lançada quando o usuário não é encontrado</exception>
        public async Task<bool> ValidatePasswordAsync(int userId, string password)
        {
            // Busca o usuário no repositório
            var user = await _userRepository.GetByIdAsync(userId);

            // Se o usuário não existir, lança exceção
            if (user == null)
            {
                throw new InvalidOperationException($"Usuário com ID {userId} não encontrado.");
            }

            // Verifica se a senha fornecida corresponde ao hash armazenado no banco
            // BCrypt.Verify compara a senha em texto plano com o hash
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);

            return isPasswordValid;
        }

        // Adicione este método na implementação
        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            // Impede que o usuário delete a si mesmo
            var currentUserId = _userContextService.GetCurrentUserId();
            if (currentUserId == user.Id)
                throw new InvalidOperationException("Você não pode deletar seu próprio usuário.");

            await _userRepository.DeleteAsync(user);
            return true;
        }
    }
}
