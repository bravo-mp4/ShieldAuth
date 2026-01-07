export default function EmptyState({ icon, title, description, action }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "80px 20px",
        maxWidth: 400,
        margin: "0 auto",
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: "3rem",
            marginBottom: 16,
            opacity: 0.4,
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 8,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="muted"
          style={{
            fontSize: "0.9rem",
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
