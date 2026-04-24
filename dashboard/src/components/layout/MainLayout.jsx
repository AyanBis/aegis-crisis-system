import Header from "./Header";

import IncidentFeed from "../panels/IncidentFeed";
import DecisionPanel from "../panels/DecisionPanel";
import DigitalTwin from "../panels/DigitalTwin";
import AlertsFeed from "../panels/AlertsFeed";
import AIInsights from "../panels/AIInsights";
import ExecutionLog from "../panels/ExecutionLog";
import InputPanel from "../panels/InputPanel";
import CCTVPanel from "../panels/CCTVPanel";

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
        {/* Swapped: AI Insights is now in the top row */}
        <AIInsights /> 
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
        {/* Swapped: Decision Panel is now in the middle row */}
        <DecisionPanel /> 
      </div>

      {/* BOTTOM GRID */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "1.5fr 1fr 1fr",
          marginTop: "16px",
        }}
      >
        <ExecutionLog />
        <InputPanel />
        <CCTVPanel />
      </div>
    </div>
  );
};

export default MainLayout;