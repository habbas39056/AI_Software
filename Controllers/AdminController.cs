using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdwiseAiPlatform.Data;
using Microsoft.AspNetCore.Authorization;
using AdwiseAiPlatform.Models;

namespace AdwiseAiPlatform.Controllers;

[Authorize]
public class AdminController : Controller
{
    private readonly ApplicationDbContext _context;

    public AdminController(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var customers = await _context.Customers.IgnoreQueryFilters().Include(c => c.Agents).ToListAsync();
        
        ViewBag.TotalAgents = customers.Sum(c => c.Agents?.Count ?? 0);
        ViewBag.ActiveAgentsCount = customers.Count(c => c.SubscriptionStatus == "Active");
        ViewBag.EstimatedRevenue = ViewBag.ActiveAgentsCount * 14000;
        
        var recentLeads = await _context.Leads.IgnoreQueryFilters()
            .OrderByDescending(l => l.LastMessageAt).Take(3).ToListAsync();
        ViewBag.RecentLeads = recentLeads;

        return View(customers);
    }

    public IActionResult AddCustomer()
    {
        Console.WriteLine("[DEBUG] AddCustomer GET page requested.");
        return View();
    }

    [HttpPost]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> AddCustomer(Customer customer, string? InitialKnowledge)
    {
        Console.WriteLine("[CRITICAL DEBUG] AddCustomer POST method HIT!");
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            Console.WriteLine($"[DEBUG] AddCustomer ModelState Invalid: {errors}");
            return View(customer);
        }

        if (string.IsNullOrWhiteSpace(customer.WhatsAppNumber))
        {
            ModelState.AddModelError("WhatsAppNumber", "Phone number is required.");
            return View(customer);
        }

        // Check if customer already exists (WhatsAppNumber is PK)
        var exists = await _context.Customers.IgnoreQueryFilters()
            .AnyAsync(c => c.WhatsAppNumber == customer.WhatsAppNumber);
        if (exists)
        {
            ModelState.AddModelError("WhatsAppNumber", "A customer with this phone number already exists.");
            return View(customer);
        }

        customer.SubscriptionDays = customer.SubscriptionDays > 0 ? customer.SubscriptionDays : 30;
        customer.SubscriptionExpiry = DateTime.UtcNow.AddDays(customer.SubscriptionDays);
        customer.SubscriptionStatus = "Active";
        
        // Ensure no nulls during INSERT
        customer.Name ??= "Unknown";
        customer.Email ??= "";
        customer.Address ??= ""; 
        customer.BusinessEntity ??= "";
        customer.InstanceName ??= "AdwiseSalesBot_" + Guid.NewGuid().ToString("N").Substring(0, 6);
        customer.InstanceName = customer.InstanceName.Replace(" ", "_");
        customer.N8nWebhookUrl ??= "";
        
        if (string.IsNullOrWhiteSpace(customer.Password))
        {
            customer.Password = "123456";
        }
        else
        {
            customer.Password = customer.Password.Trim();
        }
        
        // Auto inject an agent binding for Evolution API
        customer.Agents = new List<Agent> { 
            new Agent { InstanceName = customer.InstanceName, IsActive = true, Status = "pending" } 
        };

        // If user provided initial knowledge in the wizard Step 3
        if (!string.IsNullOrWhiteSpace(InitialKnowledge))
        {
            customer.KnowledgeBases = new List<KnowledgeBase> {
                new KnowledgeBase {
                    Topic = "Core Business Facts",
                    Content = InitialKnowledge ?? string.Empty
                }
            };
        }

