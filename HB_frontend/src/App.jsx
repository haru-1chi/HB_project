import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import KpiDashboard from "./pages/KpiDashboard";
import Lookup from "./pages/Lookup";

function App() {
  return (
    <Router>
      <div className="bg-[#F2F8FD]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kpi" element={<KpiDashboard />} />
          <Route path="/lookup" element={<Lookup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
