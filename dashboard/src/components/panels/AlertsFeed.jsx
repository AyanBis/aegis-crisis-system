import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { useApp } from "../../context/AppContext";

const AlertsFeed = () => {
  const { incidents, setSelectedIncident } = useApp();

  const highPriorityOpenIncidents = incidents.filter(
    (incident) => incident.priority === "HIGH" && incident.status !== "RESOLVED",
  );

  return (
    <Card
      title="Alerts Feed"
      subtitle="Escalated items stay visible here for fast handoff and re-focus."
    >
      <div className="stack-lg">
        <div className="soft-pill" style={{ width: "fit-content" }}>
          <span className="status-dot" style={{ background: "var(--danger)" }} />
          <span>
            Critical alerts in queue <strong>{highPriorityOpenIncidents.length}</strong>
          </span>
        </div>

        <div className="stack-md">
          {highPriorityOpenIncidents.map((incident) => (
            <button
              key={incident.id}
              type="button"
              onClick={() => setSelectedIncident(incident)}
              style={{
                padding: "14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(220, 76, 76, 0.2)",
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--danger-soft) 100%, transparent), var(--surface))",
                color: "var(--text)",
                textAlign: "left",
                cursor: "pointer",
                display: "grid",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div>
                  <strong style={{ fontSize: "1.05rem" }}>{incident.type}</strong>
                  <div style={{ marginTop: "4px", color: "var(--muted)", fontSize: "12px" }}>
                    {incident.location}
                  </div>
                </div>
                <StatusBadge status={incident.priority} />
              </div>

              <div className="inline-wrap">
                <div className="soft-pill" style={{ padding: "6px 10px" }}>
                  Status <strong>{incident.status}</strong>
                </div>
                <div className="soft-pill" style={{ padding: "6px 10px" }}>
                  Confidence <strong>{incident.confidence}%</strong>
                </div>
              </div>
            </button>
          ))}

          {highPriorityOpenIncidents.length === 0 && (
            <div className="panel-section panel-section--dashed" style={{ color: "var(--muted)" }}>
              No active high-priority alerts.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AlertsFeed;
