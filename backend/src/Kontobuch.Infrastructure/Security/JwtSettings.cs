namespace Kontobuch.Infrastructure.Security;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public required string SigningKey { get; set; }
    public required string Issuer { get; set; }
    public required string Audience { get; set; }
    public int AccessTokenMinutes { get; set; } = 60;
    public int RememberMeDays { get; set; } = 30;
}
