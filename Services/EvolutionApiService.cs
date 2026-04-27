using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace AdwiseAiPlatform.Services;

public class EvolutionApiService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public EvolutionApiService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = config["EvolutionApi:ApiKey"] ?? "YOUR_EVOLUTION_GLOBAL_API_KEY";
        
        string baseUrl = config["EvolutionApi:BaseUrl"] ?? "http://localhost:8080";
        _httpClient.BaseAddress = new Uri(baseUrl); 
        _httpClient.DefaultRequestHeaders.Add("apikey", _apiKey);
    }

    public async Task<(string? Base64, string? Error)> GetQrCodeAsync(string instanceName)
    {
        instanceName = instanceName.Replace(" ", "_"); // FORCE CLEANUP
        try 
        {
            // 1. Create the instance
            var createPayload = new {
                instanceName = instanceName,
                qrcode = true,
                integration = "WHATSAPP-BAILEYS"
            };
            
            var content = new StringContent(JsonSerializer.Serialize(createPayload), Encoding.UTF8, "application/json");
            string createUrl = $"instance/create?apikey={_apiKey}";
            var createResponse = await _httpClient.PostAsync(createUrl, content);
            var createResult = await createResponse.Content.ReadAsStringAsync();
            Console.WriteLine($"[Evolution API] Create Status: {createResponse.StatusCode}");

            // If creation was successful, check if QR is already there
            if (createResponse.IsSuccessStatusCode)
            {
                var doc = JsonDocument.Parse(createResult);
                if (doc.RootElement.TryGetProperty("qrcode", out var qrObj) && 
                    qrObj.TryGetProperty("base64", out var base64Prop)) 
                {
                    return (base64Prop.GetString(), null);
                }
            }

            // If instance already exists (409) or other success but no QR, try explicit connect
            if (createResponse.StatusCode == System.Net.HttpStatusCode.Conflict || createResponse.IsSuccessStatusCode)
            {
                string connectUrl = $"instance/connect/{instanceName}?apikey={_apiKey}";
                var response = await _httpClient.GetAsync(connectUrl);
                var result = await response.Content.ReadAsStringAsync();
                
                if (response.IsSuccessStatusCode)
                {
                    var doc = JsonDocument.Parse(result);
                    if (doc.RootElement.TryGetProperty("base64", out var base64Prop)) {
                        return (base64Prop.GetString(), null);
                    }
                    if (doc.RootElement.TryGetProperty("code", out var codeProp)) {
                        return (codeProp.GetString(), null);
                    }
                }
                else 
                {
                    return (null, $"Connect Failed ({response.StatusCode}): {result}");
                }
            }
            else 
            {
                return (null, $"Create Failed ({createResponse.StatusCode}): {createResult}");
            }
        } 
        catch (HttpRequestException ex) {
            return (null, $"Network Error: Could not reach Evolution API at {_httpClient.BaseAddress}. {ex.Message}");
        }
        catch (Exception ex) {
            return (null, $"Unexpected Error: {ex.Message}");
        }
        
        return (null, "Unknown error occurred during QR generation.");
    }

    public async Task<string> GetStatusAsync(string instanceName)
    {
        instanceName = instanceName.Replace(" ", "_"); // FORCE CLEANUP
        try {
            string url = $"instance/connectionState/{instanceName}?apikey={_apiKey}";
            var response = await _httpClient.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                var jsonStr = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(jsonStr);
                if (doc.RootElement.TryGetProperty("instance", out var instanceObj)) {
                    if (instanceObj.TryGetProperty("state", out var stateProp)) {
                        return stateProp.GetString() ?? "offline"; // "open", "close", "connecting"
                    }
                }
            }
        } catch {}
        return "offline";
    }
}
