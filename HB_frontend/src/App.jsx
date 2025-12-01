import React from "react";
// import "primereact/resources/themes/lara-dark-blue/theme.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import { BrowserRouter as BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import KpiDashboard from "./pages/KpiDashboard";
import KpiDashboardMedError from "./pages/KpiDashboardMedError";
import Lookup from "./pages/Lookup";
import LookupMedError from "./pages/LookupMedError";
import LookupOPD from "./pages/LookupOPD";
import KpiFormPage from "./pages/KpiFormPage";
import KpiFormQualityPage from "./pages/KpiFormQualityPage";
import KpiMedFormPage from "./pages/KpiMedFormPage";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProtectedRoute from "./contexts/ProtectedRoute";
import Layout from "./contexts/Layout";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <BrowserRouter basename="/HB_project/">
        <AuthProvider>
          {/* <div className="bg-[#191b24]"> */}
          <div className="bg-[#F2F8FD]">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<Layout />}>
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
                  path="/kpiMedError"
                  element={
                    <ProtectedRoute>
                      <KpiDashboardMedError />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lookup"
                  element={
                    <ProtectedRoute roles={[1, 2]}>
                      <Lookup />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lookupOPD"
                  element={
                    <ProtectedRoute roles={[1, 2]}>
                      <LookupOPD />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lookupMedError"
                  element={
                    <ProtectedRoute roles={[1, 2]}>
                      <LookupMedError />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/KpiFormPage"
                  element={
                    <ProtectedRoute roles={[1, 2]}>
                      <KpiFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/KpiFormQualityPage"
                  element={
                    <ProtectedRoute roles={[1, 2]}>
                      <KpiFormQualityPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/KpiMedFormPage"
                  element={
                    <ProtectedRoute roles={[1, 2]}>
                      <KpiMedFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/Profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </div>
        </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
