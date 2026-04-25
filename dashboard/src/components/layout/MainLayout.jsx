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
    <div className="container app-shell">
      <Header />

      <div className="dashboard-main">
        <div className="dashboard-column dashboard-column--left">
          <IncidentFeed />
          <AlertsFeed />
          <ExecutionLog />
        </div>

        <div className="dashboard-column dashboard-column--center">
          <AIInsights />
          <DecisionPanel />
          <InputPanel />
        </div>

        <div className="dashboard-column dashboard-column--right">
          <DigitalTwin />
          <CCTVPanel />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
