export function StatusBadge({ status, children }) {
  const styles = {
    active: {
      background: "var(--success-bg)",
      color: "var(--success)",
      border: "1px solid var(--success)",
    },
    expired: {
      background: "var(--error-bg)",
      color: "var(--error)",
      border: "1px solid var(--error)",
    },
    banned: {
      background: "var(--error-bg)",
      color: "var(--error)",
      border: "1px solid var(--error)",
    },
    disabled: {
      background: "var(--bg-elevated)",
      color: "var(--text-muted)",
      border: "1px solid var(--border)",
    },
    pending: {
      background: "var(--warning-bg)",
      color: "var(--warning)",
      border: "1px solid var(--warning)",
    },
  };

  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: "6px",
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        display: "inline-block",
        ...styles[status],
      }}
    >
      {children || status}
    </span>
  );
}

export function IconBadge({ icon, color = "var(--primary)" }) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.5rem",
      }}
    >
      {icon}
    </div>
  );
}
