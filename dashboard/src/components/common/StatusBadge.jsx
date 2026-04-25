const StatusBadge = ({ status }) => {
  const colors = {
    HIGH: { background: "var(--danger-soft)", color: "var(--danger)", border: "rgba(220, 76, 76, 0.35)" },
    MEDIUM: { background: "var(--warning-soft)", color: "var(--warning)", border: "rgba(217, 145, 23, 0.35)" },
    LOW: { background: "var(--success-soft)", color: "var(--success)", border: "rgba(47, 158, 95, 0.35)" },
    ACTIVE: { background: "var(--accent)", color: "#f8fbff", border: "transparent" },
    IN_PROGRESS: { background: "rgba(255, 209, 102, 0.18)", color: "#c78b10", border: "rgba(255, 209, 102, 0.32)" },
    RESOLVED: { background: "rgba(138, 215, 166, 0.18)", color: "#2f9e5f", border: "rgba(138, 215, 166, 0.32)" },
  };
  const appearance = colors[status] || {
    background: "var(--surface-raised)",
    color: "var(--text)",
    border: "var(--border)",
  };

  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        background: appearance.background,
        color: appearance.color,
        fontWeight: 700,
        border: `1px solid ${appearance.border}`,
      }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
