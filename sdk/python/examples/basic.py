"""Asks for a license key, validates it, then keeps the session alive.

    SHIELDAUTH_APP_ID=... SHIELDAUTH_API_URL=http://localhost:3000/api/v1 \
    SHIELDAUTH_PUBLIC_KEY="$(cat signing-key.pem)" python examples/basic.py
"""
import os
import sys
import time

from shieldauth import ShieldAuth

shield = ShieldAuth(
    os.environ["SHIELDAUTH_APP_ID"],
    api_url=os.environ["SHIELDAUTH_API_URL"],
    public_key=os.environ["SHIELDAUTH_PUBLIC_KEY"],
)

if not shield.validate(input("License key: ").strip()):
    sys.exit(f"Not licensed: {shield.last_message}")

print("Licensed. Running...")
shield.start_heartbeat()  # exits the process if the license is revoked
while True:
    time.sleep(60)  # stand-in for the real application
