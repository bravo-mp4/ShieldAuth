import { useEffect, useState } from "react";
import { auth } from "../services/api";

interface Account {
  id: number;
  email: string;
  name: string | null;
  role: string;
  email_verified: boolean;
}

export default function Settings() {
  const [account, setAccount] = useState<Account | null>(null);
  const [verifyNote, setVerifyNote] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNote, setPasswordNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    auth.me().then((response: any) => setAccount(response.data.user));
  }, []);

  const resend = async () => {
    try {
      const response = await auth.resendVerification();
      setVerifyNote(response.data.message);
    } catch (err: any) {
      setVerifyNote(err.response?.data?.message || "Couldn't send the email");
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordNote({ ok: false, text: "New passwords don't match" });
      return;
    }
    setSaving(true);
    try {
      const response = await auth.changePassword(currentPassword, newPassword);
      // Other sessions are now signed out; keep this one with the new token.
      localStorage.setItem("token", response.data.token);
      setPasswordNote({ ok: true, text: "Password changed. Other devices have been signed out." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordNote({ ok: false, text: err.response?.data?.message || "Couldn't change the password" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="pageTitle">Settings</div>
          <div className="pageSub">Your account and password</div>
        </div>
      </div>

      <div className="grid2">
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle" style={{ marginBottom: 16 }}>Account</div>
          {account ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>Email</div>
                <div>{account.email}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>Name</div>
                <div>{account.name || "Not set"}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>Role</div>
                <div>{account.role === "admin" ? "Platform admin" : "Developer"}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>Email status</div>
                {account.email_verified ? (
                  <span className="badge badgeSuccess">Confirmed</span>
                ) : (
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="badge badgeWarning">Not confirmed</span>
                    <button className="btn btnGhost" onClick={resend}>
                      Send confirmation email
                    </button>
                  </div>
                )}
                {verifyNote && (
                  <div className="muted" style={{ marginTop: 8, fontSize: "0.85rem" }}>
                    {verifyNote}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="muted">Loading...</div>
          )}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle" style={{ marginBottom: 16 }}>Change password</div>
          <form className="form" onSubmit={changePassword}>
            <div className="field">
              <label>Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="field">
              <label>New password (8+ characters)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            {passwordNote && (
              <div className={passwordNote.ok ? "alertSuccess" : "alertError"} style={{ marginBottom: 12 }}>
                {passwordNote.text}
              </div>
            )}
            <button className="btn btnPrimary" disabled={saving}>
              {saving ? "Saving..." : "Change password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
