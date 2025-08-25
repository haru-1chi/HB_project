import React, { useState, useRef } from "react";
import { Sidebar } from "primereact/sidebar";
import { Checkbox } from "primereact/checkbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders } from "@fortawesome/free-solid-svg-icons";
import { Button } from "primereact/button";
import { Link, useLocation } from "react-router-dom";
import Logo from "../assets/logo.png";

function SideBarMenu({
  visible,
  setVisible,
  allOpdChoices,
  selectedOpdNames,
  handleCheckboxChange,
  setSelectedOpdNames,
}) {
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

  return (
    <div className="card h-dvh bg-white w-75 p-4">
      {/* <Sidebar
        header={customHeader}
        visible={visible}
        position="left"
        onHide={() => setVisible(false)}
      > */}
      <div className="flex items-center mb-4">
        <img className="w-15 mr-3" src={Logo} alt="" />
        <h5 className="text-lg font-bold text-green-900">MaeSot Hospital</h5>
      </div>
      <div>
        <Link
          to="/"
          className={`p-3 rounded-lg block mb-3 ${
            isActive("/")
              ? "text-white font-bold bg-green-900"
              : "text-gray-700 hover:text-green-900"
          }`}
        >
          <p>สถิติทั่วไป</p>
        </Link>
        <Link
          to="/kpi"
          className={`p-3 rounded-lg block mb-3 ${
            isActive("/kpi")
              ? "text-white font-bold bg-green-900"
              : "text-gray-700 hover:text-green-900"
          }`}
        >
          <p>ตัวชี้วัดอัตราการเสียชีวิต</p>
        </Link>

        <Link
          to="/lookup"
          className={`p-3 rounded-lg block mb-3 ${
            isActive("/lookup")
              ? "text-white font-bold bg-green-900"
              : "text-gray-700 hover:text-green-900"
          }`}
        >
          <p>จัดการตัวชี้วัด</p>
        </Link>
      </div>
      {/* </Sidebar> */}
    </div>
  );
}

export default SideBarMenu;
