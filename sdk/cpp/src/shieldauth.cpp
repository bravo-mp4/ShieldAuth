#include "../include/shieldauth.h"
#include <sstream>

// Forward declarations from other files
namespace ShieldAuth {
    std::string GetHWID();
    std::string HttpPost(const std::string& url, const std::string& path, const std::string& json);
}

namespace ShieldAuth {
    
    static std::string g_app_id;
    static std::string g_session_id;
    static bool g_is_valid = false;
    static std::string API_URL = "api.shieldauth.com"; // Replace with your domain
    
    bool Initialize(const std::string& app_id) {
        g_app_id = app_id;
        return !app_id.empty();
    }
    
    // Simple JSON parser for "valid" field
    bool ParseValidField(const std::string& json) {
        size_t pos = json.find("\"valid\"");
        if (pos == std::string::npos) return false;
        
        pos = json.find(":", pos);
        if (pos == std::string::npos) return false;
        
        pos = json.find_first_not_of(" \t\n\r", pos + 1);
        if (pos == std::string::npos) return false;
        
        return json.substr(pos, 4) == "true";
    }
    
    std::string ExtractField(const std::string& json, const std::string& field) {
        size_t pos = json.find("\"" + field + "\"");
        if (pos == std::string::npos) return "";
        
        pos = json.find(":", pos);
        if (pos == std::string::npos) return "";
        
        pos = json.find("\"", pos);
        if (pos == std::string::npos) return "";
        
        size_t end = json.find("\"", pos + 1);
        if (end == std::string::npos) return "";
        
        return json.substr(pos + 1, end - pos - 1);
    }
    
    bool Validate(const std::string& license_key) {
        if (g_app_id.empty()) return false;
        
        std::string hwid = GetHWID();
        
        // Build JSON request
        std::stringstream ss;
        ss << "{"
           << "\"app_id\":\"" << g_app_id << "\","
           << "\"license_key\":\"" << license_key << "\","
           << "\"hwid\":\"" << hwid << "\""
           << "}";
        
        std::string response = HttpPost(API_URL, "/api/v1/validate", ss.str());
        
        if (response.empty()) return false;
        
        g_is_valid = ParseValidField(response);
        
        if (g_is_valid) {
            g_session_id = ExtractField(response, "session_id");
        }
        
        return g_is_valid;
    }
    
    bool Heartbeat() {
        if (g_session_id.empty()) return false;
        
        std::stringstream ss;
        ss << "{\"session_id\":\"" << g_session_id << "\"}";
        
        std::string response = HttpPost(API_URL, "/api/v1/heartbeat", ss.str());
        
        return !response.empty();
    }
    
    std::string GetSessionID() {
        return g_session_id;
    }
    
    bool IsValid() {
        return g_is_valid;
    }
}