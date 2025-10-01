// Layout.jsx
import React, { useState } from "react";
import SideBarMenu from "../components/SideBarMenu";
import { Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <div>
      {user && (
        <SideBarMenu collapsed={collapsed} setCollapsed={setCollapsed} />
      )}

      <div
        className="transition-all duration-300"
        style={{
          marginLeft: user ? (collapsed ? "4rem" : "18.75rem") : 0,
        }}
      >
        <Outlet context={user ? { collapsed } : {}} />
      </div>
    </div>
  );
}

export default Layout;
