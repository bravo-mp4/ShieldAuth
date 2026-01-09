import platform
import subprocess
import hashlib
import uuid

def get_hwid():
    """Get hardware ID for current machine"""
    cpu_id = _get_cpu_id()
    mac_address = _get_mac_address()
    machine_id = _get_machine_id()
    
    combined = f"{cpu_id}{mac_address}{machine_id}"
    return hashlib.sha256(combined.encode()).hexdigest()

def _get_cpu_id():
    """Get CPU ID"""
    try:
        if platform.system() == "Windows":
            output = subprocess.check_output("wmic cpu get ProcessorId", shell=True)
            return output.decode().split('\n')[1].strip()
        elif platform.system() == "Linux":
            with open('/proc/cpuinfo', 'r') as f:
                for line in f:
                    if 'Serial' in line:
                        return line.split(':')[1].strip()
        elif platform.system() == "Darwin":  # macOS
            output = subprocess.check_output("sysctl -n machdep.cpu.brand_string", shell=True)
            return output.decode().strip()
    except:
        pass
    return ""

def _get_mac_address():
    """Get MAC address"""
    try:
        mac = uuid.getnode()
        return ':'.join(('%012X' % mac)[i:i+2] for i in range(0, 12, 2))
    except:
        return ""

def _get_machine_id():
    """Get machine ID"""
    try:
        if platform.system() == "Windows":
            output = subprocess.check_output("wmic csproduct get UUID", shell=True)
            return output.decode().split('\n')[1].strip()
        elif platform.system() == "Linux":
            with open('/etc/machine-id', 'r') as f:
                return f.read().strip()
        elif platform.system() == "Darwin":
            output = subprocess.check_output("ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID", shell=True)
            return output.decode().split('"')[3]
    except:
        pass
    return ""