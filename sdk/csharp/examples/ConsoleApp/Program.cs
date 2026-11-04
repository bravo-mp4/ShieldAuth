// Asks for a license key, validates it, then keeps the session alive.
// Configure with SHIELDAUTH_APP_ID, SHIELDAUTH_API_URL and SHIELDAUTH_PUBLIC_KEY.
using ShieldAuth;

using var shield = new ShieldAuthClient(
    Environment.GetEnvironmentVariable("SHIELDAUTH_APP_ID")!,
    new ShieldAuthOptions
    {
        ApiUrl = Environment.GetEnvironmentVariable("SHIELDAUTH_API_URL")!,
        PublicKeyPem = Environment.GetEnvironmentVariable("SHIELDAUTH_PUBLIC_KEY"),
    });

Console.Write("License key: ");
var licenseKey = Console.ReadLine()?.Trim() ?? "";

if (!await shield.ValidateAsync(licenseKey))
{
    Console.WriteLine($"Not licensed: {shield.LastMessage}");
    return 1;
}

Console.WriteLine("Licensed. Press Enter to quit.");
shield.StartHeartbeat(TimeSpan.FromMinutes(5), reason =>
{
    Console.WriteLine($"License ended: {reason}");
    Environment.Exit(1);
});
Console.ReadLine();
return 0;
