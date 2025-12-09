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
  faChartPie,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "primereact/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";
import { useAuth } from "../contexts/AuthContext";
function SideBarMenu({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get("type");

  const isActive = (path) => location.pathname === path;
  const isKpiTypeActive = (t) => {
    return location.pathname === "/kpi" && type === String(t);
  };

  return (
    <div
      className={`sm:fixed sm:top-0 sm:left-0 sm:h-dvh bg-white flex flex-col transition-all duration-300 pt-5 shadow-md overflow-y-auto`}
      // className={`sm:fixed sm:top-0 sm:left-0 sm:h-dvh bg-grey-900 flex flex-col transition-all duration-300 pt-5 overflow-y-auto`}
      style={{ width: collapsed ? "5rem" : "19.25rem" }}
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
              to="/kpi?type=1"
              className={`p-3 rounded-lg block mb-3 ${
                isKpiTypeActive(1)
                  ? "text-white font-bold bg-teal-500"
                  : "text-gray-700 hover:text-teal-500"
              }`}
            >
              {!collapsed ? (
                "Policy"
              ) : (
                <div className="text-center">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
              )}
            </Link>
            <Link
              to="/kpi?type=2"
              className={`p-3 rounded-lg block mb-3 ${
                isKpiTypeActive(2)
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
            <Link
              to="/kpi?type=3"
              className={`p-3 rounded-lg block mb-3 ${
                isKpiTypeActive(3)
                  ? "text-white font-bold bg-teal-500"
                  : "text-gray-700 hover:text-teal-500"
              }`}
            >
              {!collapsed ? (
                "Routine"
              ) : (
                <div className="text-center">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
              )}
            </Link>
            <Link
              to="/kpi?type=4"
              className={`p-3 rounded-lg block mb-3 ${
                isKpiTypeActive(4)
                  ? "text-white font-bold bg-teal-500"
                  : "text-gray-700 hover:text-teal-500"
              }`}
            >
              {!collapsed ? (
                "Strategy"
              ) : (
                <div className="text-center">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
              )}
            </Link>
            <Link
              to="/kpiMedError"
              className={`p-3 rounded-lg block mb-3 ${
                isActive("/kpiMedError")
                  ? "text-white font-bold bg-teal-500"
                  : "text-gray-700 hover:text-teal-500"
              }`}
            >
              {!collapsed ? (
                "ตัวชี้วัดความเสี่ยง"
              ) : (
                <div className="text-center">
                  <FontAwesomeIcon icon={faChartPie} />
                </div>
              )}
            </Link>
            {user?.role !== 3 && (
              <>
                <hr className="text-gray-200 mb-3" />
                {!collapsed && <p className="p-3 text-gray-400">หลังบ้าน</p>}
                {[1, 2, 3].includes(user?.assign) && (
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
                )}
                {[1, 4].includes(user?.assign) && (
                  <>
                    <Link
                      to="/lookupOPD"
                      className={`p-3 rounded-lg block mb-3 ${
                        isActive("/lookupOPD")
                          ? "text-white font-bold bg-teal-500"
                          : "text-gray-700 hover:text-teal-500"
                      }`}
                    >
                      {!collapsed ? (
                        "จัดการชื่อ OPD"
                      ) : (
                        <div className="text-center">
                          <FontAwesomeIcon icon={faMarker} />
                        </div>
                      )}
                    </Link>
                    <Link
                      to="/lookupMedError"
                      className={`p-3 rounded-lg block mb-3 ${
                        isActive("/lookupMedError")
                          ? "text-white font-bold bg-teal-500"
                          : "text-gray-700 hover:text-teal-500"
                      }`}
                    >
                      {!collapsed ? (
                        "จัดการชื่อตัวชี้วัดความเสี่ยง"
                      ) : (
                        <div className="text-center">
                          <FontAwesomeIcon icon={faMarker} />
                        </div>
                      )}
                    </Link>
                  </>
                )}

                <hr className="text-gray-200 mb-3" />
                {!collapsed && (
                  <p className="p-3 text-gray-400">จัดการข้อมูล</p>
                )}
                {[1, 2].includes(user?.assign) && (
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
                )}
                {[1, 2, 3].includes(user?.assign) && (
                  <Link
                    to="/KpiFormQualityPage"
                    className={`p-3 rounded-lg block mb-3 ${
                      isActive("/KpiFormQualityPage")
                        ? "text-white font-bold bg-teal-500"
                        : "text-gray-700 hover:text-teal-500"
                    }`}
                  >
                    {!collapsed ? (
                      "จัดการข้อมูลตัวชี้วัดคุณภาพ"
                    ) : (
                      <div className="text-center">
                        <FontAwesomeIcon icon={faFilePen} />
                      </div>
                    )}
                  </Link>
                )}
                {[1, 4].includes(user?.assign) && (
                  <Link
                    to="/KpiMedFormPage"
                    className={`p-3 rounded-lg block mb-3 ${
                      isActive("/KpiMedFormPage")
                        ? "text-white font-bold bg-teal-500"
                        : "text-gray-700 hover:text-teal-500"
                    }`}
                  >
                    {!collapsed ? (
                      "จัดการข้อมูลตัวชี้วัดความเสี่ยง"
                    ) : (
                      <div className="text-center">
                        <FontAwesomeIcon icon={faFilePen} />
                      </div>
                    )}
                  </Link>
                )}
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
