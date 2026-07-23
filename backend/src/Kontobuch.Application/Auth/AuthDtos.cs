namespace Kontobuch.Application.Auth;

public record RegisterRequest(string Email, string Password, string PasswordConfirm);

public record LoginRequest(string Email, string Password, bool RememberMe);

public record AuthResponse(string Token, DateTime ExpiresAt, string Email);
