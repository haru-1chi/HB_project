import React, { useState, useRef } from "react";
import { Sidebar } from "primereact/sidebar";
import { Checkbox } from "primereact/checkbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSliders,
  faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "primereact/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";

function SideBarMenu({
  visible,
  setVisible,
  allOpdChoices,
  selectedOpdNames,
  handleCheckboxChange,
  setSelectedOpdNames,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const isAllChecked =
    allOpdChoices?.length > 0 &&
    selectedOpdNames.length === allOpdChoices.length;

  const toggleCheckAll = () => {
    if (isAllChecked) {
      setSelectedOpdNames([]); // Uncheck all
    } else {
      setSelectedOpdNames(allOpdChoices); // Check all
    }
  };

  const customHeader = (
    <div className="flex items-center gap-2 text-xl">
      <FontAwesomeIcon icon={faSliders} />
      <span className="font-bold">Maesot Hospital</span>
    </div>
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="fixed top-0 left-0 card h-dvh bg-white w-75 p-4  flex flex-col">
      {/* <Sidebar
        header={customHeader}
        visible={visible}
        position="left"
        onHide={() => setVisible(false)}
      > */}
      <div className="flex items-center mb-4">
        <img className="w-15 mr-3" src={Logo} alt="" />
        <h5 className="text-lg font-bold text-teal-500">MaeSot Hospital</h5>
      </div>
      <div className="flex flex-col justify-between flex-grow">
        <div>
          <Link
            to="/"
            className={`p-3 rounded-lg block mb-3 ${
              isActive("/")
                ? "text-white font-bold bg-teal-500"
                : "text-gray-700 hover:text-teal-500"
            }`}
          >
            <p>สถิติทั่วไป</p>
          </Link>
          <Link
            to="/kpi"
            className={`p-3 rounded-lg block mb-3 ${
              isActive("/kpi")
                ? "text-white font-bold bg-teal-500"
                : "text-gray-700 hover:text-teal-500"
            }`}
          >
            <p>ตัวชี้วัดอัตราการเสียชีวิต</p>
          </Link>

          <Link
            to="/lookup"
            className={`p-3 rounded-lg block mb-3 ${
              isActive("/lookup")
                ? "text-white font-bold bg-teal-500"
                : "text-gray-700 hover:text-teal-500"
            }`}
          >
            <p>จัดการตัวชี้วัด</p>
          </Link>
        </div>
        <div className="mt-auto">
          <div className="p-3 mb-2 border-b-1 border-gray-300">นาย วสันต์ ปราการทอง</div>
          <Button
            icon={<FontAwesomeIcon icon={faArrowRightFromBracket} />}
            label={"ออกจากระบบ"}
            text
            className="w-full text-left"
            onClick={handleLogout}
            pt={{
              root: {
                style: {
                  padding: " 0.5rem 0.75rem",
                },
              },
              label: {
                style: {
                  flex: "0 0 auto",
                  marginLeft: "0.5rem",
                },
              },
            }}
          />
        </div>
      </div>
      {/* </Sidebar> */}
    </div>
  );
}

export default SideBarMenu;
