namespace AdwiseAiPlatform.Models;

public class Lead
{
    public int Id { get; set; }
    
    // FK → Customer.WhatsAppNumber (phone number)
    public string CustomerId { get; set; } = string.Empty;
    public Customer Customer { get; set; } = null!;

    public string? Name { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Score { get; set; } = "General Inquiry"; // "Hot", "Cold", "General Inquiry"
    
    public bool IsPaused { get; set; } = false;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
