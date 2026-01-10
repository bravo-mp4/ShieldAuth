import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface BlogPost {
  post_id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_emoji: string;
  category: string;
  read_time_minutes: number;
  published_at: string;
  views: number;
  likes: number;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "Company", "Tutorial", "Security", "General"];

  useEffect(() => {
    loadBlogPosts();
  }, [selectedCategory]);

  const loadBlogPosts = async () => {
    try {
      setLoading(true);

      // Fetch featured post
      const featuredResponse = await axios.get(
        `${API_BASE_URL}/api/v1/public/blog?featured=true&limit=1`
      );
      if (featuredResponse.data.posts.length > 0) {
        setFeaturedPost(featuredResponse.data.posts[0]);
      }

      // Fetch regular posts
      const params: any = { limit: 9 };
      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      const response = await axios.get(`${API_BASE_URL}/api/v1/public/blog`, {
        params,
      });

      setPosts(response.data.posts);
    } catch (error) {
      console.error("Failed to load blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
          style={{ fontSize: "1.1rem", textAlign: "center", marginBottom: 40 }}
        >
          News, tutorials, and insights from the ShieldAuth team
        </p>

        {/* Category Filter */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginBottom: 60,
            flexWrap: "wrap",
          }}
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: "8px 20px",
                background:
                  selectedCategory === category
                    ? "var(--primary)"
                    : "var(--bg-elevated)",
                color:
                  selectedCategory === category ? "white" : "var(--text-primary)",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
                textTransform: "capitalize",
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div
              style={{ fontSize: "2rem", marginBottom: 16, color: "var(--text-muted)" }}
            >
              Loading...
            </div>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
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
                    {featuredPost.featured_emoji}
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
                      style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        marginBottom: 12,
                      }}
                    >
                      {featuredPost.title}
                    </h2>
                    <p
                      className="muted"
                      style={{ fontSize: "1.1rem", marginBottom: 16 }}
                    >
                      {featuredPost.excerpt}
                    </p>
                    <div
                      style={{ display: "flex", gap: 16, alignItems: "center" }}
                    >
                      <span className="muted" style={{ fontSize: "0.9rem" }}>
                        {formatDate(featuredPost.published_at)}
                      </span>
                      <span className="muted" style={{ fontSize: "0.9rem" }}>
                        •
                      </span>
                      <span className="muted" style={{ fontSize: "0.9rem" }}>
                        {featuredPost.read_time_minutes} min read
                      </span>
                      <span className="muted" style={{ fontSize: "0.9rem" }}>
                        •
                      </span>
                      <span className="muted" style={{ fontSize: "0.9rem" }}>
                        {featuredPost.views.toLocaleString()} views
                      </span>
                      <Link
                        to={`/blog/${featuredPost.slug}`}
                        className="btn btnPrimary"
                        style={{ marginLeft: "auto" }}
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Posts */}
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 32 }}
            >
              Recent Posts
            </h2>

            {posts.length === 0 ? (
              <div
                className="card"
                style={{ padding: 60, textAlign: "center" }}
              >
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>📝</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 8 }}>
                  No posts yet
                </div>
                <div className="muted">
                  Check back soon for new content!
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 24,
                }}
              >
                {posts.map((post) => (
                  <Link
                    key={post.post_id}
                    to={`/blog/${post.slug}`}
                    className="card"
                    style={{
                      padding: 24,
                      display: "flex",
                      flexDirection: "column",
                      textDecoration: "none",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
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
                        color: "var(--text-primary)",
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
                      <span className="muted">
                        {formatDate(post.published_at)}
                      </span>
                      <span className="muted">•</span>
                      <span className="muted">
                        {post.read_time_minutes} min
                      </span>
                      <span className="muted">•</span>
                      <span className="muted">
                        {post.views} views
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "var(--primary)",
                          fontWeight: 600,
                        }}
                      >
                        Read →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
