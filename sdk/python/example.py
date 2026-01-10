#!/usr/bin/env python3
"""
ShieldAuth Python SDK Example

This example demonstrates how to use the ShieldAuth Python SDK
for license validation and session management.
"""

import time
import threading
from shieldauth import ShieldAuthClient


def heartbeat_worker(client: ShieldAuthClient, interval: int = 300):
    """
    Background worker to send heartbeats.
    
    Args:
        client: ShieldAuth client instance
        interval: Heartbeat interval in seconds (default: 300 = 5 minutes)
    """
    while client.is_valid():
        time.sleep(interval)
        if client.is_valid():
            success = client.heartbeat()
            status = "✓" if success else "✗"
            print(f"[{time.strftime('%H:%M:%S')}] Heartbeat sent: {status}")


def main():
    print("ShieldAuth Python SDK Example")
    print("==============================\n")
    
    # Initialize client
    client = ShieldAuthClient("YOUR_APP_ID_HERE")
    
    # Get license key from user
    license_key = input("Enter your license key: ")
    
    # Validate license
    print("\nValidating license...")
    result = client.validate(license_key)
    
    if not result['valid']:
        print(f"❌ Validation failed: {result['message']}")
        return
    
    print("✓ License valid!")
    print(f"Session ID: {client.get_session_id()}")
    print(f"HWID: {client.get_hwid_value()}")
    
    if 'expires_at' in result:
        from datetime import datetime
        expires_at = datetime.fromtimestamp(result['expires_at'])
        print(f"Expires: {expires_at}")
    
    # Start heartbeat thread
    print("\n🚀 Application started successfully!")
    print("Starting heartbeat worker (every 30s for demo)...\n")
    
    heartbeat_thread = threading.Thread(
        target=heartbeat_worker,
        args=(client, 30),  # 30 seconds for demo (use 300 for production)
        daemon=True
    )
    heartbeat_thread.start()
    
    # Simulate application running
    print("Application running for 60 seconds...\n")
    for i in range(1, 61):
        print(f"[{time.strftime('%H:%M:%S')}] Running... {i}s")
        time.sleep(1)
    
    print("\nApplication finished.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nExiting...")
    except Exception as e:
        print(f"\nError: {e}")
