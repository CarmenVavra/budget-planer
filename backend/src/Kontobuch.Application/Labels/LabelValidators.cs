using FluentValidation;

namespace Kontobuch.Application.Labels;

public class CreateLabelRequestValidator : AbstractValidator<CreateLabelRequest>
{
    public CreateLabelRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Bitte gib eine Bezeichnung ein.")
            .MaximumLength(100);

        RuleFor(x => x.Type).IsInEnum();
    }
}

public class UpdateLabelRequestValidator : AbstractValidator<UpdateLabelRequest>
{
    public UpdateLabelRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Bitte gib eine Bezeichnung ein.")
            .MaximumLength(100);

        RuleFor(x => x.Type).IsInEnum();
    }
}
