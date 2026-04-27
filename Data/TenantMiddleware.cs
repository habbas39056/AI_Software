using AdwiseAiPlatform.Data;
using System.Security.Claims;

namespace AdwiseAiPlatform.Data;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var customerId = context.User.FindFirst("CustomerId")?.Value;
            if (!string.IsNullOrEmpty(customerId))
            {
                dbContext.CurrentTenantPhone = customerId;
            }
        }

        await _next(context);
    }
}

public static class TenantMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<TenantMiddleware>();
    }
}
