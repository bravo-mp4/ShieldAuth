#pragma once

#include <string>

namespace ShieldAuth {
    
    // Initialize with your app ID
    bool Initialize(const std::string& app_id);
    
    // Validate license key (calls API)
    bool Validate(const std::string& license_key);
    
    // Send heartbeat (call every 5 minutes)
    bool Heartbeat();
    
    // Get current session ID
    std::string GetSessionID();
    
    // Get HWID of current machine
    std::string GetHWID();
    
    // Check if license is still valid (offline check)
    bool IsValid();
}