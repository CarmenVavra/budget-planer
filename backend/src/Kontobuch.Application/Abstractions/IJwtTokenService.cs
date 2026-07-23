namespace Kontobuch.Application.Abstractions;

public interface IJwtTokenService
{
    /// <param name="longLived">True when the user chose "Angemeldet bleiben" — extends token lifetime.</param>
    (string Token, DateTime ExpiresAt) GenerateToken(Guid userId, string email, bool longLived);
}
