import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./styles/global.css";
import "./styles/variables.css";

import { AppProvider } from "./context/AppContext"; // 👈 ADD THIS

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>   {/* 👈 WRAP HERE */}
      <App />
    </AppProvider>
  </React.StrictMode>
);