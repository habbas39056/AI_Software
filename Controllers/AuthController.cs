using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using AdwiseAiPlatform.Data;

namespace AdwiseAiPlatform.Controllers;

public class AuthController : Controller
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpGet]
    public IActionResult Login()
    {
        if (User.Identity != null && User.Identity.IsAuthenticated)
        {
            if (User.IsInRole("Super Admin")) return RedirectToAction("Index", "Admin");
            return RedirectToAction("Index", "Client");
        }
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Login(string username, string password)
    {
        // 1. Super Admin Logic
        var adminUsername = _configuration["AdminSettings:Username"] ?? "admin";
        var adminPassword = _configuration["AdminSettings:Password"] ?? "admin123";

        if (username.ToLower() == adminUsername.ToLower() && password == adminPassword)
        {
            var adminClaims = new List<Claim> {
                new Claim(ClaimTypes.Name, "Haris Azam"),
                new Claim(ClaimTypes.Role, "Super Admin")
            };
            await HttpContext.SignInAsync("Cookies", new ClaimsPrincipal(new ClaimsIdentity(adminClaims, "Cookies")));
            return RedirectToAction("Index", "Admin");
        }

        // 2. Client Login Logic
        Console.WriteLine($"[LOGIN] Attempt: username='{username}', password='{password}'");
        
        var customer = await _context.Customers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Email == username);
        
        if (customer != null)
        {
            Console.WriteLine($"[LOGIN] Found customer: {customer.Name} | Email: {customer.Email} | Password in DB: '{customer.Password}' | Phone: {customer.WhatsAppNumber}");
            
            // Accept: stored Password, OR phone number as password (backward compat)
            bool passwordOk = password == customer.Password 
                           || password == customer.WhatsAppNumber;
            
            if (!passwordOk)
            {
                Console.WriteLine("[LOGIN] Password mismatch!");
            }
        }
        else
        {
            Console.WriteLine($"[LOGIN] No customer found with email '{username}'");
        }

        // Accept if password matches stored password OR phone number
        if (customer != null && (password == customer.Password || password == customer.WhatsAppNumber))
        {
            var clientClaims = new List<Claim> {
                new Claim(ClaimTypes.Name, customer.Name ?? "Unknown Client"),
                new Claim(ClaimTypes.Role, "Client"),
                // CustomerId is now the phone number (WhatsAppNumber = PK)
                new Claim("CustomerId", customer.WhatsAppNumber),
                new Claim("WhatsAppNumber", customer.WhatsAppNumber)
            };
            await HttpContext.SignInAsync("Cookies", new ClaimsPrincipal(new ClaimsIdentity(clientClaims, "Cookies")));
            return RedirectToAction("Index", "Client");
        }

        ViewBag.Error = "Invalid Username or Password";
        return View();
    }

    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync("Cookies");
        return RedirectToAction("Login");
    }
}
