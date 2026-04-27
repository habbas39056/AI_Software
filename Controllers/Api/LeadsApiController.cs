using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdwiseAiPlatform.Data;
using AdwiseAiPlatform.Models;

namespace AdwiseAiPlatform.Controllers.Api;

public class LeadDto 
{
    public string InstanceName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Score { get; set; } = string.Empty;
}

[Route("api/leads")]
[ApiController]
public class LeadsApiController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public LeadsApiController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("upsert")]
    public async Task<IActionResult> UpsertLead([FromBody] LeadDto dto)
    {
        // Look up customer by InstanceName — ignore query filters (API bypass)
        var customer = await _context.Customers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.InstanceName == dto.InstanceName);
        if (customer == null) return NotFound(new { success = false, message = "Customer instance not found" });

        // CustomerId is now the WhatsAppNumber (phone)
        var lead = await _context.Leads.IgnoreQueryFilters()
            .FirstOrDefaultAsync(l => l.PhoneNumber == dto.PhoneNumber && l.CustomerId == customer.WhatsAppNumber);

        if (lead == null)
        {
            lead = new Lead 
            { 
                CustomerId = customer.WhatsAppNumber,   // phone number as FK
                PhoneNumber = dto.PhoneNumber,
                Summary = dto.Summary,
                Score = string.IsNullOrEmpty(dto.Score) ? "General Inquiry" : dto.Score
            };
            _context.Leads.Add(lead);
        }
        else
        {
            lead.Summary = dto.Summary;
            if (!string.IsNullOrEmpty(dto.Score)) lead.Score = dto.Score;
            lead.LastMessageAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, leadId = lead.Id, pauseStatus = lead.IsPaused });
    }
}
