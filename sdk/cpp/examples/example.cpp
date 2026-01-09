#include "../include/shieldauth.h"
#include <iostream>
#include <thread>
#include <chrono>

int main() {
    // Initialize with your app ID
    if (!ShieldAuth::Initialize("YOUR_APP_ID_HERE")) {
        std::cout << "Failed to initialize ShieldAuth" << std::endl;
        return 1;
    }
    
    // Get license key from user
    std::string license_key;
    std::cout << "Enter license key: ";
    std::cin >> license_key;
    
    // Validate license
    std::cout << "Validating license..." << std::endl;
    if (!ShieldAuth::Validate(license_key)) {
        std::cout << "Invalid license key!" << std::endl;
        return 1;
    }
    
    std::cout << "License valid! Starting application..." << std::endl;
    std::cout << "Session ID: " << ShieldAuth::GetSessionID() << std::endl;
    std::cout << "HWID: " << ShieldAuth::GetHWID() << std::endl;
    
    // Your application runs here
    for (int i = 0; i < 60; i++) {
        std::cout << "Running... " << i << "s" << std::endl;
        std::this_thread::sleep_for(std::chrono::seconds(1));
        
        // Send heartbeat every 5 minutes
        if (i % 300 == 0 && i > 0) {
            if (ShieldAuth::Heartbeat()) {
                std::cout << "Heartbeat sent successfully" << std::endl;
            } else {
                std::cout << "Heartbeat failed!" << std::endl;
            }
        }
    }
    
    return 0;
}