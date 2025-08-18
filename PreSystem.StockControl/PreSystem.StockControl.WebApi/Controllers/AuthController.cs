using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PreSystem.StockControl.Application.DTOs;
using PreSystem.StockControl.Application.Interfaces.Services;
using PreSystem.StockControl.Domain.Entities;
using PreSystem.StockControl.Domain.Interfaces.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

namespace PreSystem.StockControl.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IUserRepository _userRepository;
        private readonly IPasswordResetTokenRepository _passwordResetTokenRepository;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IConfiguration configuration,
            IUserRepository userRepository,
            IPasswordResetTokenRepository passwordResetTokenRepository,
            IEmailService emailService,
            ILogger<AuthController> logger)
        {
            _configuration = configuration;
            _userRepository = userRepository;
            _passwordResetTokenRepository = passwordResetTokenRepository;
            _emailService = emailService;
            _logger = logger;
        }

        // POST: api/auth/login
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto login)
        {
            // 1. Consulta o usuário no banco pelo e-mail
            var user = await _userRepository.GetByEmailAsync(login.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(login.Password, user.PasswordHash))
                return Unauthorized("Usuário ou senha inválidos.");

            // 2. Criação das claims incluindo role e ID
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim("UserId", user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role ?? "operator")
            };

            // 3. Obtém a chave JWT (primeiro tenta variável de ambiente, depois appsettings)
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET") ??
                            _configuration.GetValue<string>("JwtSettings:Secret") ??
                            "chave-secreta-super-segura-para-producao-123456";

            // Para compatibilidade, definir issuer e audience como opcionais
            var issuer = _configuration.GetValue<string>("JwtSettings:Issuer") ?? "PreSystemStockControl";
            var audience = _configuration.GetValue<string>("JwtSettings:Audience") ?? "PreSystemStockControl";

            Console.WriteLine($"🔑 JWT Secret obtido (length: {secretKey.Length})");

            if (string.IsNullOrEmpty(secretKey))
                throw new InvalidOperationException("JWT Secret Key não encontrado nem em variável de ambiente nem em appsettings.json");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // 4. Gera o token JWT com 2h de expiração
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: creds
            );
            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // 5. Retorna o token junto com informações do usuário (opcional mas útil)
            return Ok(new
            {
                Token = tokenString,
                User = new
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Role = user.Role
                }
            });
        }

        // POST: api/auth/forgot-password
        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            try
            {
                // Busca o usuário pelo email
                var user = await _userRepository.GetByEmailAsync(dto.Email);

                // Por segurança, sempre retorna sucesso mesmo se o email não existir
                if (user == null)
                {
                    _logger.LogWarning("Tentativa de recuperação de senha para email não cadastrado: {Email}", dto.Email);
                    return Ok(new PasswordResetResponseDto
                    {
                        Success = true,
                        Message = "Se o email existir em nossa base, você receberá as instruções de recuperação."
                    });
                }

                // Invalida tokens anteriores
                await _passwordResetTokenRepository.InvalidateTokensByEmailAsync(dto.Email);

                // Cria novo token
                var resetToken = new PasswordResetToken
                {
                    Email = dto.Email,
                    UserId = user.Id,
                    Token = Guid.NewGuid().ToString(),
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                };

                await _passwordResetTokenRepository.AddAsync(resetToken);

                // Monta o link de reset
                var frontendUrl = _configuration.GetValue<string>("FrontendUrl") ?? "http://localhost:3000";
                var resetLink = $"{frontendUrl}/reset-password?token={resetToken.Token}";

                // Envia o email
                var emailSent = await _emailService.SendPasswordResetEmailAsync(dto.Email, resetLink);

                // Em desenvolvimento, retorna o token para facilitar testes
                var isDevelopment = _configuration.GetValue<bool>("EmailSettings:UseDevelopmentMode", true);

                return Ok(new PasswordResetResponseDto
                {
                    Success = true,
                    Message = "Se o email existir em nossa base, você receberá as instruções de recuperação.",
                    Token = isDevelopment ? resetToken.Token : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar recuperação de senha");
                return StatusCode(500, new { message = "Erro ao processar solicitação" });
            }
        }

        // POST: api/auth/reset-password
        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            try
            {
                // Busca o token válido
                var resetToken = await _passwordResetTokenRepository.GetByTokenAsync(dto.Token);

                if (resetToken == null)
                {
                    return BadRequest(new PasswordResetResponseDto
                    {
                        Success = false,
                        Message = "Token inválido ou expirado."
                    });
                }

                // Busca o usuário
                var user = await _userRepository.GetByEmailAsync(resetToken.Email);
                if (user == null)
                {
                    return BadRequest(new PasswordResetResponseDto
                    {
                        Success = false,
                        Message = "Usuário não encontrado."
                    });
                }

                // Atualiza a senha
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                await _userRepository.UpdateAsync(user);

                // Marca o token como usado
                resetToken.IsUsed = true;
                await _passwordResetTokenRepository.UpdateAsync(resetToken);

                _logger.LogInformation("Senha resetada com sucesso para o usuário: {Email}", user.Email);

                return Ok(new PasswordResetResponseDto
                {
                    Success = true,
                    Message = "Senha alterada com sucesso! Você já pode fazer login."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao resetar senha");
                return StatusCode(500, new { message = "Erro ao processar solicitação" });
            }
        }

        // GET: api/auth/validate-token/{token}
        [AllowAnonymous]
        [HttpGet("validate-token/{token}")]
        public async Task<IActionResult> ValidateResetToken(string token)
        {
            var resetToken = await _passwordResetTokenRepository.GetByTokenAsync(token);

            if (resetToken == null)
            {
                return Ok(new { valid = false, message = "Token inválido ou expirado" });
            }

            return Ok(new { valid = true, email = resetToken.Email });
        }
    }
}