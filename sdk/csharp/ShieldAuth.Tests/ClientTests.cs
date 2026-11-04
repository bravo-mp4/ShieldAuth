using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ShieldAuth;
using Xunit;

public class SharedVectorTests
{
    private static readonly JsonElement Vectors =
        JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "test-vectors.json"))).RootElement;

    [Fact]
    public void RebuildsSignedTextLikeTheServer()
    {
        var v = Vectors.GetProperty("validate");
        var text = Protocol.CanonicalMessage("validate",
            v.GetProperty("app_id").GetString(), v.GetProperty("license_key").GetString(), v.GetProperty("hwid").GetString(),
            v.GetProperty("nonce").GetString(), v.GetProperty("valid").GetBoolean() ? 1 : 0, v.GetProperty("session_id").GetString(),
            v.GetProperty("expires_at").GetInt64(), v.GetProperty("signed_at").GetInt64());
        Assert.Equal(v.GetProperty("message").GetString(), text);
    }

    [Theory]
    [InlineData("validate")]
    [InlineData("heartbeat")]
    public void VerifiesServerSignaturesAndRejectsTampering(string name)
    {
        using var key = Protocol.ImportPublicKey(Vectors.GetProperty("public_key_pem").GetString()!);
        var v = Vectors.GetProperty(name);
        var message = v.GetProperty("message").GetString()!;
        var signature = v.GetProperty("signature").GetString()!;
        Assert.True(Protocol.VerifySignature(key, message, signature));
        Assert.False(Protocol.VerifySignature(key, message + "x", signature));
    }
}

/// <summary>Answers like the real API, or like an attacker's server.</summary>
public sealed class FakeServer : HttpMessageHandler
{
    public readonly ECDsa Key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
    private readonly ECDsa _attacker = ECDsa.Create(ECCurve.NamedCurves.nistP256);
    public string Mode = "honest";
    public bool Valid = true;
    public bool HeartbeatValid = true;

    public string PublicKeyPem =>
        "-----BEGIN PUBLIC KEY-----\n" + Convert.ToBase64String(Key.ExportSubjectPublicKeyInfo()) + "\n-----END PUBLIC KEY-----\n";

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken token)
    {
        var body = JsonDocument.Parse(await request.Content!.ReadAsStringAsync(token)).RootElement;
        string S(string name) => body.GetProperty(name).GetString()!;
        var signedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - (Mode == "stale" ? 3600 : 0);
        var nonce = Mode == "wrong-nonce" ? "some-other-nonce-value" : S("nonce");
        var key = Mode == "forged-key" ? _attacker : Key;
        var status = HttpStatusCode.OK;
        Dictionary<string, object?> answer;

        if (request.RequestUri!.AbsolutePath.EndsWith("/validate"))
        {
            var session = Valid ? new string('s', 64) : null;
            var text = Protocol.CanonicalMessage("validate", S("app_id"), S("license_key"), S("hwid"), S("nonce"), Valid ? 1 : 0, session, null, signedAt);
            answer = new() { ["valid"] = Valid, ["message"] = "ok", ["session_id"] = session, ["signature"] = Sign(key, text) };
        }
        else
        {
            var text = Protocol.CanonicalMessage("heartbeat", S("session_id"), S("nonce"), HeartbeatValid ? 1 : 0, signedAt);
            answer = new() { ["valid"] = HeartbeatValid, ["message"] = "hb", ["signature"] = Sign(key, text) };
            if (!HeartbeatValid) status = HttpStatusCode.Unauthorized;
        }
        answer["nonce"] = nonce;
        answer["signed_at"] = signedAt;
        if (Mode == "unsigned") answer.Remove("signature");

        return new HttpResponseMessage(status)
        {
            Content = new StringContent(JsonSerializer.Serialize(answer), Encoding.UTF8, "application/json"),
        };
    }

    private static string Sign(ECDsa key, string text) =>
        Convert.ToBase64String(key.SignData(Encoding.UTF8.GetBytes(text), HashAlgorithmName.SHA256));
}

public class ClientTests
{
    private static ShieldAuthClient Client(FakeServer server) =>
        new("app", new ShieldAuthOptions { ApiUrl = "http://fake/api/v1", PublicKeyPem = server.PublicKeyPem, Hwid = "machine" }, server);

    [Fact]
    public async Task AcceptsGenuineAnswer()
    {
        var server = new FakeServer();
        using var client = Client(server);
        Assert.True(await client.ValidateAsync("KEY"));
        Assert.Equal(new string('s', 64), client.SessionId);
    }

    [Theory]
    [InlineData("forged-key")]
    [InlineData("wrong-nonce")]
    [InlineData("stale")]
    [InlineData("unsigned")]
    public async Task RejectsUntrustworthyValidAnswers(string mode)
    {
        var server = new FakeServer { Mode = mode };
        using var client = Client(server);
        Assert.False(await client.ValidateAsync("KEY"));
    }

    [Fact]
    public async Task HeartbeatRevocationCallsHandler()
    {
        var server = new FakeServer();
        using var client = Client(server);
        Assert.True(await client.ValidateAsync("KEY"));
        Assert.True(await client.HeartbeatAsync());

        server.HeartbeatValid = false;
        server.Valid = false;
        var revoked = new TaskCompletionSource<string>();
        client.StartHeartbeat(TimeSpan.FromMilliseconds(20), reason => revoked.TrySetResult(reason));
        Assert.Same(revoked.Task, await Task.WhenAny(revoked.Task, Task.Delay(5000)));
        Assert.False(client.IsValid);
    }

    [Fact]
    public void RequiresPublicKey()
    {
        Assert.Throws<ArgumentException>(() => new ShieldAuthClient("app", new ShieldAuthOptions { ApiUrl = "http://fake" }));
    }

    [Fact]
    public void HwidIsStableHex()
    {
        Assert.Matches("^[0-9a-f]{64}$", Hwid.Get());
        Assert.Equal(Hwid.Get(), Hwid.Get());
    }
}
