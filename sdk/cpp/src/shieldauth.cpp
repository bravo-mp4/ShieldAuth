#include "shieldauth.h"

#include <cstdlib>
#include <ctime>

namespace ShieldAuth {

std::string ComputeHWID();

namespace Detail {
std::string HttpPost(const std::string& url, const std::string& body, int& status);

std::string CanonicalMessage(const std::string& type, std::initializer_list<std::string> fields) {
    std::string out = "shieldauth-v1\n" + type;
    for (const std::string& field : fields) out += "\n" + field;
    return out;
}
}  // namespace Detail

namespace {

Config g_config;
std::string g_hwid;
std::string g_session_id;
std::string g_license_key;
std::string g_last_message;
bool g_valid = false;
bool g_initialized = false;

using Answer = std::map<std::string, std::string>;

std::string Field(const Answer& answer, const char* name) {
    auto it = answer.find(name);
    return it == answer.end() || it->second == "null" ? "" : it->second;
}

bool Post(const std::string& path, const std::string& body, Answer& answer) {
    int status = 0;
    std::string response = Detail::HttpPost(g_config.api_url + path, body, status);
    // 401 from /heartbeat still carries a signed verdict.
    if (response.empty() || (status != 200 && status != 401)) return false;
    answer = Detail::ParseFlatObject(response);
    return !answer.empty();
}

// Signature, echoed nonce and timestamp must all check out.
bool Trusted(const Answer& answer, const std::string& nonce, const std::string& message) {
    if (g_config.allow_unsigned && g_config.public_key_pem.empty()) return true;
    std::string signedAt = Field(answer, "signed_at");
    if (Field(answer, "nonce") != nonce || signedAt.empty() || Field(answer, "signature").empty()) return false;
    long long age = static_cast<long long>(time(nullptr)) - atoll(signedAt.c_str());
    if (age > g_config.max_clock_skew_seconds || -age > g_config.max_clock_skew_seconds) return false;
    return Detail::VerifySignature(g_config.public_key_pem, message, Field(answer, "signature"));
}

bool Fail(const std::string& message) {
    g_valid = false;
    g_session_id.clear();
    g_last_message = message;
    return false;
}

}  // namespace

bool Initialize(const Config& config) {
    g_initialized = false;
    if (config.app_id.empty() || config.api_url.empty()) return false;
    if (config.public_key_pem.empty() && !config.allow_unsigned) return false;

    g_config = config;
    while (!g_config.api_url.empty() && g_config.api_url.back() == '/') g_config.api_url.pop_back();
    g_hwid = config.hwid.empty() ? ComputeHWID() : config.hwid;
    g_initialized = true;
    return true;
}

bool Validate(const std::string& license_key) {
    if (!g_initialized) return Fail("ShieldAuth::Initialize was not called");
    g_license_key = license_key;
    std::string nonce = Detail::RandomNonce();

    std::string body = "{\"app_id\":\"" + Detail::JsonEscape(g_config.app_id) + "\",\"license_key\":\"" +
                       Detail::JsonEscape(license_key) + "\",\"hwid\":\"" + Detail::JsonEscape(g_hwid) +
                       "\",\"nonce\":\"" + nonce + "\"}";
    Answer answer;
    if (!Post("/validate", body, answer)) return Fail("Couldn't reach the license server");

    bool valid = Field(answer, "valid") == "true";
    std::string message = Detail::CanonicalMessage("validate", {
        g_config.app_id, license_key, g_hwid, nonce, valid ? "1" : "0",
        Field(answer, "session_id"), Field(answer, "expires_at"), Field(answer, "signed_at"),
    });
    if (!Trusted(answer, nonce, message)) return Fail("License server answer failed verification");

    g_valid = valid;
    g_session_id = valid ? Field(answer, "session_id") : "";
    g_last_message = Field(answer, "message");
    return g_valid;
}

bool Heartbeat() {
    if (g_session_id.empty()) return false;
    std::string sessionId = g_session_id;
    std::string nonce = Detail::RandomNonce();

    Answer answer;
    if (!Post("/heartbeat", "{\"session_id\":\"" + Detail::JsonEscape(sessionId) + "\",\"nonce\":\"" + nonce + "\"}",
              answer)) {
        return false;  // offline: keep the session and try again later
    }

    bool valid = Field(answer, "valid") == "true";
    std::string message =
        Detail::CanonicalMessage("heartbeat", {sessionId, nonce, valid ? "1" : "0", Field(answer, "signed_at")});
    if (!Trusted(answer, nonce, message)) return false;

    if (!valid) {
        // A lapsed session gets one fresh validation before giving up.
        if (!g_license_key.empty() && Validate(g_license_key)) return true;
        g_valid = false;
        g_session_id.clear();
    }
    g_last_message = Field(answer, "message");
    return valid;
}

bool IsValid() { return g_valid; }
std::string GetSessionID() { return g_session_id; }
std::string GetHWID() { return g_initialized ? g_hwid : ComputeHWID(); }
std::string LastMessage() { return g_last_message; }

}  // namespace ShieldAuth
