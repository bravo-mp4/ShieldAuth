using System;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Management;
using System.Linq;

namespace ShieldAuth
{
    public class ShieldAuthClient
    {
        private static readonly HttpClient httpClient = new HttpClient();
        private string apiBaseUrl = "https://shieldauth-production.up.railway.app/api/v1";
        private string appId;
        private string sessionId;
        private string licenseKey;
        private string hwid;
        private bool isInitialized = false;

        public ShieldAuthClient(string appId, string apiUrl = null)
        {
            this.appId = appId;
            if (!string.IsNullOrEmpty(apiUrl))
            {
                this.apiBaseUrl = apiUrl;
            }
        }

        /// <summary>
        /// Get hardware ID of the current machine
        /// </summary>
        private string GetHWID()
        {
            try
            {
                StringBuilder hwid = new StringBuilder();

                // Get CPU ID
                ManagementObjectSearcher cpuSearcher = new ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor");
                foreach (ManagementObject obj in cpuSearcher.Get())
                {
                    hwid.Append(obj["ProcessorId"]?.ToString() ?? "");
                }

                // Get Motherboard Serial
                ManagementObjectSearcher boardSearcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard");
                foreach (ManagementObject obj in boardSearcher.Get())
                {
                    hwid.Append(obj["SerialNumber"]?.ToString() ?? "");
                }

                // Get MAC Address
                ManagementObjectSearcher macSearcher = new ManagementObjectSearcher("SELECT MACAddress FROM Win32_NetworkAdapter WHERE MACAddress IS NOT NULL");
                var macAddress = macSearcher.Get().Cast<ManagementObject>().FirstOrDefault();
                if (macAddress != null)
                {
                    hwid.Append(macAddress["MACAddress"]?.ToString() ?? "");
                }

                // Hash the combined HWID
                using (SHA256 sha256 = SHA256.Create())
                {
                    byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(hwid.ToString()));
                    return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting HWID: {ex.Message}");
                return "fallback-hwid-" + Environment.MachineName.GetHashCode().ToString("x");
            }
        }

        /// <summary>
        /// Validate a license key
        /// </summary>
        public async Task<ValidateResponse> ValidateAsync(string licenseKey)
        {
            try
            {
                this.licenseKey = licenseKey;
                this.hwid = GetHWID();

                var requestBody = new
                {
                    app_id = this.appId,
                    license_key = licenseKey,
                    hwid = this.hwid
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await httpClient.PostAsync($"{apiBaseUrl}/validate", content);
                var responseBody = await response.Content.ReadAsStringAsync();
                
                var result = JsonSerializer.Deserialize<ValidateResponse>(responseBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result.Valid)
                {
                    this.sessionId = result.SessionId;
                    this.isInitialized = true;
                }

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Validation error: {ex.Message}");
                return new ValidateResponse
                {
                    Valid = false,
                    Message = $"Connection error: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Send heartbeat to keep session alive
        /// </summary>
        public async Task<bool> HeartbeatAsync()
        {
            if (!isInitialized || string.IsNullOrEmpty(sessionId))
            {
                Console.WriteLine("Not initialized. Call ValidateAsync first.");
                return false;
            }

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, $"{apiBaseUrl}/heartbeat");
                request.Headers.Add("session-id", sessionId);

                var response = await httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Heartbeat error: {ex.Message}");
                return false;
            }
        }

        public string GetSessionId() => sessionId;
        public string GetHWIDValue() => hwid;
        public bool IsInitialized() => isInitialized;
    }

    public class ValidateResponse
    {
        public bool Valid { get; set; }
        public string Message { get; set; }
        public long? ExpiresAt { get; set; }
        public string SessionId { get; set; }
    }
}
