import React, { useState, useEffect } from "react";
import { Sidebar } from "primereact/sidebar";
import { Checkbox } from "primereact/checkbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSliders,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
function SideBarFilter({
  visible,
  setVisible,
  allOpdChoices,
  selectedOpdNames,
  handleCheckboxChange,
  setSelectedOpdNames,
}) {
  const [searchTerm, setSearchTerm] = useState("");

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
      <span className="font-bold">กรอง</span>
    </div>
  );

  const filteredOpdChoices = allOpdChoices?.filter((opd) =>
    opd.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card h-dvh bg-white">
      <Sidebar
        header={customHeader}
        visible={visible}
        position="right"
        onHide={() => setVisible(false)}
      >
        <div>
          <div className="flex mb-3 mt-1">
            <IconField iconPosition="left">
              <InputIcon>
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </InputIcon>
              <InputText
                placeholder="ค้นหา"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-inputtext-sm"
              />
            </IconField>
          </div>
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
              className="text-blue-500 hover:bg-blue-50 cursor-pointer px-3 py-1 rounded-md"
              unstyled
            />
          </div>

          {filteredOpdChoices?.map((opd, index) => (
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

           {filteredOpdChoices?.length === 0 && (
            <p className="text-gray-400 text-center mt-4">ไม่พบข้อมูล</p>
          )}
        </div>
      </Sidebar>
    </div>
  );
}

export default SideBarFilter;
