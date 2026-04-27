namespace AdwiseAiPlatform.Models;

public class Agent
{
    public int Id { get; set; }
    
    // FK → Customer.WhatsAppNumber (phone number)
    public string CustomerId { get; set; } = string.Empty;
    public Customer Customer { get; set; } = null!;

    public string InstanceName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string Status { get; set; } = "offline"; 
}
