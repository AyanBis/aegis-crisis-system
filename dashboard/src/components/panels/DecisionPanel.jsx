import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { useApp } from "../../context/AppContext";

const DecisionPanel = () => {
  const { selectedIncident, setIncidentStatus, resolveIncident } = useApp();

  if (!selectedIncident) {
    return (
      <Card title="Decision Panel">
        <p>Select an incident to view recommendations and actions.</p>
      </Card>
    );
  }

  const getActions = () => {
    switch (selectedIncident.type) {
      case "Fire":
        return ["Dispatch Fire Unit", "Alert Hospitals", "Evacuate Area"];
      case "Medical":
        return ["Send Ambulance", "Notify Medical Staff"];
      case "Security":
        return ["Dispatch Security Team", "Lock Nearby Access Points"];
      default:
        return ["Monitor Situation"];
    }
  };

  const getResponders = () => {
    if (selectedIncident.type === "Fire") {
      return ["Fire Dept", "Police", "Ambulance"];
    }

    if (selectedIncident.type === "Security") {
      return ["Security Ops", "Police"];
    }

    return ["Medical Team"];
  };

  const isResolved = selectedIncident.status === "RESOLVED";
  const isInProgress = selectedIncident.status === "IN_PROGRESS";

  return (
    <Card title="Decision Panel">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>{selectedIncident.type}</h3>
          <div style={{ display: "flex", gap: "6px" }}>
            <StatusBadge status={selectedIncident.priority} />
            <StatusBadge status={selectedIncident.status} />
          </div>
        </div>

        <div style={{ color: "var(--muted)" }}>
          Location: {selectedIncident.location}
        </div>

        <div style={{ color: "var(--muted)" }}>
          Confidence: {selectedIncident.confidence}%
        </div>

        <div>
          <strong>Actions:</strong>
          <ul style={{ marginTop: "6px", paddingLeft: "18px" }}>
            {getActions().map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>

        <div>
          <strong>Responders:</strong>
          <div style={{ marginTop: "6px", display: "flex", gap: "8px" }}>
            {getResponders().map((responder, index) => (
              <span
                key={index}
                style={{
                  padding: "4px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              >
                {responder}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {!isResolved && !isInProgress && (
            <button
              type="button"
              onClick={() => setIncidentStatus(selectedIncident.id, "IN_PROGRESS")}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              Start Response
            </button>
          )}

          {!isResolved && (
            <button
              type="button"
              onClick={() => resolveIncident(selectedIncident.id)}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid var(--success)",
                background: "var(--success)",
                color: "#08100a",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Resolve Incident
            </button>
          )}

          {isResolved && (
            <span style={{ color: "var(--muted)", fontSize: "13px" }}>
              Incident is resolved.
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DecisionPanel;
