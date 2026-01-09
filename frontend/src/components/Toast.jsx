import { useEffect } from "react";

export default function Toast({
  message,
  type = "info",
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: {
      background: "var(--success-bg)",
      border: "1px solid var(--success)",
      color: "var(--success)",
    },
    error: {
      background: "var(--error-bg)",
      border: "1px solid var(--error)",
      color: "var(--error)",
    },
    warning: {
      background: "var(--warning-bg)",
      border: "1px solid var(--warning)",
      color: "var(--warning)",
    },
    info: {
      background: "var(--info-bg)",
      border: "1px solid var(--info)",
      color: "var(--info)",
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        minWidth: 300,
        maxWidth: 500,
        padding: "16px 20px",
        borderRadius: 12,
        ...typeStyles[type],
        boxShadow: "var(--shadow-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        animation: "slideInRight 0.3s ease",
      }}
    >
      <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            fontSize: "1.2rem",
            padding: 0,
            opacity: 0.7,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.target.style.opacity = "1")}
          onMouseLeave={(e) => (e.target.style.opacity = "0.7")}
        >
          ×
        </button>
      )}
    </div>
  );
}
