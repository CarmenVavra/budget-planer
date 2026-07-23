using Kontobuch.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kontobuch.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Label> Labels { get; }
    DbSet<Transaction> Transactions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
