import { useEffect, useRef, useState, useMemo } from "react";
import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import { useApp } from "../../context/AppContext";
import PatientModel from "../3d/PatientModel";

const inferAffectedOrgans = (incident) => {
  const affected = new Set();
  const incidentType = String(incident.type || "").toLowerCase();
  const incidentLocation = String(incident.location || "").toLowerCase();

  if (incidentType.includes("fire")) { affected.add("Lungs"); affected.add("Skin"); }
  if (incidentType.includes("medical")) affected.add("Heart");
  if (incidentType.includes("threat")) affected.add("Head");
  
  if (["stomach", "abdomen", "belly", "gastric"].some(w => incidentLocation.includes(w))) affected.add("Stomach");
  if (["leg", "knee", "foot", "ankle"].some(w => incidentLocation.includes(w))) affected.add("Leg");
  if (["arm", "hand", "shoulder"].some(w => incidentLocation.includes(w))) affected.add("Arm");
  if (["chest", "lung", "breath"].some(w => incidentLocation.includes(w))) affected.add("Lungs");
  if (["head", "brain"].some(w => incidentLocation.includes(w))) affected.add("Head");
  if (["back", "spine"].some(w => incidentLocation.includes(w))) affected.add("Spine");

  if (affected.size === 0) affected.add("Heart");
  return [...affected];
};

const DigitalTwin = () => {
  // We now import incidents and setSelectedIncident to power the heatmap
  const { selectedIncident, incidents, setSelectedIncident } = useApp();
  const modelFrameRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === modelFrameRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // --- HEATMAP LOGIC ---
  const mapRooms = useMemo(() => {
    // Standard hospital layout
    const baseRooms = ["Lobby", "Room 203", "Room 204", "ER", "ICU", "Cafeteria"];
    
    // Auto-detect any new locations you type in the Input Panel!
    const dynamicRooms = Array.from(new Set(incidents.map(i => i.location)))
      .filter(loc => loc && !baseRooms.some(br => br.toLowerCase() === loc.toLowerCase()));
      
    // Combine and limit to 8 rooms for a clean grid
    return [...baseRooms, ...dynamicRooms].slice(0, 8);
  }, [incidents]);

  const getRoomHeat = (roomName) => {
    const activeInRoom = incidents.filter(
      i => i.location?.toLowerCase() === roomName.toLowerCase() && i.status !== "RESOLVED"
    );

    if (activeInRoom.length === 0) {
      return { bg: "var(--surface)", border: "1px solid var(--border)", text: "var(--muted)", pulse: false, incident: null };
    }

    const hasHigh = activeInRoom.some(i => i.priority === "HIGH");
    if (hasHigh) {
      const inc = activeInRoom.find(i => i.priority === "HIGH");
      return { bg: "rgba(255, 77, 79, 0.15)", border: "1px solid #ff4d4f", text: "#ff4d4f", pulse: true, incident: inc };
    }

    return { bg: "rgba(255, 214, 10, 0.15)", border: "1px solid #ffd60a", text: "#ffd60a", pulse: true, incident: activeInRoom[0] };
  };
  // ----------------------

  if (!selectedIncident) {
    return (
      <Card title="Digital Twin Panel">
        <p style={{ color: "var(--muted)" }}>Select an incident to sync twin behavior.</p>
      </Card>
    );
  }

  const isHigh = selectedIncident.priority === "HIGH";
  const dt = selectedIncident.digital_twin || {};
  const heartRate = dt.heart_rate || (isHigh ? 120 : 78);
  const oxygen = dt.oxygen_level || (selectedIncident.type === "Fire" ? 88 : 97);
  const risk = selectedIncident.status === "RESOLVED" ? "LOW" : dt.risk_level || (isHigh ? "HIGH" : "MEDIUM");
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
    <Card title="Digital Twin & Telemetry">
      <div style={{ display: "grid", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>{selectedIncident.type} Twin</strong>
          <StatusBadge status={selectedIncident.status} />
        </div>

        <div style={{ color: "var(--muted)", fontSize: "13px" }}>
          Sync: {twinState} | Live physiological simulation
        </div>

        <div
          ref={modelFrameRef}
          style={{
            border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden",
            background: "var(--model-panel-bg)", minHeight: isFullscreen ? "100vh" : "320px", position: "relative",
          }}
        >
          <PatientModel risk={risk} affectedOrgans={affectedOrgans} showLabels={isFullscreen} height={isFullscreen ? "100vh" : 320} />
          <button
            type="button" onClick={toggleFullscreen}
            style={{
              position: "absolute", right: "10px", bottom: "10px", width: "34px", height: "34px",
              borderRadius: "6px", border: "1px solid var(--border)", background: "var(--model-overlay)",
              color: "var(--text)", cursor: "pointer", fontSize: "16px", lineHeight: 1,
            }}
          >
            ⛶
          </button>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", background: "var(--surface)" }}>
          <div style={{ fontSize: "13px", marginBottom: "6px" }}>Vital Metrics</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>Heart Rate: <strong>{heartRate} BPM</strong></div>
            <div style={{ fontSize: "12px", color: oxygenAlert ? "#55c7ff" : "var(--muted)", fontWeight: oxygenAlert ? "bold" : "normal" }}>
              Oxygen: <strong>{oxygen}%</strong>
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>Risk Level: <strong>{risk}</strong></div>
            <div style={{ fontSize: "12px", color: "var(--muted)"}}>Organs: <strong>{affectedOrgans.join(", ")}</strong></div>
          </div>
        </div>

        {/* --- THE NEW INTERACTIVE HEATMAP --- */}
        <div style={{ border: "1px dashed var(--border)", borderRadius: "8px", padding: "10px", background: "var(--surface-strong)" }}>
          <div style={{ fontSize: "13px", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
            <span>Live Facility Heatmap</span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>Click to select</span>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
            {mapRooms.map(room => {
              const heat = getRoomHeat(room);
              const isSelected = selectedIncident.location?.toLowerCase() === room.toLowerCase();
              
              return (
                <div
                  key={room}
                  onClick={() => {
                    if (heat.incident) setSelectedIncident(heat.incident);
                  }}
                  style={{
                    padding: "10px 4px",
                    borderRadius: "6px",
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: "bold",
                    background: heat.bg,
                    border: heat.border,
                    color: heat.text,
                    cursor: heat.incident ? "pointer" : "default",
                    opacity: heat.incident || isSelected ? 1 : 0.6,
                    boxShadow: isSelected ? "0 0 0 2px var(--accent)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  {room}
                </div>
              );
            })}
          </div>
        </div>
        {/* ----------------------------------- */}
        
      </div>
    </Card>
  );
};

export default DigitalTwin;