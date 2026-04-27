import { createContext, useContext, useEffect, useState } from "react";
import { initialIncidents } from "../data/mockData";

const AppContext = createContext();
const THEME_STORAGE_KEY = "aegis-theme";

// Added your Backend URL here
const API_BASE_URL = "https://aegis-crisis-system-production.up.railway.app"; 
const MAX_LOG_ENTRIES = 40;

const normalizeStatus = (status) => {
  const normalized = String(status || "ACTIVE").trim().toUpperCase();

  if (normalized === "IN PROGRESS") {
    return "IN_PROGRESS";
  }

  if (normalized === "RESOLVED" || normalized === "IN_PROGRESS" || normalized === "ACTIVE") {
    return normalized;
  }

  return "ACTIVE";
};

const normalizePriority = (priority) => {
  const normalized = String(priority || "MEDIUM").trim().toUpperCase();
  if (normalized === "HIGH" || normalized === "MEDIUM" || normalized === "LOW") {
    return normalized;
  }
  return "MEDIUM";
};

const normalizeIncident = (incident) => ({
  id: incident.id ?? Date.now(),
  type: incident.type || "General",
  location: incident.location || "Unknown",
  priority: normalizePriority(incident.priority),
  status: normalizeStatus(incident.status),
  confidence: typeof incident.confidence === "number" ? incident.confidence : 75,
  timestamp: incident.timestamp || "just now",
  createdAt: incident.createdAt || new Date().toISOString(),
  resolvedAt: incident.resolvedAt || null,
  
  // --- ADD THESE 3 LINES ---
  digital_twin: incident.digital_twin || null,
  llm_explanation: incident.llm_explanation || null,
  decision: incident.decision || null,
});

const makeLog = (message, level = "info") => ({
  id: Date.now() + Math.random(),
  message,
  level,
  time: new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
});

const seedIncidents = initialIncidents.map(normalizeIncident);

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [incidents, setIncidents] = useState(seedIncidents);
  const [selectedIncident, setSelectedIncident] = useState(
    seedIncidents[0] || null,
  );
  const [executionLog, setExecutionLog] = useState([
    makeLog("System online. Monitoring incidents."),
  ]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const appendLog = (message, level = "info") => {
    const log = makeLog(message, level);
    setExecutionLog((prev) => [log, ...prev].slice(0, MAX_LOG_ENTRIES));
  };

  // UPDATED: Now connects to the backend!
  const addIncident = async (incidentData) => {
    appendLog(`Sending report to backend...`, "info");

    try {
      // Package data specifically for FastAPI Form dependencies
      const formData = new FormData();
      
      // 1. UPDATED: Now uses 'text' from the new InputPanel instead of 'type'
      formData.append("text", incidentData.text || "unknown situation");
      formData.append("location", incidentData.location || "Unknown");

      // 2. ADDED: Attach files if the user uploaded them!
      if (incidentData.image) {
        formData.append("image", incidentData.image);
      }
      if (incidentData.audio) {
        formData.append("audio", incidentData.audio);
      }

      // Send to your backend
      const response = await fetch(`${API_BASE_URL}/report`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Receive the AI engine's decision
      const data = await response.json();

      // Normalize it so the dashboard UI understands it
      const newIncident = normalizeIncident({
        id: data.incident_id,
        type: data.crisis_type, 
        location: data.location,
        priority: data.decision?.priority || "MEDIUM",
        status: data.status || "ACTIVE",
        confidence: Math.round((data.confidence || 0.75) * 100), 
        timestamp: data.timestamp || new Date().toISOString(),
        
        // Save the rich AI data
        digital_twin: data.digital_twin,
        llm_explanation: data.llm_explanation,
        decision: data.decision
      });

      setIncidents((prev) => [newIncident, ...prev]);
      setSelectedIncident((prev) => prev || newIncident);

      appendLog(
        `Backend accepted report: ${newIncident.type} at ${newIncident.location} (${newIncident.priority})`,
        newIncident.priority === "HIGH" ? "critical" : "success",
      );
    } catch (error) {
      console.error(error);
      appendLog(`Failed to connect to backend: ${error.message}`, "critical");
    }
  };

  const setIncidentStatus = (incidentId, status) => {
    const nextStatus = normalizeStatus(status);
    let updatedIncident = null;

    setIncidents((prev) =>
      prev.map((incident) => {
        if (incident.id !== incidentId) {
          return incident;
        }

        updatedIncident = {
          ...incident,
          status: nextStatus,
          resolvedAt: nextStatus === "RESOLVED" ? new Date().toISOString() : null,
        };

        return updatedIncident;
      }),
    );

    setSelectedIncident((prev) =>
      prev?.id === incidentId
        ? {
            ...prev,
            status: nextStatus,
            resolvedAt: nextStatus === "RESOLVED" ? new Date().toISOString() : null,
          }
        : prev,
    );

    if (updatedIncident) {
      const level = nextStatus === "RESOLVED" ? "success" : "info";
      appendLog(
        `Incident ${updatedIncident.id} set to ${nextStatus} (${updatedIncident.type})`,
        level,
      );
    }
  };

  const resolveIncident = (incidentId) => {
    setIncidentStatus(incidentId, "RESOLVED");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        incidents,
        selectedIncident,
        setSelectedIncident,
        executionLog,
        addIncident,
        setIncidentStatus,
        resolveIncident,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);
