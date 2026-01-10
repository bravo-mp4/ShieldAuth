import { useState } from "react";
import { Link } from "react-router-dom";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function Pricing() {
  const [billingInterval, setBillingInterval] = useState("monthly");

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      description: "Perfect for testing and small projects",
      features: [
        { text: "1 Application", included: true },
        { text: "25 Users per App", included: true },
        { text: "License Management", included: true },
        { text: "HWID Protection (1 slot)", included: true },
        { text: "API Access", included: true },
        { text: "Basic Dashboard", included: true },
        { text: "Community Support (Discord)", included: true },
        { text: "Documentation", included: true },
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Developer",
      price: { monthly: 2.99, yearly: 29.90 },
      description: "For indie developers building apps",
      features: [
        { text: "3 Applications", included: true },
        { text: "10,000 Users per App", included: true },
        { text: "HWID Protection (up to 3 slots)", included: true },
        { text: "Session Management", included: true },
        { text: "Webhooks", included: true },
        { text: "IP Whitelists/Blacklists", included: true },
        { text: "Event Logs", included: true },
        { text: "Basic Analytics", included: true },
        { text: "All SDKs (C++/C#/Python/Node.js)", included: true },
        { text: "2FA Account Security", included: true },
        { text: "Email Support (Priority)", included: true },
      ],
      cta: "Start Trial",
      popular: false,
    },
    {
      name: "Seller",
      price: { monthly: 4.99, yearly: 49.90 },
      description: "Best for selling software products",
      features: [
        { text: "Everything in Developer", included: true },
        { text: "Unlimited Applications", included: true },
        { text: "Unlimited Users per App", included: true },
        { text: "Unlimited HWID slots", included: true },
        { text: "Team Management", included: true },
        { text: "Reseller System", included: true },
        { text: "Customer Panel (white-label)", included: true },
        { text: "Discord Bot Integration", included: true },
        { text: "Telegram Bot Integration", included: true },
        { text: "Advanced Analytics", included: true },
        { text: "Custom Branding", included: true },
        { text: "Remove \"Powered by ShieldAuth\"", included: true },
        { text: "Dedicated Support", included: true },
      ],
      cta: "Start Trial",
      popular: true,
    },
    {
      name: "Pro",
      price: { monthly: 39.99, yearly: 399.90 },
      description: "Complete protection solution",
      features: [
        { text: "Everything in Seller", included: true },
        { text: "🛡️ BINARY PROTECTOR", included: true, highlight: true },
        { text: "Code Obfuscation", included: true },
        { text: "String Encryption", included: true },
        { text: "Anti-Debug Protection", included: true },
        { text: "Import Hiding", included: true },
        { text: "Anti-Tamper", included: true },
        { text: "Unlimited Protected Binaries", included: true },
        { text: "Auto-integrate with Auth", included: true },
        { text: "Priority Feature Requests", included: true },
      ],
      cta: "Get Pro",
      popular: false,
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
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: 800,
              marginBottom: 16,
              background:
                "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Simple, Transparent Pricing
          </h1>
          <p className="muted" style={{ fontSize: "1.2rem", marginBottom: 40 }}>
            Start free, upgrade as you grow. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                color:
                  billingInterval === "monthly"
                    ? "var(--text)"
                    : "var(--text-secondary)",
              }}
            >
              Monthly
            </span>
            <button
              onClick={() =>
                setBillingInterval(
                  billingInterval === "monthly" ? "yearly" : "monthly"
                )
              }
              style={{
                width: 56,
                height: 28,
                borderRadius: 14,
                background:
                  billingInterval === "yearly"
                    ? "var(--primary)"
                    : "var(--bg-card)",
                border: "1px solid var(--border)",
                position: "relative",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: 2,
                  left: billingInterval === "yearly" ? 30 : 2,
                  transition: "all 0.2s",
                }}
              />
            </button>
            <span
              style={{
                color:
                  billingInterval === "yearly"
                    ? "var(--text)"
                    : "var(--text-secondary)",
              }}
            >
              Yearly
              <span
                style={{
                  marginLeft: 8,
                  padding: "2px 8px",
                  background: "var(--success)",
                  color: "white",
                  borderRadius: 4,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Trust Badges */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 32,
            marginBottom: 60,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>✓</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
              30-Day Money Back
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>✓</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
              No Credit Card Required
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>✓</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
              Cancel Anytime
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🔒</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
              Secure Payment
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                padding: 32,
                position: "relative",
                border: plan.popular ? "2px solid var(--primary)" : undefined,
                transform: plan.popular ? "scale(1.05)" : undefined,
                boxShadow: plan.popular
                  ? "0 20px 60px rgba(34, 197, 94, 0.2)"
                  : undefined,
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--primary)",
                    color: "white",
                    padding: "4px 16px",
                    borderRadius: 12,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  MOST POPULAR
                </div>
              )}

              <h3
                style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}
              >
                {plan.name}
              </h3>
              <p
                className="muted"
                style={{ fontSize: "0.9rem", marginBottom: 24 }}
              >
                {plan.description}
              </p>

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: "3rem", fontWeight: 800 }}>
                  ${plan.price[billingInterval]}
                </span>
                <span className="muted">
                  {plan.price[billingInterval] > 0
                    ? `/${billingInterval === "monthly" ? "mo" : "yr"}`
                    : "forever"}
                </span>
              </div>

              <Link
                to={plan.name === "Business" ? "/contact" : "/signup"}
                className="btn btnPrimary"
                style={{ width: "100%", marginBottom: 24 }}
              >
                {plan.cta}
              </Link>

              <ul style={{ listStyle: "none", padding: 0, textAlign: "left" }}>
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 12,
                      opacity: feature.included ? 1 : 0.4,
                      background: feature.highlight ? "var(--primary-bg)" : "transparent",
                      padding: feature.highlight ? "8px 12px" : "0",
                      borderRadius: feature.highlight ? "6px" : "0",
                      border: feature.highlight ? "1px solid var(--border-green)" : "none",
                    }}
                  >
                    <span
                      style={{
                        color: feature.included
                          ? "var(--success)"
                          : "var(--text-muted)",
                        fontSize: "1.2rem",
                      }}
                    >
                      {feature.included ? "✓" : "✗"}
                    </span>
                    <span style={{ 
                      fontSize: "0.9rem",
                      fontWeight: feature.highlight ? 600 : 400,
                      color: feature.highlight ? "var(--primary)" : "inherit"
                    }}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{ marginBottom: 80 }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            Trusted by Developers Worldwide
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {[
              {
                name: "Alex Chen",
                role: "Game Developer",
                company: "PixelForge Studios",
                quote:
                  "ShieldLabs cut our piracy rate by 87% in the first month. The HWID locking is bulletproof and the integration took literally 10 minutes.",
                avatar: "👨‍💻",
              },
              {
                name: "Sarah Martinez",
                role: "CTO",
                company: "DataSync Pro",
                quote:
                  "We switched from Auth0 and saved $2,400/year while getting better features. The binary protection alone is worth 10x the price.",
                avatar: "👩‍💼",
              },
              {
                name: "Mike Johnson",
                role: "Indie Developer",
                company: "Solo Creator",
                quote:
                  "As a solo dev, I needed something that just works. ShieldLabs dashboard is so intuitive I never have to check the docs anymore.",
                avatar: "🧑‍🎨",
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="card" style={{ padding: 28 }}>
                <div
                  style={{
                    marginBottom: 16,
                    fontSize: "0.95rem",
                    lineHeight: 1.7,
                    fontStyle: "italic",
                  }}
                >
                  "{testimonial.quote}"
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: "2.5rem" }}>{testimonial.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      {testimonial.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div
          style={{ maxWidth: 800, margin: "80px auto 0", textAlign: "center" }}
        >
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 40 }}>
            Frequently Asked Questions
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          <div className="card" style={{ padding: 24 }}>
            <h3
              style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}
            >
              Can I change plans later?
            </h3>
            <p className="muted">
              Yes! You can upgrade or downgrade at any time. Changes take effect
              immediately.
            </p>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h3
              style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}
            >
              What payment methods do you accept?
            </h3>
            <p className="muted">
              We accept all major credit cards (Visa, Mastercard, Amex) and
              PayPal.
            </p>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h3
              style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}
            >
              Is there a free trial?
            </h3>
            <p className="muted">
              Yes! All paid plans include a 14-day free trial. No credit card
              required.
            </p>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h3
              style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}
            >
              Do you offer refunds?
            </h3>
            <p className="muted">
              Yes, we offer a 30-day money-back guarantee on all plans.
            </p>
          </div>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
