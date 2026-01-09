import { useState } from "react";
import { Link } from "react-router-dom";

export default function OnboardingWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [appName, setAppName] = useState("");
  const [sdkChoice, setSdkChoice] = useState("");

  const steps = [
    {
      title: "Welcome to ShieldLabs!",
      subtitle: "Let's get your first app protected in 5 minutes",
      content: (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "4rem", marginBottom: 24 }}>🚀</div>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>
            Get Started in 5 Easy Steps
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              marginBottom: 32,
              maxWidth: 500,
              margin: "0 auto 32px",
            }}
          >
            We'll guide you through creating your first application, generating
            a license key, and testing validation.
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                background: "var(--bg-elevated)",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  marginBottom: 4,
                }}
              >
                Step 1
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Create App
              </div>
            </div>
            <div
              style={{
                padding: "12px 20px",
                background: "var(--bg-elevated)",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  marginBottom: 4,
                }}
              >
                Step 2
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Get API Key
              </div>
            </div>
            <div
              style={{
                padding: "12px 20px",
                background: "var(--bg-elevated)",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  marginBottom: 4,
                }}
              >
                Step 3
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Install SDK
              </div>
            </div>
            <div
              style={{
                padding: "12px 20px",
                background: "var(--bg-elevated)",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  marginBottom: 4,
                }}
              >
                Step 4
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Test It
              </div>
            </div>
            <div
              style={{
                padding: "12px 20px",
                background: "var(--bg-elevated)",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  marginBottom: 4,
                }}
              >
                Step 5
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Deploy
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Create Your First App",
      subtitle: "Give your application a name",
      content: (
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div className="form">
            <div className="field">
              <label>Application Name</label>
              <input
                type="text"
                placeholder="e.g., MyAwesomeGame, DesktopTool Pro"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                autoFocus
              />
              <div
                className="muted"
                style={{ fontSize: "0.85rem", marginTop: 8 }}
              >
                This is how you'll identify your app in the dashboard
              </div>
            </div>
            <div className="field">
              <label>Version (Optional)</label>
              <input
                type="text"
                placeholder="e.g., 1.0.0"
                defaultValue="1.0.0"
              />
            </div>
          </div>
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "var(--info-bg)",
              border: "1px solid var(--info)",
              borderRadius: 8,
              fontSize: "0.9rem",
            }}
          >
            💡 <strong>Tip:</strong> You can manage multiple applications from
            one dashboard
          </div>
        </div>
      ),
    },
    {
      title: "Choose Your SDK",
      subtitle: "Select your development language",
      content: (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                id: "cpp",
                name: "C++",
                icon: "⚡",
                desc: "Native performance",
              },
              { id: "csharp", name: "C#", icon: "🎮", desc: "Unity & .NET" },
              {
                id: "python",
                name: "Python",
                icon: "🐍",
                desc: "Easy integration",
              },
              {
                id: "nodejs",
                name: "Node.js",
                icon: "📦",
                desc: "Electron apps",
              },
            ].map((sdk) => (
              <button
                key={sdk.id}
                onClick={() => setSdkChoice(sdk.id)}
                className="card"
                style={{
                  padding: 20,
                  cursor: "pointer",
                  border:
                    sdkChoice === sdk.id
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                  background:
                    sdkChoice === sdk.id
                      ? "var(--primary-bg)"
                      : "var(--bg-card)",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>
                  {sdk.icon}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {sdk.name}
                </div>
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  {sdk.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Install SDK & Test",
      subtitle: `Here's your integration code for ${
        sdkChoice || "your language"
      }`,
      content: (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div
            style={{
              background: "#0a0a0f",
              borderRadius: 12,
              border: "1px solid var(--border)",
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                background: "var(--bg-elevated)",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                main.cpp
              </div>
              <button
                className="btn btnGhost"
                style={{ padding: "4px 12px", fontSize: "0.8rem" }}
              >
                📋 Copy
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: 24,
                fontSize: "0.85rem",
                lineHeight: 1.6,
                color: "#e4e4e7",
                overflowX: "auto",
                fontFamily: "'Fira Code', monospace",
              }}
            >
              {`#include "shieldlabs.h"

ShieldLabs::Client client("your_api_key_here");

auto result = client.validate({
    .license_key = "XXXX-XXXX-XXXX-XXXX",
    .hwid = ShieldLabs::getHWID()
});

if (result.valid) {
    std::cout << "✓ License valid!" << std::endl;
} else {
    std::cout << "✗ Invalid license" << std::endl;
    exit(1);
}`}
            </pre>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <Link to="/docs" className="btn btnGhost" style={{ flex: 1 }}>
              📚 Full Documentation
            </Link>
            <Link to="/downloads" className="btn btnGhost" style={{ flex: 1 }}>
              ⬇️ Download SDK
            </Link>
          </div>
          <div
            style={{
              padding: 16,
              background: "var(--success-bg)",
              border: "1px solid var(--success)",
              borderRadius: 8,
              fontSize: "0.9rem",
            }}
          >
            ✓ <strong>Next:</strong> Run the code above to test your first
            validation
          </div>
        </div>
      ),
    },
    {
      title: "🎉 You're All Set!",
      subtitle: "Your first app is ready to go",
      content: (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "5rem", marginBottom: 24 }}>✓</div>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 16 }}>
            Congratulations!
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              marginBottom: 40,
              maxWidth: 500,
              margin: "0 auto 40px",
            }}
          >
            You've successfully set up your first protected application. Here's
            what you can do next:
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              maxWidth: 800,
              margin: "0 auto 32px",
            }}
          >
            <Link
              to="/applications"
              className="card"
              style={{
                padding: 24,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📦</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Manage Apps
              </div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                View and configure
              </div>
            </Link>
            <Link
              to="/users"
              className="card"
              style={{
                padding: 24,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>👥</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Create Licenses
              </div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                Generate keys
              </div>
            </Link>
            <Link
              to="/analytics"
              className="card"
              style={{
                padding: 24,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📊</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                View Analytics
              </div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                Track usage
              </div>
            </Link>
            <Link
              to="/docs"
              className="card"
              style={{
                padding: 24,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📚</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Read Docs</div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                Learn more
              </div>
            </Link>
          </div>
        </div>
      ),
    },
  ];

  const canProceed = () => {
    if (currentStep === 1) return appName.trim().length > 0;
    if (currentStep === 2) return sdkChoice !== "";
    return true;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 900,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 0,
        }}
      >
        {/* Progress Bar */}
        <div
          style={{
            height: 4,
            background: "var(--bg-elevated)",
            borderRadius: "4px 4px 0 0",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "var(--primary)",
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              transition: "width 0.3s ease",
              borderRadius: "4px 0 0 0",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            padding: "32px 40px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 8,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Step {currentStep + 1} of {steps.length}
              </div>
              <h2
                style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 8 }}
              >
                {steps[currentStep].title}
              </h2>
              <p
                style={{ fontSize: "1.05rem", color: "var(--text-secondary)" }}
              >
                {steps[currentStep].subtitle}
              </p>
            </div>
            {currentStep === steps.length - 1 && (
              <button
                onClick={onComplete}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  padding: 4,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 40 }}>{steps[currentStep].content}</div>

        {/* Footer */}
        <div
          style={{
            padding: "24px 40px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            background: "var(--bg-elevated)",
          }}
        >
          <button
            className="btn btnGhost"
            onClick={() =>
              currentStep > 0 ? setCurrentStep(currentStep - 1) : onComplete()
            }
            style={{ padding: "12px 24px" }}
          >
            {currentStep === 0 ? "Skip Tutorial" : "← Back"}
          </button>
          <button
            className="btn btnPrimary"
            onClick={() => {
              if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
              } else {
                onComplete();
              }
            }}
            disabled={!canProceed()}
            style={{ padding: "12px 32px" }}
          >
            {currentStep === steps.length - 1 ? "Go to Dashboard" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
