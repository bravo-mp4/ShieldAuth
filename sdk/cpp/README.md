# ShieldAuth C++ SDK

## Installation

### Option 1: Static Library
```bash
mkdir build && cd build
cmake ..
cmake --build .
```

Link `libshieldauth.a` to your project.

### Option 2: Header-Only (Copy Files)
Copy `include/` and `src/` to your project.

## Usage
```cpp
#include "shieldauth.h"

int main() {
    ShieldAuth::Initialize("your_app_id");
    
    if (!ShieldAuth::Validate(license_key)) {
        return 1;
    }
    
    // Your app runs
}
```

## Building Example
```bash
cd build
./example
```