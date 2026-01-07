import { useState, useEffect } from "react";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";
// @ts-expect-error - JSX component
import Loader from "../components/Loader";
// @ts-expect-error - JSX component
import EmptyState from "../components/EmptyState";
// @ts-expect-error - JSX component
import Toast from "../components/Toast";
// @ts-expect-error - JS module
import { useToast } from "../hooks/useToast";

export default function APIKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState({
    read: true,
    write: false,
    delete: false
  });
  const [revealedKey, setRevealedKey] = useState(null);
  const { toast, showSuccess, hideToast } = useToast();

  useEffect(() => {
    // TODO: Replace with real API call when backend endpoint exists
    setTimeout(() => {
      setKeys([
        {
          id: "key_1",
          name: "Production API Key",
          key: "sk_live_abc123def456ghi789jkl012",
          permissions: ["read", "write"],
          created: "2025-01-15",
          lastUsed: "2025-01-31"
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess("API key copied to clipboard!");
  };

  const handleCreateKey = () => {
    const newKey = {
      id: `key_${keys.length + 1}`,
      name: newKeyName || "Untitled Key",
      key: `sk_live_${Math.random().toString(36).substring(2, 30)}`,
      permissions: Object.keys(newKeyPerms).filter(p => newKeyPerms[p]),
      created: new Date().toISOString().split('T')[0],
      lastUsed: "Never"
    };
    
    setKeys([...keys, newKey]);
    setShowCreateModal(false);
    showSuccess("API key created successfully!");
    setNewKeyName("");
    setNewKeyPerms({ read: true, write: false, delete: false });
  };

  const handleRevokeKey = (keyId) => {
    if (confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      setKeys(keys.filter(k => k.id !== keyId));
      showSuccess("API key revoked");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <TopBar
        title="API Keys"
        subtitle="Manage your API authentication keys"
        actions={
          <button 
            className="btn btnPrimary"
            onClick={() => setShowCreateModal(true)}
          >
            + Create API Key
          </button>
        }
      />

      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div className="card" style={{ 
            padding: 32,
            maxWidth: 500,
            width: "100%",
            position: "relative"
          }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "var(--text-secondary)"
              }}
            >
              ×
            </button>

            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>
              Create API Key
            </h3>

            <form className="form" onSubmit={(e) => { e.preventDefault(); handleCreateKey(); }}>
              <div className="field">
                <label>Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  required
                />
              </div>

              <div className="field">
                <label>Permissions</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                  {Object.entries(newKeyPerms).map(([perm, checked]) => (
                    <label key={perm} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 12,
                      cursor: "pointer"
                    }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setNewKeyPerms({
                          ...newKeyPerms,
                          [perm]: e.target.checked
                        })}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ textTransform: "capitalize" }}>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button 
                  type="button"
                  className="btn btnSecondary"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btnPrimary"
                  style={{ flex: 1 }}
                >
                  Create Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <EmptyState
          icon="🔑"
          title="No API keys yet"
          description="Create your first API key to start integrating with the ShieldVM API"
          action={
            <button
              className="btn btnPrimary"
              onClick={() => setShowCreateModal(true)}
            >
              Create API Key
            </button>
          }
        />
      ) : (
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Permissions</th>
                <th>Created</th>
                <th>Last Used</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td style={{ fontWeight: 600 }}>{key.name}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <code className="codeInline">
                        {revealedKey === key.id ? key.key : `${key.key.substring(0, 20)}...`}
                      </code>
                      <button
                        className="btn btnGhost"
                        style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                        onClick={() => setRevealedKey(revealedKey === key.id ? null : key.id)}
                      >
                        {revealedKey === key.id ? "Hide" : "Show"}
                      </button>
                      <button
                        className="btn btnGhost"
                        style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                        onClick={() => copyToClipboard(key.key)}
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {key.permissions.map(perm => (
                        <span key={perm} className="codeInline" style={{ fontSize: "0.8rem" }}>
                          {perm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="muted">{new Date(key.created).toLocaleDateString()}</td>
                  <td className="muted">
                    {key.lastUsed === "Never" ? key.lastUsed : new Date(key.lastUsed).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btnDanger"
                      style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                      onClick={() => handleRevokeKey(key.id)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
