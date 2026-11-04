import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Package } from "lucide-react";
import api, { applications } from "../services/api";
import TopBar from "../components/TopBar";

export default function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    loadApp();
  }, [id]);

  useEffect(() => {
    api.get("/public/signing-key").then((response) => setPublicKey(response.data.public_key_pem));
  }, []);

  const loadApp = async () => {
    try {
      setLoading(true);
      const response = await applications.get(id);
      setApp(response.data);
    } catch {
      setApp(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: "center", padding: 60 }}>
          <div className="muted">Loading application...</div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: "center", padding: 60 }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <Package size={48} className="text-gray-600" />
          </div>
          <div className="cardTitle" style={{ marginBottom: 16 }}>
            Application not found
          </div>
          <Link to="/applications" className="btn btnPrimary">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <TopBar
        title={app.name}
        subtitle={`App ID: ${app.id}`}
        actions={
          <Link to="/licenses" className="btn btnPrimary">
            Manage licenses
          </Link>
        }
      />

      <div>
          {/* SDK Integration */}
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <h3
              style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}
            >
              SDK Integration
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label
                  className="muted"
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: 8,
                    display: "block",
                  }}
                >
                  App ID
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={app.id}
                    readOnly
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btnGhost"
                    onClick={() => copyToClipboard(app.id)}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

            </div>

            <div
              style={{
                marginTop: 24,
                padding: 16,
                background: "var(--bg-elevated)",
                borderRadius: 8,
              }}
            >
              <div
                className="muted"
                style={{ fontSize: "0.85rem", marginBottom: 12 }}
              >
                Quick start (Node.js; the other SDKs take the same three values):
              </div>
              <pre
                style={{
                  background: "var(--bg)",
                  padding: 16,
                  borderRadius: 8,
                  overflow: "auto",
                  fontSize: "0.9rem",
                }}
              >
                {`const shield = new ShieldAuth("${app.id}", {
  apiUrl: "${window.location.origin}/api/v1",
  publicKey: SHIELDAUTH_PUBLIC_KEY, // below
});

if (!(await shield.validate(licenseKey))) process.exit(1);
shield.startHeartbeat();`}
              </pre>
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="muted" style={{ fontSize: "0.85rem" }}>
                  Signing public key: pin this in your app so it only trusts real answers
                </label>
                <button className="btn btnGhost" onClick={() => copyToClipboard(publicKey)} disabled={!publicKey}>
                  📋 Copy
                </button>
              </div>
              <pre style={{ background: "var(--bg)", padding: 16, borderRadius: 8, overflow: "auto", fontSize: "0.8rem" }}>
                {publicKey || "Loading..."}
              </pre>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <a href="https://github.com/bravo-mp4/ShieldAuth/tree/master/sdk" className="btn btnPrimary" target="_blank" rel="noreferrer">
                Get the SDKs
              </a>
              <Link to="/docs" className="btn btnSecondary">
                View Full Docs
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 24,
            }}
          >
            <div className="card" style={{ padding: 24 }}>
              <div className="cardTitle">Licenses</div>
              <div className="metricValue">{app.users.toLocaleString()}</div>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div className="cardTitle">Validations</div>
              <div className="metricValue metricGreen">
                {app.validations.toLocaleString()}
              </div>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div className="cardTitle">Status</div>
              <div
                className="metricValue"
                style={{ fontSize: "1.5rem", color: "var(--success)" }}
              >
                {app.status === "active" ? "✓ Active" : "Inactive"}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
