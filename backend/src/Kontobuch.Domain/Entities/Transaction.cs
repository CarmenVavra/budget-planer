using Kontobuch.Domain.Enums;

namespace Kontobuch.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Note { get; set; }

    /// <summary>FK, set only when Type == Ausgabe. Label carries the display name.</summary>
    public Guid? LabelId { get; set; }

    /// <summary>Free-text Bezeichnung, set only when Type == Einnahme (no label lookup for income).</summary>
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User? User { get; set; }
    public Label? Label { get; set; }
}
