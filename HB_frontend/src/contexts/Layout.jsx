import React, { useState } from "react";
import SideBarMenu from "../components/SideBarMenu";
import { Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <SideBarMenu collapsed={collapsed} setCollapsed={setCollapsed} />
      <div>
        <Outlet context={{ collapsed }} />
      </div>
    </div>
  );
}

export default Layout;
