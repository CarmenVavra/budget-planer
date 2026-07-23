using Kontobuch.Domain.Enums;

namespace Kontobuch.Application.Labels;

public record LabelDto(Guid Id, string Name, LabelType Type, DateOnly? LastUsed);

public record CreateLabelRequest(string Name, LabelType Type);

public record UpdateLabelRequest(string Name, LabelType Type);
