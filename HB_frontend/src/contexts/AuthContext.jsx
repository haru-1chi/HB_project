import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const login = async (username, password) => {
    try {
      const res = await fetch("http://172.16.190.17:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // Save token
      localStorage.setItem("token", data.token);
      setToken(data.token);

      const profileRes = await fetch("http://172.16.39.6:3000/api/me", {
        method: "POST",
        headers: {
          token: data.token,
        },
      });
      const profile = await profileRes.json();
      setUser(profile.data);

      navigate("/kpi");
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) return;

      try {
        const profileRes = await fetch("http://172.16.39.6:3000/api/me", {
          method: "POST",
          headers: { token: storedToken },
        });
        const profile = await profileRes.json();
        setUser(profile.data);
      } catch {
        setUser(null);
        localStorage.removeItem("token");
      }
    };
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
