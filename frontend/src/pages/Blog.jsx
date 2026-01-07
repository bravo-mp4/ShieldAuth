import { Link } from "react-router-dom";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function Blog() {
  const featuredPost = {
    title: "Introducing VM Protection",
    excerpt:
      "Take your binary protection to the next level with our new VM-based obfuscation system...",
    date: "Jan 5, 2026",
    readTime: "5 min read",
    image: "🛡️",
  };

  const posts = [
    {
      title: "Building Secure Software: Best Practices",
      excerpt:
        "Learn the essential security practices every developer should follow...",
      date: "Jan 3, 2026",
      readTime: "8 min read",
      category: "Security",
    },
    {
      title: "How HWID Locking Works",
      excerpt: "A deep dive into hardware ID locking and why it's effective...",
      date: "Dec 30, 2025",
      readTime: "6 min read",
      category: "Tutorial",
    },
    {
      title: "ShieldAuth 2025 Year in Review",
      excerpt: "Looking back at an amazing year of growth and new features...",
      date: "Dec 28, 2025",
      readTime: "4 min read",
      category: "Company",
    },
  ];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicNav />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 800,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Blog
        </h1>
        <p
          className="muted"
          style={{ fontSize: "1.1rem", textAlign: "center", marginBottom: 60 }}
        >
          News, tutorials, and insights from the ShieldAuth team
        </p>

        {/* Featured Post */}
        <div className="card" style={{ padding: 40, marginBottom: 60 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: 40,
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "8rem", textAlign: "center" }}>
              {featuredPost.image}
            </div>
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: 4,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                FEATURED
              </div>
              <h2
                style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 12 }}
              >
                {featuredPost.title}
              </h2>
              <p
                className="muted"
                style={{ fontSize: "1.1rem", marginBottom: 16 }}
              >
                {featuredPost.excerpt}
              </p>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span className="muted" style={{ fontSize: "0.9rem" }}>
                  {featuredPost.date}
                </span>
                <span className="muted" style={{ fontSize: "0.9rem" }}>
                  •
                </span>
                <span className="muted" style={{ fontSize: "0.9rem" }}>
                  {featuredPost.readTime}
                </span>
                <button
                  className="btn btnPrimary"
                  style={{ marginLeft: "auto" }}
                >
                  Read More →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 32 }}>
          Recent Posts
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          {posts.map((post, idx) => (
            <div
              key={idx}
              className="card"
              style={{ padding: 24, display: "flex", flexDirection: "column" }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  background: "var(--bg-elevated)",
                  color: "var(--primary)",
                  borderRadius: 4,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  alignSelf: "flex-start",
                }}
              >
                {post.category}
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                {post.title}
              </h3>
              <p
                className="muted"
                style={{ fontSize: "0.95rem", marginBottom: 16, flex: 1 }}
              >
                {post.excerpt}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  fontSize: "0.85rem",
                }}
              >
                <span className="muted">{post.date}</span>
                <span className="muted">•</span>
                <span className="muted">{post.readTime}</span>
                <Link
                  to="#"
                  style={{
                    marginLeft: "auto",
                    color: "var(--primary)",
                    fontWeight: 600,
                  }}
                >
                  Read →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
