# ShieldAuth C# SDK

.NET Standard 2.0+ compatible authentication SDK for ShieldAuth.

## Features

- ✅ License validation with HWID binding
- ✅ Automatic HWID generation (CPU, Motherboard, MAC)
- ✅ Session management
- ✅ Heartbeat system
- ✅ Async/await support
- ✅ Cross-platform (.NET Core, .NET Framework, Unity)

## Installation

### Option 1: Add to your project

1. Copy `ShieldAuth.cs` to your project
2. Install required NuGet package:

```bash
dotnet add package System.Management
```

### Option 2: Build as DLL

```bash
cd sdk/csharp
dotnet build -c Release
```

## Quick Start

```csharp
using ShieldAuth;

// Initialize client
var client = new ShieldAuthClient("your_app_id_here");

// Validate license
var result = await client.ValidateAsync("license-key-here");

if (result.Valid)
{
    Console.WriteLine("✓ License valid!");
    Console.WriteLine($"Session: {client.GetSessionId()}");

    // Send heartbeat every 5 minutes
    await client.HeartbeatAsync();
}
else
{
    Console.WriteLine($"✗ {result.Message}");
}
```

## API Reference

### Constructor

```csharp
new ShieldAuthClient(string appId, string apiUrl = null)
```

- `appId`: Your application ID from ShieldAuth dashboard
- `apiUrl`: (Optional) Custom API URL for self-hosted instances

### Methods

#### `ValidateAsync(string licenseKey)`

Validates a license key and binds it to the current hardware.

**Returns:** `Task<ValidateResponse>`

```csharp
var result = await client.ValidateAsync("license-key");
if (result.Valid) {
    // License is valid
}
```

#### `HeartbeatAsync()`

Sends a heartbeat to keep the session alive. Call this periodically (recommended: every 5 minutes).

**Returns:** `Task<bool>` - `true` if heartbeat successful

```csharp
bool success = await client.HeartbeatAsync();
```

#### `GetSessionId()`

Returns the current session ID after successful validation.

#### `GetHWIDValue()`

Returns the computed hardware ID for the current machine.

#### `IsInitialized()`

Returns `true` if validation was successful.

## Unity Support

ShieldAuth C# SDK works with Unity! Just copy `ShieldAuth.cs` to your Unity project's `Assets/Scripts` folder.

**Note:** Unity WebGL doesn't support `System.Management`. For WebGL builds, you'll need to implement a custom HWID function or use a web-based alternative.

## Example: Unity Integration

```csharp
using UnityEngine;
using ShieldAuth;
using System.Threading.Tasks;

public class LicenseManager : MonoBehaviour
{
    private ShieldAuthClient client;

    async void Start()
    {
        client = new ShieldAuthClient("your_app_id");

        var result = await client.ValidateAsync("license-key");

        if (result.Valid)
        {
            Debug.Log("License validated!");
            StartHeartbeat();
        }
        else
        {
            Debug.LogError($"License invalid: {result.Message}");
            Application.Quit();
        }
    }

    async void StartHeartbeat()
    {
        while (Application.isPlaying)
        {
            await Task.Delay(300000); // 5 minutes
            await client.HeartbeatAsync();
        }
    }
}
```

## Error Handling

```csharp
try
{
    var result = await client.ValidateAsync(licenseKey);

    if (!result.Valid)
    {
        // Handle specific errors
        if (result.Message.Contains("expired"))
        {
            // License expired
        }
        else if (result.Message.Contains("HWID"))
        {
            // HWID mismatch or limit reached
        }
    }
}
catch (Exception ex)
{
    // Network or other errors
    Console.WriteLine($"Error: {ex.Message}");
}
```

## Response Object

```csharp
public class ValidateResponse
{
    public bool Valid { get; set; }           // Validation result
    public string Message { get; set; }        // Status message
    public long? ExpiresAt { get; set; }      // Unix timestamp (seconds)
    public string SessionId { get; set; }      // Session ID for heartbeat
}
```

## Best Practices

1. **Store session ID**: Save `GetSessionId()` to avoid re-validation
2. **Regular heartbeats**: Send every 5 minutes to maintain active session
3. **Handle errors gracefully**: Network issues shouldn't crash your app
4. **Obfuscate your code**: Use tools like ConfuserEx or Eazfuscator
5. **Don't hardcode keys**: Never embed license keys in your application

## Example Project

See `example/Program.cs` for a complete working example.

To run the example:

```bash
cd sdk/csharp/example
dotnet run
```

## Support

- Documentation: https://shield-auth.vercel.app/docs
- Support: support@shieldlabs.com
- Discord: https://discord.gg/shieldauth

## License

MIT License - See LICENSE file for details
