import { useState } from "react";

export default function APIPlayground() {
  const [licenseKey, setLicenseKey] = useState("DEMO-1234-5678-ABCD");
  const [hwid, setHwid] = useState("ABC123DEF456");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const exampleRequests = [
    {
      name: "Validate License",
      method: "POST",
      endpoint: "/v1/licenses/validate",
      body: {
        license_key: "XXXX-XXXX-XXXX-XXXX",
        hwid: "device_fingerprint_here",
      },
    },
    {
      name: "Create License",
      method: "POST",
      endpoint: "/v1/licenses",
      body: {
        plan: "premium",
        duration_days: 30,
        max_hwids: 2,
      },
    },
    {
      name: "Get License Info",
      method: "GET",
      endpoint: "/v1/licenses/{key}",
      body: null,
    },
  ];

  const [selectedExample, setSelectedExample] = useState(0);

  const handleTest = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockResponse = {
      success: true,
      valid: true,
      license: {
        key: licenseKey,
        username: "demo_user",
        plan: "premium",
        expires_at: "2026-02-06T00:00:00Z",
        hwid_slots_used: 1,
        hwid_slots_total: 2,
        created_at: "2026-01-06T00:00:00Z",
      },
      validation: {
        hwid_matched: true,
        is_expired: false,
        is_banned: false,
        timestamp: new Date().toISOString(),
      },
    };

    setResponse(mockResponse);
    setLoading(false);
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>
          🎮 Live API Playground
        </h3>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Try it now • No auth required
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: 500,
        }}
      >
        {/* Left: Request */}
        <div style={{ padding: 24, borderRight: "1px solid var(--border)" }}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Example Requests
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {exampleRequests.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedExample(idx)}
                  className={`btn ${
                    selectedExample === idx ? "btnPrimary" : "btnGhost"
                  }`}
                  style={{
                    justifyContent: "flex-start",
                    padding: "10px 16px",
                    fontSize: "0.9rem",
                  }}
                >
                  <span
                    style={{
                      padding: "2px 8px",
                      background:
                        example.method === "POST"
                          ? "var(--success-bg)"
                          : "var(--info-bg)",
                      color:
                        example.method === "POST"
                          ? "var(--success)"
                          : "var(--info)",
                      borderRadius: 4,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      marginRight: 8,
                    }}
                  >
                    {example.method}
                  </span>
                  {example.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Endpoint
            </label>
            <div
              style={{
                padding: "12px 16px",
                background: "#0a0a0f",
                borderRadius: 8,
                fontFamily: "'Fira Code', monospace",
                fontSize: "0.85rem",
                color: "var(--primary)",
              }}
            >
              {exampleRequests[selectedExample].endpoint}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              License Key
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
                fontFamily: "'Fira Code', monospace",
                fontSize: "0.9rem",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Hardware ID (HWID)
            </label>
            <input
              type="text"
              value={hwid}
              onChange={(e) => setHwid(e.target.value)}
              placeholder="Device fingerprint"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
                fontFamily: "'Fira Code', monospace",
                fontSize: "0.9rem",
              }}
            />
          </div>

          <button
            onClick={handleTest}
            disabled={loading}
            className="btn btnPrimary"
            style={{ width: "100%", padding: "12px", fontSize: "1rem" }}
          >
            {loading ? "⏳ Testing..." : "▶️ Test Request"}
          </button>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "var(--info-bg)",
              borderRadius: 8,
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}
          >
            💡 This is a demo environment. Real API requires authentication.
          </div>
        </div>

        {/* Right: Response */}
        <div style={{ padding: 24, background: "#0a0a0f" }}>
          <div
            style={{
              marginBottom: 12,
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}
          >
            Response
          </div>
          {response ? (
            <>
              <div
                style={{
                  marginBottom: 16,
                  padding: "8px 12px",
                  background: response.success
                    ? "var(--success-bg)"
                    : "var(--error-bg)",
                  borderRadius: 6,
                  display: "inline-block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: response.success ? "var(--success)" : "var(--error)",
                }}
              >
                {response.success ? "✓ 200 OK" : "✗ 400 Bad Request"}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 16,
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: 8,
                  fontSize: "0.8rem",
                  lineHeight: 1.6,
                  color: "#e4e4e7",
                  overflowX: "auto",
                  fontFamily: "'Fira Code', monospace",
                  maxHeight: 350,
                  overflowY: "auto",
                }}
              >
                {JSON.stringify(response, null, 2)}
              </pre>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: 16, opacity: 0.3 }}>
                📡
              </div>
              <div>Click "Test Request" to see the response</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
