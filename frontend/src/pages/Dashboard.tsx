import { useEffect, useMemo, useState } from "react";
import { api, User } from "../api";

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showCheckForm, setShowCheckForm] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    hwid: "",
    expires_at: "",
  });

  const [checkHwid, setCheckHwid] = useState("");
  const [checkResult, setCheckResult] = useState<{
    valid: boolean;
    user?: User;
  } | null>(null);

  const activeCount = useMemo(() => {
    const now = Date.now();
    return users.filter((u) => {
      const expires = new Date(u.expires_at).getTime();
      return Number.isFinite(expires) ? expires > now : false;
    }).length;
  }, [users]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      setNewUser({ username: "", hwid: "", expires_at: "" });
      setShowAddForm(false);
      await loadUsers();
    } catch (err) {
      setError("Failed to create user");
      console.error(err);
    }
  };

  const handleCheckHWID = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.checkHWID({ hwid: checkHwid });
      setCheckResult(result);
      setError(null);
    } catch (err) {
      setError("Failed to check HWID");
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: number) => {
    const ok = globalThis.confirm("Delete this user?");
    if (!ok) return;

    try {
      await api.deleteUser(id);
      await loadUsers();
    } catch (err) {
      setError("Failed to delete user");
      console.error(err);
    }
  };

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="pageTitle">Dashboard</div>
          <div className="pageSub">
            Manage licenses and validate hardware IDs
          </div>
        </div>
        <div className="pageActions">
          <button className="btn btnSecondary" onClick={() => loadUsers()}>
            Refresh
          </button>
          <button
            className="btn btnGhost"
            onClick={() => setShowCheckForm((v) => !v)}
          >
            {showCheckForm ? "Close" : "Check HWID"}
          </button>
          <button
            className="btn btnPrimary"
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? "Close" : "Add User"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alertError" role="alert">
          <div>{error}</div>
          <button
            className="iconBtn"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid2">
        <div className="card">
          <div className="cardTitle">Users</div>
          <div className="metricRow">
            <div className="metric">
              <div className="metricValue">{users.length}</div>
              <div className="metricLabel">Total</div>
            </div>
            <div className="metric">
              <div className="metricValue metricGreen">{activeCount}</div>
              <div className="metricLabel">Active</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">API Configuration</div>
          <div className="muted">Base Path</div>
          <div className="codePill">/api/v1</div>
          <div className="muted" style={{ marginTop: 8 }}>
            Proxy: <span className="codeInline">/api</span> →{" "}
            <span className="codeInline">localhost:3000</span>
          </div>
        </div>
      </div>

      {(showAddForm || showCheckForm) && (
        <div className="grid2" style={{ marginTop: 16 }}>
          {showAddForm && (
            <div className="card">
              <div className="cardTitle">Create User</div>
              <form className="form" onSubmit={handleAddUser}>
                <div className="field">
                  <label>Username</label>
                  <input
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                    placeholder="e.g. alice"
                    required
                  />
                </div>
                <div className="field">
                  <label>HWID</label>
                  <input
                    value={newUser.hwid}
                    onChange={(e) =>
                      setNewUser({ ...newUser, hwid: e.target.value })
                    }
                    placeholder="hardware-id-string"
                    required
                  />
                </div>
                <div className="field">
                  <label>Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={newUser.expires_at}
                    onChange={(e) =>
                      setNewUser({ ...newUser, expires_at: e.target.value })
                    }
                  />
                </div>
                <button className="btn btnPrimary" type="submit">
                  Create User
                </button>
              </form>
            </div>
          )}

          {showCheckForm && (
            <div className="card">
              <div className="cardTitle">Validate HWID</div>
              <form className="form" onSubmit={handleCheckHWID}>
                <div className="field">
                  <label>HWID</label>
                  <input
                    value={checkHwid}
                    onChange={(e) => setCheckHwid(e.target.value)}
                    placeholder="hardware-id-string"
                    required
                  />
                </div>
                <button className="btn btnGhost" type="submit">
                  Validate
                </button>
              </form>

              {checkResult && (
                <div className={`result ${checkResult.valid ? "ok" : "bad"}`}>
                  <div className="resultTitle">
                    {checkResult.valid ? "✓ Valid" : "✗ Invalid"}
                  </div>
                  {checkResult.user && (
                    <div className="resultMeta">
                      <div>
                        <span className="muted">User:</span>{" "}
                        <span className="codeInline">
                          {checkResult.user.username}
                        </span>
                      </div>
                      <div>
                        <span className="muted">Expires:</span>{" "}
                        <span className="codeInline">
                          {new Date(
                            checkResult.user.expires_at
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="cardTitle">Registered Users</div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : users.length === 0 ? (
          <div className="empty">No users yet. Create one to get started.</div>
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
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td className="strong">{user.username}</td>
                    <td className="mono green">
                      {user.hwid_hash.substring(0, 18)}…
                    </td>
                    <td className="muted">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="muted">
                      {new Date(user.expires_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btnDanger"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
