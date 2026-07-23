using Kontobuch.Application.Abstractions;

namespace Kontobuch.Application.Tests.TestHelpers;

public class FakeCurrentUserService(Guid userId) : ICurrentUserService
{
    public Guid UserId { get; } = userId;
}
