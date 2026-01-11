import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function Pricing() {
  const [billingInterval, setBillingInterval] = useState("monthly");
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    loadTestimonials();
    loadFaqs();
  }, []);

  const loadTestimonials = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/public/testimonials?featured=true&limit=3`
      );
      setTestimonials(response.data);
    } catch (error) {
      console.error("Failed to load testimonials:", error);
    }
  };

  const loadFaqs = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/public/faqs?category=Billing & Pricing&limit=10`
      );
      setFaqs(response.data);
    } catch (error) {
      console.error("Failed to load FAQs:", error);
    }
  };

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      description: "Perfect for testing and small projects",
      sections: [
        {
          title: "Core Authentication",
          features: [
            "1 Application",
            "25 Users per App",
            "License Management",
            "HWID Protection (1 slot)",
            "API Access",
          ],
        },
        {
          title: "Management",
          features: ["Basic Dashboard", "License Generation"],
        },
        {
          title: "Support",
          features: ["Community (Discord)", "Documentation"],
        },
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Developer",
      price: { monthly: 2.99, yearly: 29.90 },
      description: "For indie developers building apps",
      sections: [
        {
          title: "Core Authentication",
          features: [
            "3 Applications",
            "10,000 Users per App",
            "All Authentication Methods",
            "HWID Protection (up to 3 slots)",
            "Session Management",
          ],
        },
        {
          title: "Management & Administration",
          features: [
            "User Management",
            "License Management",
            "Subscription Management",
            "File Management (SDK downloads)",
            "Variables (store app data)",
          ],
        },
        {
          title: "Security",
          features: ["IP Whitelists/Blacklists", "2FA (Account)"],
        },
        {
          title: "Integration",
          features: ["Webhooks", "REST API"],
        },
        {
          title: "Analytics",
          features: ["Event Logs", "Basic Analytics"],
        },
        {
          title: "Developer Tools",
          features: [
            "All SDKs (C++/C#/Python/Node.js)",
            "Code Examples",
            "API Documentation",
          ],
        },
        {
          title: "Support",
          features: ["Email Support (Priority)", "Discord Priority Channel"],
        },
      ],
      cta: "Start Trial",
      popular: false,
    },
    {
      name: "Seller",
      price: { monthly: 4.99, yearly: 49.90 },
      description: "Best for selling software products",
      sections: [
        {
          title: "Everything in Developer, plus:",
          features: [],
        },
        {
          title: "Core Authentication",
          features: [
            "Unlimited Applications",
            "Unlimited Users per App",
            "HWID Protection (unlimited slots)",
          ],
        },
        {
          title: "Team & Business",
          features: [
            "Team Management (add team members)",
            "Reseller System",
            "Customer Panel (white-label)",
          ],
        },
        {
          title: "Integration",
          features: [
            "Discord Bot Integration",
            "Telegram Bot Integration",
            "Advanced Webhooks",
          ],
        },
        {
          title: "Analytics",
          features: [
            "Advanced Analytics Dashboard",
            "Seller Logs",
            "Export Reports",
          ],
        },
        {
          title: "Branding",
          features: ["Custom Branding", 'Remove "Powered by ShieldAuth"'],
        },
        {
          title: "Support",
          features: [
            "Dedicated Support",
            "Priority Bug Fixes",
            "Feature Requests Priority",
          ],
        },
      ],
      cta: "Start Trial",
      popular: true,
    },
    {
      name: "Pro",
      price: { monthly: 39.99, yearly: 399.90 },
      description: "Complete protection solution",
      badge: "NEW",
      sections: [
        {
          title: "Everything in Seller, plus:",
          features: [],
        },
        {
          title: "🛡️ BINARY PROTECTOR",
          features: [
            "Code Obfuscation",
            "String Encryption",
            "Anti-Debug",
            "Import Hiding",
            "Anti-Tamper",
          ],
        },
        {
          title: "Protection Features",
          features: [
            "Download Protector Tool",
            "Unlimited Protected Binaries",
            "Auto-integrate with Auth",
          ],
        },
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
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    right: 20,
                    background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 12,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                  }}
                >
                  {plan.badge}
                </div>
              )}

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

              <div style={{ textAlign: "left" }}>
                {plan.sections.map((section, i) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <h4
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--text)",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {section.title}
                    </h4>
                    {section.features.length > 0 && (
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {section.features.map((feature, j) => (
                          <li
                            key={j}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 8,
                              marginBottom: 8,
                              fontSize: "0.85rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <span
                              style={{
                                color: "var(--success)",
                                fontSize: "1rem",
                                marginTop: "2px",
                              }}
                            >
                              •
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
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
            {testimonials.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40 }}>
                <div className="muted">Loading testimonials...</div>
              </div>
            ) : (
              testimonials.map((testimonial, idx) => (
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
                    <div style={{ fontSize: "2.5rem" }}>{testimonial.author_avatar_url}</div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        {testimonial.author_name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {testimonial.author_role} at {testimonial.author_company}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
