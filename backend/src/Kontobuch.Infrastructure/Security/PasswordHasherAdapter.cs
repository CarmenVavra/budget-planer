using Kontobuch.Application.Abstractions;
using Kontobuch.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace Kontobuch.Infrastructure.Security;

/// <summary>Thin adapter over ASP.NET Core's PasswordHasher (PBKDF2, adaptive iterations) — no custom crypto.</summary>
public class PasswordHasherAdapter : IPasswordHasher
{
    private readonly PasswordHasher<User> _inner = new();

    public string Hash(string password) => _inner.HashPassword(default!, password);

    public bool Verify(string hash, string providedPassword) =>
        _inner.VerifyHashedPassword(default!, hash, providedPassword) != PasswordVerificationResult.Failed;
}
