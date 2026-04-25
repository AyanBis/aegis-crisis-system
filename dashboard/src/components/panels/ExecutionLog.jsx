import Card from "../common/Card";
import { useApp } from "../../context/AppContext";

const levelAppearance = {
  critical: {
    border: "var(--danger)",
    badgeBg: "var(--danger-soft)",
    badgeText: "var(--danger)",
    label: "Critical",
  },
  success: {
    border: "var(--success)",
    badgeBg: "var(--success-soft)",
    badgeText: "var(--success)",
    label: "Success",
  },
  info: {
    border: "var(--accent)",
    badgeBg: "var(--accent-soft)",
    badgeText: "var(--accent-strong)",
    label: "Info",
  },
};

const ExecutionLog = () => {
  const { executionLog } = useApp();

  return (
    <Card
      title="Execution Log"
      subtitle="Session activity and handoff events, newest first."
    >
      <div
        className="panel-section scroll-area"
        style={{
          maxHeight: "360px",
          background: "linear-gradient(180deg, #07111d, #0a1421)",
          borderColor: "rgba(143, 184, 255, 0.18)",
        }}
      >
        <div className="stack-md">
          {executionLog.map((entry) => {
            const appearance = levelAppearance[entry.level] || levelAppearance.info;

            return (
              <div
                key={entry.id}
                style={{
                  borderLeft: `3px solid ${appearance.border}`,
                  paddingLeft: "12px",
                  paddingBottom: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "999px",
                      background: appearance.badgeBg,
                      color: appearance.badgeText,
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {appearance.label}
                  </span>
                  <span style={{ fontSize: "11px", color: "#7f8fa6" }}>{entry.time}</span>
                </div>
                <div style={{ fontSize: "13px", color: "#dce6f4", marginTop: "8px" }}>
                  {entry.message}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default ExecutionLog;
