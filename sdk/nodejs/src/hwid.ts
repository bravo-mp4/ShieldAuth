import { execFileSync } from "child_process";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import * as os from "os";

/**
 * A stable per-machine ID: SHA-256 of the OS's machine identifier plus the
 * CPU model. MAC addresses are left out on purpose; VPNs, Docker and USB
 * adapters change them and would make a user's own machine look new.
 */
export function getHWID(): string {
  const parts = [getMachineId(), os.cpus()[0]?.model ?? "", os.platform(), os.arch()];
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

function run(command: string, args: string[]): string {
  // execFile with fixed arguments: no shell, nothing user-controlled.
  return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 });
}

export function getMachineId(): string {
  try {
    switch (os.platform()) {
      case "win32": {
        // Set at Windows install time; wmic, which this used before, is deprecated.
        const output = run("reg", ["query", "HKLM\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid"]);
        return output.match(/MachineGuid\s+REG_SZ\s+(\S+)/)?.[1] ?? "";
      }
      case "darwin": {
        const output = run("ioreg", ["-rd1", "-c", "IOPlatformExpertDevice"]);
        return output.match(/"IOPlatformUUID" = "([^"]+)"/)?.[1] ?? "";
      }
      default:
        for (const file of ["/etc/machine-id", "/var/lib/dbus/machine-id"]) {
          try {
            return readFileSync(file, "utf8").trim();
          } catch {
            // try the next location
          }
        }
    }
  } catch {
    // fall through to the hostname
  }
  return os.hostname();
}
