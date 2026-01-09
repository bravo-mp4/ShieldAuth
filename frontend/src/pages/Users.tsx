import { useState, useEffect } from "react";
import { api, User } from "../api";
// @ts-expect-error - JSX component
import Loader from "../components/Loader";
// @ts-expect-error - JSX component
import EmptyState from "../components/EmptyState";
// @ts-expect-error - JSX component
import { StatusBadge } from "../components/Badge";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log("Loading users...");
      const data = await api.getUsers();
      console.log("Users loaded:", data);
      console.log("Data type:", typeof data, "Is array:", Array.isArray(data));
      const usersArray = Array.isArray(data) ? data : [];
      setUsers(usersArray);
      setError("");
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError(`Failed to load users: ${err.response?.data?.message || err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.deleteUser(id);
      await loadUsers();
    } catch (err) {
      setError("Failed to delete user");
    }
  };

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="pageTitle">Users</div>
          <div className="pageSub">Manage all licensed users</div>
        </div>
        <div className="pageActions">
          <button className="btn btnSecondary" onClick={loadUsers}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alertError">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="grid3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="cardTitle">Total Users</div>
          <div className="metricValue">{users.length}</div>
        </div>
        <div className="card">
          <div className="cardTitle">Active</div>
          <div className="metricValue metricGreen">
            {users.filter((u) => new Date(u.expires_at) > new Date()).length}
          </div>
        </div>
        <div className="card">
          <div className="cardTitle">Expired</div>
          <div className="metricValue" style={{ color: "var(--error)" }}>
            {users.filter((u) => new Date(u.expires_at) <= new Date()).length}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text)",
              fontSize: "0.9rem",
            }}
          />
        </div>

        {loading ? (
          <Loader />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon="👥"
            title={searchTerm ? "No users found" : "No users yet"}
            description={searchTerm ? "Try adjusting your search" : "Users will appear here once created"}
          />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>HWID Hash</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isExpired = new Date(user.expires_at) <= new Date();
                  return (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td style={{ fontWeight: 500 }}>{user.username}</td>
                      <td
                        className="mono"
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {user.hwid_hash.substring(0, 16)}...
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>{new Date(user.expires_at).toLocaleDateString()}</td>
                      <td>
                        <StatusBadge status={isExpired ? "expired" : "active"} />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btnDanger"
                          onClick={() => handleDeleteUser(user.id)}
                          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
