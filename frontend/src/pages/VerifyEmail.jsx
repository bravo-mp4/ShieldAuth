import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { auth } from "../services/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("working");
  const sent = useRef(false);

  useEffect(() => {
    // Links are single-use, so make sure StrictMode's double effect doesn't spend it twice.
    if (sent.current) return;
    sent.current = true;
    auth
      .verifyEmail(searchParams.get("token") || "")
      .then(() => setStatus("done"))
      .catch(() => setStatus("failed"));
  }, [searchParams]);

  const message = {
    working: "Confirming your email...",
    done: "Your email is confirmed.",
    failed: "This link is invalid or has expired. You can send a new one from Settings.",
  }[status];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ maxWidth: 420, width: "100%", padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 16 }}>Email confirmation</h1>
        <p className={status === "failed" ? "red" : "muted"} style={{ marginBottom: 24 }}>
          {message}
        </p>
        <Link to={localStorage.getItem("token") ? "/dashboard" : "/login"} className="btn btnPrimary">
          Continue
        </Link>
      </div>
    </div>
  );
}
