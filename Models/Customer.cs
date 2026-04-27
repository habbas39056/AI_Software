using System.ComponentModel.DataAnnotations;

namespace AdwiseAiPlatform.Models;

public class Customer
{
    // WhatsAppNumber IS the primary key (customer phone number)
    [Key]
    public string WhatsAppNumber { get; set; } = string.Empty;

    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? BusinessEntity { get; set; }
    public string? Password { get; set; }
    
    // Technical Config
    public string? InstanceName { get; set; }
    public string? N8nWebhookUrl { get; set; }
    
    // Billing Settings
    public string? SubscriptionStatus { get; set; } = "Active"; // "Active", "GracePeriod", "Suspended"
    public DateTime? SubscriptionExpiry { get; set; }
    public int SubscriptionDays { get; set; } = 30; // Days assigned by admin
    public decimal MonthlyFee { get; set; } = 14000; // PKR
    
    // Navigation properties
    public ICollection<Agent> Agents { get; set; } = new List<Agent>();
    public ICollection<KnowledgeBase> KnowledgeBases { get; set; } = new List<KnowledgeBase>();
    public ICollection<Lead> Leads { get; set; } = new List<Lead>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
