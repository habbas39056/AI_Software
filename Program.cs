using Microsoft.EntityFrameworkCore;
using AdwiseAiPlatform.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(5, 7, 0)),
        mySqlOptions => mySqlOptions.EnableRetryOnFailure()));

// Inject Evolution API HTTP Client Service
builder.Services.AddHttpClient<AdwiseAiPlatform.Services.EvolutionApiService>();

// Inject Authentication
builder.Services.AddAuthentication("Cookies")
    .AddCookie("Cookies", options =>
    {
        options.LoginPath = "/Auth/Login";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
    });

var app = builder.Build();

// Auto-create Database if it doesn't exist
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    try
    {
        using var conn = new MySqlConnector.MySqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"));
        conn.Open();
        
        // Add new billing columns if they don't exist
        string[] alterSqls = {
            "ALTER TABLE Customers ADD COLUMN SubscriptionDays INT NOT NULL DEFAULT 30;",
            "ALTER TABLE Customers ADD COLUMN MonthlyFee DECIMAL(10,2) NOT NULL DEFAULT 14000;"
        };
        foreach(var sql in alterSqls) {
            try { using var cmd = new MySqlConnector.MySqlCommand(sql, conn); cmd.ExecuteNonQuery(); Console.WriteLine("[DB] " + sql); }
            catch { /* column already exists */ }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB ERROR] Failed: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();
app.UseTenantMiddleware();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Admin}/{action=Index}/{id?}");

app.Run();
