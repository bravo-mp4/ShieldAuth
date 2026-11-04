using System;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace ShieldAuth
{
    public sealed class ShieldAuthOptions
    {
        /// <summary>Base URL of the API, ending in /api/v1.</summary>
        public string ApiUrl { get; set; } = "";

        /// <summary>PEM public key from GET /api/v1/public/signing-key. Pin it in your app.</summary>
        public string? PublicKeyPem { get; set; }

        /// <summary>Only for local experiments: accept answers without checking signatures.</summary>
        public bool AllowUnsigned { get; set; }

        public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(10);
        public TimeSpan MaxClockSkew { get; set; } = TimeSpan.FromMinutes(5);

        /// <summary>Override the hardware ID (default: <see cref="Hwid.Get"/>).</summary>
        public string? Hwid { get; set; }
    }

    /// <summary>
    /// var shield = new ShieldAuthClient(appId, new ShieldAuthOptions { ApiUrl = ..., PublicKeyPem = ... });
    /// if (!await shield.ValidateAsync(key)) Environment.Exit(1);
    /// shield.StartHeartbeat(TimeSpan.FromMinutes(5), reason => Environment.Exit(1));
    /// </summary>
    public sealed class ShieldAuthClient : IDisposable
    {
        private readonly string _appId;
        private readonly ShieldAuthOptions _options;
        private readonly ECDsa? _publicKey;
        private readonly HttpClient _http;
        private string? _licenseKey;
        private Timer? _heartbeatTimer;
        private int _heartbeatRunning;

        public string Hwid { get; }
        public string? SessionId { get; private set; }
        public bool IsValid { get; private set; }
        public string LastMessage { get; private set; } = "";

        public ShieldAuthClient(string appId, ShieldAuthOptions options, HttpMessageHandler? handler = null)
        {
            if (string.IsNullOrEmpty(appId)) throw new ArgumentException("appId is required", nameof(appId));
            if (string.IsNullOrEmpty(options.ApiUrl)) throw new ArgumentException("ApiUrl is required", nameof(options));
            if (string.IsNullOrEmpty(options.PublicKeyPem) && !options.AllowUnsigned)
                throw new ArgumentException("PublicKeyPem is required (or set AllowUnsigned for local testing)", nameof(options));

            _appId = appId;
            _options = options;
            _publicKey = string.IsNullOrEmpty(options.PublicKeyPem) ? null : Protocol.ImportPublicKey(options.PublicKeyPem!);
            _http = handler == null ? new HttpClient() : new HttpClient(handler);
            _http.Timeout = options.Timeout;
            Hwid = options.Hwid ?? ShieldAuth.Hwid.Get();
        }

        /// <summary>True if the license is valid. Never throws; network errors count as not valid.</summary>
        public async Task<bool> ValidateAsync(string licenseKey)
        {
            _licenseKey = licenseKey;
            var nonce = Protocol.NewNonce();
            var body = await PostAsync("/validate", new { app_id = _appId, license_key = licenseKey, hwid = Hwid, nonce });
            if (body == null) return Fail("Couldn't reach the license server");

            var message = Protocol.CanonicalMessage("validate",
                _appId, licenseKey, Hwid, nonce, body.Valid ? 1 : 0, body.SessionId, body.ExpiresAt, body.SignedAt);
            if (!Trusted(body, nonce, message)) return Fail("License server answer failed verification");

            IsValid = body.Valid;
            SessionId = body.Valid ? body.SessionId : null;
            LastMessage = body.Message ?? "";
            return IsValid;
        }

        /// <summary>Renews the session. False once revoked or lapsed; also false (but still valid) when offline.</summary>
        public async Task<bool> HeartbeatAsync()
        {
            var sessionId = SessionId;
            if (sessionId == null) return false;
            var nonce = Protocol.NewNonce();
            var body = await PostAsync("/heartbeat", new { session_id = sessionId, nonce });
            if (body == null) return false;

            var message = Protocol.CanonicalMessage("heartbeat", sessionId, nonce, body.Valid ? 1 : 0, body.SignedAt);
            if (!Trusted(body, nonce, message)) return false;

            if (!body.Valid)
            {
                IsValid = false;
                SessionId = null;
            }
            LastMessage = body.Message ?? "";
            return body.Valid;
        }

        /// <summary>
        /// Sends heartbeats on a timer and calls onInvalid once the server says the
        /// license is gone (after one fresh validation, for sessions that lapsed).
        /// </summary>
        public void StartHeartbeat(TimeSpan interval, Action<string> onInvalid)
        {
            StopHeartbeat();
            _heartbeatTimer = new Timer(async _ =>
            {
                if (Interlocked.Exchange(ref _heartbeatRunning, 1) == 1) return;
                try
                {
                    await HeartbeatAsync();
                    if (!IsValid && _licenseKey != null) await ValidateAsync(_licenseKey);
                    if (!IsValid)
                    {
                        StopHeartbeat();
                        onInvalid(string.IsNullOrEmpty(LastMessage) ? "License is no longer valid" : LastMessage);
                    }
                }
                finally
                {
                    Interlocked.Exchange(ref _heartbeatRunning, 0);
                }
            }, null, interval, interval);
        }

        public void StopHeartbeat()
        {
            _heartbeatTimer?.Dispose();
            _heartbeatTimer = null;
        }

        public void Dispose()
        {
            StopHeartbeat();
            _http.Dispose();
            _publicKey?.Dispose();
        }

        private bool Fail(string message)
        {
            IsValid = false;
            SessionId = null;
            LastMessage = message;
            return false;
        }

        private bool Trusted(Answer body, string nonce, string message)
        {
            if (_options.AllowUnsigned && _publicKey == null) return true;
            if (_publicKey == null || body.Signature == null || body.Nonce != nonce || body.SignedAt == null) return false;
            var age = Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - body.SignedAt.Value);
            if (age > _options.MaxClockSkew.TotalSeconds) return false;
            return Protocol.VerifySignature(_publicKey, message, body.Signature);
        }

        private async Task<Answer?> PostAsync(string path, object payload)
        {
            try
            {
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                using (var response = await _http.PostAsync(_options.ApiUrl.TrimEnd('/') + path, content))
                {
                    // 401 from /heartbeat still carries a signed verdict.
                    if (!response.IsSuccessStatusCode && response.StatusCode != HttpStatusCode.Unauthorized) return null;
                    return JsonSerializer.Deserialize<Answer>(await response.Content.ReadAsStringAsync());
                }
            }
            catch (Exception ex) when (ex is HttpRequestException || ex is TaskCanceledException || ex is JsonException)
            {
                return null;
            }
        }

        private sealed class Answer
        {
            [JsonPropertyName("valid")] public bool Valid { get; set; }
            [JsonPropertyName("message")] public string? Message { get; set; }
            [JsonPropertyName("session_id")] public string? SessionId { get; set; }
            [JsonPropertyName("expires_at")] public long? ExpiresAt { get; set; }
            [JsonPropertyName("nonce")] public string? Nonce { get; set; }
            [JsonPropertyName("signed_at")] public long? SignedAt { get; set; }
            [JsonPropertyName("signature")] public string? Signature { get; set; }
        }
    }
}
