#pragma once

// ShieldAuth C++ SDK (Windows: WinHTTP + CNG, no third-party libraries).
// Protocol: sdk/PROTOCOL.md.

#include <map>
#include <string>

namespace ShieldAuth {

struct Config {
    std::string app_id;
    // Base URL ending in /api/v1, e.g. "https://licensing.example.com/api/v1".
    std::string api_url;
    // PEM from GET /api/v1/public/signing-key. Pin it in your binary.
    std::string public_key_pem;
    // Only for local experiments: accept answers without checking signatures.
    bool allow_unsigned = false;
    int max_clock_skew_seconds = 300;
    // Override the hardware ID (default: GetHWID()).
    std::string hwid;
};

// Returns false if the config is incomplete or the public key can't be read.
bool Initialize(const Config& config);

// True only for a signed, fresh answer that says the license is valid.
bool Validate(const std::string& license_key);

// Renews the session. False once revoked or lapsed (IsValid() turns false),
// and also false while offline (IsValid() stays true). Call every few minutes.
bool Heartbeat();

bool IsValid();
std::string GetSessionID();
std::string GetHWID();
std::string LastMessage();

// Building blocks, exposed for tests.
namespace Detail {
std::string CanonicalMessage(const std::string& type, std::initializer_list<std::string> fields);
bool VerifySignature(const std::string& public_key_pem, const std::string& message, const std::string& signature_b64);
std::string Sha256Hex(const std::string& data);
std::string RandomNonce();
std::string JsonEscape(const std::string& value);
// Parses a flat JSON object. Strings are unescaped; numbers, booleans and
// null are returned as their literal text.
std::map<std::string, std::string> ParseFlatObject(const std::string& json);
}  // namespace Detail

}  // namespace ShieldAuth
