using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Win32;

namespace ShieldAuth
{
    /// <summary>
    /// A stable per-machine ID: SHA-256 of the OS machine identifier plus the
    /// OS and architecture. No WMI (slow, and absent on Linux and macOS) and
    /// no MAC addresses (VPNs and adapters change them).
    /// </summary>
    public static class Hwid
    {
        public static string Get()
        {
            var parts = string.Join("|", MachineId(), RuntimeInformation.OSDescription, RuntimeInformation.OSArchitecture);
            using (var sha = SHA256.Create())
            {
                var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(parts));
                return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
            }
        }

        public static string MachineId()
        {
            try
            {
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    using (var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography"))
                        return key?.GetValue("MachineGuid") as string ?? Environment.MachineName;
                }
                if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                {
                    var info = new ProcessStartInfo("ioreg", "-rd1 -c IOPlatformExpertDevice")
                    {
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                    };
                    using (var process = Process.Start(info)!)
                    {
                        var output = process.StandardOutput.ReadToEnd();
                        var match = Regex.Match(output, "\"IOPlatformUUID\" = \"([^\"]+)\"");
                        if (match.Success) return match.Groups[1].Value;
                    }
                }
                foreach (var path in new[] { "/etc/machine-id", "/var/lib/dbus/machine-id" })
                {
                    if (File.Exists(path)) return File.ReadAllText(path).Trim();
                }
            }
            catch (Exception)
            {
                // fall back to the machine name
            }
            return Environment.MachineName;
        }
    }
}
