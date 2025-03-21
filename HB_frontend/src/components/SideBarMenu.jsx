import React, { useState, useEffect } from "react";
import { Sidebar } from "primereact/sidebar";
import { Checkbox } from "primereact/checkbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders } from "@fortawesome/free-solid-svg-icons";
import { Button } from "primereact/button";
function SideBarMenu({
  visible,
  setVisible,
  allOpdChoices,
  selectedOpdNames,
  handleCheckboxChange,
  setSelectedOpdNames,
}) {
  const isAllChecked =
  allOpdChoices?.length > 0 && selectedOpdNames.length === allOpdChoices.length;

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
      <span className="font-bold">กรอง</span>
    </div>
  );

  return (
    <div className="card h-dvh bg-white">
      <Sidebar
        header={customHeader}
        visible={visible}
        onHide={() => setVisible(false)}
      >
        <div>
          <div className="flex justify-between mb-3 items-center">
            <div className="flex items-center">
              <Checkbox
                inputId="check-all"
                checked={isAllChecked}
                onChange={toggleCheckAll}
              />
              <label htmlFor="check-all" className="ml-2">
                ทั้งหมด
              </label>
            </div>
            <Button
              label={
                <>
                  <FontAwesomeIcon icon={faSliders} className="mr-2" />
                  ล้างตัวกรอง
                </>
              }
              onClick={() => setSelectedOpdNames([])}
              text
              className=""
              unstyled
            />
          </div>

          {allOpdChoices?.map((opd, index) => (
          <div key={index} className="mb-3 items-center">
            <Checkbox
              inputId={`cb-${index}`}
              checked={selectedOpdNames.includes(opd)}
              onChange={() => handleCheckboxChange(opd)}
            />
            <label htmlFor={`cb-${index}`} className="ml-2">
              {opd}
            </label>
          </div>
        ))}
        </div>
      </Sidebar>
    </div>
  );
}

export default SideBarMenu;
