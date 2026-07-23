using FluentAssertions;
using FluentValidation;
using Kontobuch.Application.Abstractions;
using Kontobuch.Application.Auth;
using Kontobuch.Application.Common.Exceptions;
using Kontobuch.Application.Tests.TestHelpers;
using Kontobuch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Kontobuch.Application.Tests.Auth;

public class AuthServiceTests
{
    private readonly AppDbContext _db = TestDbContextFactory.Create();
    private readonly Mock<IPasswordHasher> _passwordHasher = new();
    private readonly Mock<IJwtTokenService> _jwtTokenService = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _passwordHasher.Setup(p => p.Hash(It.IsAny<string>())).Returns("hashed-password");
        _jwtTokenService
            .Setup(j => j.GenerateToken(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<bool>()))
            .Returns(("fake-jwt-token", DateTime.UtcNow.AddHours(1)));

        _sut = new AuthService(
            _db,
            _passwordHasher.Object,
            _jwtTokenService.Object,
            new RegisterRequestValidator(),
            new LoginRequestValidator());
    }

    [Fact]
    public async Task RegisterAsync_ValidRequest_CreatesUserAndReturnsToken()
    {
        var request = new RegisterRequest("maria.keller@email.de", "password123", "password123");

        var result = await _sut.RegisterAsync(request, CancellationToken.None);

        result.Token.Should().Be("fake-jwt-token");
        result.Email.Should().Be("maria.keller@email.de");
        (await _db.Users.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ThrowsConflictException()
    {
        await _sut.RegisterAsync(new RegisterRequest("maria.keller@email.de", "password123", "password123"), CancellationToken.None);

        var act = () => _sut.RegisterAsync(
            new RegisterRequest("maria.keller@email.de", "password456", "password456"), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task RegisterAsync_PasswordTooShort_ThrowsValidationException()
    {
        var request = new RegisterRequest("maria.keller@email.de", "short", "short");

        var act = () => _sut.RegisterAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task RegisterAsync_PasswordMismatch_ThrowsValidationException()
    {
        var request = new RegisterRequest("maria.keller@email.de", "password123", "somethingelse");

        var act = () => _sut.RegisterAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsToken()
    {
        _passwordHasher.Setup(p => p.Verify(It.IsAny<string>(), "password123")).Returns(true);
        await _sut.RegisterAsync(new RegisterRequest("maria.keller@email.de", "password123", "password123"), CancellationToken.None);

        var result = await _sut.LoginAsync(new LoginRequest("maria.keller@email.de", "password123", false), CancellationToken.None);

        result.Token.Should().Be("fake-jwt-token");
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ThrowsAuthenticationException()
    {
        _passwordHasher.Setup(p => p.Verify(It.IsAny<string>(), "password123")).Returns(true);
        _passwordHasher.Setup(p => p.Verify(It.IsAny<string>(), "wrong")).Returns(false);
        await _sut.RegisterAsync(new RegisterRequest("maria.keller@email.de", "password123", "password123"), CancellationToken.None);

        var act = () => _sut.LoginAsync(new LoginRequest("maria.keller@email.de", "wrong", false), CancellationToken.None);

        await act.Should().ThrowAsync<Kontobuch.Application.Common.Exceptions.AuthenticationException>();
    }

    [Fact]
    public async Task LoginAsync_UnknownEmail_ThrowsAuthenticationException_NotNotFound()
    {
        // Deliberately the same exception type as a wrong password — must not leak whether the email exists.
        var act = () => _sut.LoginAsync(new LoginRequest("unknown@email.de", "password123", false), CancellationToken.None);

        await act.Should().ThrowAsync<Kontobuch.Application.Common.Exceptions.AuthenticationException>();
    }
}
