namespace AdwiseAiPlatform.Models;

public class KnowledgeBase
{
    public int Id { get; set; }
    
    // FK → Customer.WhatsAppNumber (phone number)
    public string CustomerId { get; set; } = string.Empty;
    public Customer Customer { get; set; } = null!;
    
    public string Topic { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
