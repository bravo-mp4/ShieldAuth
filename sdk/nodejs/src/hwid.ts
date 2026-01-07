import { execSync } from 'child_process';
import { createHash } from 'crypto';
import * as os from 'os';

export function getHWID(): string {
  const cpuId = getCPUID();
  const macAddress = getMacAddress();
  const machineId = getMachineId();
  
  const combined = cpuId + macAddress + machineId;
  return createHash('sha256').update(combined).digest('hex');
}

function getCPUID(): string {
  try {
    const platform = os.platform();
    
    if (platform === 'win32') {
      const output = execSync('wmic cpu get ProcessorId', { encoding: 'utf8' });
      return output.split('\n')[1].trim();
    } else if (platform === 'linux') {
      const output = execSync('cat /proc/cpuinfo | grep Serial', { encoding: 'utf8' });
      return output.split(':')[1]?.trim() || '';
    } else if (platform === 'darwin') {
      const output = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' });
      return output.trim();
    }
  } catch {}
  return '';
}

function getMacAddress(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
      const iface = interfaces[name];
      if (iface) {
        for (const addr of iface) {
          if (!addr.internal && addr.mac !== '00:00:00:00:00:00') {
            return addr.mac;
          }
        }
      }
    }
  } catch {}
  return '';
}

function getMachineId(): string {
  try {
    const platform = os.platform();
    
    if (platform === 'win32') {
      const output = execSync('wmic csproduct get UUID', { encoding: 'utf8' });
      return output.split('\n')[1].trim();
    } else if (platform === 'linux') {
      const output = execSync('cat /etc/machine-id', { encoding: 'utf8' });
      return output.trim();
    } else if (platform === 'darwin') {
      const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', { encoding: 'utf8' });
      return output.split('"')[3];
    }
  } catch {}
  return '';
}