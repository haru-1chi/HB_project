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
  faMarker,
  faUser,
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
      className={`sm:fixed sm:top-0 sm:left-0 sm:h-dvh bg-white flex flex-col transition-all duration-300 pt-5`}
      style={{ width: collapsed ? "4rem" : "18.75rem" }}
    >
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

      <div className="flex flex-col flex-grow px-2">
        {user?.verify === 1 && (
          <>
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
                "Quality & Safety"
              ) : (
                <div className="text-center">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
              )}
            </Link>
            {user?.role !== 3 && (
              <>
                <Link
                  to="/lookup"
                  className={`p-3 rounded-lg block mb-3 ${
                    isActive("/lookup")
                      ? "text-white font-bold bg-teal-500"
                      : "text-gray-700 hover:text-teal-500"
                  }`}
                >
                  {!collapsed ? (
                    "จัดการชื่อตัวชี้วัด"
                  ) : (
                    <div className="text-center">
                      <FontAwesomeIcon icon={faMarker} />
                    </div>
                  )}
                </Link>

                <Link
                  to="/KpiFormPage"
                  className={`p-3 rounded-lg block mb-3 ${
                    isActive("/KpiFormPage")
                      ? "text-white font-bold bg-teal-500"
                      : "text-gray-700 hover:text-teal-500"
                  }`}
                >
                  {!collapsed ? (
                    "จัดการข้อมูลตัวชี้วัด"
                  ) : (
                    <div className="text-center">
                      <FontAwesomeIcon icon={faFilePen} />
                    </div>
                  )}
                </Link>
              </>
            )}
          </>
        )}
      </div>

      <div className="mt-auto px-2 py-4">
        <Link
          to="/Profile"
          className={`p-3 rounded-lg block mb-3 ${
            isActive("/Profile")
              ? "text-white font-bold bg-teal-500"
              : "text-gray-700 hover:text-teal-500"
          }`}
        >
          {!collapsed && user ? (
            <div className="flex items-center">
              <FontAwesomeIcon icon={faUser} />
              <p className="ml-3">{user?.name || "ตั้งค่าโปรไฟล์"}</p>
            </div>
          ) : (
            <div className="text-center">
              <FontAwesomeIcon icon={faUser} />
            </div>
          )}
        </Link>
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
