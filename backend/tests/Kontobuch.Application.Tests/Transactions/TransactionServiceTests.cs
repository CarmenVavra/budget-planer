using FluentAssertions;
using FluentValidation;
using Kontobuch.Application.Common.Exceptions;
using Kontobuch.Application.Labels;
using Kontobuch.Application.Tests.TestHelpers;
using Kontobuch.Application.Transactions;
using Kontobuch.Domain.Enums;
using Kontobuch.Infrastructure.Persistence;
using Xunit;

namespace Kontobuch.Application.Tests.Transactions;

public class TransactionServiceTests
{
    private readonly AppDbContext _db = TestDbContextFactory.Create();
    private readonly Guid _userId = Guid.NewGuid();
    private readonly TransactionService _sut;
    private readonly LabelService _labels;

    public TransactionServiceTests()
    {
        _sut = new TransactionService(
            _db,
            new FakeCurrentUserService(_userId),
            new UpsertTransactionRequestValidator());
        _labels = new LabelService(
            _db,
            new FakeCurrentUserService(_userId),
            new CreateLabelRequestValidator(),
            new UpdateLabelRequestValidator());
    }

    [Fact]
    public async Task CreateAsync_Ausgabe_WithValidLabel_CreatesTransactionWithResolvedArt()
    {
        var label = await _labels.CreateAsync(new CreateLabelRequest("Miete", LabelType.Fix), CancellationToken.None);

        var result = await _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Ausgabe, 780m, new DateOnly(2026, 7, 22), label.Id, null, null),
            CancellationToken.None);

        result.Bezeichnung.Should().Be("Miete");
        result.Art.Should().Be(LabelType.Fix);
    }

    [Fact]
    public async Task CreateAsync_Ausgabe_WithoutLabelIdOrDescription_ThrowsValidationException()
    {
        var act = () => _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Ausgabe, 10m, new DateOnly(2026, 7, 22), null, null, null),
            CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task CreateAsync_Ausgabe_WithoutLabelId_ButWithDescription_CreatesOneOffVariabelTransaction()
    {
        var result = await _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Ausgabe, 12.5m, new DateOnly(2026, 7, 22), null, "Parkticket", null),
            CancellationToken.None);

        result.Bezeichnung.Should().Be("Parkticket");
        result.Art.Should().Be(LabelType.Variabel);
        result.LabelId.Should().BeNull();
    }

    [Fact]
    public async Task GetAllAsync_FilterByVariabelArt_IncludesOneOffTransactionsWithoutLabel()
    {
        var variabel = await _labels.CreateAsync(new CreateLabelRequest("Tanken", LabelType.Variabel), CancellationToken.None);
        await _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Ausgabe, 50m, new DateOnly(2026, 7, 10), variabel.Id, null, null), CancellationToken.None);
        await _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Ausgabe, 12.5m, new DateOnly(2026, 7, 22), null, "Parkticket", null), CancellationToken.None);

        var result = await _sut.GetAllAsync(new TransactionQuery(Art: LabelType.Variabel), CancellationToken.None);

        result.Items.Should().HaveCount(2);
    }

    [Fact]
    public async Task CreateAsync_Einnahme_WithoutDescription_ThrowsValidationException()
    {
        var act = () => _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Einnahme, 2450m, new DateOnly(2026, 7, 15), null, null, null),
            CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task CreateAsync_NegativeOrZeroAmount_ThrowsValidationException()
    {
        var act = () => _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Einnahme, 0m, new DateOnly(2026, 7, 15), null, "Gehalt", null),
            CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task CreateAsync_LabelBelongsToAnotherUser_ThrowsNotFoundException()
    {
        var otherUsersLabels = new LabelService(
            _db,
            new FakeCurrentUserService(Guid.NewGuid()),
            new CreateLabelRequestValidator(),
            new UpdateLabelRequestValidator());
        var foreignLabel = await otherUsersLabels.CreateAsync(new CreateLabelRequest("Miete", LabelType.Fix), CancellationToken.None);

        var act = () => _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Ausgabe, 780m, new DateOnly(2026, 7, 22), foreignLabel.Id, null, null),
            CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_AnotherUsersTransaction_ThrowsNotFoundException()
    {
        var tx = await _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Einnahme, 2450m, new DateOnly(2026, 7, 15), null, "Gehalt", null),
            CancellationToken.None);

        var otherUsersService = new TransactionService(
            _db,
            new FakeCurrentUserService(Guid.NewGuid()),
            new UpsertTransactionRequestValidator());

        var act = () => otherUsersService.DeleteAsync(tx.Id, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetSummaryAsync_ComputesEinnahmenAusgabenSaldoAndFixVariabelSplit()
    {
        var fix = await _labels.CreateAsync(new CreateLabelRequest("Miete", LabelType.Fix), CancellationToken.None);
        var variabel = await _labels.CreateAsync(new CreateLabelRequest("Tanken", LabelType.Variabel), CancellationToken.None);

        await _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Einnahme, 2450m, new DateOnly(2026, 7, 15), null, "Gehalt", null), CancellationToken.None);
        await _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Ausgabe, 780m, new DateOnly(2026, 7, 22), fix.Id, null, null), CancellationToken.None);
        await _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Ausgabe, 68.5m, new DateOnly(2026, 7, 12), variabel.Id, null, null), CancellationToken.None);
        // Outside the queried period — must not be included.
        await _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Ausgabe, 999m, new DateOnly(2026, 6, 1), fix.Id, null, null), CancellationToken.None);

        var summary = await _sut.GetSummaryAsync(SummaryPeriod.Month, new DateOnly(2026, 7, 22), CancellationToken.None);

        summary.Einnahmen.Should().Be(2450m);
        summary.Ausgaben.Should().Be(848.5m);
        summary.AusgabenFix.Should().Be(780m);
        summary.AusgabenVariabel.Should().Be(68.5m);
        summary.Saldo.Should().Be(2450m - 848.5m);
        summary.LetzteTransaktionen.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetSummaryAsync_OneOffAusgabeWithoutLabel_CountsTowardVariabel()
    {
        await _sut.CreateAsync(
            new UpsertTransactionRequest(TransactionType.Ausgabe, 12.5m, new DateOnly(2026, 7, 22), null, "Parkticket", null), CancellationToken.None);

        var summary = await _sut.GetSummaryAsync(SummaryPeriod.Month, new DateOnly(2026, 7, 22), CancellationToken.None);

        summary.AusgabenVariabel.Should().Be(12.5m);
        summary.Ausgaben.Should().Be(12.5m);
        summary.AusgabenCount.Should().Be(1);
    }
}
