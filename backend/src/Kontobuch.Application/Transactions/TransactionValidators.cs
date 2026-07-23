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

        RuleFor(x => x.LabelId)
            .NotNull().WithMessage("Bitte wähle eine Bezeichnung aus.")
            .When(x => x.Type == TransactionType.Ausgabe);

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Bitte gib eine Bezeichnung ein.")
            .MaximumLength(100)
            .When(x => x.Type == TransactionType.Einnahme);

        RuleFor(x => x.Note)
            .MaximumLength(500);
    }
}
