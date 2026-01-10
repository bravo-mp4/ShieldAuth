import { useState } from "react";
import axios from "axios";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await axios.post(`${API_BASE_URL}/api/v1/public/contact`, {
        name,
        email,
        subject,
        message,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit contact form:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <PublicNav />
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            padding: "120px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: 24 }}>✓</div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>
            Message Sent!
          </h1>
          <p className="muted" style={{ fontSize: "1.1rem", marginBottom: 32 }}>
            We'll get back to you within 24 hours.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="btn btnPrimary"
          >
            Send Another Message
          </button>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicNav />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 800,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Contact Us
        </h1>
        <p
          className="muted"
          style={{ fontSize: "1.1rem", textAlign: "center", marginBottom: 60 }}
        >
          Have questions? We'd love to hear from you.
        </p>

        <div
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 40 }}
        >
          {/* Contact Form */}
          <div className="card" style={{ padding: 40 }}>
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}
            >
              Send us a message
            </h2>
            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="field">
                <label>Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="How can we help?"
                  required
                />
              </div>

              <div className="field">
                <label>Message</label>
                <textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more..."
                  required
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: 12,
                    background: "var(--error-bg)",
                    color: "var(--error)",
                    borderRadius: 6,
                    marginBottom: 16,
                    fontSize: "0.9rem",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btnPrimary"
                style={{ width: "100%" }}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Other Ways to Reach Us
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <div
                    className="muted"
                    style={{ fontSize: "0.85rem", marginBottom: 4 }}
                  >
                    Email
                  </div>
                  <a
                    href="mailto:hello@shieldlabs.com"
                    style={{ color: "var(--primary)", fontWeight: 600 }}
                  >
                    hello@shieldlabs.com
                  </a>
                </div>
                <div>
                  <div
                    className="muted"
                    style={{ fontSize: "0.85rem", marginBottom: 4 }}
                  >
                    Discord
                  </div>
                  <a
                    href="#"
                    style={{ color: "var(--primary)", fontWeight: 600 }}
                  >
                    discord.gg/shieldauth
                  </a>
                </div>
                <div>
                  <div
                    className="muted"
                    style={{ fontSize: "0.85rem", marginBottom: 4 }}
                  >
                    Twitter
                  </div>
                  <a
                    href="#"
                    style={{ color: "var(--primary)", fontWeight: 600 }}
                  >
                    @shieldauth
                  </a>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Documentation
              </h3>
              <p
                className="muted"
                style={{ fontSize: "0.9rem", marginBottom: 16 }}
              >
                Most questions can be answered in our docs.
              </p>
              <a
                href="/docs"
                className="btn btnSecondary"
                style={{ width: "100%" }}
              >
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
