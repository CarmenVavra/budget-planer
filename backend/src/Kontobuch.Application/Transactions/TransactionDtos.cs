using Kontobuch.Domain.Enums;

namespace Kontobuch.Application.Transactions;

public record TransactionDto(
    Guid Id,
    TransactionType Type,
    decimal Amount,
    DateOnly Date,
    string Bezeichnung,
    LabelType? Art,
    Guid? LabelId,
    string? Note);

public record UpsertTransactionRequest(
    TransactionType Type,
    decimal Amount,
    DateOnly Date,
    Guid? LabelId,
    string? Description,
    string? Note);

public record TransactionQuery(
    TransactionType? Type = null,
    LabelType? Art = null,
    Guid? LabelId = null,
    string? Search = null,
    DateOnly? From = null,
    DateOnly? To = null,
    int Page = 1,
    int PageSize = 20);

public enum SummaryPeriod
{
    Month,
    Year
}

public record TransactionSummaryDto(
    decimal Einnahmen,
    int EinnahmenCount,
    decimal Ausgaben,
    int AusgabenCount,
    decimal AusgabenFix,
    decimal AusgabenVariabel,
    decimal Saldo,
    DateOnly Stand,
    IReadOnlyList<TransactionDto> LetzteTransaktionen);
