using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdwiseAiPlatform.Data;

namespace AdwiseAiPlatform.Controllers.Api;

[Route("api/appointments")]
[ApiController]
public class AppointmentsApiController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AppointmentsApiController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("check")]
    public async Task<IActionResult> CheckAvailability([FromQuery] string instanceName, [FromQuery] DateTime time)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.InstanceName == instanceName);
        if (customer == null) return NotFound("Customer not found.");

        bool isTaken = await _context.Appointments.IgnoreQueryFilters()
            .AnyAsync(a => a.CustomerId == customer.WhatsAppNumber && a.StartTime == time);

        return Ok(new { available = !isTaken });
    }
}
