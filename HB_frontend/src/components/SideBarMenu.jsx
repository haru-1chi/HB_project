// SideBarMenu.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartColumn,
  faChartLine,
  faFilePen,
  faArrowRightFromBracket,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "primereact/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";
import { useAuth } from "../contexts/AuthContext";
function SideBarMenu({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div
      className={`fixed top-0 left-0 h-dvh bg-white flex flex-col transition-all duration-300 pt-5`}
      style={{ width: collapsed ? "4rem" : "18.75rem" }} // adjust width
    >
      {/* Collapse button */}

      {/* Logo */}
      {!collapsed ? (
        <div className="flex justify-between items-center mb-4 pl-4 pr-2">
          <div className="flex items-center ">
            <img className="w-15 mr-3" src={Logo} alt="" />
            <h5 className="text-lg font-bold text-teal-500">MaeSot Hospital</h5>
          </div>

          <Button
            icon={
              <FontAwesomeIcon
                icon={collapsed ? faChevronRight : faChevronLeft}
              />
            }
            text
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>
      ) : (
        <div className="p-2">
          <Button
            icon={
              <FontAwesomeIcon
                icon={collapsed ? faChevronRight : faChevronLeft}
              />
            }
            text
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>
      )}

      {/* Links */}
      <div className="flex flex-col flex-grow px-2">
        <Link
          to="/"
          className={`p-3 rounded-lg block mb-3 ${
            isActive("/")
              ? "text-white font-bold bg-teal-500"
              : "text-gray-700 hover:text-teal-500"
          }`}
        >
          {!collapsed ? (
            "สถิติทั่วไป"
          ) : (
            <div className="text-center">
              <FontAwesomeIcon icon={faChartColumn} />
            </div>
          )}
        </Link>

        <Link
          to="/kpi"
          className={`p-3 rounded-lg block mb-3 ${
            isActive("/kpi")
              ? "text-white font-bold bg-teal-500"
              : "text-gray-700 hover:text-teal-500"
          }`}
        >
          {!collapsed ? (
            "ตัวชี้วัดอัตราการเสียชีวิต"
          ) : (
            <div className="text-center">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
          )}
        </Link>

        <Link
          to="/lookup"
          className={`p-3 rounded-lg block mb-3 ${
            isActive("/lookup")
              ? "text-white font-bold bg-teal-500"
              : "text-gray-700 hover:text-teal-500"
          }`}
        >
          {!collapsed ? (
            "จัดการตัวชี้วัด"
          ) : (
            <div className="text-center">
              <FontAwesomeIcon icon={faFilePen} />
            </div>
          )}
        </Link>
      </div>

      {/* Logout */}
      <div className="mt-auto px-2 py-4">
        {!collapsed && user && (
          <div className="p-3 mb-2 border-b border-gray-300">
            {user.name}
          </div>
        )}
        <Button
          icon={<FontAwesomeIcon icon={faArrowRightFromBracket} />}
          label={!collapsed ? "ออกจากระบบ" : ""}
          text
          className="w-full text-left"
          onClick={logout}
        />
      </div>
    </div>
  );
}

export default SideBarMenu;
