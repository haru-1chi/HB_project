import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { setAuthErrorInterceptor } from "../utils/axiosInstance";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // Save token
      localStorage.setItem("token", data.token);
      setToken(data.token);

      const profileRes = await fetch(`${API_BASE}/me`, {
        method: "POST",
        headers: { token: data.token },
      });
      const profile = await profileRes.json();
      setUser(profile.data);

      navigate("/");
    } catch (err) {
      throw err;
    }
  };

  const logout = useCallback(() => {
    // 💡 Wrap in useCallback
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const profileRes = await fetch(`${API_BASE}/me`, {
          method: "POST",
          headers: { token: storedToken },
        });
        const profile = await profileRes.json();
        setUser(profile.data);
      } catch {
        setUser(null);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const dummyToast = (severity, summary, detail) => {
      console.error("Interceptor Toast:", summary, detail);
    };

    setAuthErrorInterceptor(logout, dummyToast, navigate);
  }, [logout, navigate]);

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, setToken, login, logout, loading }}
    >
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
