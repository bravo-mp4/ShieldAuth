import { useState } from "react";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";

export default function Downloads() {
  const sdks = [
    {
      name: "C++ SDK",
      version: "2.5.0",
      language: "C++",
      icon: "⚡",
      color: "#00599C",
      downloads: 12453,
      size: "2.4 MB",
      updated: "2025-01-28",
      downloadUrl: "/downloads/shieldvm-cpp-sdk-2.5.0.zip",
      docsUrl: "/docs/cpp",
    },
    {
      name: "C# SDK",
      version: "2.4.1",
      language: "C#",
      icon: "🟪",
      color: "#239120",
      downloads: 8921,
      size: "1.8 MB",
      updated: "2025-01-25",
      downloadUrl: "/downloads/shieldvm-csharp-sdk-2.4.1.zip",
      docsUrl: "/docs/csharp",
    },
    {
      name: "Python SDK",
      version: "2.3.0",
      language: "Python",
      icon: "🐍",
      color: "#3776AB",
      downloads: 5632,
      size: "1.2 MB",
      updated: "2025-01-20",
      downloadUrl: "/downloads/shieldvm-python-sdk-2.3.0.zip",
      docsUrl: "/docs/python",
    },
    {
      name: "Node.js SDK",
      version: "2.2.4",
      language: "Node.js",
      icon: "🟢",
      color: "#339933",
      downloads: 4215,
      size: "980 KB",
      updated: "2025-01-18",
      downloadUrl: "/downloads/shieldvm-nodejs-sdk-2.2.4.zip",
      docsUrl: "/docs/nodejs",
    },
  ];

  const tools = [
    {
      name: "ShieldVM Protector",
      version: "1.8.2",
      description: "Binary protection and obfuscation tool",
      icon: "🛡️",
      size: "45 MB",
      updated: "2025-01-30",
      platforms: ["Windows", "Linux"],
      downloadUrl: "/downloads/shieldvm-protector-1.8.2.exe",
    },
    {
      name: "License Generator CLI",
      version: "1.5.0",
      description: "Command-line tool for bulk license generation",
      icon: "⚙️",
      size: "12 MB",
      updated: "2025-01-22",
      platforms: ["Windows", "Linux", "macOS"],
      downloadUrl: "/downloads/license-gen-cli-1.5.0.zip",
    },
  ];

  const examples = [
    {
      name: "C++ Game Integration",
      description:
        "Complete example of integrating ShieldVM into a game client",
      language: "C++",
      githubUrl: "https://github.com/shieldvm/cpp-game-example",
    },
    {
      name: "C# WPF Application",
      description: "Desktop application with license validation",
      language: "C#",
      githubUrl: "https://github.com/shieldvm/csharp-wpf-example",
    },
    {
      name: "Python CLI Tool",
      description: "Command-line tool with license protection",
      language: "Python",
      githubUrl: "https://github.com/shieldvm/python-cli-example",
    },
  ];

  return (
    <div className="page">
      <TopBar title="Downloads" subtitle="SDKs, tools, and example projects" />

      {/* SDKs Section */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>
          SDKs
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {sdks.map((sdk) => (
            <div key={sdk.name} className="card" style={{ padding: 28 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: `${sdk.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8rem",
                  }}
                >
                  {sdk.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.2rem",
                      marginBottom: 4,
                    }}
                  >
                    {sdk.name}
                  </div>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    v{sdk.version}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.9rem",
                  }}
                >
                  <span className="muted">Size:</span>
                  <span>{sdk.size}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.9rem",
                  }}
                >
                  <span className="muted">Downloads:</span>
                  <span>{sdk.downloads.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.9rem",
                  }}
                >
                  <span className="muted">Updated:</span>
                  <span>{new Date(sdk.updated).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={sdk.downloadUrl}
                  className="btn btnPrimary"
                  style={{ flex: 1, textAlign: "center" }}
                >
                  ⬇️ Download
                </a>
                <a
                  href={sdk.docsUrl}
                  className="btn btnSecondary"
                  style={{ padding: "10px 16px" }}
                >
                  📚
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tools Section */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>
          Tools
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {tools.map((tool) => (
            <div key={tool.name} className="card" style={{ padding: 28 }}>
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 20 }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: "var(--bg-elevated)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                  }}
                >
                  {tool.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "1.3rem" }}>
                      {tool.name}
                    </div>
                    <span
                      style={{
                        padding: "4px 12px",
                        background: "var(--bg-elevated)",
                        borderRadius: 6,
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      v{tool.version}
                    </span>
                  </div>
                  <div className="muted" style={{ marginBottom: 12 }}>
                    {tool.description}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: "0.9rem",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span className="muted">Size:</span>
                      <span>{tool.size}</span>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span className="muted">Updated:</span>
                      <span>{new Date(tool.updated).toLocaleDateString()}</span>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span className="muted">Platforms:</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {tool.platforms.map((platform) => (
                          <span
                            key={platform}
                            style={{
                              padding: "2px 8px",
                              background: "var(--bg-elevated)",
                              borderRadius: 4,
                              fontSize: "0.8rem",
                            }}
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <a href={tool.downloadUrl} className="btn btnPrimary">
                    ⬇️ Download
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example Projects Section */}
      <div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>
          Example Projects
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {examples.map((example) => (
            <div key={example.name} className="card" style={{ padding: 28 }}>
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1.15rem",
                    marginBottom: 8,
                  }}
                >
                  {example.name}
                </div>
                <div
                  className="muted"
                  style={{ fontSize: "0.95rem", marginBottom: 12 }}
                >
                  {example.description}
                </div>
                <span
                  style={{
                    padding: "4px 12px",
                    background: "var(--primary-bg)",
                    color: "var(--primary)",
                    borderRadius: 6,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  {example.language}
                </span>
              </div>
              <a
                href={example.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btnSecondary"
                style={{ width: "100%", textAlign: "center" }}
              >
                🔗 View on GitHub
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* System Requirements */}
      <div className="card" style={{ padding: 32, marginTop: 48 }}>
        <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 20 }}>
          System Requirements
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 24,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>C++ SDK</div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                color: "var(--text-secondary)",
                lineHeight: 1.8,
              }}
            >
              <li>Visual Studio 2019 or later</li>
              <li>C++17 or later</li>
              <li>Windows 10/11, Linux (Ubuntu 20.04+)</li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>C# SDK</div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                color: "var(--text-secondary)",
                lineHeight: 1.8,
              }}
            >
              <li>.NET Framework 4.7.2+ or .NET 6+</li>
              <li>Windows 10/11</li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Python SDK</div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                color: "var(--text-secondary)",
                lineHeight: 1.8,
              }}
            >
              <li>Python 3.7 or later</li>
              <li>pip package manager</li>
              <li>Cross-platform</li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Node.js SDK</div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                color: "var(--text-secondary)",
                lineHeight: 1.8,
              }}
            >
              <li>Node.js 14 or later</li>
              <li>npm or yarn</li>
              <li>Cross-platform</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
