const Card = ({ title, children }) => {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px",
        height: "100%",
        boxShadow: "var(--shadow)",
      }}
    >
      {title && (
        <h4 style={{ marginBottom: "10px", color: "var(--muted)" }}>
          {title}
        </h4>
      )}
      {children}
    </div>
  );
};

export default Card;
