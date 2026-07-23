using System.Linq.Expressions;
using FluentValidation;
using Kontobuch.Application.Abstractions;
using Kontobuch.Application.Common;
using Kontobuch.Application.Common.Exceptions;
using Kontobuch.Domain.Entities;
using Kontobuch.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Kontobuch.Application.Transactions;

public class TransactionService(
    IAppDbContext db,
    ICurrentUserService currentUser,
    IValidator<UpsertTransactionRequest> validator) : ITransactionService
{
    private static readonly Expression<Func<Transaction, TransactionDto>> ToDto = t => new TransactionDto(
        t.Id,
        t.Type,
        t.Amount,
        t.Date,
        t.Label != null ? t.Label.Name : (t.Description ?? string.Empty),
        t.Label != null ? t.Label.Type : (LabelType?)null,
        t.LabelId,
        t.Note);

    public async Task<PagedResult<TransactionDto>> GetAllAsync(TransactionQuery query, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var q = db.Transactions.Where(t => t.UserId == userId);

        if (query.Type.HasValue)
        {
            q = q.Where(t => t.Type == query.Type.Value);
        }

        if (query.Art.HasValue)
        {
            q = q.Where(t => t.Type == TransactionType.Ausgabe && t.Label != null && t.Label.Type == query.Art.Value);
        }

        if (query.LabelId.HasValue)
        {
            q = q.Where(t => t.LabelId == query.LabelId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(t =>
                (t.Label != null && t.Label.Name.Contains(term)) ||
                (t.Description != null && t.Description.Contains(term)) ||
                (t.Note != null && t.Note.Contains(term)));
        }

        if (query.From.HasValue)
        {
            q = q.Where(t => t.Date >= query.From.Value);
        }

        if (query.To.HasValue)
        {
            q = q.Where(t => t.Date <= query.To.Value);
        }

        var totalCount = await q.CountAsync(ct);

        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await q
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToDto)
            .ToListAsync(ct);

        return new PagedResult<TransactionDto>(items, totalCount, page, pageSize);
    }

    public async Task<TransactionSummaryDto> GetSummaryAsync(SummaryPeriod period, DateOnly referenceDate, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var (from, to) = GetPeriodRange(period, referenceDate);

        var periodTx = db.Transactions.Where(t => t.UserId == userId && t.Date >= from && t.Date <= to);

        // SQLite cannot translate SUM() over decimal columns to SQL (they're stored as TEXT for
        // precision), so the aggregation is done client-side after a single materializing query.
        var periodAmounts = await periodTx
            .Select(t => new { t.Type, t.Amount, LabelType = t.Label != null ? t.Label.Type : (LabelType?)null })
            .ToListAsync(ct);

        var einnahmen = periodAmounts.Where(t => t.Type == TransactionType.Einnahme).Sum(t => t.Amount);
        var einnahmenCount = periodAmounts.Count(t => t.Type == TransactionType.Einnahme);

        var ausgabenFix = periodAmounts
            .Where(t => t.Type == TransactionType.Ausgabe && t.LabelType == LabelType.Fix)
            .Sum(t => t.Amount);
        var ausgabenVariabel = periodAmounts
            .Where(t => t.Type == TransactionType.Ausgabe && t.LabelType == LabelType.Variabel)
            .Sum(t => t.Amount);
        var ausgabenCount = periodAmounts.Count(t => t.Type == TransactionType.Ausgabe);
        var ausgaben = ausgabenFix + ausgabenVariabel;

        var stand = await periodTx.Select(t => (DateOnly?)t.Date).MaxAsync(ct)
            ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var letzte = await periodTx
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .Take(4)
            .Select(ToDto)
            .ToListAsync(ct);

        return new TransactionSummaryDto(
            einnahmen,
            einnahmenCount,
            ausgaben,
            ausgabenCount,
            ausgabenFix,
            ausgabenVariabel,
            einnahmen - ausgaben,
            stand,
            letzte);
    }

    public async Task<TransactionDto> CreateAsync(UpsertTransactionRequest request, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(request, ct);

        var userId = currentUser.UserId;
        var label = await ResolveLabelAsync(userId, request.Type, request.LabelId, ct);

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = request.Type,
            Amount = request.Amount,
            Date = request.Date,
            Note = NormalizeOptional(request.Note),
            LabelId = label?.Id,
            Description = request.Type == TransactionType.Einnahme ? request.Description!.Trim() : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Transactions.Add(transaction);
        await db.SaveChangesAsync(ct);

        return MapToDto(transaction, label);
    }

    public async Task<TransactionDto> UpdateAsync(Guid id, UpsertTransactionRequest request, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(request, ct);

        var userId = currentUser.UserId;
        var transaction = await db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, ct)
            ?? throw new NotFoundException("Transaktion wurde nicht gefunden.");

        var label = await ResolveLabelAsync(userId, request.Type, request.LabelId, ct);

        transaction.Type = request.Type;
        transaction.Amount = request.Amount;
        transaction.Date = request.Date;
        transaction.Note = NormalizeOptional(request.Note);
        transaction.LabelId = label?.Id;
        transaction.Description = request.Type == TransactionType.Einnahme ? request.Description!.Trim() : null;
        transaction.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        return MapToDto(transaction, label);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var transaction = await db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, ct)
            ?? throw new NotFoundException("Transaktion wurde nicht gefunden.");

        db.Transactions.Remove(transaction);
        await db.SaveChangesAsync(ct);
    }

    private async Task<Label?> ResolveLabelAsync(Guid userId, TransactionType type, Guid? labelId, CancellationToken ct)
    {
        if (type != TransactionType.Ausgabe)
        {
            return null;
        }

        var label = labelId.HasValue
            ? await db.Labels.FirstOrDefaultAsync(l => l.Id == labelId.Value && l.UserId == userId, ct)
            : null;

        return label ?? throw new NotFoundException("Bezeichnung wurde nicht gefunden.");
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static TransactionDto MapToDto(Transaction t, Label? label) => new(
        t.Id,
        t.Type,
        t.Amount,
        t.Date,
        label?.Name ?? t.Description ?? string.Empty,
        label?.Type,
        t.LabelId,
        t.Note);

    private static (DateOnly From, DateOnly To) GetPeriodRange(SummaryPeriod period, DateOnly reference)
    {
        if (period == SummaryPeriod.Year)
        {
            return (new DateOnly(reference.Year, 1, 1), new DateOnly(reference.Year, 12, 31));
        }

        var from = new DateOnly(reference.Year, reference.Month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        return (from, to);
    }
}
