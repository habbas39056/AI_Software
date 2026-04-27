using Microsoft.AspNetCore.Mvc;
using AdwiseAiPlatform.Services;

namespace AdwiseAiPlatform.Controllers.Api;

[Route("api/evolution")]
[ApiController]
public class EvolutionApiController : ControllerBase
{
    private readonly EvolutionApiService _evolutionApi;

    public EvolutionApiController(EvolutionApiService evolutionApi)
    {
        _evolutionApi = evolutionApi;
    }

    [HttpGet("qr/{instanceName}")]
    public async Task<IActionResult> GetQrCode(string instanceName)
    {
        // 1. Check if already connected
        var status = await _evolutionApi.GetStatusAsync(instanceName);
        if (status == "open")
        {
            return Ok(new { status = "open", message = "Instance is already connected and active." });
        }

        // 2. Try to get QR
        var (base64, error) = await _evolutionApi.GetQrCodeAsync(instanceName);
        
        if (!string.IsNullOrEmpty(error)) {
            return BadRequest(new { error = error });
        }

        if (string.IsNullOrEmpty(base64)) {
            return BadRequest(new { error = "Could not generate QR. No data returned from API." });
        }

        if (!base64.StartsWith("data:image")) {
            base64 = "data:image/png;base64," + base64;
        }
        return Ok(new { base64 = base64 });
    }

    [HttpGet("status/{instanceName}")]
    public async Task<IActionResult> GetStatus(string instanceName)
    {
        var status = await _evolutionApi.GetStatusAsync(instanceName);
        return Ok(new { status = status });
    }
}
