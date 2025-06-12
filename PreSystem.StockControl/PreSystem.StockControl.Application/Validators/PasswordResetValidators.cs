using FluentValidation;
using PreSystem.StockControl.Application.DTOs;

namespace PreSystem.StockControl.Application.Validators
{
    public class ForgotPasswordDtoValidator : AbstractValidator<ForgotPasswordDto>
    {
        public ForgotPasswordDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("O e-mail é obrigatório.")
                .EmailAddress().WithMessage("Formato de e-mail inválido.");
        }
    }

    public class ResetPasswordDtoValidator : AbstractValidator<ResetPasswordDto>
    {
        public ResetPasswordDtoValidator()
        {
            RuleFor(x => x.Token)
                .NotEmpty().WithMessage("O token é obrigatório.");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("A nova senha é obrigatória.")
                .MinimumLength(6).WithMessage("A senha deve ter pelo menos 6 caracteres.")
                .Matches(@"[A-Z]").WithMessage("A senha deve conter pelo menos uma letra maiúscula.")
                .Matches(@"[a-z]").WithMessage("A senha deve conter pelo menos uma letra minúscula.")
                .Matches(@"[0-9]").WithMessage("A senha deve conter pelo menos um número.");

            RuleFor(x => x.ConfirmPassword)
                .NotEmpty().WithMessage("A confirmação de senha é obrigatória.")
                .Equal(x => x.NewPassword).WithMessage("As senhas não coincidem.");
        }
    }
}