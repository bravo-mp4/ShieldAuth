import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// @ts-expect-error - JS module
import { auth } from "../services/api";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await auth.register(email, password, name);
      
      // Save token and redirect to dashboard
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
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
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "40px",
        }}
      >
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
            Create Account
          </h1>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Start your 14-day free trial
          </p>
        </div>

        {error && (
          <div className="alertError" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
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

          <div className="field">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <span className="muted" style={{ fontSize: "0.9rem" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              style={{ color: "var(--primary)", fontWeight: 600 }}
            >
              Sign in
            </Link>
          </span>
        </div>

        <div
          style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: "1px solid var(--border)",
          }}
        >
          <p
            className="muted"
            style={{ fontSize: "0.75rem", textAlign: "center" }}
          >
            By signing up, you agree to our{" "}
            <a href="/terms" style={{ color: "var(--primary)" }}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" style={{ color: "var(--primary)" }}>
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
