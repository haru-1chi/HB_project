import React, { useState, useEffect } from "react";
import { Sidebar } from "primereact/sidebar";
import { Checkbox } from "primereact/checkbox";
function SideBarMenu({
  visible,
  setVisible,
  data,
  selectedOpdNames,
  handleCheckboxChange,
}) {
  return (
    <div className="card h-dvh bg-white">
      <Sidebar visible={visible} onHide={() => setVisible(false)}>
        <div className="my-4 gap-4">
          {data?.map((item, index) => (
            <div key={index} className="mb-2 items-center">
              <Checkbox
                inputId={`cb-${index}`}
                checked={selectedOpdNames.includes(item.OPD_NAME)}
                onChange={() => handleCheckboxChange(item.OPD_NAME)}
              />
              <label htmlFor={`cb-${index}`} className="ml-2">
                {item.OPD_NAME}
              </label>
            </div>
          ))}
        </div>
      </Sidebar>
    </div>
  );
}

export default SideBarMenu;
