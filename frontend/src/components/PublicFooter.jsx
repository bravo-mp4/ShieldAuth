export default function PublicFooter() {
  return (
    <footer
      style={{
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
        padding: "60px 24px 40px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40,
            marginBottom: 40,
          }}
        >
          {/* Product */}
          <div>
            <h4
              style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 16 }}
            >
              Product
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a
                href="/features"
                className="muted"
                style={{ fontSize: "0.9rem" }}
              >
                Features
              </a>
              <a
                href="/pricing"
                className="muted"
                style={{ fontSize: "0.9rem" }}
              >
                Pricing
              </a>
              <a
                href="/status"
                className="muted"
                style={{ fontSize: "0.9rem" }}
              >
                Status
              </a>
              <a
                href="/changelog"
                className="muted"
                style={{ fontSize: "0.9rem" }}
              >
                Changelog
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4
              style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 16 }}
            >
              Resources
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="/docs" className="muted" style={{ fontSize: "0.9rem" }}>
                Documentation
              </a>
              <a
                href="/downloads"
                className="muted"
                style={{ fontSize: "0.9rem" }}
              >
                Downloads
              </a>
              <a
                href="/support"
                className="muted"
                style={{ fontSize: "0.9rem" }}
              >
                Support
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4
              style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 16 }}
            >
              Company
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="/about" className="muted" style={{ fontSize: "0.9rem" }}>
                About
              </a>
              <a href="/blog" className="muted" style={{ fontSize: "0.9rem" }}>
                Blog
              </a>
              <a
                href="/contact"
                className="muted"
                style={{ fontSize: "0.9rem" }}
              >
                Contact
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4
              style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 16 }}
            >
              Legal
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="/terms" className="muted" style={{ fontSize: "0.9rem" }}>
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="muted"
                style={{ fontSize: "0.9rem" }}
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 24,
            textAlign: "center",
          }}
        >
          <div className="muted" style={{ fontSize: "0.9rem" }}>
            © 2026 ShieldLabs. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
