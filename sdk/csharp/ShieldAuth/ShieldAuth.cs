using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using ShieldAuth.Models;

namespace ShieldAuth
{
    public static class ShieldAuth
    {
        private static string _appId;
        private static string _sessionId;
        private static bool _isValid = false;
        private static readonly HttpClient _httpClient = new HttpClient();
        private const string API_URL = "https://api.shieldauth.com/api/v1";
        
        /// <summary>
        /// Initialize ShieldAuth with your App ID
        /// </summary>
        public static void Initialize(string appId)
        {
            if (string.IsNullOrEmpty(appId))
                throw new ArgumentException("App ID cannot be empty", nameof(appId));
            
            _appId = appId;
        }
        
        /// <summary>
        /// Validate a license key
        /// </summary>
        public static async Task<bool> ValidateAsync(string licenseKey)
        {
            if (string.IsNullOrEmpty(_appId))
                throw new InvalidOperationException("ShieldAuth not initialized. Call Initialize() first.");
            
            try
            {
                string hwid = HWID.Get();
                
                var request = new ValidateRequest
                {
                    AppId = _appId,
                    LicenseKey = licenseKey,
                    HWID = hwid
                };
                
                string json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                HttpResponseMessage response = await _httpClient.PostAsync($"{API_URL}/validate", content);
                string responseBody = await response.Content.ReadAsStringAsync();
                
                var result = JsonSerializer.Deserialize<ValidateResponse>(responseBody);
                
                _isValid = result?.Valid ?? false;
                if (_isValid)
                {
                    _sessionId = result.SessionId;
                }
                
                return _isValid;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ShieldAuth validation error: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Synchronous version of Validate
        /// </summary>
        public static bool Validate(string licenseKey)
        {
            return ValidateAsync(licenseKey).GetAwaiter().GetResult();
        }
        
        /// <summary>
        /// Send heartbeat to keep session alive
        /// </summary>
        public static async Task<bool> HeartbeatAsync()
        {
            if (string.IsNullOrEmpty(_sessionId))
                return false;
            
            try
            {
                var request = new { session_id = _sessionId };
                string json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                HttpResponseMessage response = await _httpClient.PostAsync($"{API_URL}/heartbeat", content);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }
        
        /// <summary>
        /// Get current session ID
        /// </summary>
        public static string GetSessionId() => _sessionId;
        
        /// <summary>
        /// Get current HWID
        /// </summary>
        public static string GetHWID() => HWID.Get();
        
        /// <summary>
        /// Check if currently valid (offline check)
        /// </summary>
        public static bool IsValid() => _isValid;
    }
}