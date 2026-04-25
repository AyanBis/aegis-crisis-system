import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { useApp } from "../../context/AppContext";
import PatientModel from "../3d/PatientModel";

const FullscreenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const inferAffectedOrgans = (incident) => {
  const affected = new Set();
  const incidentType = String(incident.type || "").toLowerCase();
  const incidentLocation = String(incident.location || "").toLowerCase();

  if (incidentType.includes("fire")) {
    affected.add("Lungs");
    affected.add("Skin");
  }
  if (incidentType.includes("medical")) affected.add("Heart");
  if (incidentType.includes("threat")) affected.add("Head");

  if (["stomach", "abdomen", "belly", "gastric"].some((word) => incidentLocation.includes(word))) {
    affected.add("Stomach");
  }
  if (["leg", "knee", "foot", "ankle"].some((word) => incidentLocation.includes(word))) {
    affected.add("Leg");
  }
  if (["arm", "hand", "shoulder"].some((word) => incidentLocation.includes(word))) {
    affected.add("Arm");
  }
  if (["chest", "lung", "breath"].some((word) => incidentLocation.includes(word))) {
    affected.add("Lungs");
  }
  if (["head", "brain"].some((word) => incidentLocation.includes(word))) {
    affected.add("Head");
  }
  if (["back", "spine"].some((word) => incidentLocation.includes(word))) {
    affected.add("Spine");
  }

  if (affected.size === 0) affected.add("Heart");
  return [...affected];
};

const metricBoxStyle = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "12px",
  background: "linear-gradient(180deg, var(--surface-raised), var(--surface))",
};

