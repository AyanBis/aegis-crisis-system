import Card from "../common/Card";
import { useApp } from "../../context/AppContext";

const levelColor = {
  critical: "var(--danger)",
  success: "var(--success)",
  info: "var(--muted)",
};

const ExecutionLog = () => {
  const { executionLog } = useApp();

  return (
    <Card title="Execution Log">
      <div style={{ display: "grid", gap: "8px", maxHeight: "240px", overflow: "auto" }}>
        {executionLog.map((entry) => (
          <div
            key={entry.id}
            style={{
              borderLeft: `2px solid ${levelColor[entry.level] || "var(--border)"}`,
              paddingLeft: "8px",
            }}
          >
            <div style={{ fontSize: "13px" }}>{entry.message}</div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>{entry.time}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ExecutionLog;
