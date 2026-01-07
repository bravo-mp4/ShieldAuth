export default function StatCard({ title, value, subtitle, icon, trend }) {
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: 12,
        }}
      >
        <div
          className="muted"
          style={{ fontSize: "0.875rem", fontWeight: 500 }}
        >
          {title}
        </div>
        {icon && <div style={{ fontSize: "1.5rem", opacity: 0.7 }}>{icon}</div>}
      </div>

      <div className="metricValue" style={{ marginBottom: 8 }}>
        {value}
      </div>

      {subtitle && (
        <div className="muted" style={{ fontSize: "0.8rem" }}>
          {subtitle}
        </div>
      )}

      {trend && (
        <div
          style={{
            marginTop: 8,
            fontSize: "0.8rem",
            fontWeight: 600,
            color: trend > 0 ? "var(--success)" : "var(--error)",
          }}
        >
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
