import hashlib
import platform
import subprocess
import uuid
import requests
from typing import Optional, Dict, Any


class ShieldAuthClient:
    """
    ShieldAuth Python SDK for license validation and HWID binding.
    """
    
    def __init__(self, app_id: str, api_url: str = "https://shieldauth-production.up.railway.app/api/v1"):
        """
        Initialize ShieldAuth client.
        
        Args:
            app_id: Your application ID from ShieldAuth dashboard
            api_url: API base URL (optional, for self-hosted instances)
        """
        self.app_id = app_id
        self.api_url = api_url.rstrip('/')
        self.session_id: Optional[str] = None
        self.hwid: Optional[str] = None
        self.license_key: Optional[str] = None
        self.is_initialized = False
    
    def get_hwid(self) -> str:
        """
        Generate hardware ID for the current machine.
        Uses CPU, motherboard, and MAC address info.
        
        Returns:
            Hardware ID as hex string
        """
        try:
            hwid_parts = []
            
            # Get CPU info
            if platform.system() == "Windows":
                # Windows: use WMIC
                try:
                    cpu_id = subprocess.check_output(
                        "wmic cpu get ProcessorId", 
                        shell=True
                    ).decode().split('\n')[1].strip()
                    hwid_parts.append(cpu_id)
                except:
                    pass
                
                # Motherboard serial
                try:
                    board_serial = subprocess.check_output(
                        "wmic baseboard get SerialNumber",
                        shell=True
                    ).decode().split('\n')[1].strip()
                    hwid_parts.append(board_serial)
                except:
                    pass
            
            elif platform.system() == "Linux":
                # Linux: use /proc/cpuinfo and dmidecode
                try:
                    with open('/proc/cpuinfo', 'r') as f:
                        for line in f:
                            if 'Serial' in line or 'processor' in line:
                                hwid_parts.append(line.split(':')[1].strip())
                                break
                except:
                    pass
                
                try:
                    board_serial = subprocess.check_output(
                        ["sudo", "dmidecode", "-s", "baseboard-serial-number"],
                        stderr=subprocess.DEVNULL
                    ).decode().strip()
                    hwid_parts.append(board_serial)
                except:
                    pass
            
            elif platform.system() == "Darwin":
                # macOS: use system_profiler
                try:
                    serial = subprocess.check_output(
                        ["system_profiler", "SPHardwareDataType"],
                        stderr=subprocess.DEVNULL
                    ).decode()
                    for line in serial.split('\n'):
                        if 'Serial Number' in line:
                            hwid_parts.append(line.split(':')[1].strip())
                except:
                    pass
            
            # Get MAC address (cross-platform)
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                           for elements in range(0, 8*6, 8)][::-1])
            hwid_parts.append(mac)
            
            # Fallback: use hostname and system info
            if not hwid_parts:
                hwid_parts = [
                    platform.node(),
                    platform.machine(),
                    platform.processor()
                ]
            
            # Combine and hash
            combined = ''.join(hwid_parts)
            hwid_hash = hashlib.sha256(combined.encode()).hexdigest()
            
            return hwid_hash
            
        except Exception as e:
            print(f"Error generating HWID: {e}")
            # Fallback HWID
            fallback = f"{platform.node()}{uuid.getnode()}"
            return hashlib.sha256(fallback.encode()).hexdigest()
    
    def validate(self, license_key: str) -> Dict[str, Any]:
        """
        Validate a license key.
        
        Args:
            license_key: The license key to validate
            
        Returns:
            Dictionary with validation result:
            {
                'valid': bool,
                'message': str,
                'expires_at': int (optional, unix timestamp),
                'session_id': str (optional)
            }
        """
        try:
            self.license_key = license_key
            self.hwid = self.get_hwid()
            
            payload = {
                'app_id': self.app_id,
                'license_key': license_key,
                'hwid': self.hwid
            }
            
            response = requests.post(
                f"{self.api_url}/validate",
                json=payload,
                timeout=10
            )
            
            result = response.json()
            
            if result.get('valid'):
                self.session_id = result.get('session_id')
                self.is_initialized = True
            
            return result
            
        except requests.exceptions.RequestException as e:
            return {
                'valid': False,
                'message': f'Connection error: {str(e)}'
            }
        except Exception as e:
            return {
                'valid': False,
                'message': f'Error: {str(e)}'
            }
    
    def heartbeat(self) -> bool:
        """
        Send heartbeat to keep session alive.
        Call this periodically (recommended: every 5 minutes).
        
        Returns:
            True if heartbeat successful, False otherwise
        """
        if not self.is_initialized or not self.session_id:
            print("Not initialized. Call validate() first.")
            return False
        
        try:
            response = requests.post(
                f"{self.api_url}/heartbeat",
                headers={'session-id': self.session_id},
                timeout=5
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Heartbeat error: {e}")
            return False
    
    def get_session_id(self) -> Optional[str]:
        """Get the current session ID."""
        return self.session_id
    
    def get_hwid_value(self) -> Optional[str]:
        """Get the computed hardware ID."""
        return self.hwid
    
    def is_valid(self) -> bool:
        """Check if client is initialized with valid license."""
        return self.is_initialized


# Convenience function for quick validation
def validate_license(app_id: str, license_key: str) -> bool:
    """
    Quick validation helper function.
    
    Args:
        app_id: Your application ID
        license_key: License key to validate
        
    Returns:
        True if license is valid, False otherwise
    """
    client = ShieldAuthClient(app_id)
    result = client.validate(license_key)
    return result.get('valid', False)
