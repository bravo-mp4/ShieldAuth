#include <string>
#include <sstream>
#include <iomanip>
#include <windows.h>
#include <intrin.h>
#include <iphlpapi.h>

#pragma comment(lib, "iphlpapi.lib")

namespace ShieldAuth {
    
    // SHA256 hash function (simple implementation)
    std::string SHA256(const std::string& input) {
        // For production, use a proper crypto library
        // This is simplified
        unsigned long hash = 5381;
        for (char c : input) {
            hash = ((hash << 5) + hash) + c;
        }
        
        std::stringstream ss;
        ss << std::hex << std::setfill('0') << std::setw(16) << hash;
        return ss.str();
    }
    
    std::string GetCPUID() {
        int cpuInfo[4] = {0};
        __cpuid(cpuInfo, 0);
        
        std::stringstream ss;
        ss << std::hex << cpuInfo[0] << cpuInfo[1] << cpuInfo[2] << cpuInfo[3];
        return ss.str();
    }
    
    std::string GetMacAddress() {
        IP_ADAPTER_INFO adapterInfo[16];
        DWORD bufLen = sizeof(adapterInfo);
        
        DWORD status = GetAdaptersInfo(adapterInfo, &bufLen);
        if (status != ERROR_SUCCESS) {
            return "";
        }
        
        std::stringstream ss;
        for (int i = 0; i < 6; i++) {
            ss << std::hex << std::setfill('0') << std::setw(2) 
               << (int)adapterInfo[0].Address[i];
        }
        return ss.str();
    }
    
    std::string GetVolumeSerial() {
        DWORD serialNum = 0;
        GetVolumeInformationA("C:\\", NULL, 0, &serialNum, NULL, NULL, NULL, 0);
        
        std::stringstream ss;
        ss << std::hex << serialNum;
        return ss.str();
    }
    
    std::string GetHWID() {
        std::string combined = GetCPUID() + GetMacAddress() + GetVolumeSerial();
        return SHA256(combined);
    }
}