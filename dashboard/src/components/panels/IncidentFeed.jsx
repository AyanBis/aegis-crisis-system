import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { useApp } from "../../context/AppContext";

const CRISIS_TYPE_COLORS = {
  FIRE: "#ff4d4f",
  MEDICAL: "#4cd964",
  THREAT: "#39465a",
  UNKNOWN: "#ffd60a",
};

const getTypeKey = (type) => String(type || "UNKNOWN").toUpperCase();

const getTypeColor = (type) => {
  const typeKey = getTypeKey(type);
  return CRISIS_TYPE_COLORS[typeKey] || "var(--accent)";
};

const getAiSummary = (incident) => {
  if (incident.aiSummary) {
    return incident.aiSummary;
  }

  const type = getTypeKey(incident.type);

  switch (type) {
    case "FIRE":
      return "Heat and smoke pattern indicates active combustion risk. Recommend immediate containment and evacuation protocol.";
    case "MEDICAL":
      return "Medical distress confidence is high. Fast response and nearest team dispatch recommended.";
    case "THREAT":
      return "Behavioral anomaly suggests elevated threat potential. Secure perimeter and verify nearby access points.";
    default:
      return "Signal is partially uncertain. Continue monitoring while validating with nearby sensors or operators.";
  }
};

const formatTime = (incident) => {
  if (incident.timestamp && incident.timestamp !== "just now") {
    return incident.timestamp;
  }

  if (!incident.createdAt) {
    return "N/A";
  }

  return new Date(incident.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const playAlertTone = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      620,
      audioContext.currentTime + 0.25,
    );

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.15,
      audioContext.currentTime + 0.02,
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.3,
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);

    setTimeout(() => {
      audioContext.close();
    }, 350);
  } catch {
    // Ignore browsers that block autoplay or audio context creation.
  }
};

const IncidentFeed = () => {
  const { incidents, setSelectedIncident, selectedIncident, resolveIncident } = useApp();
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const seenIncidentIds = useRef(new Set());

  useEffect(() => {
    if (seenIncidentIds.current.size === 0) {
      incidents.forEach((incident) => seenIncidentIds.current.add(incident.id));
      return;
    }

    const newHighPriorityIncidents = incidents.filter(
      (incident) =>
        !seenIncidentIds.current.has(incident.id) &&
        incident.priority === "HIGH" &&
        incident.status !== "RESOLVED",
    );

    if (newHighPriorityIncidents.length > 0 && soundEnabled) {
      playAlertTone();
    }

    incidents.forEach((incident) => seenIncidentIds.current.add(incident.id));
  }, [incidents, soundEnabled]);

  const typeOptions = useMemo(
    () => ["ALL", ...new Set(incidents.map((incident) => incident.type))],
    [incidents],
  );

  const filteredIncidents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const statusOrder = {
      ACTIVE: 0,
      IN_PROGRESS: 1,
      RESOLVED: 2,
    };

    return incidents
      .filter((incident) => {
        const matchesType = typeFilter === "ALL" || incident.type === typeFilter;
        const matchesPriority =
          priorityFilter === "ALL" || incident.priority === priorityFilter;
        const matchesStatus =
          statusFilter === "ALL" || incident.status === statusFilter;
        const matchesLocation =
          normalizedSearch.length === 0 ||
          incident.location.toLowerCase().includes(normalizedSearch);

        return matchesType && matchesPriority && matchesStatus && matchesLocation;
      })
      .sort((a, b) => {
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }

        return b.id - a.id;
      });
  }, [incidents, typeFilter, priorityFilter, statusFilter, searchQuery]);

  const incidentCounts = useMemo(
    () => ({
      active: incidents.filter((incident) => incident.status === "ACTIVE").length,
      inProgress: incidents.filter((incident) => incident.status === "IN_PROGRESS")
        .length,
      resolved: incidents.filter((incident) => incident.status === "RESOLVED").length,
    }),
    [incidents],
  );

  const resetFilters = () => {
    setTypeFilter("ALL");
    setPriorityFilter("ALL");
    setStatusFilter("ALL");
    setSearchQuery("");
  };

  return (
    <Card title="Incident Feed">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              Type: {type}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
        >
          <option value="ALL">Priority: ALL</option>
          <option value="HIGH">Priority: HIGH</option>
          <option value="MEDIUM">Priority: MEDIUM</option>
          <option value="LOW">Priority: LOW</option>
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ALL">Status: ALL</option>
          <option value="ACTIVE">Status: ACTIVE</option>
          <option value="IN_PROGRESS">Status: IN_PROGRESS</option>
          <option value="RESOLVED">Status: RESOLVED</option>
        </select>

        <input
          type="text"
          placeholder="Search location"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div style={{ marginBottom: "10px", color: "var(--muted)", fontSize: "12px" }}>
        Showing {filteredIncidents.length} of {incidents.length} incidents
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--muted)" }}>
          Active {incidentCounts.active} | In Progress {incidentCounts.inProgress} |
          Resolved {incidentCounts.resolved}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            style={{
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: soundEnabled ? "var(--success-soft)" : "transparent",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Sound {soundEnabled ? "On" : "Off"}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            style={{
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredIncidents.map((incident) => {
          const typeColor = getTypeColor(incident.type);
          const typeLabel = getTypeKey(incident.type);
          const isSelected = selectedIncident?.id === incident.id;
          const isResolved = incident.status === "RESOLVED";

          return (
            <div
              key={incident.id}
              style={{
                borderRadius: "10px",
                border: isSelected
                  ? `1px solid ${typeColor}`
                  : "1px solid var(--border)",
                borderLeft: `5px solid ${typeColor}`,
                padding: "12px",
                background: isSelected ? "var(--surface-tint)" : "var(--surface)",
                opacity: isResolved ? 0.72 : 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: "bold",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "999px",
                      background: typeColor,
                      display: "inline-block",
                      border: typeLabel === "THREAT" ? "1px solid var(--border-strong)" : "none",
                    }}
                  />
                  <span>{typeLabel}</span>
                  <span style={{ color: "var(--muted)" }}>|</span>
                  <span>{incident.priority}</span>
                </div>

                <StatusBadge status={incident.status} />
              </div>

              <div style={{ marginTop: "8px", fontSize: "14px" }}>
                <div>Location: {incident.location}</div>
                <div>Time: {formatTime(incident)}</div>
                <div>Confidence: {incident.confidence}%</div>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  marginTop: "10px",
                  paddingTop: "8px",
                  color: "var(--muted)",
                  fontSize: "13px",
                  lineHeight: 1.35,
                }}
              >
                AI explanation summary: {getAiSummary(incident)}
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  marginTop: "10px",
                  paddingTop: "8px",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedIncident(incident)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--accent)",
                    background: "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  View Details
                </button>
                <button
                  type="button"
                  disabled={isResolved}
                  onClick={() => resolveIncident(incident.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--success)",
                    background: isResolved ? "var(--surface-strong)" : "var(--success)",
                    color: isResolved ? "var(--muted)" : "#08100a",
                    cursor: isResolved ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Resolve
                </button>
              </div>
            </div>
          );
        })}

        {filteredIncidents.length === 0 && (
          <div
            style={{
              border: "1px dashed var(--border)",
              borderRadius: "8px",
              padding: "14px",
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            No incidents match your filters.
          </div>
        )}
      </div>
    </Card>
  );
};

export default IncidentFeed;
