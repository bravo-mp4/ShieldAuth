import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

interface BlogPost {
  post_id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_emoji: string;
  author_email: string;
  category: string;
  read_time_minutes: number;
  published_at: string;
  views: number;
  likes: number;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);

  useEffect(() => {
    loadPost();
  }, [slug]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/v1/public/blog/${slug}`
      );
      setPost(response.data);
      setLocalLikes(response.data.likes);
    } catch (error) {
      console.error("Failed to load blog post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (liked) return;

    try {
      await axios.post(`/api/v1/public/blog/${slug}/like`);
      setLiked(true);
      setLocalLikes((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <PublicNav />
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", color: "var(--text-muted)" }}>
            Loading...
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <PublicNav />
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: 24 }}>😔</div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>
            Post Not Found
          </h1>
          <p className="muted" style={{ marginBottom: 32 }}>
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/blog" className="btn btnPrimary">
            ← Back to Blog
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicNav />

      <article
        style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px" }}
      >
        {/* Breadcrumb */}
        <div style={{ marginBottom: 32 }}>
          <Link
            to="/blog"
            style={{
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            ← Back to Blog
          </Link>
        </div>

        {/* Category Badge */}
        <div
          style={{
            display: "inline-block",
            padding: "6px 16px",
            background: "var(--primary-bg)",
            color: "var(--primary)",
            borderRadius: 6,
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          {post.category}
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 800,
            marginBottom: 24,
            lineHeight: 1.2,
          }}
        >
          <span style={{ fontSize: "3.5rem", marginRight: 16 }}>
            {post.featured_emoji}
          </span>
          {post.title}
        </h1>

        {/* Meta Info */}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginBottom: 48,
            paddingBottom: 24,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span className="muted">{formatDate(post.published_at)}</span>
          <span className="muted">•</span>
          <span className="muted">{post.read_time_minutes} min read</span>
          <span className="muted">•</span>
          <span className="muted">{post.views.toLocaleString()} views</span>
          <button
            onClick={handleLike}
            disabled={liked}
            style={{
              marginLeft: "auto",
              padding: "8px 16px",
              background: liked ? "var(--success-bg)" : "var(--bg-elevated)",
              color: liked ? "var(--success)" : "var(--text-primary)",
              border: "none",
              borderRadius: 6,
              cursor: liked ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {liked ? "❤️" : "🤍"} {localLikes}
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            fontSize: "1.1rem",
            lineHeight: 1.8,
            color: "var(--text-primary)",
          }}
        >
          {post.content.split("\n\n").map((paragraph, idx) => {
            // Check if paragraph is a heading
            if (paragraph.startsWith("## ")) {
              return (
                <h2
                  key={idx}
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    marginTop: 48,
                    marginBottom: 24,
                  }}
                >
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }

            // Check if paragraph is a subheading
            if (paragraph.startsWith("### ")) {
              return (
                <h3
                  key={idx}
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    marginTop: 32,
                    marginBottom: 16,
                  }}
                >
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }

            // Check if paragraph is bold
            if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
              return (
                <p
                  key={idx}
                  style={{
                    fontWeight: 700,
                    marginBottom: 16,
                    fontSize: "1.15rem",
                  }}
                >
                  {paragraph.replace(/\*\*/g, "")}
                </p>
              );
            }

            // Regular paragraph
            return (
              <p key={idx} style={{ marginBottom: 24 }}>
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* CTA Section */}
        <div
          className="card"
          style={{
            padding: 40,
            marginTop: 60,
            textAlign: "center",
            background: "var(--primary-bg)",
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: 16,
              color: "var(--primary)",
            }}
          >
            Ready to protect your software?
          </h3>
          <p className="muted" style={{ marginBottom: 24 }}>
            Get started with ShieldAuth today. Free plan available, no credit
            card required.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <Link to="/signup" className="btn btnPrimary">
              Start Free Trial
            </Link>
            <Link to="/pricing" className="btn btnSecondary">
              View Pricing
            </Link>
          </div>
        </div>

        {/* Back to Blog */}
        <div style={{ marginTop: 60, textAlign: "center" }}>
          <Link
            to="/blog"
            style={{
              color: "var(--primary)",
              textDecoration: "none",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            ← Read More Articles
          </Link>
        </div>
      </article>

      <PublicFooter />
    </div>
  );
}
