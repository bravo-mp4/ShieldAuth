import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";
// @ts-expect-error - JSX component
import Loader from "../components/Loader";

export default function LicensePortal() {
  const { licenseKey } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [license, setLicense] = useState<any>(null);
  const [editingDevice, setEditingDevice] = useState<number | null>(null);
  const [deviceName, setDeviceName] = useState("");

  useEffect(() => {
    if (licenseKey) {
      loadLicenseData();
    }
  }, [licenseKey]);

  const loadLicenseData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`/api/v1/public/portal/${licenseKey}`);
      setLicense(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load license data");
    } finally {
      setLoading(false);
    }
  };

  const handleUnbind = async (hwidId: number) => {
    if (!confirm("Are you sure you want to unbind this device? You can only unbind once every 7 days.")) {
      return;
    }

    try {
      await axios.post(`/api/v1/public/portal/${licenseKey}/unbind/${hwidId}`);
      alert("Device unbound successfully!");
      loadLicenseData();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to unbind device";
      const retryAfter = err.response?.data?.retry_after;
      
      if (retryAfter) {
        alert(`${message}\nYou can try again in ${retryAfter} days.`);
      } else {
        alert(message);
      }
    }
  };

  const handleUpdateDeviceName = async (hwidId: number) => {
    try {
      await axios.put(`/api/v1/public/portal/${licenseKey}/device/${hwidId}/name`, {
        device_name: deviceName
      });
      setEditingDevice(null);
      setDeviceName("");
      loadLicenseData();
    } catch (err) {
      alert("Failed to update device name");
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <>
        <PublicNav />
        <div style={{ paddingTop: 120, paddingBottom: 80, textAlign: "center" }}>
          <div className="container">
            <div style={{ fontSize: "4rem", marginBottom: 24 }}>❌</div>
            <h1 style={{ marginBottom: 16 }}>License Not Found</h1>
            <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>{error}</p>
            <a href="/" className="btn btnPrimary">Go to Homepage</a>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  if (!license) return null;

  const expirationDate = new Date(license.expires_at);
  const isExpired = expirationDate < new Date();
  const daysRemaining = license.days_remaining;

  return (
    <>
      <PublicNav />
      
      <div style={{ paddingTop: 100, paddingBottom: 80 }}>
        <div className="container" style={{ maxWidth: 900 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="kicker" style={{ marginBottom: 16 }}>🔐 LICENSE PORTAL</div>
            <h1 style={{ fontSize: "2.5rem", marginBottom: 16 }}>
              Your License Details
            </h1>
            <p style={{ color: "var(--text-muted)" }}>
              Manage your license and bound devices
            </p>
          </div>

          {/* License Status Card */}
          <div className="card" style={{ padding: 32, marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>License Status</h2>
              {license.is_active ? (
                <span className="badge badgeSuccess" style={{ fontSize: "1rem", padding: "8px 16px" }}>
                  ✓ Active
                </span>
              ) : license.is_banned ? (
                <span className="badge badgeDanger" style={{ fontSize: "1rem", padding: "8px 16px" }}>
                  Banned
                </span>
              ) : (
                <span className="badge badgeDanger" style={{ fontSize: "1rem", padding: "8px 16px" }}>
                  Expired
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>
                  License Key
                </div>
                <code style={{ 
                  fontSize: "0.9rem",
                  background: "var(--bg)",
                  padding: "8px 12px",
                  borderRadius: 6,
                  display: "block",
                  wordBreak: "break-all"
                }}>
                  {license.license_key.substring(0, 32)}...
                </code>
              </div>

              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>
                  Expires On
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 500 }}>
                  {expirationDate.toLocaleDateString()}
                </div>
                {!isExpired && daysRemaining <= 7 && (
                  <div style={{ 
                    fontSize: "0.85rem", 
                    color: "var(--warning)",
                    marginTop: 4
                  }}>
                    ⚠️ {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>
                  Device Slots
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 500 }}>
                  {license.hwid_bindings.length} / {license.max_hwid_slots}
                </div>
              </div>
            </div>
          </div>

          {/* Bound Devices */}
          <div className="card" style={{ padding: 32 }}>
            <h2 style={{ marginBottom: 24 }}>Bound Devices</h2>

            {license.hwid_bindings.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>🖥️</div>
                <p>No devices bound yet</p>
                <p style={{ fontSize: "0.9rem" }}>
                  Launch your application with this license to bind a device
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {license.hwid_bindings.map((binding: any) => (
                  <div 
                    key={binding.id}
                    className="card"
                    style={{ 
                      padding: 20,
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                          <div style={{ fontSize: "1.5rem" }}>🖥️</div>
                          {editingDevice === binding.id ? (
                            <input
                              type="text"
                              value={deviceName}
                              onChange={(e) => setDeviceName(e.target.value)}
                              placeholder="Device name"
                              className="input"
                              style={{ flex: 1, maxWidth: 300 }}
                              autoFocus
                            />
                          ) : (
                            <div style={{ fontSize: "1.1rem", fontWeight: 500 }}>
                              {binding.device_name}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          <div>
                            HWID: <code style={{ fontSize: "0.8rem" }}>{binding.hwid_hash}</code>
                          </div>
                          <div>
                            Last Seen: {new Date(binding.last_seen).toLocaleString()}
                          </div>
                          {binding.unbind_count > 0 && (
                            <div>
                              Unbinds: {binding.unbind_count} 
                              {binding.last_unbind_at && ` (Last: ${new Date(binding.last_unbind_at).toLocaleDateString()})`}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        {editingDevice === binding.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateDeviceName(binding.id)}
                              className="btn btnPrimary"
                              style={{ fontSize: "0.85rem", padding: "8px 16px" }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingDevice(null);
                                setDeviceName("");
                              }}
                              className="btn"
                              style={{ fontSize: "0.85rem", padding: "8px 16px" }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingDevice(binding.id);
                                setDeviceName(binding.device_name);
                              }}
                              className="btn"
                              style={{ fontSize: "0.85rem", padding: "8px 16px" }}
                            >
                              ✏️ Rename
                            </button>
                            <button
                              onClick={() => handleUnbind(binding.id)}
                              className="btn btnDanger"
                              style={{ fontSize: "0.85rem", padding: "8px 16px" }}
                              disabled={!binding.can_unbind}
                              title={!binding.can_unbind ? "You can only unbind once every 7 days" : ""}
                            >
                              🗑️ Unbind
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="alertInfo" style={{ marginTop: 32 }}>
            <strong>ℹ️ Important Information:</strong>
            <ul style={{ marginTop: 12, paddingLeft: 20 }}>
              <li>You can unbind a device once every 7 days</li>
              <li>After unbinding, you can bind a different device</li>
              <li>Device names are stored locally for your convenience</li>
              <li>Contact support if you need to reset your license</li>
            </ul>
          </div>

          {/* Support Link */}
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
              Need help with your license?
            </p>
            <a href="/support" className="btn btnPrimary">
              Contact Support
            </a>
          </div>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
