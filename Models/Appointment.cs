namespace AdwiseAiPlatform.Models;

public class Appointment
{
    public int Id { get; set; }
    
    public int LeadId { get; set; }
    public Lead Lead { get; set; } = null!;

    // FK → Customer.WhatsAppNumber (phone number)
    public string CustomerId { get; set; } = string.Empty;
    public Customer Customer { get; set; } = null!;

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
