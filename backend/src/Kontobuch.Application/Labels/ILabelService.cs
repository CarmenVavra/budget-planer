namespace Kontobuch.Application.Labels;

public interface ILabelService
{
    Task<IReadOnlyList<LabelDto>> GetAllAsync(CancellationToken ct);

    Task<LabelDto> CreateAsync(CreateLabelRequest request, CancellationToken ct);

    Task<LabelDto> UpdateAsync(Guid id, UpdateLabelRequest request, CancellationToken ct);

    /// <summary>Throws ConflictException if the label is still referenced by a transaction.</summary>
    Task DeleteAsync(Guid id, CancellationToken ct);
}
