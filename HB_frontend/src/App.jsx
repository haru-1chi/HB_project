import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import KpiDashboard from "./pages/KpiDashboard";
import Lookup from "./pages/Lookup";
import KpiFormPage from "./pages/KpiFormPage";
import Login from "./pages/Login";
import ProtectedRoute from "./contexts/ProtectedRoute";
import Layout from "./contexts/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import ConditionalStyleDemo from "./pages/test";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="bg-[#F2F8FD]">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/test1" element={<ConditionalStyleDemo />} />
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
                path="/lookup"
                element={
                  <ProtectedRoute>
                    <Lookup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/KpiFormPage"
                element={
                  <ProtectedRoute>
                    <KpiFormPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>

    // <Router>
    //   <AuthProvider>
    //     <div className="bg-[#F2F8FD]">
    //       <Routes>
    //         <Route path="/login" element={<Login />} />

    //         {/* <Route element={<Layout />}> */}
    //           <Route path="/" element={<Home />} />
    //           <Route
    //             path="/kpi"
    //             element={
    //               <ProtectedRoute>
    //                 <KpiDashboard />
    //               </ProtectedRoute>
    //             }
    //           />
    //           <Route
    //             path="/lookup"
    //             element={
    //               <ProtectedRoute>
    //                 <Lookup />
    //               </ProtectedRoute>
    //             }
    //           />
    //         {/* </Route> */}
    //       </Routes>
    //     </div>
    //   </AuthProvider>
    // </Router>
  );
}

export default App;
