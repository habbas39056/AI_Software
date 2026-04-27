using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdwiseAiPlatform.Data;

namespace AdwiseAiPlatform.Controllers.Api;

[Route("api/agent")]
[ApiController]
public class AgentApiController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AgentApiController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("status/{instanceName}")]
    public async Task<IActionResult> GetStatus(string instanceName)
    {
        var agent = await _context.Agents
            .Include(a => a.Customer)
            .FirstOrDefaultAsync(a => a.InstanceName == instanceName);

        if (agent == null) return NotFound(new { error = "Agent not found" });

        // The Bot only replies if the Kill Switch is ON, and if the Billing is NOT suspended.
        bool isActive = agent.IsActive && agent.Customer.SubscriptionStatus != "Suspended";

        return Ok(new { 
            isActive = isActive, 
            status = agent.Status,
            subscriptionStatus = agent.Customer.SubscriptionStatus
        });
    }

    [HttpPatch("toggle/{instanceName}")]
    public async Task<IActionResult> ToggleKillSwitch(string instanceName, [FromBody] bool isActive)
    {
        var agent = await _context.Agents.FirstOrDefaultAsync(a => a.InstanceName == instanceName);
        if (agent == null) return NotFound();

        agent.IsActive = isActive;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, isActive = agent.IsActive });
    }
}
