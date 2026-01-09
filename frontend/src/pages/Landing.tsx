import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function Landing() {
  const navigate = useNavigate();
  const [liveValidations, setLiveValidations] = useState(47923);
  
  useEffect(() => {
    // If user is logged in, redirect to dashboard
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
    
    // Live validations counter
    const interval = setInterval(() => {
      setLiveValidations(prev => prev + Math.floor(Math.random() * 3));
    }, 2000);
    return () => clearInterval(interval);
  }, [navigate]);
  return (
    <>
      <PublicNav />
      <div className="hero" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <div className="kicker">🔐 ENTERPRISE-GRADE SECURITY</div>
          <div style={{ 
            background: 'var(--success-bg)', 
            color: 'var(--success)', 
            padding: '4px 12px', 
            borderRadius: 12, 
            fontSize: '0.75rem',
            fontWeight: 600,
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            ● {liveValidations.toLocaleString()} validations today
          </div>
        </div>
        <h1 className="heroTitle" style={{ marginBottom: '24px', maxWidth: '900px', margin: '0 auto' }}>
          Protect Your Software with{" "}
          <span className="heroAccent">ShieldLabs</span>
        </h1>
        <p className="heroDesc" style={{ fontSize: '1.2rem', marginBottom: '48px', maxWidth: '650px' }}>
          Advanced HWID authentication and licensing system. Prevent
          unauthorized access, protect your revenue, and scale with confidence.
        </p>

        <div className="heroCtas" style={{ marginBottom: '48px' }}>
          <Link className="btn btnPrimary" to="/signup" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
            Protect Your App in 5 Minutes →
          </Link>
          <Link className="btn btnGhost" to="/docs" style={{ padding: '16px 32px' }}>
            📚 Documentation
          </Link>
        </div>
        
        {/* Product Screenshot */}
        <div style={{ 
          maxWidth: '1100px', 
          margin: '0 auto 60px',
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          background: 'var(--bg-card)'
        }}>
          <div style={{ 
            padding: '12px 16px', 
            background: 'var(--bg-elevated)', 
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }}></div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }}></div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }}></div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ShieldLabs Dashboard</div>
          </div>
          <div style={{ padding: 40, background: 'linear-gradient(135deg, #0a0a0f 0%, #131318 100%)' }}>
            <div className="grid3" style={{ gap: 16, marginBottom: 24 }}>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Active Licenses</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>1,247</div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Validations Today</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>8,942</div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Revenue</div>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>$12.4K</div>
              </div>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 600 }}>Recent Activity</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Last 24 hours</div>
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', marginTop: 6 }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', marginBottom: 4 }}>License validated successfully</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>user_{i}234 • App_Premium • {i * 2}m ago</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="heroStats">
          <div className="stat">
            <div className="statValue">50K+</div>
            <div className="statLabel">Active Licenses</div>
          </div>
          <div className="stat">
            <div className="statValue">2.5K+</div>
            <div className="statLabel">Developers</div>
          </div>
          <div className="stat">
            <div className="statValue">99.9%</div>
            <div className="statLabel">Uptime</div>
          </div>
        </div>
        
        {/* Customer Logos */}
        <div style={{ marginTop: 80, textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 32, fontWeight: 500 }}>
            TRUSTED BY DEVELOPERS AT
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 48, 
            flexWrap: 'wrap',
            opacity: 0.6
          }}>
            {['Unity Games', 'Electron Apps', 'Desktop Tools', 'SaaS Platforms', 'Gaming Studios', 'Enterprise'].map(name => (
              <div key={name} style={{ 
                padding: '12px 24px',
                background: 'var(--bg-card)',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}>
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section" style={{ padding: '100px 40px' }}>
        <div className="sectionTitle" style={{ marginBottom: '64px' }}>Why ShieldLabs?</div>
        <div className="grid3" style={{ gap: '24px' }}>
          <div className="card" style={{ padding: '32px', transition: 'all 0.3s ease' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔐</div>
            <div className="cardTitle" style={{ marginBottom: '12px', fontSize: '1.2rem' }}>Hardware ID Locking</div>
            <div className="panelBody">
              Lock licenses to specific hardware fingerprints. Prevent
              unauthorized license sharing and protect your revenue stream.
            </div>
          </div>
          <div className="card" style={{ padding: '32px', transition: 'all 0.3s ease' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚡</div>
            <div className="cardTitle" style={{ marginBottom: '12px', fontSize: '1.2rem' }}>Lightning Fast</div>
            <div className="muted" style={{ lineHeight: '1.7' }}>
              Sub-100ms validation times with global CDN distribution. Your
              users won't even notice the authentication layer.
            </div>
          </div>
          <div className="card" style={{ padding: '32px', transition: 'all 0.3s ease' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🛡️</div>
            <div className="cardTitle" style={{ marginBottom: '12px', fontSize: '1.2rem' }}>Battle-Tested</div>
            <div className="muted" style={{ lineHeight: '1.7' }}>
              Used by thousands of developers worldwide. Proven protection
              against crackers, reverse engineering, and unauthorized access.
            </div>
          </div>
          <div className="card" style={{ padding: '32px', transition: 'all 0.3s ease' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📊</div>
            <div className="cardTitle" style={{ marginBottom: '12px', fontSize: '1.2rem' }}>Real-Time Analytics</div>
            <div className="muted" style={{ lineHeight: '1.7' }}>
              Monitor license usage, track authentication attempts, and get
              insights into your user base with our advanced dashboard.
            </div>
          </div>
          <div className="card" style={{ padding: '32px', transition: 'all 0.3s ease' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔄</div>
            <div className="cardTitle" style={{ marginBottom: '12px', fontSize: '1.2rem' }}>Easy Integration</div>
            <div className="muted" style={{ lineHeight: '1.7' }}>
              Simple REST API with SDKs for C++, C#, Python, and more. Get up
              and running in minutes, not hours.
            </div>
          </div>
          <div className="card" style={{ padding: '32px', transition: 'all 0.3s ease' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>💼</div>
            <div className="cardTitle" style={{ marginBottom: '12px', fontSize: '1.2rem' }}>Enterprise Ready</div>
            <div className="muted" style={{ lineHeight: '1.7' }}>
              Scalable infrastructure, 24/7 support, SLA guarantees, and custom
              solutions for enterprise clients.
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="sectionTitle">Simple, Transparent Pricing</div>
        <div className="grid3">
          <div className="card">
            <div className="cardTitle">Starter</div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: "700",
                margin: "16px 0",
                color: "var(--text)",
              }}
            >
              $29
              <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>
                /mo
              </span>
            </div>
            <div className="muted" style={{ marginBottom: "24px" }}>
              Perfect for indie developers
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ Up to 1,000 licenses
              </li>
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ HWID authentication
              </li>
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ Basic analytics
              </li>
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ Email support
              </li>
            </ul>
            <button
              className="btn btnGhost"
              style={{ marginTop: "24px", width: "100%" }}
            >
              Choose Plan
            </button>
          </div>

          <div className="card" style={{ border: "2px solid var(--primary)" }}>
            <div className="cardTitle" style={{ color: "var(--primary)" }}>
              Professional
              <span
                style={{
                  fontSize: "0.7rem",
                  marginLeft: "8px",
                  padding: "2px 8px",
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: "4px",
                }}
              >
                POPULAR
              </span>
            </div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: "700",
                margin: "16px 0",
                color: "var(--text)",
              }}
            >
              $79
              <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>
                /mo
              </span>
            </div>
            <div className="muted" style={{ marginBottom: "24px" }}>
              For growing businesses
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ Up to 10,000 licenses
              </li>
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ Advanced analytics
              </li>
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ Priority support
              </li>
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ Custom branding
              </li>
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ Webhooks & API access
              </li>
            </ul>
            <button
              className="btn btnPrimary"
              style={{ marginTop: "24px", width: "100%" }}
            >
              Choose Plan
            </button>
          </div>

          <div className="card">
            <div className="cardTitle">Enterprise</div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: "700",
                margin: "16px 0",
                color: "var(--text)",
              }}
            >
              Custom
            </div>
            <div className="muted" style={{ marginBottom: "24px" }}>
              Tailored to your needs
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ Unlimited licenses
              </li>
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ Dedicated infrastructure
              </li>
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ 24/7 phone support
              </li>
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ SLA guarantees
              </li>
              <li style={{ color: "var(--text-secondary)" }}>
                ✓ Custom integrations
              </li>
            </ul>
            <button
              className="btn btnGhost"
              style={{ marginTop: "24px", width: "100%" }}
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
