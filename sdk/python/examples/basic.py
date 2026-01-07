import time
from shieldauth import ShieldAuth

# Initialize
auth = ShieldAuth("YOUR_APP_ID")

# Get license from user
license_key = input("Enter license key: ")

# Validate
print("Validating license...")
if not auth.validate(license_key):
    print("Invalid license!")
    exit(1)

print("License valid!")
print(f"Session ID: {auth.get_session_id()}")
print(f"HWID: {ShieldAuth.get_hwid()}")

# Your application runs here
print("\nApplication running...")
for i in range(60):
    print(f"Running... {i}s")
    time.sleep(1)
    
    # Heartbeat every 5 minutes
    if i % 300 == 0 and i > 0:
        if auth.heartbeat():
            print("Heartbeat sent")
        else:
            print("Heartbeat failed")