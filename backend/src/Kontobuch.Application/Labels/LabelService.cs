using FluentValidation;
using Kontobuch.Application.Abstractions;
using Kontobuch.Application.Common.Exceptions;
using Kontobuch.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kontobuch.Application.Labels;

public class LabelService(
    IAppDbContext db,
    ICurrentUserService currentUser,
    IValidator<CreateLabelRequest> createValidator,
    IValidator<UpdateLabelRequest> updateValidator) : ILabelService
{
    public async Task<IReadOnlyList<LabelDto>> GetAllAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId;

        var labels = await db.Labels
            .Where(l => l.UserId == userId)
            .OrderBy(l => l.CreatedAt)
            .Select(l => new LabelDto(
                l.Id,
                l.Name,
                l.Type,
                db.Transactions
                    .Where(t => t.LabelId == l.Id)
                    .Select(t => (DateOnly?)t.Date)
                    .Max()))
            .ToListAsync(ct);

        return labels;
    }

    public async Task<LabelDto> CreateAsync(CreateLabelRequest request, CancellationToken ct)
    {
        await createValidator.ValidateAndThrowAsync(request, ct);

        var userId = currentUser.UserId;
        var name = request.Name.Trim();

        await EnsureNameIsUniqueAsync(userId, name, excludeId: null, ct);

        var label = new Label
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name,
            Type = request.Type,
            CreatedAt = DateTime.UtcNow
        };

        db.Labels.Add(label);
        await db.SaveChangesAsync(ct);

        return new LabelDto(label.Id, label.Name, label.Type, LastUsed: null);
    }

    public async Task<LabelDto> UpdateAsync(Guid id, UpdateLabelRequest request, CancellationToken ct)
    {
        await updateValidator.ValidateAndThrowAsync(request, ct);

        var userId = currentUser.UserId;
        var label = await db.Labels.FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId, ct)
            ?? throw new NotFoundException("Bezeichnung wurde nicht gefunden.");

        var name = request.Name.Trim();
        await EnsureNameIsUniqueAsync(userId, name, excludeId: id, ct);

        label.Name = name;
        label.Type = request.Type;
        await db.SaveChangesAsync(ct);

        var lastUsed = await db.Transactions
            .Where(t => t.LabelId == label.Id)
            .Select(t => (DateOnly?)t.Date)
            .MaxAsync(ct);

        return new LabelDto(label.Id, label.Name, label.Type, lastUsed);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var label = await db.Labels.FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId, ct)
            ?? throw new NotFoundException("Bezeichnung wurde nicht gefunden.");

        var usageCount = await db.Transactions.CountAsync(t => t.LabelId == id, ct);
        if (usageCount > 0)
        {
            throw new ConflictException(
                $"Diese Bezeichnung wird von {usageCount} Transaktion(en) verwendet und kann nicht gelöscht werden.");
        }

        db.Labels.Remove(label);
        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureNameIsUniqueAsync(Guid userId, string name, Guid? excludeId, CancellationToken ct)
    {
        var normalized = name.ToLowerInvariant();
        var exists = await db.Labels.AnyAsync(
            l => l.UserId == userId
                 && (!excludeId.HasValue || l.Id != excludeId.Value)
                 && l.Name.ToLower() == normalized,
            ct);

        if (exists)
        {
            throw new ConflictException($"Eine Bezeichnung mit dem Namen \"{name}\" existiert bereits.");
        }
    }
}
