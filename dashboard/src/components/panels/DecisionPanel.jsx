import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { useApp } from "../../context/AppContext";

const tokenStyle = {
  padding: "8px 12px",
  border: "1px solid var(--border)",
  borderRadius: "999px",
  fontSize: "12px",
  background: "var(--surface-raised)",
};

const formatResponderLabel = (responder) =>
  String(responder || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const DecisionPanel = () => {
  const { selectedIncident, setIncidentStatus, resolveIncident } = useApp();

  if (!selectedIncident) {
    return (
      <Card
        title="Decision Panel"
        subtitle="Recommended operational playbooks appear here when an incident is in focus."
      >
        <div className="panel-section panel-section--dashed" style={{ color: "var(--muted)" }}>
          Select an incident to view recommendations and actions.
        </div>
      </Card>
    );
  }

  const getActions = () => {
    if (selectedIncident.decision?.actions?.length) {
      return selectedIncident.decision.actions;
    }

    switch (String(selectedIncident.type || "").toLowerCase()) {
      case "fire":
        return ["Dispatch fire unit", "Alert hospitals", "Evacuate area"];
      case "medical":
        return ["Send ambulance", "Notify medical staff", "Secure treatment route"];
      case "security":
      case "threat":
        return ["Dispatch security team", "Lock nearby access points", "Sweep camera perimeter"];
      default:
        return ["Monitor situation", "Confirm nearby sensor data"];
    }
  };

  const getResponders = () => {
    if (selectedIncident.decision?.responders?.length) {
      return selectedIncident.decision.responders.map(formatResponderLabel);
    }

    const incidentType = String(selectedIncident.type || "").toLowerCase();

    if (incidentType === "fire") {
      return ["Fire Dept", "Police", "Ambulance"];
    }

    if (incidentType === "security" || incidentType === "threat") {
      return ["Security Ops", "Police"];
    }

    return ["Medical Team"];
  };

  const isResolved = selectedIncident.status === "RESOLVED";
  const isInProgress = selectedIncident.status === "IN_PROGRESS";
  const recommendedAction =
    selectedIncident.decision?.recommended_action ||
    selectedIncident.decision?.actions?.[0] ||
    getActions()[0];

  return (
    <Card
      title="Decision Panel"
      subtitle="Human response recommendations paired with the selected incident."
    >
      <div className="stack-lg">
        <div className="panel-section panel-section--tinted stack-md">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div className="stack-sm">
              <div className="eyebrow">Active Focus</div>
              <h3 style={{ fontSize: "1.8rem" }}>{selectedIncident.type}</h3>
              <div style={{ color: "var(--muted)" }}>{selectedIncident.location}</div>
            </div>
            <div className="inline-wrap">
              <StatusBadge status={selectedIncident.priority} />
              <StatusBadge status={selectedIncident.status} />
            </div>
          </div>

          <div className="metric-grid metric-grid--three">
            <div className="metric-tile">
              <div className="metric-tile__label">Confidence</div>
              <div className="metric-tile__value" style={{ fontSize: "1.25rem" }}>
                {selectedIncident.confidence}%
              </div>
            </div>
            <div className="metric-tile">
              <div className="metric-tile__label">Primary Directive</div>
              <div className="metric-tile__value" style={{ fontSize: "1rem", lineHeight: 1.2 }}>
                {recommendedAction}
              </div>
            </div>
            <div className="metric-tile">
              <div className="metric-tile__label">Current State</div>
              <div className="metric-tile__value" style={{ fontSize: "1.1rem" }}>
                {isResolved ? "Closed" : isInProgress ? "Responding" : "Awaiting Response"}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
          }}
        >
          <div className="panel-section stack-md">
            <div className="metric-tile__label">Recommended Actions</div>
            <div className="stack-sm">
              {getActions().map((action, index) => (
                <div
                  key={action}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "var(--radius-xs)",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "999px",
                      display: "grid",
                      placeItems: "center",
                      background: "var(--accent-soft)",
                      color: "var(--accent-strong)",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section stack-md">
            <div className="metric-tile__label">Responder Lineup</div>
            <div className="inline-wrap">
              {getResponders().map((responder) => (
                <span key={responder} style={tokenStyle}>
                  {responder}
                </span>
              ))}
            </div>
            <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              Route resources based on proximity, severity, and current room status.
            </div>
          </div>
        </div>

        <div className="inline-wrap">
          {!isResolved && !isInProgress && (
            <button
              type="button"
              className="button-primary"
              onClick={() => setIncidentStatus(selectedIncident.id, "IN_PROGRESS")}
            >
              Start Response
            </button>
          )}

          {!isResolved && (
            <button
              type="button"
              className="button-success"
              onClick={() => resolveIncident(selectedIncident.id)}
            >
              Resolve Incident
            </button>
          )}

          {isResolved && (
            <div className="soft-pill">
              <span className="status-dot" style={{ background: "var(--success)" }} />
              Incident is resolved.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DecisionPanel;
