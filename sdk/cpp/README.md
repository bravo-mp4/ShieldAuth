# ShieldAuth C++ SDK

Static library for integrating ShieldAuth license validation into C++ applications.

## Quick Start

### Build the Library

**Windows (Visual Studio):**

```cmd
build.bat
```

This creates:

- `dist/include/shieldauth.h` - Header file
- `dist/lib/shieldauth.lib` - Static library

**Linux/Mac:**

```bash
mkdir build && cd build
cmake ..
make
```

### Integration

1. **Copy files to your project:**

   - `dist/include/shieldauth.h` → your include directory
   - `dist/lib/shieldauth.lib` → your lib directory

2. **Install libcurl dependency:**

   - Windows: Download from https://curl.se/windows/
   - Linux: `sudo apt install libcurl4-openssl-dev`
   - Mac: `brew install curl`

3. **In your C++ code:**

```cpp
#include "shieldauth.h"
#include <iostream>

int main() {
    // Initialize with your app secret
    ShieldAuth auth("your-app-secret-here");
    auth.setApiUrl("https://shieldauth-production.up.railway.app");

    // Get hardware ID
    std::string hwid = auth.getHWID();

    // Validate license
    ValidationResponse response = auth.validateLicense("license-key", hwid);

    if (response.valid) {
        std::cout << "✓ License valid for: " << response.username << std::endl;
        // Your application logic here
    } else {
        std::cout << "✗ Invalid license: " << response.message << std::endl;
        return 1;
    }

    return 0;
}
```

4. **Link in your project:**
   - Visual Studio: Add to Linker → Input → `shieldauth.lib;libcurl.lib`
   - CMake: `target_link_libraries(your_app shieldauth curl)`
   - Command line: `cl your_app.cpp shieldauth.lib libcurl.lib`

## Requirements

- C++17 or higher
- libcurl
- Visual Studio 2017+ / GCC 7+ / Clang 5+

## Building Example

```bash
cd build
./example
```
