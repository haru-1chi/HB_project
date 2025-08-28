import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import KpiDashboard from "./pages/KpiDashboard";
import Lookup from "./pages/Lookup";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
function App() {
  return (
    <Router>
      <div className="bg-[#F2F8FD]">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/kpi"
            element={
              <ProtectedRoute>
                <KpiDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lookup"
            element={
              <ProtectedRoute>
                <Lookup />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
