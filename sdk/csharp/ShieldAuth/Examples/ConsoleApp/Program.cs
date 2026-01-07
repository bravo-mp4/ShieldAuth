using System;
using System.Threading;
using ShieldAuth;

class Program
{
    static void Main(string[] args)
    {
        // Initialize with your App ID
        ShieldAuth.ShieldAuth.Initialize("YOUR_APP_ID");
        
        Console.WriteLine("Enter license key:");
        string licenseKey = Console.ReadLine();
        
        Console.WriteLine("Validating license...");
        bool valid = ShieldAuth.ShieldAuth.Validate(licenseKey);
        
        if (!valid)
        {
            Console.WriteLine("Invalid license key!");
            return;
        }
        
        Console.WriteLine("License valid!");
        Console.WriteLine($"Session ID: {ShieldAuth.ShieldAuth.GetSessionId()}");
        Console.WriteLine($"HWID: {ShieldAuth.ShieldAuth.GetHWID()}");
        
        // Your application runs here
        Console.WriteLine("\nApplication running...");
        for (int i = 0; i < 60; i++)
        {
            Console.WriteLine($"Running... {i}s");
            Thread.Sleep(1000);
            
            // Send heartbeat every 5 minutes
            if (i % 300 == 0 && i > 0)
            {
                bool heartbeat = ShieldAuth.ShieldAuth.HeartbeatAsync().Result;
                Console.WriteLine(heartbeat ? "Heartbeat sent" : "Heartbeat failed");
            }
        }
    }
}