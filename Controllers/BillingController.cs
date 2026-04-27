using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdwiseAiPlatform.Data;
using Microsoft.AspNetCore.Authorization;

namespace AdwiseAiPlatform.Controllers;

[Authorize]
public class BillingController : Controller
{
    private readonly ApplicationDbContext _context;

    public BillingController(ApplicationDbContext context)
    {
        _context = context;
    }

    // Admin: Billing Overview — all customers with expiry status
    public async Task<IActionResult> Index()
    {
        var allCustomers = await _context.Customers.IgnoreQueryFilters()
            .Include(c => c.Agents)
            .OrderBy(c => c.SubscriptionExpiry)
            .ToListAsync();

        // Auto-suspend expired customers
        foreach (var c in allCustomers)
        {
            if (c.SubscriptionExpiry.HasValue && c.SubscriptionExpiry.Value < DateTime.UtcNow && c.SubscriptionStatus != "Suspended")
            {
                c.SubscriptionStatus = "Suspended";
                if (c.Agents != null)
                    foreach (var a in c.Agents) a.IsActive = false;
            }
        }
        await _context.SaveChangesAsync();
            
        return View(allCustomers);
    }

    // Admin: Confirm Payment and renew
    [HttpPost]
    public async Task<IActionResult> ConfirmPayment(string customerId, int days)
    {
        var customer = await _context.Customers.IgnoreQueryFilters()
            .Include(c => c.Agents)
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == customerId);
        if (customer != null)
        {
            int renewDays = days > 0 ? days : customer.SubscriptionDays;
            customer.SubscriptionExpiry = DateTime.UtcNow.AddDays(renewDays);
            customer.SubscriptionDays = renewDays;
            customer.SubscriptionStatus = "Active";
            
            // Re-activate agents automatically after payment
            foreach (var agent in customer.Agents) {
                agent.IsActive = true;
            }
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }

    // The Customer Lockout Screen
    [AllowAnonymous]
    public IActionResult Locked()
    {
        return View();
    }
}
