// Asks for a license key, validates it, then sends a heartbeat every five
// minutes and stops if the license is revoked.

#include "shieldauth.h"

#include <chrono>
#include <iostream>
#include <thread>

// Paste the key from your dashboard's application page.
static const char* kPublicKey = R"(-----BEGIN PUBLIC KEY-----
REPLACE_WITH_YOUR_SHIELDAUTH_PUBLIC_KEY
-----END PUBLIC KEY-----
)";

int main() {
    ShieldAuth::Config config;
    config.app_id = "YOUR_APP_ID";
    config.api_url = "https://your-shieldauth-host/api/v1";
    config.public_key_pem = kPublicKey;

    if (!ShieldAuth::Initialize(config)) {
        std::cerr << "ShieldAuth is not configured\n";
        return 1;
    }

    std::string licenseKey;
    std::cout << "License key: ";
    std::getline(std::cin, licenseKey);

    if (!ShieldAuth::Validate(licenseKey)) {
        std::cerr << "Not licensed: " << ShieldAuth::LastMessage() << "\n";
        return 1;
    }
    std::cout << "Licensed. Running...\n";

    while (true) {
        std::this_thread::sleep_for(std::chrono::minutes(5));
        ShieldAuth::Heartbeat();
        if (!ShieldAuth::IsValid()) {
            std::cerr << "License ended: " << ShieldAuth::LastMessage() << "\n";
            return 1;
        }
    }
}
