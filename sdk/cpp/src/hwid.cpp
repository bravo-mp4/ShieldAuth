// A stable per-machine ID: SHA-256 of the Windows MachineGuid plus the CPU
// vendor and brand string. The old version mixed in a MAC address (which
// VPNs and adapters change) and "hashed" with a 64-bit djb2, not SHA-256.

#include "shieldauth.h"

#include <windows.h>
#include <intrin.h>

#include <cstring>

namespace ShieldAuth {
namespace Detail {

namespace {

std::string MachineGuid() {
    char value[128] = {};
    DWORD size = sizeof(value);
    if (RegGetValueA(HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Cryptography", "MachineGuid",
                     RRF_RT_REG_SZ | RRF_SUBKEY_WOW6464KEY, nullptr, value, &size) == ERROR_SUCCESS) {
        return value;
    }
    char name[MAX_COMPUTERNAME_LENGTH + 1] = {};
    DWORD length = sizeof(name);
    return GetComputerNameA(name, &length) ? name : "";
}

std::string CpuBrand() {
    int info[4] = {};
    char brand[49] = {};
    __cpuid(info, 0x80000000);
    if (static_cast<unsigned int>(info[0]) >= 0x80000004) {
        for (int i = 0; i < 3; i++) {
            __cpuid(info, 0x80000002 + i);
            memcpy(brand + i * 16, info, sizeof(info));
        }
    }
    return brand;
}

}  // namespace

}  // namespace Detail

#pragma comment(lib, "advapi32.lib")

std::string ComputeHWID() {
    return Detail::Sha256Hex(Detail::MachineGuid() + "|" + Detail::CpuBrand());
}

}  // namespace ShieldAuth
