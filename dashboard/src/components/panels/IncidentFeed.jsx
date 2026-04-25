import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { useApp } from "../../context/AppContext";

const CRISIS_TYPE_COLORS = {
  FIRE: "#ff5a5a",
  MEDICAL: "#4cd964",
  THREAT: "#8fb8ff",
  SECURITY: "#8fb8ff",
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
    case "SECURITY":
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

const summaryCardStyle = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "12px",
  background: "linear-gradient(180deg, var(--surface-raised), var(--surface))",
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
    <Card
      title="Incident Feed"
      subtitle="Filter, triage, and hand off live events from a single queue."
    >
      <div className="stack-lg">
        <div className="metric-grid metric-grid--three">
          <div style={summaryCardStyle}>
            <div className="metric-tile__label">Active</div>
            <div className="metric-tile__value" style={{ fontSize: "1.25rem" }}>
              {incidentCounts.active}
            </div>
          </div>
          <div style={summaryCardStyle}>
            <div className="metric-tile__label">In Progress</div>
            <div className="metric-tile__value" style={{ fontSize: "1.25rem" }}>
              {incidentCounts.inProgress}
            </div>
          </div>
          <div style={summaryCardStyle}>
            <div className="metric-tile__label">Resolved</div>
            <div className="metric-tile__value" style={{ fontSize: "1.25rem" }}>
              {incidentCounts.resolved}
            </div>
          </div>
        </div>

        <div className="panel-section panel-section--tinted stack-md">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
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

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">Status: ALL</option>
              <option value="ACTIVE">Status: ACTIVE</option>
              <option value="IN_PROGRESS">Status: IN_PROGRESS</option>
              <option value="RESOLVED">Status: RESOLVED</option>
            </select>

            <input
              type="text"
              placeholder="Search by location"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div className="soft-pill">
              <span className="status-dot" style={{ background: "var(--accent)" }} />
              <span>
                Showing <strong>{filteredIncidents.length}</strong> of{" "}
                <strong>{incidents.length}</strong> incidents
              </span>
            </div>

            <div className="inline-wrap">
              <button
                type="button"
                className={soundEnabled ? "button-secondary" : "button-ghost"}
                onClick={() => setSoundEnabled((prev) => !prev)}
              >
                Sound {soundEnabled ? "On" : "Off"}
              </button>
              <button type="button" className="button-ghost" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <div className="stack-md scroll-area" style={{ maxHeight: "680px", paddingRight: "4px" }}>
          {filteredIncidents.map((incident) => {
            const typeColor = getTypeColor(incident.type);
            const typeLabel = getTypeKey(incident.type);
            const isSelected = selectedIncident?.id === incident.id;
            const isResolved = incident.status === "RESOLVED";

            return (
              <article
                key={incident.id}
                style={{
                  borderRadius: "var(--radius-sm)",
                  border: isSelected
                    ? `1px solid ${typeColor}`
                    : "1px solid var(--border)",
                  background: isSelected
                    ? `linear-gradient(180deg, ${typeColor}1a, var(--surface))`
                    : "linear-gradient(180deg, var(--surface-raised), var(--surface))",
                  boxShadow: isSelected ? `0 0 0 1px ${typeColor}33` : "var(--shadow-inset)",
                  padding: "14px",
                  opacity: isResolved ? 0.76 : 1,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "0 auto 0 0",
                    width: "5px",
                    background: typeColor,
                  }}
                />

                <div className="stack-md">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div className="stack-sm">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          aria-hidden="true"
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "999px",
                            background: typeColor,
                            display: "inline-block",
                            boxShadow: `0 0 0 6px ${typeColor}1f`,
                          }}
                        />
                        <h4 style={{ fontSize: "1.3rem" }}>
                          {typeLabel} <span style={{ color: "var(--muted)" }}>/</span>{" "}
                          {incident.priority}
                        </h4>
                      </div>
                      <div className="inline-wrap">
                        <div className="soft-pill" style={{ padding: "6px 10px" }}>
                          <strong>{incident.location}</strong>
                        </div>
                        <div className="soft-pill" style={{ padding: "6px 10px" }}>
                          {formatTime(incident)}
                        </div>
                        <div className="soft-pill" style={{ padding: "6px 10px" }}>
                          Confidence <strong>{incident.confidence}%</strong>
                        </div>
                      </div>
                    </div>

                    <StatusBadge status={incident.status} />
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--border)",
                      background: "var(--card-strong)",
                      color: "var(--muted)",
                      lineHeight: 1.55,
                    }}
                  >
                    <div className="metric-tile__label" style={{ marginBottom: "6px" }}>
                      AI Summary
                    </div>
                    {getAiSummary(incident)}
                  </div>

                  <div className="inline-wrap">
                    <button
                      type="button"
                      className={isSelected ? "button-secondary" : "button-primary"}
                      onClick={() => setSelectedIncident(incident)}
                    >
                      {isSelected ? "Focused" : "View Details"}
                    </button>
                    <button
                      type="button"
                      className={isResolved ? "button-secondary" : "button-success"}
                      disabled={isResolved}
                      onClick={() => resolveIncident(incident.id)}
                    >
                      {isResolved ? "Resolved" : "Resolve"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredIncidents.length === 0 && (
            <div
              className="panel-section panel-section--dashed"
              style={{ color: "var(--muted)", textAlign: "center" }}
            >
              No incidents match your filters.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default IncidentFeed;
