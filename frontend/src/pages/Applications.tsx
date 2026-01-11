import { useState, useEffect } from "react";
import { Package } from "lucide-react";
// @ts-expect-error - JS module
import { applications } from "../services/api";
// @ts-expect-error - JSX component
import AppCard from "../components/AppCard";
// @ts-expect-error - JSX component
import Modal from "../components/Modal";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";
// @ts-expect-error - JSX component
import Loader from "../components/Loader";
// @ts-expect-error - JSX component
import EmptyState from "../components/EmptyState";

interface Application {
  id: string;
  name: string;
  version: string;
  status: "active" | "disabled";
  users: number;
  created: string;
  validation_count?: number;
}

export default function Applications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppVersion, setNewAppVersion] = useState("");
  const [creating, setCreating] = useState(false);

  // Load applications from backend
  const loadApps = async () => {
    try {
      setLoading(true);
      const response = await applications.list();
      setApps(response.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  // Load on component mount
  useEffect(() => {
    loadApps();
  }, []);

  // Create new application
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreating(true);
      await applications.create({
        name: newAppName,
        version: newAppVersion,
      });

      // Reset form
      setNewAppName("");
      setNewAppVersion("");
      setShowCreateModal(false);

      // Reload applications list
      await loadApps();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create application");
    } finally {
      setCreating(false);
    }
  };

  // Calculate stats
  const totalUsers = apps.reduce((sum, app) => sum + app.users, 0);
  const activeApps = apps.filter((app) => app.status === "active").length;

  return (
    <div className="page">
      <TopBar
        title="Applications"
        subtitle="Manage your protected applications"
        actions={
          <button
            className="btn btnPrimary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Application
          </button>
        }
      />

      {/* Error Alert */}
      {error && (
        <div className="alertError" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <Loader />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid3" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="cardTitle">Total Applications</div>
              <div className="metricValue">{apps.length}</div>
            </div>
            <div className="card">
              <div className="cardTitle">Active Users</div>
              <div className="metricValue metricGreen">{totalUsers}</div>
            </div>
            <div className="card">
              <div className="cardTitle">Active Apps</div>
              <div className="metricValue" style={{ color: "var(--success)" }}>
                {activeApps}
              </div>
            </div>
          </div>

          {/* Applications Grid */}
          {apps.length === 0 ? (
            <EmptyState
              icon={<Package size={48} className="text-gray-600" />}
              title="No applications yet"
              description="Create your first application to get started"
              action={
                <button
                  className="btn btnPrimary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Application
                </button>
              }
            />
          ) : (
            <div className="grid2">
              {apps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Application Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Application"
        footer={
          <>
            <button
              className="btn btnGhost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btnPrimary"
              onClick={handleCreate}
              disabled={creating || !newAppName || !newAppVersion}
            >
              {creating ? "Creating..." : "Create Application"}
            </button>
          </>
        }
      >
        <form className="form" onSubmit={handleCreate}>
          <div className="field">
            <label>Application Name</label>
            <input
              type="text"
              placeholder="My Application"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>Version</label>
            <input
              type="text"
              placeholder="1.0.0"
              value={newAppVersion}
              onChange={(e) => setNewAppVersion(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
