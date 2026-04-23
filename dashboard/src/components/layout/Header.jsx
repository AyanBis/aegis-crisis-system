import { useApp } from "../../context/AppContext";

const Header = () => {
  const { theme, toggleTheme } = useApp();

  return (
    <div
      style={{
        background: "var(--card)",
        padding: "14px 20px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h3>Aegis Dashboard</h3>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ color: "var(--muted)" }}>
          Temp: 78°C | Load: 65% | Network: Stable
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            borderRadius: "999px",
            padding: "8px 14px",
            cursor: "pointer",
            minWidth: "122px",
            fontWeight: 600,
            boxShadow: "var(--shadow-soft)",
          }}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </div>
    </div>
  );
};

export default Header;
