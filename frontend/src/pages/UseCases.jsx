import { Link } from "react-router-dom";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function UseCases() {
  const useCases = [
    {
      industry: "Gaming",
      icon: "🎮",
      title: "Game Development & Distribution",
      description:
        "Protect your indie games, mods, and premium content from piracy while maintaining a seamless player experience.",
      challenges: [
        "High piracy rates costing 40-60% of revenue",
        "Cracked versions spreading faster than official releases",
        "Need for instant license activation",
      ],
      solutions: [
        "HWID locking prevents license sharing between players",
        "Sub-50ms validation won't impact gameplay",
        "Automatic updates through protected binary system",
        "Discord/Steam integration for community management",
      ],
      stats: {
        metric: "87%",
        label: "Average piracy reduction",
        secondary: "From 47% to 6% piracy rate",
      },
      customers: [
        "Unity Developers",
        "Unreal Engine Studios",
        "Indie Game Creators",
      ],
    },
    {
      industry: "Desktop Apps",
      icon: "💻",
      title: "Desktop Software & Tools",
      description:
        "Secure your desktop applications, productivity tools, and professional software with enterprise-grade licensing.",
      challenges: [
        "Easy reverse engineering of .exe files",
        "License key generators spreading online",
        "No way to track unauthorized usage",
      ],
      solutions: [
        "Code obfuscation and VM protection",
        "Real-time license validation with offline grace periods",
        "Usage analytics to identify suspicious patterns",
        "Automatic license renewal and subscription management",
      ],
      stats: {
        metric: "5 min",
        label: "Average integration time",
        secondary: "C++, C#, Python SDKs",
      },
      customers: ["SaaS Tools", "Design Software", "Developer Tools"],
    },
    {
      industry: "Enterprise",
      icon: "🏢",
      title: "Enterprise & B2B Solutions",
      description:
        "Scale your licensing infrastructure with team management, custom branding, and dedicated support.",
      challenges: [
        "Complex multi-seat licensing requirements",
        "Need for white-label solutions",
        "Compliance and audit requirements",
      ],
      solutions: [
        "Unlimited applications and team management",
        "Custom branding on all user-facing elements",
        "SSO/SAML integration for enterprise authentication",
        "99.9% SLA with dedicated support channel",
      ],
      stats: {
        metric: "$12K",
        label: "Avg. annual savings",
        secondary: "vs building in-house",
      },
      customers: ["Enterprise SaaS", "B2B Platforms", "Corporate Software"],
    },
    {
      industry: "Content Creators",
      icon: "🎨",
      title: "Digital Products & Course Content",
      description:
        "Protect premium courses, digital downloads, and subscription content with easy-to-use licensing.",
      challenges: [
        "Content being re-shared on piracy sites",
        "No control after initial purchase",
        "Difficult to manage subscriptions",
      ],
      solutions: [
        "Time-based licenses for subscription models",
        "Instant license generation via webhooks",
        "Revoke access for chargebacks/refunds",
        "Integration with Gumroad, Patreon, Stripe",
      ],
      stats: {
        metric: "94%",
        label: "Content protection rate",
        secondary: "Stop unauthorized sharing",
      },
      customers: ["Course Creators", "Digital Artists", "Premium Content"],
    },
  ];

  return (
    <>
      <PublicNav />
      <div
        className="page"
        style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 40px" }}
      >
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
            Built for Your Industry
          </h1>
          <p
            className="muted"
            style={{ fontSize: "1.2rem", maxWidth: 700, margin: "0 auto" }}
          >
            See how developers across different industries use ShieldLabs to
            protect their work and grow revenue
          </p>
        </div>

        {/* Use Cases */}
        <div style={{ display: "flex", flexDirection: "column", gap: 60 }}>
          {useCases.map((useCase, idx) => (
            <div key={idx} className="card" style={{ padding: 48 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 48,
                  alignItems: "start",
                }}
              >
                {/* Left Column */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ fontSize: "3rem" }}>{useCase.icon}</div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {useCase.industry}
                      </div>
                      <h2 style={{ fontSize: "2rem", fontWeight: 700 }}>
                        {useCase.title}
                      </h2>
                    </div>
                  </div>
                  <p
                    className="muted"
                    style={{
                      fontSize: "1.05rem",
                      lineHeight: 1.7,
                      marginBottom: 32,
                    }}
                  >
                    {useCase.description}
                  </p>

                  {/* Challenges */}
                  <div style={{ marginBottom: 32 }}>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        marginBottom: 16,
                        color: "var(--error)",
                      }}
                    >
                      ⚠️ Common Challenges
                    </h3>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {useCase.challenges.map((challenge, i) => (
                        <li
                          key={i}
                          style={{
                            display: "flex",
                            gap: 8,
                            fontSize: "0.95rem",
                          }}
                        >
                          <span style={{ color: "var(--error)" }}>✗</span>
                          <span className="muted">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stats */}
                  <div
                    style={{
                      padding: 24,
                      background: "var(--primary-bg)",
                      border: "1px solid var(--primary)",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "3rem",
                        fontWeight: 800,
                        color: "var(--primary)",
                        marginBottom: 4,
                      }}
                    >
                      {useCase.stats.metric}
                    </div>
                    <div
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {useCase.stats.label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {useCase.stats.secondary}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  {/* Solutions */}
                  <div style={{ marginBottom: 32 }}>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        marginBottom: 16,
                        color: "var(--success)",
                      }}
                    >
                      ✓ ShieldLabs Solution
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {useCase.solutions.map((solution, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: 12,
                            padding: 16,
                            background: "var(--bg-elevated)",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              background: "var(--success-bg)",
                              color: "var(--success)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.9rem",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            ✓
                          </div>
                          <span style={{ fontSize: "0.95rem" }}>
                            {solution}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customers */}
                  <div>
                    <h3
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginBottom: 12,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Perfect For
                    </h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {useCase.customers.map((customer, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "8px 16px",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            fontSize: "0.85rem",
                            fontWeight: 500,
                          }}
                        >
                          {customer}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="card"
          style={{
            padding: "60px 40px",
            textAlign: "center",
            marginTop: 80,
            background:
              "linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-card) 100%)",
          }}
        >
          <h2 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 16 }}>
            Ready to Get Started?
          </h2>
          <p
            className="muted"
            style={{
              fontSize: "1.1rem",
              marginBottom: 32,
              maxWidth: 600,
              margin: "0 auto 32px",
            }}
          >
            Join 2,500+ developers protecting their work with ShieldLabs
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/signup"
              className="btn btnPrimary"
              style={{ padding: "14px 36px", fontSize: "1.05rem" }}
            >
              Start Free Trial →
            </Link>
            <Link
              to="/pricing"
              className="btn btnGhost"
              style={{ padding: "14px 36px", fontSize: "1.05rem" }}
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
