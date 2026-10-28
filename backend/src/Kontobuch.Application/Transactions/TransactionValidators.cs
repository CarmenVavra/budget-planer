using FluentValidation;
using Kontobuch.Domain.Enums;

namespace Kontobuch.Application.Transactions;

public class UpsertTransactionRequestValidator : AbstractValidator<UpsertTransactionRequest>
{
    public UpsertTransactionRequestValidator()
    {
        RuleFor(x => x.Type).IsInEnum();

        RuleFor(x => x.Amount)
            .GreaterThan(0m).WithMessage("Der Betrag muss größer als 0 sein.");

        RuleFor(x => x.Date)
            .NotEqual(default(DateOnly)).WithMessage("Bitte gib ein Datum an.");

        // Ausgabe either references a saved Bezeichnung (LabelId) or — for a one-off Variabel
        // expense the user chose not to save — carries a free-text Description instead.
        RuleFor(x => x)
            .Must(x => x.LabelId.HasValue || !string.IsNullOrWhiteSpace(x.Description))
            .WithMessage("Bitte wähle eine Bezeichnung aus oder gib einen Namen ein.")
            .When(x => x.Type == TransactionType.Ausgabe);

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Bitte gib eine Bezeichnung ein.")
            .When(x => x.Type == TransactionType.Einnahme);

        RuleFor(x => x.Description)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.Note)
            .MaximumLength(500);
    }
}
