using FluentAssertions;
using Kontobuch.Infrastructure.Security;
using Xunit;

namespace Kontobuch.Application.Tests.Security;

public class PasswordHasherAdapterTests
{
    private readonly PasswordHasherAdapter _sut = new();

    [Fact]
    public void Hash_ThenVerify_WithCorrectPassword_Succeeds()
    {
        var hash = _sut.Hash("password123");

        _sut.Verify(hash, "password123").Should().BeTrue();
    }

    [Fact]
    public void Verify_WithWrongPassword_Fails()
    {
        var hash = _sut.Hash("password123");

        _sut.Verify(hash, "wrong-password").Should().BeFalse();
    }

    [Fact]
    public void Hash_NeverReturnsThePlainTextPassword()
    {
        var hash = _sut.Hash("password123");

        hash.Should().NotBe("password123");
        hash.Should().NotContain("password123");
    }
}
