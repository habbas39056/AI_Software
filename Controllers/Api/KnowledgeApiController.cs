using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdwiseAiPlatform.Data;

namespace AdwiseAiPlatform.Controllers.Api;

[Route("api/knowledge")]
[ApiController]
public class KnowledgeApiController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public KnowledgeApiController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string instanceName, [FromQuery] string q)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.InstanceName == instanceName);
        if (customer == null) return NotFound("Unknown Instance");

        var query = $"%{q}%";
        var results = await _context.KnowledgeBases
            .Where(k => k.CustomerId == customer.WhatsAppNumber)
            .Where(k => EF.Functions.Like(k.Topic, query) || EF.Functions.Like(k.Content, query))
            .Select(k => new { k.Topic, k.Content })
            .ToListAsync();

        return Ok(results);
    }
}
