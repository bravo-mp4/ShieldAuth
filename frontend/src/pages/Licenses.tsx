import { useState, useEffect } from "react";
import axios from "axios";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";
// @ts-expect-error - JSX component
import Modal from "../components/Modal";
// @ts-expect-error - JSX component
import Loader from "../components/Loader";

interface License {
  license_key: string;
  app_id: string;
  username: string;
  email: string;
  hwid: string | null;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

interface Application {
  app_id: string;
  name?: string;
}

export default function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [selectedAppId, setSelectedAppId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [daysValid, setDaysValid] = useState("30");
  const [maxHwidSlots, setMaxHwidSlots] = useState("1");

  useEffect(() => {
    loadLicenses();
    loadApplications();
  }, []);

  const loadLicenses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/v1/admin/licenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLicenses(response.data);
    } catch (err) {
      console.error("Failed to load licenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/v1/admin/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(response.data);
    } catch (err) {
      console.error("Failed to load applications:", err);
    }
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCreating(true);
      const token = localStorage.getItem("token");
      
      await axios.post(
        "/api/v1/admin/license/create",
        {
          app_id: selectedAppId,
          username,
          email,
          days: parseInt(daysValid),
          max_hwid_slots: parseInt(maxHwidSlots),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Reset form
      setUsername("");
      setEmail("");
      setDaysValid("30");
      setMaxHwidSlots("1");
      setShowCreateModal(false);

      // Reload licenses
      await loadLicenses();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create license");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLicense = async (licenseKey: string) => {
    if (!confirm("Are you sure you want to delete this license?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/v1/admin/license/${licenseKey}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadLicenses();
    } catch (err) {
      alert("Failed to delete license");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (loading) return <Loader />;

  return (
    <div className="page">
      <TopBar
        title="Licenses"
        subtitle="Manage licenses for your applications"
        actions={
          <button
            className="btn btnPrimary"
            onClick={() => setShowCreateModal(true)}
            disabled={applications.length === 0}
          >
            Create License
          </button>
        }
      />

      {applications.length === 0 && (
        <div className="alertWarning" style={{ marginBottom: 20 }}>
          You need to create an application first before generating licenses.
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Total Licenses</div>
          <div className="metricValue">{licenses.length}</div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Active Licenses</div>
          <div className="metricValue metricGreen">
            {licenses.filter(l => l.is_active).length}
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Expired</div>
          <div className="metricValue metricRed">
            {licenses.filter(l => !l.is_active || new Date(l.expires_at) < new Date()).length}
          </div>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>License Key</th>
                <th>Username</th>
                <th>Email</th>
                <th>HWID</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    No licenses yet. Create your first license to get started.
                  </td>
                </tr>
              ) : (
                licenses.map((license) => (
                  <tr key={license.license_key}>
                    <td>
                      <code style={{ fontSize: 12 }}>
                        {license.license_key.substring(0, 20)}...
                      </code>
                      <button
                        onClick={() => copyToClipboard(license.license_key)}
                        style={{
                          marginLeft: 8,
                          padding: "4px 8px",
                          fontSize: 11,
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Copy
                      </button>
                    </td>
                    <td>{license.username}</td>
                    <td>{license.email}</td>
                    <td>
                      {license.hwid ? (
                        <code style={{ fontSize: 11 }}>{license.hwid.substring(0, 15)}...</code>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Not bound</span>
                      )}
                    </td>
                    <td>{new Date(license.expires_at).toLocaleDateString()}</td>
                    <td>
                      {license.is_active && new Date(license.expires_at) > new Date() ? (
                        <span className="badge badgeSuccess">Active</span>
                      ) : (
                        <span className="badge badgeDanger">Expired</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteLicense(license.license_key)}
                        className="btn btnDanger"
                        style={{ fontSize: 12, padding: "6px 12px" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create License Modal */}
      {showCreateModal && (
        <Modal
          title="Create New License"
          onClose={() => setShowCreateModal(false)}
        >
          <form onSubmit={handleCreateLicense}>
            <div className="formGroup">
              <label>Application</label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                required
                className="input"
              >
                <option value="">Select Application</option>
                {applications.map((app) => (
                  <option key={app.app_id} value={app.app_id}>
                    {app.name || app.app_id}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="input"
              />
            </div>

            <div className="formGroup">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="input"
              />
            </div>

            <div className="formGroup">
              <label>Valid For (Days)</label>
              <input
                type="number"
                value={daysValid}
                onChange={(e) => setDaysValid(e.target.value)}
                min="1"
                max="3650"
                required
                className="input"
              />
            </div>

            <div className="formGroup">
              <label>Max HWID Slots</label>
              <input
                type="number"
                value={maxHwidSlots}
                onChange={(e) => setMaxHwidSlots(e.target.value)}
                min="1"
                max="10"
                required
                className="input"
              />
              <small style={{ color: "var(--text-muted)", marginTop: 4 }}>
                Number of devices this license can be used on
              </small>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                type="submit"
                className="btn btnPrimary"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create License"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn"
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
