import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/api";
// @ts-expect-error - JSX component
import Toast from "../components/Toast";
// @ts-expect-error - JS module
import { useToast } from "../hooks/useToast";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Don't refresh page
    setError("");
    setLoading(true);

    try {
      // Call backend API
      const response = await auth.login(email, password);

      // Save token and user data for future requests
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Show success message
      showSuccess("Welcome back!");

      // Go to dashboard page
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "20px",
      }}
    >
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "40px",
        }}
      >
        {/* Logo/Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              background:
                "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 8,
            }}
          >
            ShieldLabs
          </h1>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Sign in to your account
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alertError" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btnPrimary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
