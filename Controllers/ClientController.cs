using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AdwiseAiPlatform.Data;
using AdwiseAiPlatform.Models;
using System.Security.Claims;

namespace AdwiseAiPlatform.Controllers;

[Authorize(Roles = "Client")]
public class ClientController : Controller
{
    private readonly ApplicationDbContext _context;

    public ClientController(ApplicationDbContext context)
    {
        _context = context;
    }

    // Helper: get the phone number (PK) from the current user's claims
    private string? GetCurrentPhone() =>
        User.FindFirst("WhatsAppNumber")?.Value ?? User.FindFirst("CustomerId")?.Value;

    // Subscription guard: check status & remaining days
    private (bool blocked, int daysLeft, string alertLevel) CheckSubscription(Customer customer)
    {
        if (customer.SubscriptionStatus == "Suspended")
            return (true, 0, "blocked");
            
        if (customer.SubscriptionExpiry == null)
            return (false, 999, "none");
            
        int daysLeft = (int)(customer.SubscriptionExpiry.Value - DateTime.UtcNow).TotalDays;
        
        if (daysLeft <= 0)
        {
            customer.SubscriptionStatus = "Suspended";
            _context.SaveChanges();
            return (true, 0, "blocked");
        }
        if (daysLeft <= 3) return (false, daysLeft, "critical");
        if (daysLeft <= 10) return (false, daysLeft, "warning");
        return (false, daysLeft, "none");
    }

    public async Task<IActionResult> Index()
    {
        var phone = GetCurrentPhone();
        if (string.IsNullOrEmpty(phone)) return RedirectToAction("Logout", "Auth");

        var customer = await _context.Customers.IgnoreQueryFilters()
            .Include(c => c.Agents)
            .Include(c => c.Leads)
            .Include(c => c.KnowledgeBases)
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == phone);
            
        if (customer == null) return RedirectToAction("Logout", "Auth");
        
        // CHECK SUBSCRIPTION
        var (blocked, daysLeft, alertLevel) = CheckSubscription(customer);
        if (blocked) return RedirectToAction("Locked", "Billing");
        
        ViewBag.DaysLeft = daysLeft;
        ViewBag.AlertLevel = alertLevel;
        
        int leadsCount = customer.Leads?.Count ?? 0;
        ViewBag.TotalMessages = leadsCount * 3;
        ViewBag.LeadsCaptured = leadsCount;
        ViewBag.HoursSaved = leadsCount > 0 ? Math.Round(leadsCount * 0.5, 1) : 0; 
        ViewBag.ArticlesCount = customer.KnowledgeBases?.Count ?? 0;

        return View(customer);
    }

    [HttpPost]
    public async Task<IActionResult> AddKnowledge(string Topic, string Content)
    {
        var phone = GetCurrentPhone();
        if (string.IsNullOrEmpty(phone)) return RedirectToAction("Logout", "Auth");
        
        if (!string.IsNullOrWhiteSpace(Topic) && !string.IsNullOrWhiteSpace(Content))
        {
            _context.KnowledgeBases.Add(new KnowledgeBase {
                CustomerId = phone,
                Topic = Topic,
                Content = Content
            });
            await _context.SaveChangesAsync();
        }
        
        return RedirectToAction("Index");
    }

    [HttpPost]
    public async Task<IActionResult> DeleteKnowledge(int id)
    {
        var phone = GetCurrentPhone();
        if (string.IsNullOrEmpty(phone)) return RedirectToAction("Logout", "Auth");

        var kb = await _context.KnowledgeBases.IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.Id == id && k.CustomerId == phone);
        if (kb != null)
        {
            _context.KnowledgeBases.Remove(kb);
            await _context.SaveChangesAsync();
        }

        return RedirectToAction("Index");
    }

    [HttpGet]
    public async Task<IActionResult> KnowledgeBase()
    {
        var phone = GetCurrentPhone();
        if (string.IsNullOrEmpty(phone)) return RedirectToAction("Logout", "Auth");

        var customer = await _context.Customers.IgnoreQueryFilters()
            .Include(c => c.KnowledgeBases)
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == phone);
            
        if (customer == null) return RedirectToAction("Logout", "Auth");
        return View(customer);
    }

    [HttpGet]
    public async Task<IActionResult> Leads()
    {
        var phone = GetCurrentPhone();
        if (string.IsNullOrEmpty(phone)) return RedirectToAction("Logout", "Auth");

        var customer = await _context.Customers.IgnoreQueryFilters()
            .Include(c => c.Leads)
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == phone);
            
        if (customer == null) return RedirectToAction("Logout", "Auth");
        return View(customer);
    }

    [HttpGet]
    public async Task<IActionResult> Billing()
    {
        var phone = GetCurrentPhone();
        if (string.IsNullOrEmpty(phone)) return RedirectToAction("Logout", "Auth");

        var customer = await _context.Customers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == phone);
            
        if (customer == null) return RedirectToAction("Logout", "Auth");
        return View(customer);
    }

    [HttpGet]
    public async Task<IActionResult> Settings()
    {
        var phone = GetCurrentPhone();
        if (string.IsNullOrEmpty(phone)) return RedirectToAction("Logout", "Auth");

        var customer = await _context.Customers.IgnoreQueryFilters()
            .Include(c => c.Agents)
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == phone);
            
        if (customer == null) return RedirectToAction("Logout", "Auth");
        return View(customer);
    }

    [HttpPost]
    public async Task<IActionResult> ToggleAgent(bool IsActive)
    {
        var phone = GetCurrentPhone();
        if (string.IsNullOrEmpty(phone)) return RedirectToAction("Logout", "Auth");

        var customer = await _context.Customers.IgnoreQueryFilters()
            .Include(c => c.Agents)
            .FirstOrDefaultAsync(c => c.WhatsAppNumber == phone);
            
        if (customer?.Agents != null) 
        {
            foreach (var agent in customer.Agents)
            {
                agent.IsActive = IsActive;
            }
            await _context.SaveChangesAsync();
            Console.WriteLine($"[TOGGLE] All agents for {phone} set to IsActive={IsActive}");
        }
        return RedirectToAction("Index");
    }
}
