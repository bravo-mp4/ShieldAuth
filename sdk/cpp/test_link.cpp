#include "include/shieldauth.h"
#include <iostream>

int main() {
    std::string hwid = ShieldAuth::GetHWID();
    std::cout << "HWID: " << hwid << std::endl;
    return 0;
}
