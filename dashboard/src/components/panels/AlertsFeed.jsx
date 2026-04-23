import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { useApp } from "../../context/AppContext";

const AlertsFeed = () => {
  const { incidents, setSelectedIncident } = useApp();

  const highPriorityOpenIncidents = incidents.filter(
    (incident) => incident.priority === "HIGH" && incident.status !== "RESOLVED",
  );

  return (
    <Card title="Alerts Feed">
      <div style={{ display: "grid", gap: "8px" }}>
        {highPriorityOpenIncidents.map((incident) => (
          <button
            key={incident.id}
            type="button"
            onClick={() => setSelectedIncident(incident)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--alert-surface)",
              color: "var(--text)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{incident.type}</strong>
              <StatusBadge status={incident.priority} />
            </div>
            <div style={{ marginTop: "4px", color: "var(--muted)", fontSize: "12px" }}>
              {incident.location}
            </div>
          </button>
        ))}

        {highPriorityOpenIncidents.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>
            No active high-priority alerts.
          </p>
        )}
      </div>
    </Card>
  );
};

export default AlertsFeed;
