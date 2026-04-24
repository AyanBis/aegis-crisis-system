import { useMemo } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import Card from "../common/Card";
import { useApp } from "../../context/AppContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

const PRIORITY_WEIGHT = {
  HIGH: 0.88,
  MEDIUM: 0.58,
  LOW: 0.28,
};

const BIN_LABELS = ["0-20", "21-40", "41-60", "61-80", "81-100"];

const getConfidenceBinIndex = (confidence) => {
  const value = Math.max(0, Math.min(100, Number(confidence) || 0));
  if (value <= 20) return 0;
  if (value <= 40) return 1;
  if (value <= 60) return 2;
  if (value <= 80) return 3;
  return 4;
};

const AIInsights = () => {
  const { incidents, selectedIncident, theme } = useApp();
  const chartTickColor = theme === "dark" ? "#9aa4b2" : "#5f7187";
  const chartGridColor = theme === "dark" ? "#1f2632" : "#dbe5f0";

  const analytics = useMemo(() => {
    const typeCounts = incidents.reduce((accumulator, incident) => {
      const key = String(incident.type || "Unknown").toUpperCase();
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const total = incidents.length;
    const highCount = incidents.filter((incident) => incident.priority === "HIGH").length;
    const unresolvedCount = incidents.filter(
      (incident) => incident.status !== "RESOLVED",
    ).length;

    const confidenceBins = [0, 0, 0, 0, 0];
    incidents.forEach((incident) => {
      const idx = getConfidenceBinIndex(incident.confidence);
      confidenceBins[idx] += 1;
    });

    const cumulativeCounts = confidenceBins.reduce((accumulator, count, index) => {
      const prev = index === 0 ? 0 : accumulator[index - 1];
      accumulator.push(prev + count);
      return accumulator;
    }, []);

    const cumulativePercentages = cumulativeCounts.map((count) =>
      total === 0 ? 0 : Math.round((count / total) * 100),
    );

    return {
      typeCounts,
      total,
      highCount,
      unresolvedCount,
      confidenceBins,
      cumulativePercentages,
    };
  }, [incidents]);

  const typeBarData = useMemo(() => {
    const labels = Object.keys(analytics.typeCounts);
    const data = Object.values(analytics.typeCounts);

    return {
      labels,
      datasets: [
        {
          label: "Count",
          data,
          backgroundColor: ["#ff4d4f", "#4cd964", "#5f7187", "#ffd60a", "#4da3ff"],
          borderRadius: 6,
          maxBarThickness: 24,
        },
      ],
    };
  }, [analytics.typeCounts]);

  const histogramData = useMemo(
    () => ({
      labels: BIN_LABELS,
      datasets: [
        {
          label: "Incidents",
          data: analytics.confidenceBins,
          backgroundColor: "#4da3ff",
          borderRadius: 6,
          maxBarThickness: 28,
        },
      ],
    }),
    [analytics.confidenceBins],
  );

  const ogiveData = useMemo(
    () => ({
      labels: BIN_LABELS,
      datasets: [
        {
          label: "Cumulative %",
          data: analytics.cumulativePercentages,
          borderColor: "#6ddc8a",
          backgroundColor: "rgba(109,220,138,0.2)",
          tension: 0.3,
          fill: true,
          pointRadius: 3,
        },
      ],
    }),
    [analytics.cumulativePercentages],
  );

  const riskScore = useMemo(() => {
    if (!selectedIncident) {
      return null;
    }

    const confidenceFactor = Math.min(Math.max(selectedIncident.confidence || 0, 0), 100) / 100;
    const priorityFactor = PRIORITY_WEIGHT[selectedIncident.priority] || 0.45;
    return Math.round((confidenceFactor * 0.55 + priorityFactor * 0.45) * 100);
  }, [selectedIncident]);

  const baseBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: chartTickColor }, grid: { color: chartGridColor } },
      y: {
        ticks: { color: chartTickColor, precision: 0 },
        grid: { color: chartGridColor },
        beginAtZero: true,
      },
    },
  };

  return (
    <Card title="AI Insights & Analytics">
      <div style={{ display: "grid", gap: "12px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}
        >
          <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "8px" }}>
            <div style={{ color: "var(--muted)", fontSize: "12px" }}>Total Incidents</div>
            <strong>{analytics.total}</strong>
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "8px" }}>
            <div style={{ color: "var(--muted)", fontSize: "12px" }}>High Priority</div>
            <strong>{analytics.highCount}</strong>
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "8px" }}>
            <div style={{ color: "var(--muted)", fontSize: "12px" }}>Unresolved</div>
            <strong>{analytics.unresolvedCount}</strong>
          </div>
        </div>

        {selectedIncident ? (
          <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "10px" }}>
            <div style={{ color: "var(--muted)", fontSize: "12px" }}>Selected Incident Risk</div>
            <div style={{ marginTop: "4px" }}>
              <strong>{selectedIncident.type}</strong> at {selectedIncident.location}
            </div>
            <div style={{ marginTop: "4px" }}>
              Failure Probability: <strong>{riskScore}%</strong>
            </div>
            
            {/* --- UPDATED: Dynamic LLM Explanation --- */}
            <div style={{ color: "var(--muted)", fontSize: "12px", marginTop: "4px" }}>
              Prediction summary: <strong>{selectedIncident.llm_explanation || "Elevated risk if response is delayed; continue real-time monitoring."}</strong>
            </div>

            {/* --- UPDATED: Dynamic Recommended Action --- */}
            {selectedIncident.decision?.recommended_action && (
              <div style={{ color: "#55c7ff", fontSize: "12px", marginTop: "6px", borderTop: "1px solid var(--border)", paddingTop: "4px" }}>
                Action: {selectedIncident.decision.recommended_action}
              </div>
            )}
            
          </div>
        ) : (
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>
            Select an incident to view predictive risk details.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "10px",
          }}
        >
          <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "10px" }}>
            <div style={{ marginBottom: "8px", fontSize: "13px", color: "var(--muted)" }}>
              Type Mini-Bar
            </div>
            <div style={{ height: "150px" }}>
              <Bar data={typeBarData} options={baseBarOptions} />
            </div>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "10px" }}>
            <div style={{ marginBottom: "8px", fontSize: "13px", color: "var(--muted)" }}>
              Confidence Histogram
            </div>
            <div style={{ height: "150px" }}>
              <Bar data={histogramData} options={baseBarOptions} />
            </div>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "10px" }}>
            <div style={{ marginBottom: "8px", fontSize: "13px", color: "var(--muted)" }}>
              Ogive (Cumulative)
            </div>
            <div style={{ height: "150px" }}>
              <Line
                data={ogiveData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: { ticks: { color: chartTickColor }, grid: { color: chartGridColor } },
                    y: {
                      ticks: {
                        color: chartTickColor,
                        callback: (value) => `${value}%`,
                      },
                      grid: { color: chartGridColor },
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AIInsights;