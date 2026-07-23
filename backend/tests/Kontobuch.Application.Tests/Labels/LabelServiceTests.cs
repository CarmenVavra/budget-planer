using FluentAssertions;
using FluentValidation;
using Kontobuch.Application.Common.Exceptions;
using Kontobuch.Application.Labels;
using Kontobuch.Application.Tests.TestHelpers;
using Kontobuch.Domain.Entities;
using Kontobuch.Domain.Enums;
using Kontobuch.Infrastructure.Persistence;
using Xunit;

namespace Kontobuch.Application.Tests.Labels;

public class LabelServiceTests
{
    private readonly AppDbContext _db = TestDbContextFactory.Create();
    private readonly Guid _userId = Guid.NewGuid();
    private readonly LabelService _sut;

    public LabelServiceTests()
    {
        _sut = new LabelService(
            _db,
            new FakeCurrentUserService(_userId),
            new CreateLabelRequestValidator(),
            new UpdateLabelRequestValidator());
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesLabel()
    {
        var result = await _sut.CreateAsync(new CreateLabelRequest("Miete", LabelType.Fix), CancellationToken.None);

        result.Name.Should().Be("Miete");
        result.Type.Should().Be(LabelType.Fix);
        result.LastUsed.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_DuplicateNameForSameUser_ThrowsConflictException()
    {
        await _sut.CreateAsync(new CreateLabelRequest("Miete", LabelType.Fix), CancellationToken.None);

        var act = () => _sut.CreateAsync(new CreateLabelRequest("miete", LabelType.Variabel), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateAsync_EmptyName_ThrowsValidationException()
    {
        var act = () => _sut.CreateAsync(new CreateLabelRequest("", LabelType.Fix), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task DeleteAsync_LabelInUse_ThrowsConflictExceptionAndKeepsLabel()
    {
        var label = await _sut.CreateAsync(new CreateLabelRequest("Miete", LabelType.Fix), CancellationToken.None);
        _db.Transactions.Add(new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            Type = TransactionType.Ausgabe,
            Amount = 780m,
            Date = new DateOnly(2026, 7, 22),
            LabelId = label.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(CancellationToken.None);

        var act = () => _sut.DeleteAsync(label.Id, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
        (await _sut.GetAllAsync(CancellationToken.None)).Should().ContainSingle();
    }

    [Fact]
    public async Task DeleteAsync_LabelNotInUse_DeletesSuccessfully()
    {
        var label = await _sut.CreateAsync(new CreateLabelRequest("Miete", LabelType.Fix), CancellationToken.None);

        await _sut.DeleteAsync(label.Id, CancellationToken.None);

        (await _sut.GetAllAsync(CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteAsync_UnknownId_ThrowsNotFoundException()
    {
        var act = () => _sut.DeleteAsync(Guid.NewGuid(), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetAllAsync_OnlyReturnsLabelsOwnedByCurrentUser()
    {
        await _sut.CreateAsync(new CreateLabelRequest("Miete", LabelType.Fix), CancellationToken.None);

        var otherUsersService = new LabelService(
            _db,
            new FakeCurrentUserService(Guid.NewGuid()),
            new CreateLabelRequestValidator(),
            new UpdateLabelRequestValidator());
        await otherUsersService.CreateAsync(new CreateLabelRequest("Tanken", LabelType.Variabel), CancellationToken.None);

        var myLabels = await _sut.GetAllAsync(CancellationToken.None);

        myLabels.Should().ContainSingle(l => l.Name == "Miete");
    }
}