const DigitalTwin = () => {
  const { selectedIncident, incidents, setSelectedIncident } = useApp();
  const modelFrameRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === modelFrameRef.current);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const mapRooms = useMemo(() => {
    const baseRooms = ["Lobby", "Room 203", "Room 204", "ER", "ICU", "Cafeteria"];

    const dynamicRooms = Array.from(new Set(incidents.map((incident) => incident.location)))
      .filter(
        (location) =>
          location &&
          !baseRooms.some((baseRoom) => baseRoom.toLowerCase() === location.toLowerCase()),
      );

    return [...baseRooms, ...dynamicRooms].slice(0, 8);
  }, [incidents]);

  const getRoomHeat = (roomName) => {
    const activeInRoom = incidents.filter(
      (incident) =>
        incident.location?.toLowerCase() === roomName.toLowerCase() &&
        incident.status !== "RESOLVED",
    );

    if (activeInRoom.length === 0) {
      return {
        bg: "var(--surface)",
        border: "1px solid var(--border)",
        text: "var(--muted)",
        incident: null,
      };
    }

    const hasHigh = activeInRoom.some((incident) => incident.priority === "HIGH");
    if (hasHigh) {
      const incident = activeInRoom.find((item) => item.priority === "HIGH");
      return {
        bg: "rgba(255, 90, 90, 0.16)",
        border: "1px solid rgba(255, 90, 90, 0.45)",
        text: "#ff7b7b",
        incident,
      };
    }

    return {
      bg: "rgba(255, 176, 32, 0.14)",
      border: "1px solid rgba(255, 176, 32, 0.4)",
      text: "#ffb84d",
      incident: activeInRoom[0],
    };
  };

  if (!selectedIncident) {
    return (
      <Card
        title="Digital Twin & Telemetry"
        subtitle="The patient twin activates when an incident is selected from the queue."
      >
        <div className="panel-section panel-section--dashed" style={{ color: "var(--muted)" }}>
          Select an incident to sync twin behavior.
        </div>
      </Card>
    );
  }

  const isHigh = selectedIncident.priority === "HIGH";
  const dt = selectedIncident.digital_twin || {};
  const heartRate = dt.heart_rate || (isHigh ? 120 : 78);
  const oxygen = dt.oxygen_level || (selectedIncident.type === "Fire" ? 88 : 97);
  const risk =
    selectedIncident.status === "RESOLVED"
      ? "LOW"
      : dt.risk_level || (isHigh ? "HIGH" : "MEDIUM");
  const twinState = selectedIncident.status === "RESOLVED" ? "STABLE" : "TRACKING";
  const oxygenAlert = oxygen < 92;
  const affectedOrgans = inferAffectedOrgans(selectedIncident);

  const toggleFullscreen = async () => {
    if (!modelFrameRef.current) return;

    if (document.fullscreenElement === modelFrameRef.current) {
      await document.exitFullscreen();
    } else {
      await modelFrameRef.current.requestFullscreen();
    }
  };

  return (
    <Card
      title="Digital Twin & Telemetry"
      subtitle="Real-time physiological context around the currently selected event."
    >
      <div className="stack-lg">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div className="stack-sm">
            <div className="eyebrow">Twin Status</div>
            <h3 style={{ fontSize: "1.7rem" }}>{selectedIncident.type} Twin</h3>
            <div style={{ color: "var(--muted)" }}>
              Sync {twinState} / Live physiological simulation
            </div>
          </div>
          <StatusBadge status={selectedIncident.status} />
        </div>

        <div
          ref={modelFrameRef}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
            background: "var(--model-panel-bg)",
            minHeight: isFullscreen ? "100vh" : "360px",
            position: "relative",
          }}
        >
          <PatientModel
            risk={risk}
            affectedOrgans={affectedOrgans}
            showLabels={isFullscreen}
            height={isFullscreen ? "100vh" : 360}
          />
          <button
            type="button"
            onClick={toggleFullscreen}
            className="button-secondary"
            style={{
              position: "absolute",
              right: "12px",
              bottom: "12px",
              width: "40px",
              height: "40px",
              display: "grid",
              placeItems: "center",
              padding: 0,
              background: "var(--model-overlay)",
            }}
            aria-label={isFullscreen ? "Exit fullscreen view" : "Enter fullscreen view"}
          >
            <FullscreenIcon />
          </button>
        </div>

        <div className="metric-grid metric-grid--four">
          <div style={metricBoxStyle}>
            <div className="metric-tile__label">Heart Rate</div>
            <div className="metric-tile__value" style={{ fontSize: "1.25rem" }}>
              {heartRate} BPM
            </div>
          </div>
          <div style={metricBoxStyle}>
            <div className="metric-tile__label">Oxygen</div>
            <div
              className="metric-tile__value"
              style={{
                fontSize: "1.25rem",
                color: oxygenAlert ? "#55c7ff" : "var(--heading)",
              }}
            >
              {oxygen}%
            </div>
          </div>
          <div style={metricBoxStyle}>
            <div className="metric-tile__label">Risk Level</div>
            <div className="metric-tile__value" style={{ fontSize: "1.25rem" }}>
              {risk}
            </div>
          </div>
          <div style={metricBoxStyle}>
            <div className="metric-tile__label">Organs In Focus</div>
            <div className="metric-tile__value" style={{ fontSize: "0.95rem", lineHeight: 1.3 }}>
              {affectedOrgans.join(", ")}
            </div>
          </div>
        </div>

        <div className="panel-section panel-section--dashed stack-md">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div className="metric-tile__label">Live Facility Heatmap</div>
            <div style={{ color: "var(--muted)", fontSize: "12px" }}>Click a room to focus</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: "8px",
            }}
          >
            {mapRooms.map((room) => {
              const heat = getRoomHeat(room);
              const isSelected =
                selectedIncident.location?.toLowerCase() === room.toLowerCase();

              return (
                <button
                  key={room}
                  type="button"
                  onClick={() => {
                    if (heat.incident) setSelectedIncident(heat.incident);
                  }}
                  style={{
                    padding: "12px 8px",
                    borderRadius: "var(--radius-xs)",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: heat.bg,
                    border: heat.border,
                    color: heat.text,
                    cursor: heat.incident ? "pointer" : "default",
                    opacity: heat.incident || isSelected ? 1 : 0.65,
                    boxShadow: isSelected ? "0 0 0 2px var(--accent-soft)" : "none",
                  }}
                  disabled={!heat.incident}
                >
                  {room}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DigitalTwin;
