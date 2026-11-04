"""A stable per-machine ID.

SHA-256 of the operating system's machine identifier plus the CPU
description. MAC addresses are left out because VPNs, Docker and USB
adapters change them.
"""

import hashlib
import platform
import socket
import subprocess


def _machine_id() -> str:
    system = platform.system()
    try:
        if system == "Windows":
            import winreg  # Windows-only module

            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Cryptography") as key:
                return str(winreg.QueryValueEx(key, "MachineGuid")[0])
        if system == "Darwin":
            output = subprocess.run(
                ["ioreg", "-rd1", "-c", "IOPlatformExpertDevice"],
                capture_output=True, text=True, timeout=5, check=False,
            ).stdout
            for line in output.splitlines():
                if "IOPlatformUUID" in line:
                    return line.split('"')[-2]
        for path in ("/etc/machine-id", "/var/lib/dbus/machine-id"):
            try:
                with open(path, encoding="utf-8") as handle:
                    return handle.read().strip()
            except OSError:
                continue
    except Exception:  # noqa: BLE001 - any failure falls back to the hostname
        pass
    return socket.gethostname()


def get_hwid() -> str:
    parts = [_machine_id(), platform.processor(), platform.system(), platform.machine()]
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()
