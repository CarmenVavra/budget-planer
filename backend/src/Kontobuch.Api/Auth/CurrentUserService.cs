using System.IdentityModel.Tokens.Jwt;
using Kontobuch.Application.Abstractions;

namespace Kontobuch.Api.Auth;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid UserId
    {
        get
        {
            var sub = httpContextAccessor.HttpContext?.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var userId))
            {
                throw new InvalidOperationException("Kein authentifizierter Benutzer im aktuellen Kontext.");
            }

            return userId;
        }
    }
}
