export default function Loader({ size = "md", inline = false }) {
  const sizes = {
    sm: 16,
    md: 32,
    lg: 48,
  };

  const spinnerSize = sizes[size];

  const Spinner = (
    <div
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `3px solid var(--border)`,
        borderTop: `3px solid var(--primary)`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );

  if (inline) {
    return Spinner;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      {Spinner}
    </div>
  );
}
