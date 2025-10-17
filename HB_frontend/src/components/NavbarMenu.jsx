import React, { useState, useEffect } from "react";
import Logo from "../assets/logo.png";
import { Button } from "primereact/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { Sidebar } from "primereact/sidebar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
function NavbarMenu() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const isActive = (path) => location.pathname === path;
  const customHeader = (
    <div className="flex items-center">
      <img className="w-15 mr-3" src={Logo} alt="" />
      <h5 className="text-lg font-bold text-teal-500">MaeSot Hospital</h5>
    </div>
  );

  return (
    <>
      <div className="w-full fixed top-0 left-0 flex justify-between items-center z-1 bg-white p-3 shadow-md">
        <div className="flex items-center">
          <img className="w-15 mr-3" src={Logo} alt="" />
          <h5 className="text-lg font-bold text-teal-500">MaeSot Hospital</h5>
        </div>
        <Button
          label={<FontAwesomeIcon icon={faBars} />}
          text
          onClick={() => setVisible(true)}
        />
      </div>

      <Sidebar
        header={customHeader}
        visible={visible}
        onHide={() => setVisible(false)}
        className="p-sidebar-sm"
      >
        <div
          className={`h-full bg-white flex flex-col justify-between transition-all duration-300 pt-5`}
        >
          <div className="flex flex-col flex-grow px-2">
            <Link
              to="/"
              className={`p-3 rounded-lg block mb-3 ${
                isActive("/")
                  ? "text-white font-bold bg-teal-500"
                  : "text-gray-700 hover:text-teal-500"
              }`}
            >
              สถิติทั่วไป
            </Link>

            <Link
              to="/kpi"
              className={`p-3 rounded-lg block mb-3 ${
                isActive("/kpi")
                  ? "text-white font-bold bg-teal-500"
                  : "text-gray-700 hover:text-teal-500"
              }`}
            >
              ตัวชี้วัดอัตราการเสียชีวิต
            </Link>

            <Link
              to="/lookup"
              className={`p-3 rounded-lg block mb-3 ${
                isActive("/lookup")
                  ? "text-white font-bold bg-teal-500"
                  : "text-gray-700 hover:text-teal-500"
              }`}
            >
              จัดการชื่อตัวชี้วัด
            </Link>
          </div>

          <div className="mt-auto px-2 py-4">
            <div className="p-3 mb-2 border-b border-gray-300">{user.name}</div>

            <Button
              icon={<FontAwesomeIcon icon={faArrowRightFromBracket} />}
              label={"ออกจากระบบ"}
              text
              className="w-full text-left"
              onClick={logout}
            />
          </div>
        </div>
      </Sidebar>
    </>
  );
}

export default NavbarMenu;
