// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function Terms() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicNav />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: 16 }}>
          Terms of Service
        </h1>
        <p className="muted" style={{ marginBottom: 60 }}>
          Last updated: January 6, 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <section>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              By accessing and using ShieldAuth's services, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}>
              2. Use License
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)", marginBottom: 16 }}>
              Permission is granted to temporarily use ShieldAuth's services for personal or commercial purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul style={{ paddingLeft: 24, lineHeight: 2, color: "var(--text-secondary)" }}>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose without a valid license</li>
              <li>Attempt to reverse engineer any software contained in ShieldAuth's services</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}>
              3. Disclaimer
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              The materials on ShieldAuth's services are provided on an 'as is' basis. ShieldAuth makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}>
              4. Limitations
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              In no event shall ShieldAuth or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use ShieldAuth's services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}>
              5. Accuracy of Materials
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              The materials appearing on ShieldAuth's services could include technical, typographical, or photographic errors. ShieldAuth does not warrant that any of the materials on its services are accurate, complete, or current.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}>
              6. Links
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              ShieldAuth has not reviewed all of the sites linked to its services and is not responsible for the contents of any such linked site.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}>
              7. Modifications
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              ShieldAuth may revise these terms of service at any time without notice. By using this service you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}>
              8. Governing Law
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>
        </div>

        <div style={{ marginTop: 60, padding: 24, background: "var(--bg-elevated)", borderRadius: 12 }}>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Questions about our Terms of Service? <a href="/contact" style={{ color: "var(--primary)" }}>Contact us</a>
          </p>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