        Console.WriteLine($"[DEBUG] Attempting to add customer: {customer.Name} ({customer.WhatsAppNumber})");
        try
        {
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            Console.WriteLine("[DEBUG] Customer successfully saved to database.");
            return RedirectToAction(nameof(Index));
        }
        catch (DbUpdateException dbEx)
        {
            Console.WriteLine($"[DATABASE ERROR] {dbEx.InnerException?.Message ?? dbEx.Message}");
            ModelState.AddModelError("", "Database error: " + (dbEx.InnerException?.Message ?? dbEx.Message));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GENERAL ERROR] {ex.Message}");
            ModelState.AddModelError("", "An unexpected error occurred: " + ex.Message);
        }
        
        return View(customer);
    }

    // Details now uses phone number (string) as the key
    public async Task<IActionResult> Details(string id)
    {
        var customer = await _context.Customers.IgnoreQueryFilters()
            .Include(c => c.Agents)
            .Include(c => c.KnowledgeBases)
            .Include(c => c.Leads)
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == id);
            
        if (customer == null) return NotFound();
        
        return View(customer);
    }

    // Separate page: Leads for a customer
    public async Task<IActionResult> Leads(string id)
    {
        var customer = await _context.Customers.IgnoreQueryFilters()
            .Include(c => c.Leads)
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == id);

        if (customer == null) return NotFound();

        return View(customer);
    }

    // Separate page: Knowledge Base for a customer
    public async Task<IActionResult> KnowledgeBase(string id)
    {
        var customer = await _context.Customers.IgnoreQueryFilters()
            .Include(c => c.KnowledgeBases)
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == id);

        if (customer == null) return NotFound();

        return View(customer);
    }

    public async Task<IActionResult> Clients()
    {
        var customers = await _context.Customers.IgnoreQueryFilters()
            .OrderByDescending(c => c.Name).ToListAsync();
        return View(customers);
    }

    [HttpGet]
    public async Task<IActionResult> EditCustomer(string id)
    {
        var customer = await _context.Customers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == id);
        if (customer == null) return NotFound();
        return View(customer);
    }

    [HttpPost]
    public async Task<IActionResult> EditCustomer(string id, Customer data)
    {
        var customer = await _context.Customers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == id);
        if (customer != null) 
        {
            customer.Name = data.Name;
            customer.BusinessEntity = data.BusinessEntity;
            customer.Email = data.Email;
            customer.InstanceName = data.InstanceName;
            customer.N8nWebhookUrl = data.N8nWebhookUrl;
            
            if (!string.IsNullOrWhiteSpace(data.Password))
            {
                customer.Password = data.Password.Trim();
            }
            
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Clients));
    }

    [HttpPost]
    public async Task<IActionResult> AddKnowledge(string customerId, string Topic, string Content)
    {
        if (!string.IsNullOrWhiteSpace(Topic) && !string.IsNullOrWhiteSpace(Content))
        {
            _context.KnowledgeBases.Add(new KnowledgeBase {
                CustomerId = customerId,
                Topic = Topic,
                Content = Content
            });
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Details), new { id = customerId });
    }

    [HttpPost]
    public async Task<IActionResult> DeleteKnowledge(string customerId, int id)
    {
        var kb = await _context.KnowledgeBases.IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.Id == id && k.CustomerId == customerId);
        if (kb != null)
        {
            _context.KnowledgeBases.Remove(kb);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Details), new { id = customerId });
    }

    [HttpPost]
    public async Task<IActionResult> DeleteCustomer(string id)
    {
        var customer = await _context.Customers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == id);
            
        if (customer != null)
        {
            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Clients));
    }

    // Admin Toggle: Block or Unblock a client portal
    [HttpPost]
    public async Task<IActionResult> ToggleSubscription(string id, string status)
    {
        var customer = await _context.Customers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == id);
        if (customer != null)
        {
            customer.SubscriptionStatus = status; // "Active" or "Suspended"
            if (status == "Suspended")
            {
                // Disable all agents when suspended
                var agents = await _context.Agents.IgnoreQueryFilters()
                    .Where(a => a.CustomerId == id).ToListAsync();
                foreach (var a in agents) a.IsActive = false;
            }
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Details), new { id });
    }

    // Admin: Renew subscription with custom days
    [HttpPost]
    public async Task<IActionResult> RenewSubscription(string id, int days, decimal fee)
    {
        var customer = await _context.Customers.IgnoreQueryFilters()
            .Include(c => c.Agents)
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == id);
        if (customer != null)
        {
            customer.SubscriptionDays = days > 0 ? days : 30;
            customer.MonthlyFee = fee > 0 ? fee : 14000;
            customer.SubscriptionExpiry = DateTime.UtcNow.AddDays(customer.SubscriptionDays);
            customer.SubscriptionStatus = "Active";
            // Re-activate agents
            foreach (var a in customer.Agents) a.IsActive = true;
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Details), new { id });
    }
}
