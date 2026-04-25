import { useApp } from "../../context/AppContext";

const SunIcon = ({ active }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={{ opacity: active ? 1 : 0.55, transition: "opacity 0.25s ease" }}
  >
    <circle cx="12" cy="12" r="4" fill="#f6c453" />
    <g stroke="#f6c453" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2.5V5" />
      <path d="M12 19v2.5" />
      <path d="M2.5 12H5" />
      <path d="M19 12h2.5" />
      <path d="M5.2 5.2l1.8 1.8" />
      <path d="M17 17l1.8 1.8" />
      <path d="M18.8 5.2L17 7" />
      <path d="M7 17l-1.8 1.8" />
    </g>
  </svg>
);

const MoonIcon = ({ active }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={{ opacity: active ? 1 : 0.55, transition: "opacity 0.25s ease" }}
  >
    <path
      d="M14.5 3.2a8.8 8.8 0 1 0 6.3 15.2 9.8 9.8 0 1 1-6.3-15.2Z"
      fill="#8fb8ff"
    />
  </svg>
);

const Header = () => {
  const { theme, toggleTheme } = useApp();
  const isLight = theme === "light";

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
      <h3>Aegis</h3>

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
            borderRadius: "999px",
            padding: "4px",
            cursor: "pointer",
            boxShadow: "var(--shadow-soft)",
            width: "78px",
            height: "42px",
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "background 0.25s ease, border-color 0.25s ease",
          }}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <span
            aria-hidden="true"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 8px",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: isLight ? "4px" : "calc(100% - 34px)",
                transform: "translateY(-50%)",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: isLight ? "rgba(246, 196, 83, 0.18)" : "rgba(143, 184, 255, 0.2)",
                border: `1px solid ${isLight ? "rgba(246, 196, 83, 0.35)" : "rgba(143, 184, 255, 0.35)"}`,
                boxShadow: "var(--shadow-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "left 0.25s ease, background 0.25s ease, border-color 0.25s ease",
              }}
            >
              {isLight ? <SunIcon active /> : <MoonIcon active />}
            </span>
            <SunIcon active={isLight} />
            <MoonIcon active={!isLight} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default Header;
