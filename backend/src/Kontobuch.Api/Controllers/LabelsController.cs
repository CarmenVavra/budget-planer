using Kontobuch.Application.Labels;
using Microsoft.AspNetCore.Mvc;

namespace Kontobuch.Api.Controllers;

[ApiController]
[Route("api/labels")]
public class LabelsController(ILabelService labelService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LabelDto>>> GetAll(CancellationToken ct) =>
        Ok(await labelService.GetAllAsync(ct));

    [HttpPost]
    public async Task<ActionResult<LabelDto>> Create(CreateLabelRequest request, CancellationToken ct)
    {
        var label = await labelService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetAll), label);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<LabelDto>> Update(Guid id, UpdateLabelRequest request, CancellationToken ct) =>
        Ok(await labelService.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await labelService.DeleteAsync(id, ct);
        return NoContent();
    }
}
