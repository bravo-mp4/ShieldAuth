using System;
using System.Threading;
using System.Threading.Tasks;
using ShieldAuth;

namespace ShieldAuthExample
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("ShieldAuth C# SDK Example");
            Console.WriteLine("==========================\n");

            // Initialize ShieldAuth client
            var client = new ShieldAuthClient("YOUR_APP_ID_HERE");

            // Get license key from user
            Console.Write("Enter your license key: ");
            string licenseKey = Console.ReadLine();

            // Validate license
            Console.WriteLine("\nValidating license...");
            var result = await client.ValidateAsync(licenseKey);

            if (!result.Valid)
            {
                Console.WriteLine($"❌ Validation failed: {result.Message}");
                Console.WriteLine("\nPress any key to exit...");
                Console.ReadKey();
                return;
            }

            Console.WriteLine("✓ License valid!");
            Console.WriteLine($"Session ID: {client.GetSessionId()}");
            Console.WriteLine($"HWID: {client.GetHWIDValue()}");
            
            if (result.ExpiresAt.HasValue)
            {
                var expiresAt = DateTimeOffset.FromUnixTimeSeconds(result.ExpiresAt.Value);
                Console.WriteLine($"Expires: {expiresAt.LocalDateTime}");
            }

            // Your application logic here
            Console.WriteLine("\n🚀 Application started successfully!");
            Console.WriteLine("Running for 60 seconds with heartbeat every 30s...\n");

            // Heartbeat loop
            var cts = new CancellationTokenSource();
            var heartbeatTask = Task.Run(async () =>
            {
                while (!cts.Token.IsCancellationRequested)
                {
                    await Task.Delay(30000, cts.Token); // 30 seconds
                    if (!cts.Token.IsCancellationRequested)
                    {
                        bool success = await client.HeartbeatAsync();
                        Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Heartbeat sent: {(success ? "✓" : "✗")}");
                    }
                }
            }, cts.Token);

            // Simulate application running
            for (int i = 1; i <= 60; i++)
            {
                Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] Running... {i}s");
                await Task.Delay(1000);
            }

            cts.Cancel();
            await heartbeatTask;

            Console.WriteLine("\nApplication finished. Press any key to exit...");
            Console.ReadKey();
        }
    }
}
