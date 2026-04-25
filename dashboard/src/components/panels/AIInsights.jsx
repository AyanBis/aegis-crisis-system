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

const chartPanelStyle = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "14px",
  background: "linear-gradient(180deg, var(--surface-raised), var(--surface))",
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
    const averageConfidence =
      total === 0
        ? 0
        : Math.round(
            incidents.reduce((sum, incident) => sum + (incident.confidence || 0), 0) / total,
          );

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
      averageConfidence,
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
          backgroundColor: ["#ff5a5a", "#4cd964", "#8fb8ff", "#ffd60a", "#4da3ff"],
          borderRadius: 8,
          maxBarThickness: 26,
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
          borderRadius: 8,
          maxBarThickness: 32,
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
          backgroundColor: "rgba(109,220,138,0.16)",
          tension: 0.32,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#6ddc8a",
        },
      ],
    }),
    [analytics.cumulativePercentages],
  );

  const riskScore = useMemo(() => {
    if (!selectedIncident) {
      return null;
    }

    const confidenceFactor =
      Math.min(Math.max(selectedIncident.confidence || 0, 0), 100) / 100;
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
    <Card
      title="AI Insights & Analytics"
      subtitle="Operational signals and model confidence, shaped for quick interpretation."
    >
      <div className="stack-lg">
        <div className="metric-grid metric-grid--four">
          <div className="metric-tile">
            <div className="metric-tile__label">Total Incidents</div>
            <div className="metric-tile__value">{analytics.total}</div>
            <div className="metric-tile__meta">Combined active and historical session load</div>
          </div>
          <div className="metric-tile">
            <div className="metric-tile__label">High Priority</div>
            <div className="metric-tile__value">{analytics.highCount}</div>
            <div className="metric-tile__meta">Events marked high urgency by response logic</div>
          </div>
          <div className="metric-tile">
            <div className="metric-tile__label">Unresolved</div>
            <div className="metric-tile__value">{analytics.unresolvedCount}</div>
            <div className="metric-tile__meta">Cases still open in the operating queue</div>
          </div>
          <div className="metric-tile">
            <div className="metric-tile__label">Avg Confidence</div>
            <div className="metric-tile__value">{analytics.averageConfidence}%</div>
            <div className="metric-tile__meta">Mean model certainty across incidents</div>
          </div>
        </div>

        {selectedIncident ? (
          <div
            className="panel-section panel-section--tinted stack-md"
            style={{ borderColor: "var(--border-strong)" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div className="stack-sm">
                <div className="eyebrow">Selected Incident Risk</div>
                <h3 style={{ fontSize: "1.8rem" }}>
                  {selectedIncident.type} at {selectedIncident.location}
                </h3>
              </div>
              <div className="soft-pill">
                Risk Estimate <strong>{riskScore}%</strong>
              </div>
            </div>

            <div
              style={{
                height: "12px",
                borderRadius: "999px",
                background: "var(--surface-strong)",
                overflow: "hidden",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: `${riskScore}%`,
                  height: "100%",
                  background:
                    riskScore >= 80
                      ? "linear-gradient(90deg, #ff8b6f, #ff5a5a)"
                      : riskScore >= 55
                        ? "linear-gradient(90deg, #ffd166, #ffb020)"
                        : "linear-gradient(90deg, #6ddc8a, #2f9e5f)",
                }}
              />
            </div>

            <div className="metric-grid metric-grid--three">
              <div style={chartPanelStyle}>
                <div className="metric-tile__label">Failure Probability</div>
                <div className="metric-tile__value" style={{ fontSize: "1.3rem" }}>
                  {riskScore}%
                </div>
              </div>
              <div style={chartPanelStyle}>
                <div className="metric-tile__label">Confidence</div>
                <div className="metric-tile__value" style={{ fontSize: "1.3rem" }}>
                  {selectedIncident.confidence}%
                </div>
              </div>
              <div style={chartPanelStyle}>
                <div className="metric-tile__label">Priority</div>
                <div className="metric-tile__value" style={{ fontSize: "1.3rem" }}>
                  {selectedIncident.priority}
                </div>
              </div>
            </div>

            <div style={chartPanelStyle}>
              <div className="metric-tile__label" style={{ marginBottom: "8px" }}>
                Prediction Summary
              </div>
              <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--text)" }}>
                  {selectedIncident.llm_explanation ||
                    "Elevated risk if response is delayed; continue real-time monitoring."}
                </strong>
              </div>

              {selectedIncident.decision?.recommended_action && (
                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border)",
                    color: "var(--accent-strong)",
                  }}
                >
                  Action: {selectedIncident.decision.recommended_action}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="panel-section panel-section--dashed" style={{ color: "var(--muted)" }}>
            Select an incident to view predictive risk details.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={chartPanelStyle}>
            <div style={{ marginBottom: "10px" }} className="metric-tile__label">
              Type Distribution
            </div>
            <div style={{ height: "220px" }}>
              <Bar data={typeBarData} options={baseBarOptions} />
            </div>
          </div>

          <div style={chartPanelStyle}>
            <div style={{ marginBottom: "10px" }} className="metric-tile__label">
              Confidence Histogram
            </div>
            <div style={{ height: "220px" }}>
              <Bar data={histogramData} options={baseBarOptions} />
            </div>
          </div>

          <div style={chartPanelStyle}>
            <div style={{ marginBottom: "10px" }} className="metric-tile__label">
              Cumulative Confidence
            </div>
            <div style={{ height: "220px" }}>
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
