import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../contexts/AuthContext";
//พิเศษ
const ProtectedRoute = ({ children, roles = [] }) => {
  const token = localStorage.getItem("token");
  const { user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp && decoded.exp < currentTime) {
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

