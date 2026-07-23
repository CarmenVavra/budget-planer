using FluentValidation;

namespace Kontobuch.Application.Auth;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-Mail ist erforderlich.")
            .EmailAddress().WithMessage("Bitte gib eine gültige E-Mail-Adresse ein.")
            .MaximumLength(256);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Passwort ist erforderlich.")
            .MinimumLength(8).WithMessage("Mindestens 8 Zeichen.");

        RuleFor(x => x.PasswordConfirm)
            .Equal(x => x.Password).WithMessage("Die Passwörter stimmen nicht überein.");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-Mail ist erforderlich.")
            .EmailAddress().WithMessage("Bitte gib eine gültige E-Mail-Adresse ein.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Passwort ist erforderlich.");
    }
}
