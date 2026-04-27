using Microsoft.EntityFrameworkCore;
using AdwiseAiPlatform.Models;

namespace AdwiseAiPlatform.Data;

public class ApplicationDbContext : DbContext
{
    // Tenant phone number used for Global Query Filters (tenant isolation)
    public string? CurrentTenantPhone { get; set; }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Customer> Customers { get; set; }
    public DbSet<Agent> Agents { get; set; }
    public DbSet<KnowledgeBase> KnowledgeBases { get; set; }
    public DbSet<Lead> Leads { get; set; }
    public DbSet<Appointment> Appointments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Customer PK = WhatsAppNumber (phone number)
        modelBuilder.Entity<Customer>()
            .HasKey(c => c.WhatsAppNumber);

        modelBuilder.Entity<Customer>()
            .Property(c => c.WhatsAppNumber)
            .HasMaxLength(20);

        // Relationships — all FKs now point to Customer.WhatsAppNumber
        modelBuilder.Entity<Customer>()
            .HasMany(c => c.Agents)
            .WithOne(a => a.Customer)
            .HasForeignKey(a => a.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Customer>()
            .HasMany(c => c.KnowledgeBases)
            .WithOne(k => k.Customer)
            .HasForeignKey(k => k.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Customer>()
            .HasMany(c => c.Leads)
            .WithOne(l => l.Customer)
            .HasForeignKey(l => l.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Customer>()
            .HasMany(c => c.Appointments)
            .WithOne(a => a.Customer)
            .HasForeignKey(a => a.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Lead>()
            .HasMany(l => l.Appointments)
            .WithOne(a => a.Lead)
            .HasForeignKey(a => a.LeadId)
            .OnDelete(DeleteBehavior.Restrict);

        // ==========================================
        //  GLOBAL QUERY FILTERS (TENANT ISOLATION)
        //  When CurrentTenantPhone is set, every query
        //  automatically appends WHERE CustomerId = phone
        // ==========================================
        modelBuilder.Entity<Agent>()
            .HasQueryFilter(a => string.IsNullOrEmpty(CurrentTenantPhone) || a.CustomerId == CurrentTenantPhone);

        modelBuilder.Entity<KnowledgeBase>()
            .HasQueryFilter(k => string.IsNullOrEmpty(CurrentTenantPhone) || k.CustomerId == CurrentTenantPhone);

        modelBuilder.Entity<Lead>()
            .HasQueryFilter(l => string.IsNullOrEmpty(CurrentTenantPhone) || l.CustomerId == CurrentTenantPhone);

        modelBuilder.Entity<Appointment>()
            .HasQueryFilter(a => string.IsNullOrEmpty(CurrentTenantPhone) || a.CustomerId == CurrentTenantPhone);

        modelBuilder.Entity<Customer>()
            .HasQueryFilter(c => string.IsNullOrEmpty(CurrentTenantPhone) || c.WhatsAppNumber == CurrentTenantPhone);
    }
}
