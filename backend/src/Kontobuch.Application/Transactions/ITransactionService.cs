using Kontobuch.Application.Common;

namespace Kontobuch.Application.Transactions;

public interface ITransactionService
{
    Task<PagedResult<TransactionDto>> GetAllAsync(TransactionQuery query, CancellationToken ct);

    Task<TransactionSummaryDto> GetSummaryAsync(SummaryPeriod period, DateOnly referenceDate, CancellationToken ct);

    Task<TransactionDto> CreateAsync(UpsertTransactionRequest request, CancellationToken ct);

    Task<TransactionDto> UpdateAsync(Guid id, UpsertTransactionRequest request, CancellationToken ct);

    Task DeleteAsync(Guid id, CancellationToken ct);
}
