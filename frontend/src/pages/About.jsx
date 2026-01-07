// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function About() {
  const team = [
    { name: "John Smith", role: "Founder & CEO", emoji: "👨‍💼" },
    { name: "Sarah Johnson", role: "CTO", emoji: "👩‍💻" },
    { name: "Mike Chen", role: "Lead Engineer", emoji: "👨‍🔧" },
    { name: "Emily Davis", role: "Product Designer", emoji: "👩‍🎨" },
  ];

  const milestones = [
    { year: "2024", event: "ShieldAuth founded" },
    { year: "2024", event: "First 100 customers" },
    { year: "2025", event: "Launched VM protection" },
    { year: "2025", event: "10,000+ licenses protected" },
    { year: "2026", event: "Series A funding" },
  ];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicNav />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: 800,
              marginBottom: 24,
              background:
                "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            About ShieldLabs
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              maxWidth: 700,
              margin: "0 auto",
              color: "var(--text-secondary)",
            }}
          >
            We're on a mission to make software protection accessible to every
            developer, from indie creators to enterprise teams.
          </p>
        </div>

        {/* Mission */}
        <div className="card" style={{ padding: 40, marginBottom: 60 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>
            Our Mission
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.8,
              color: "var(--text-secondary)",
            }}
          >
            Too many great software projects get cracked or abused because
            protection tools are either too expensive, too complicated, or
            simply don't exist. ShieldAuth combines the best of license
            management and binary protection into one affordable, easy-to-use
            platform.
          </p>
        </div>

        {/* Team */}
        <div style={{ marginBottom: 80 }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: 40,
              textAlign: "center",
            }}
          >
            Meet the Team
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 24,
            }}
          >
            {team.map((member, idx) => (
              <div
                key={idx}
                className="card"
                style={{ padding: 32, textAlign: "center" }}
              >
                <div style={{ fontSize: "4rem", marginBottom: 16 }}>
                  {member.emoji}
                </div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {member.name}
                </h3>
                <p className="muted" style={{ fontSize: "0.9rem" }}>
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="card" style={{ padding: 40 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 32 }}>
            Our Journey
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {milestones.map((milestone, idx) => (
              <div
                key={idx}
                style={{ display: "flex", gap: 24, alignItems: "center" }}
              >
                <div
                  style={{
                    minWidth: 80,
                    padding: "8px 16px",
                    background: "var(--primary)",
                    color: "white",
                    borderRadius: 8,
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {milestone.year}
                </div>
                <div style={{ fontSize: "1.1rem" }}>{milestone.event}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div style={{ textAlign: "center", marginTop: 80 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>
            Want to learn more?
          </h2>
          <p className="muted" style={{ fontSize: "1.1rem", marginBottom: 32 }}>
            Get in touch with our team
          </p>
          <a
            href="/contact"
            className="btn btnPrimary"
            style={{ padding: "12px 32px" }}
          >
            Contact Us
          </a>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
