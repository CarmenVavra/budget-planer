using Kontobuch.Application.Transactions;
using Kontobuch.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Kontobuch.Api.Controllers;

[ApiController]
[Route("api/transactions")]
public class TransactionsController(ITransactionService transactionService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Application.Common.PagedResult<TransactionDto>>> GetAll(
        [FromQuery] TransactionType? type,
        [FromQuery] LabelType? art,
        [FromQuery] Guid? labelId,
        [FromQuery] string? search,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = new TransactionQuery(type, art, labelId, search, from, to, page, pageSize);
        return Ok(await transactionService.GetAllAsync(query, ct));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<TransactionSummaryDto>> GetSummary(
        [FromQuery] SummaryPeriod period = SummaryPeriod.Month,
        [FromQuery] DateOnly? date = null,
        CancellationToken ct = default)
    {
        var reference = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        return Ok(await transactionService.GetSummaryAsync(period, reference, ct));
    }

    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create(UpsertTransactionRequest request, CancellationToken ct)
    {
        var transaction = await transactionService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetAll), transaction);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TransactionDto>> Update(Guid id, UpsertTransactionRequest request, CancellationToken ct) =>
        Ok(await transactionService.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await transactionService.DeleteAsync(id, ct);
        return NoContent();
    }
}
