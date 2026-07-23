namespace Kontobuch.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<Label> Labels { get; set; } = new List<Label>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
