import Header from "./Header";

import IncidentFeed from "../panels/IncidentFeed";
import DecisionPanel from "../panels/DecisionPanel";
import DigitalTwin from "../panels/DigitalTwin";
import AlertsFeed from "../panels/AlertsFeed";
import AIInsights from "../panels/AIInsights";
import ExecutionLog from "../panels/ExecutionLog";
import InputPanel from "../panels/InputPanel";

const MainLayout = () => {
  return (
    <div className="container">
      <Header />

      {/* TOP GRID */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "1fr 1.8fr 1.35fr",
          marginTop: "16px",
        }}
      >
        <IncidentFeed />
        <DecisionPanel />
        <DigitalTwin />
      </div>

      {/* MIDDLE GRID */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "1fr 2fr",
          marginTop: "16px",
        }}
      >
        <AlertsFeed />
        <AIInsights />
      </div>

      {/* BOTTOM GRID */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "2fr 1fr",
          marginTop: "16px",
        }}
      >
        <ExecutionLog />
        <InputPanel />
      </div>
    </div>
  );
};

export default MainLayout;
