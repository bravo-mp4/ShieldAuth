// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function Privacy() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicNav />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: 16 }}>
          Privacy Policy
        </h1>
        <p className="muted" style={{ marginBottom: 60 }}>
          Last updated: January 6, 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <section>
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}
            >
              Information We Collect
            </h2>
            <p
              style={{
                lineHeight: 1.8,
                color: "var(--text-secondary)",
                marginBottom: 16,
              }}
            >
              We collect information to provide better services to all our
              users. The types of information we collect include:
            </p>
            <ul
              style={{
                paddingLeft: 24,
                lineHeight: 2,
                color: "var(--text-secondary)",
              }}
            >
              <li>Account information (name, email, password)</li>
              <li>Usage data (API calls, license validations)</li>
              <li>Device information (IP address, hardware ID)</li>
              <li>Payment information (processed securely through Stripe)</li>
            </ul>
          </section>

          <section>
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}
            >
              How We Use Your Information
            </h2>
            <p
              style={{
                lineHeight: 1.8,
                color: "var(--text-secondary)",
                marginBottom: 16,
              }}
            >
              We use the information we collect for the following purposes:
            </p>
            <ul
              style={{
                paddingLeft: 24,
                lineHeight: 2,
                color: "var(--text-secondary)",
              }}
            >
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </section>

          <section>
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}
            >
              Data Security
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized or unlawful
              processing, accidental loss, destruction, or damage. All data
              transmission is encrypted using SSL/TLS.
            </p>
          </section>

          <section>
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}
            >
              Data Retention
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              We retain your personal data only for as long as necessary to
              fulfill the purposes for which it was collected, including any
              legal, accounting, or reporting requirements.
            </p>
          </section>

          <section>
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}
            >
              Your Rights
            </h2>
            <p
              style={{
                lineHeight: 1.8,
                color: "var(--text-secondary)",
                marginBottom: 16,
              }}
            >
              You have the right to:
            </p>
            <ul
              style={{
                paddingLeft: 24,
                lineHeight: 2,
                color: "var(--text-secondary)",
              }}
            >
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
            </ul>
          </section>

          <section>
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}
            >
              Cookies
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              We use cookies and similar tracking technologies to track activity
              on our service and hold certain information. You can instruct your
              browser to refuse all cookies or to indicate when a cookie is
              being sent.
            </p>
          </section>

          <section>
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}
            >
              Third-Party Services
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              We may employ third-party companies and individuals to facilitate
              our service, provide service on our behalf, or assist us in
              analyzing how our service is used. These third parties have access
              to your personal data only to perform these tasks on our behalf.
            </p>
          </section>

          <section>
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}
            >
              Changes to This Policy
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}
            >
              Contact Us
            </h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>
              If you have any questions about this Privacy Policy, please
              contact us at privacy@shieldlabs.com
            </p>
          </section>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
