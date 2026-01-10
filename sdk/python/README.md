# ShieldAuth Python SDK

Python 3.7+ compatible authentication SDK for ShieldAuth.

## Features

- ✅ License validation with HWID binding
- ✅ Automatic HWID generation (CPU, Motherboard, MAC)
- ✅ Session management
- ✅ Heartbeat system
- ✅ Cross-platform (Windows, Linux, macOS)
- ✅ Simple, pythonic API
- ✅ Type hints support

## Installation

### Option 1: Install dependencies

```bash
pip install -r requirements.txt
```

### Option 2: Install manually

```bash
pip install requests
```

## Quick Start

```python
from shieldauth import ShieldAuthClient

# Initialize client
client = ShieldAuthClient("your_app_id_here")

# Validate license
result = client.validate("license-key-here")

if result['valid']:
    print("✓ License valid!")
    print(f"Session: {client.get_session_id()}")
    
    # Send heartbeat
    client.heartbeat()
else:
    print(f"✗ {result['message']}")
```

## API Reference

### Class: `ShieldAuthClient`

#### Constructor

```python
ShieldAuthClient(app_id: str, api_url: str = "...")
```

- `app_id`: Your application ID from ShieldAuth dashboard
- `api_url`: (Optional) Custom API URL for self-hosted instances

#### Methods

##### `validate(license_key: str) -> Dict[str, Any]`

Validates a license key and binds it to the current hardware.

**Returns:** Dictionary with keys:
- `valid` (bool): Validation result
- `message` (str): Status message
- `expires_at` (int, optional): Expiration timestamp
- `session_id` (str, optional): Session ID

```python
result = client.validate("license-key")
if result['valid']:
    # License is valid
    session_id = result['session_id']
```

##### `heartbeat() -> bool`

Sends a heartbeat to keep the session alive.

**Returns:** `True` if successful, `False` otherwise

```python
success = client.heartbeat()
```

##### `get_session_id() -> Optional[str]`

Returns the current session ID after successful validation.

##### `get_hwid_value() -> Optional[str]`

Returns the computed hardware ID for the current machine.

##### `is_valid() -> bool`

Returns `True` if validation was successful.

### Helper Function

#### `validate_license(app_id: str, license_key: str) -> bool`

Quick validation without creating a client instance.

```python
from shieldauth import validate_license

if validate_license("app_id", "license_key"):
    print("Valid!")
```

## Complete Example

```python
from shieldauth import ShieldAuthClient
import time
import threading

def heartbeat_worker(client):
    """Send heartbeat every 5 minutes"""
    while client.is_valid():
        time.sleep(300)
        client.heartbeat()

# Initialize
client = ShieldAuthClient("your_app_id")

# Validate
result = client.validate("license-key")

if result['valid']:
    # Start heartbeat thread
    heartbeat_thread = threading.Thread(
        target=heartbeat_worker,
        args=(client,),
        daemon=True
    )
    heartbeat_thread.start()
    
    # Your application logic
    print("Application running...")
    while True:
        # Your code here
        time.sleep(1)
else:
    print(f"License invalid: {result['message']}")
```

## Flask/Django Integration

### Flask Example

```python
from flask import Flask, jsonify, request
from shieldauth import ShieldAuthClient

app = Flask(__name__)
client = ShieldAuthClient("your_app_id")

@app.route('/api/validate', methods=['POST'])
def validate():
    license_key = request.json.get('license_key')
    result = client.validate(license_key)
    return jsonify(result)

if __name__ == '__main__':
    app.run()
```

### Django Example

```python
# views.py
from django.http import JsonResponse
from shieldauth import ShieldAuthClient

client = ShieldAuthClient("your_app_id")

def validate_license(request):
    license_key = request.POST.get('license_key')
    result = client.validate(license_key)
    return JsonResponse(result)
```

## Automation/Bot Usage

Perfect for automation tools, Discord bots, or any Python application:

```python
from shieldauth import validate_license

# Quick validation
if not validate_license("app_id", "license_key"):
    print("Invalid license!")
    exit(1)

# Rest of your bot/automation code
print("Starting bot...")
```

## Error Handling

```python
try:
    result = client.validate(license_key)
    
    if not result['valid']:
        message = result['message']
        
        if 'expired' in message.lower():
            print("License expired!")
        elif 'hwid' in message.lower():
            print("HWID mismatch or limit reached!")
        else:
            print(f"Validation failed: {message}")
    else:
        print("Success!")
        
except Exception as e:
    print(f"Error: {e}")
```

## Platform-Specific Notes

### Windows
- Requires `wmic` command (available by default)
- Works on Windows 7, 10, 11

### Linux
- May require `sudo` for some HWID methods (dmidecode)
- Falls back to CPU info and MAC address if elevated permissions unavailable

### macOS
- Uses `system_profiler` for hardware info
- Works on macOS 10.13+

## HWID Generation

The SDK automatically generates a unique hardware ID using:

1. **CPU ID** (processor serial)
2. **Motherboard Serial Number**
3. **MAC Address**

The combined info is hashed with SHA-256 for privacy and consistency.

## Best Practices

1. **Store session ID**: Cache `get_session_id()` to avoid repeated validation
2. **Regular heartbeats**: Send every 5 minutes (300 seconds)
3. **Handle network errors**: Wrap calls in try-except blocks
4. **Don't hardcode keys**: Never embed license keys in your source code
5. **Obfuscate**: Use PyArmor or similar tools to protect your Python code

## Example: Background Service

```python
import time
import signal
import sys
from shieldauth import ShieldAuthClient

class LicensedService:
    def __init__(self, app_id, license_key):
        self.client = ShieldAuthClient(app_id)
        self.running = False
        
        # Validate on startup
        result = self.client.validate(license_key)
        if not result['valid']:
            raise Exception(f"Invalid license: {result['message']}")
        
        print("License validated successfully")
    
    def start(self):
        self.running = True
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self.stop)
        signal.signal(signal.SIGTERM, self.stop)
        
        last_heartbeat = time.time()
        
        while self.running:
            # Your service logic here
            time.sleep(1)
            
            # Heartbeat every 5 minutes
            if time.time() - last_heartbeat > 300:
                self.client.heartbeat()
                last_heartbeat = time.time()
    
    def stop(self, signum, frame):
        print("Shutting down...")
        self.running = False
        sys.exit(0)

if __name__ == '__main__':
    service = LicensedService("app_id", "license_key")
    service.start()
```

## Running the Example

```bash
cd sdk/python
python example.py
```

## Support

- Documentation: https://shield-auth.vercel.app/docs
- Support: support@shieldlabs.com
- Discord: https://discord.gg/shieldauth

## License

MIT License - See LICENSE file for details
