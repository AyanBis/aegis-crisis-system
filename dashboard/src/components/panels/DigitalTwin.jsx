import { useEffect, useRef, useState } from "react";
import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { useApp } from "../../context/AppContext";
import PatientModel from "../3d/PatientModel";

const inferAffectedOrgans = (incident) => {
  const affected = new Set();

  const incidentType = String(incident.type || "").toLowerCase();
  const incidentLocation = String(incident.location || "").toLowerCase();

  if (incidentType.includes("fire")) {
    affected.add("Lungs");
    affected.add("Skin");
  }

  if (incidentType.includes("medical")) {
    affected.add("Heart");
  }

  if (incidentType.includes("threat")) {
    affected.add("Head");
  }

  if (
    incidentLocation.includes("stomach") ||
    incidentLocation.includes("abdomen") ||
    incidentLocation.includes("belly") ||
    incidentLocation.includes("gastric")
  ) {
    affected.add("Stomach");
  }

  if (
    incidentLocation.includes("leg") ||
    incidentLocation.includes("knee") ||
    incidentLocation.includes("foot") ||
    incidentLocation.includes("ankle")
  ) {
    affected.add("Leg");
  }

  if (
    incidentLocation.includes("arm") ||
    incidentLocation.includes("hand") ||
    incidentLocation.includes("shoulder")
  ) {
    affected.add("Arm");
  }

  if (
    incidentLocation.includes("chest") ||
    incidentLocation.includes("lung") ||
    incidentLocation.includes("breath")
  ) {
    affected.add("Lungs");
  }

  if (incidentLocation.includes("head") || incidentLocation.includes("brain")) {
    affected.add("Head");
  }

  if (incidentLocation.includes("back") || incidentLocation.includes("spine")) {
    affected.add("Spine");
  }

  if (affected.size === 0) {
    affected.add("Heart");
  }

  return [...affected];
};

const DigitalTwin = () => {
  const { selectedIncident } = useApp();
  const modelFrameRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === modelFrameRef.current);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  if (!selectedIncident) {
    return (
      <Card title="Digital Twin Panel">
        <p style={{ color: "var(--muted)" }}>
          Select an incident to sync twin behavior.
        </p>
      </Card>
    );
  }

  const isHigh = selectedIncident.priority === "HIGH";
  const heartRate = isHigh ? 120 : 78;
  const oxygen = selectedIncident.type === "Fire" ? 88 : 97;

  const risk =
    selectedIncident.status === "RESOLVED"
      ? "LOW"
      : isHigh
        ? "HIGH"
        : "MEDIUM";

  const twinState =
    selectedIncident.status === "RESOLVED" ? "STABLE" : "TRACKING";

  const oxygenAlert = oxygen < 92;
  const affectedOrgans = inferAffectedOrgans(selectedIncident);

  const toggleFullscreen = async () => {
    if (!modelFrameRef.current) {
      return;
    }

    if (document.fullscreenElement === modelFrameRef.current) {
      await document.exitFullscreen();
      return;
    }

    await modelFrameRef.current.requestFullscreen();
  };

  return (
    <Card title="Digital Twin Panel">
      <div style={{ display: "grid", gap: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <strong>{selectedIncident.type} Twin</strong>
          <StatusBadge status={selectedIncident.status} />
        </div>

        <div style={{ color: "var(--muted)", fontSize: "13px" }}>
          Sync: {twinState} | Live physiological simulation
        </div>

        <div
          ref={modelFrameRef}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
            background: "var(--model-panel-bg)",
            minHeight: isFullscreen ? "100vh" : "380px",
            position: "relative",
          }}
        >
          <PatientModel
            risk={risk}
            affectedOrgans={affectedOrgans}
            showLabels={isFullscreen}
            height={isFullscreen ? "100vh" : 380}
          />

          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              position: "absolute",
              right: "10px",
              bottom: "10px",
              width: "34px",
              height: "34px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "var(--model-overlay)",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: "16px",
              lineHeight: 1,
            }}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            ⛶
          </button>
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "10px",
            background: "var(--surface)",
          }}
        >
          <div style={{ fontSize: "13px", marginBottom: "6px" }}>
            Vital Metrics
          </div>

          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
            Heart Rate: {heartRate} BPM
          </div>

          <div
            style={{
              fontSize: "12px",
              color: oxygenAlert ? "#55c7ff" : "var(--muted)",
              fontWeight: oxygenAlert ? "bold" : "normal",
            }}
          >
            Oxygen: {oxygen}%
          </div>

          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
            Risk Level: {risk}
          </div>

          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
            Affected Organs: {affectedOrgans.join(", ")}
          </div>

          {oxygenAlert && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "11px",
                color: "#55c7ff",
                border: "1px solid var(--info-border)",
                borderRadius: "6px",
                padding: "6px",
                background: "var(--info-soft)",
              }}
            >
              Oxygen drop detected. Monitor airway and response timeline.
            </div>
          )}
        </div>

        <div
          style={{
            border: "1px dashed var(--border)",
            borderRadius: "8px",
            padding: "10px",
            background: "var(--surface-strong)",
          }}
        >
          <div style={{ fontSize: "13px", marginBottom: "4px" }}>
            Map View (Future)
          </div>
          <div
            style={{
              color: "var(--muted)",
              fontSize: "12px",
              lineHeight: 1.4,
            }}
          >
            Will display live location, responder routes, and risk zones for{" "}
            <strong>{selectedIncident.location}</strong>.
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DigitalTwin;
