using FluentValidation;
using Kontobuch.Application.Abstractions;
using Kontobuch.Application.Common.Exceptions;
using Kontobuch.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kontobuch.Application.Auth;

public class AuthService(
    IAppDbContext db,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService,
    IValidator<RegisterRequest> registerValidator,
    IValidator<LoginRequest> loginValidator) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        await registerValidator.ValidateAndThrowAsync(request, ct);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailTaken = await db.Users.AnyAsync(u => u.Email == normalizedEmail, ct);
        if (emailTaken)
        {
            throw new ConflictException("Diese E-Mail-Adresse wird bereits verwendet.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            PasswordHash = passwordHasher.Hash(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        var (token, expiresAt) = jwtTokenService.GenerateToken(user.Id, user.Email, longLived: false);
        return new AuthResponse(token, expiresAt, user.Email);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        await loginValidator.ValidateAndThrowAsync(request, ct);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);
        if (user is null || !passwordHasher.Verify(user.PasswordHash, request.Password))
        {
            // Deliberately generic — do not reveal whether the email exists.
            throw new AuthenticationException("E-Mail oder Passwort ist falsch.");
        }

        var (token, expiresAt) = jwtTokenService.GenerateToken(user.Id, user.Email, request.RememberMe);
        return new AuthResponse(token, expiresAt, user.Email);
    }
}
