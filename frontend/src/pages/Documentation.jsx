import { useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, Zap, Lightbulb, Circle, Wrench, Webhook } from "lucide-react";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [activeSdk, setActiveSdk] = useState("cpp");

  const sections = [
    { id: "getting-started", title: "Getting Started", icon: <Rocket size={20} /> },
    { id: "cpp-sdk", title: "C++ SDK", icon: <Zap size={20} /> },
    { id: "csharp-sdk", title: "C# SDK", icon: "🟪" },
    { id: "python-sdk", title: "Python SDK", icon: "🐍" },
    { id: "nodejs-sdk", title: "Node.js SDK", icon: <Circle size={20} className="text-success" /> },
    { id: "api-reference", title: "API Reference", icon: <Wrench size={20} /> },
    { id: "webhooks", title: "Webhooks", icon: <Webhook size={20} /> },
    { id: "examples", title: "Examples", icon: <Lightbulb size={20} /> },
  ];

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <PublicNav />

      <div style={{ flex: 1, display: "flex" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 280,
            background: "var(--bg-elevated)",
            borderRight: "1px solid var(--border)",
            padding: "32px 0",
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
          }}
        >
          <div style={{ padding: "0 24px", marginBottom: 32 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              Documentation
            </h2>
          </div>

          <nav>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  width: "100%",
                  padding: "12px 24px",
                  background:
                    activeSection === section.id
                      ? "var(--primary-bg)"
                      : "transparent",
                  border: "none",
                  borderLeft:
                    activeSection === section.id
                      ? "3px solid var(--primary)"
                      : "3px solid transparent",
                  color:
                    activeSection === section.id
                      ? "var(--primary)"
                      : "var(--text-primary)",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontWeight: activeSection === section.id ? 600 : 400,
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{section.icon}</span>
                {section.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            padding: "48px 64px",
            maxWidth: 1000,
          }}
        >
          {activeSection === "getting-started" && (
            <div>
              <h1
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Getting Started
              </h1>
              <p
                className="muted"
                style={{ fontSize: "1.1rem", marginBottom: 48 }}
              >
                Learn how to integrate ShieldVM into your application in minutes
              </p>

              <section style={{ marginBottom: 48 }}>
                <h2
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    marginBottom: 16,
                  }}
                >
                  1. Create an Application
                </h2>
                <p style={{ marginBottom: 16 }}>
                  First, create an application in your dashboard to get your App
                  ID and Secret.
                </p>
                <div
                  className="card"
                  style={{ padding: 24, background: "var(--bg-elevated)" }}
                >
                  <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                    <li>
                      Navigate to the{" "}
                      <Link to="/apps" style={{ color: "var(--primary)" }}>
                        Applications
                      </Link>{" "}
                      page
                    </li>
                    <li>Click "Create Application"</li>
                    <li>Enter a name and configure settings</li>
                    <li>Copy your App ID and Secret</li>
                  </ol>
                </div>
              </section>

              <section style={{ marginBottom: 48 }}>
                <h2
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    marginBottom: 16,
                  }}
                >
                  2. Download SDK
                </h2>
                <p style={{ marginBottom: 16 }}>
                  Choose your programming language and download the appropriate
                  SDK.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 12,
                  }}
                >
                  {["C++", "C#", "Python", "Node.js"].map((lang) => (
                    <Link
                      key={lang}
                      to="/downloads"
                      className="card"
                      style={{
                        padding: 20,
                        textAlign: "center",
                        textDecoration: "none",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{lang}</div>
                    </Link>
                  ))}
                </div>
              </section>

              <section style={{ marginBottom: 48 }}>
                <h2
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    marginBottom: 16,
                  }}
                >
                  3. Integrate into Your App
                </h2>
                <p style={{ marginBottom: 16 }}>
                  Add a few lines of code to validate licenses in your
                  application.
                </p>
                <pre
                  style={{
                    background: "var(--bg)",
                    padding: 24,
                    borderRadius: 12,
                    overflow: "auto",
                    border: "1px solid var(--border)",
                  }}
                >
                  {`#include "shieldauth.h"

int main() {
    // Initialize with your App ID
    ShieldAuth::Initialize("your_app_id");
    
    // Validate license
    std::string license_key;
    std::cout << "Enter license key: ";
    std::cin >> license_key;
    
    if (ShieldAuth::Validate(license_key)) {
        std::cout << "License valid! Starting application..." << std::endl;
        // Continue with your application
    } else {
        std::cout << "Invalid license!" << std::endl;
        return 1;
    }
    
    return 0;
}`}
                </pre>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    marginBottom: 16,
                  }}
                >
                  Next Steps
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: 16,
                  }}
                >
                  <button
                    onClick={() => setActiveSection("cpp-sdk")}
                    className="card"
                    style={{
                      padding: 24,
                      textAlign: "left",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>
                      📖
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      SDK Documentation
                    </div>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      Explore detailed SDK guides
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveSection("api-reference")}
                    className="card"
                    style={{
                      padding: 24,
                      textAlign: "left",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>
                      🔧
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      API Reference
                    </div>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      Complete API documentation
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveSection("examples")}
                    className="card"
                    style={{
                      padding: 24,
                      textAlign: "left",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>
                      💡
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      Examples
                    </div>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      View example projects
                    </div>
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeSection === "cpp-sdk" && (
            <div>
              <h1
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                C++ SDK
              </h1>
              <p
                className="muted"
                style={{ fontSize: "1.1rem", marginBottom: 48 }}
              >
                High-performance C++ SDK for Windows and Linux applications
              </p>

              <section style={{ marginBottom: 48 }}>
                <h2
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    marginBottom: 16,
                  }}
                >
                  Installation
                </h2>
                <p style={{ marginBottom: 16 }}>
                  Download and extract the SDK, then add it to your project.
                </p>
                <pre
                  style={{
                    background: "var(--bg)",
                    padding: 24,
                    borderRadius: 12,
                    overflow: "auto",
                    border: "1px solid var(--border)",
                  }}
                >
                  {`// Add to your CMakeLists.txt
include_directories(\${PROJECT_SOURCE_DIR}/shieldvm/include)
link_directories(\${PROJECT_SOURCE_DIR}/shieldvm/lib)
target_link_libraries(your_project shieldauth)`}
                </pre>
              </section>

              <section style={{ marginBottom: 48 }}>
                <h2
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    marginBottom: 16,
                  }}
                >
                  API Reference
                </h2>
                <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    ShieldAuth::Initialize()
                  </h3>
                  <p className="muted" style={{ marginBottom: 16 }}>
                    Initialize the ShieldVM SDK with your application ID.
                  </p>
                  <pre
                    style={{
                      background: "var(--bg)",
                      padding: 16,
                      borderRadius: 8,
                      overflow: "auto",
                    }}
                  >
                    {`bool ShieldAuth::Initialize(const std::string& app_id);`}
                  </pre>
                </div>

                <div className="card" style={{ padding: 24 }}>
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    ShieldAuth::Validate()
                  </h3>
                  <p className="muted" style={{ marginBottom: 16 }}>
                    Validate a license key and return true if valid.
                  </p>
                  <pre
                    style={{
                      background: "var(--bg)",
                      padding: 16,
                      borderRadius: 8,
                      overflow: "auto",
                    }}
                  >
                    {`bool ShieldAuth::Validate(const std::string& license_key);`}
                  </pre>
                </div>
              </section>
            </div>
          )}

          {activeSection === "api-reference" && (
            <div>
              <h1
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                API Reference
              </h1>
              <p
                className="muted"
                style={{ fontSize: "1.1rem", marginBottom: 48 }}
              >
                Complete REST API documentation for ShieldVM
              </p>

              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    marginBottom: 16,
                  }}
                >
                  Base URL
                </h3>
                <code
                  style={{
                    padding: "8px 16px",
                    background: "var(--bg)",
                    borderRadius: 8,
                    display: "inline-block",
                  }}
                >
                  https://api.shieldvm.com/v1
                </code>
              </div>

              <section style={{ marginBottom: 48 }}>
                <h2
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    marginBottom: 24,
                  }}
                >
                  Authentication
                </h2>
                <p style={{ marginBottom: 16 }}>
                  All API requests require authentication using your API key in
                  the Authorization header.
                </p>
                <pre
                  style={{
                    background: "var(--bg)",
                    padding: 24,
                    borderRadius: 12,
                    overflow: "auto",
                    border: "1px solid var(--border)",
                  }}
                >
                  {`Authorization: Bearer YOUR_API_KEY`}
                </pre>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    marginBottom: 24,
                  }}
                >
                  Endpoints
                </h2>

                {[
                  {
                    method: "POST",
                    endpoint: "/licenses/validate",
                    desc: "Validate a license key",
                    color: "var(--success)",
                  },
                  {
                    method: "POST",
                    endpoint: "/licenses",
                    desc: "Create a new license",
                    color: "var(--success)",
                  },
                  {
                    method: "GET",
                    endpoint: "/licenses",
                    desc: "List all licenses",
                    color: "var(--primary)",
                  },
                  {
                    method: "DELETE",
                    endpoint: "/licenses/:id",
                    desc: "Delete a license",
                    color: "var(--error)",
                  },
                ].map((endpoint, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{ padding: 24, marginBottom: 16 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 12px",
                          background: `${endpoint.color}20`,
                          color: endpoint.color,
                          borderRadius: 6,
                          fontSize: "0.85rem",
                          fontWeight: 700,
                        }}
                      >
                        {endpoint.method}
                      </span>
                      <code
                        style={{ fontFamily: "monospace", fontSize: "1.1rem" }}
                      >
                        {endpoint.endpoint}
                      </code>
                    </div>
                    <p className="muted">{endpoint.desc}</p>
                  </div>
                ))}
              </section>
            </div>
          )}

          {activeSection === "examples" && (
            <div>
              <h1
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Examples
              </h1>
              <p
                className="muted"
                style={{ fontSize: "1.1rem", marginBottom: 48 }}
              >
                Browse example projects and code snippets
              </p>

              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>💡</div>
                <div className="cardTitle" style={{ marginBottom: 8 }}>
                  Example projects coming soon
                </div>
                <div className="muted" style={{ marginBottom: 24 }}>
                  Check back later for complete example implementations
                </div>
                <Link to="/downloads" className="btn btnPrimary">
                  View Downloads
                </Link>
              </div>
            </div>
          )}

          {/* Other sections show placeholder */}
          {![
            "getting-started",
            "cpp-sdk",
            "api-reference",
            "examples",
          ].includes(activeSection) && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>📖</div>
              <div className="cardTitle" style={{ marginBottom: 8 }}>
                Documentation coming soon
              </div>
              <div className="muted">
                This section is currently under development
              </div>
            </div>
          )}
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}
