import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import SideBarMenu from "../components/SideBarMenu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSliders,
  faTrash,
  faEdit,
  faPlus,
  faCheck,
  faXmark,
  faSave,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

import Logo from "../assets/logo.png";
function KpiFormPage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState([]);

  const [visible, setVisible] = useState(false);

  const [kpiData, setKpiData] = useState([]);
  const [kpiNames, setKpiNames] = useState([]);
  const [newKPI, setNewKPI] = useState("");
  const [editRowId, setEditRowId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const toast = useRef(null);
  // const API_BASE = "http://172.16.190.17:3000/api"
  const API_BASE = "http://172.16.39.6:3000/api";
  const token = localStorage.getItem("token");

  const fetchKpiData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/getKPIData`);
      setKpiData(response.data);
      setEditedData(response.data);
    } catch (error) {
      console.error("Failed to fetch KPI names:", error);
    }
  };

  const fetchKpiNames = async () => {
    try {
      const res = await axios.get(`${API_BASE}/getKPIName`);
      const options = res.data.map((item) => ({
        label: item.kpi_name,
        value: item.id,
      }));
      setKpiNames(options);
    } catch (error) {
      console.error("Failed to fetch KPI names:", error);
    }
  };

  useEffect(() => {
    fetchKpiData();
    fetchKpiNames();
  }, []);

  const handleFieldChange = (rowIndex, field, value) => {
    const updated = [...editedData];
    updated[rowIndex][field] = value;
    setEditedData(updated);
  };

  //
  const handleSaveAll = async () => {
    try {
      await axios.put(`${API_BASE}/updateKPINameBulk`, editedData, {
        headers: { token },
      });

      toast.current.show({
        severity: "success",
        summary: "สำเร็จ",
        detail: "บันทึกรายการเรียบร้อยแล้ว",
        life: 3000,
      });

      setIsEditMode(false);
      fetchKPInames();
    } catch (error) {
      console.error("Failed to save all edits:", error);
    }
  };

  const editableBody = (rowData, options) => {
    const rowIndex = options.rowIndex;
    const field = options.field;

    if (isEditMode) {
      return (
        <InputText
          value={editedData[rowIndex][field] ?? ""}
          onChange={(e) => handleFieldChange(rowIndex, field, e.target.value)}
          className="w-full"
        />
      );
    }
    return rowData[field];
  };
  //

  const handleAdd = async () => {
    if (newKPI.trim() === "") return;

    try {
      await axios.post(`${API_BASE}/createKPIName`, [{ kpi_name: newKPI }], {
        headers: { token },
      });

      toast.current.show({
        severity: "success",
        summary: "สำเร็จ",
        detail: "เพิ่มตัวชี้วัดใหม่แล้ว",
        life: 3000,
      });

      fetchKPInames();
      setNewKPI("");
    } catch (error) {
      console.error("Failed to add KPI:", error);
    }
  };

  const handleEditSave = async (id) => {
    try {
      await axios.put(
        `${API_BASE}/updateKPIData`,
        [{ id, kpi_name: editValue }],
        {
          headers: {
            token: token,
          },
        }
      );
      toast.current.show({
        severity: "success",
        summary: "สำเร็จ",
        detail: "บันทึกรายการเรียบร้อยแล้ว",
        life: 3000,
      });
      fetchKPInames();
      setEditRowId(null);
      setEditValue("");
    } catch (error) {
      console.error("Failed to update KPI:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/deleteKPIName/${id}`, {
        headers: {
          token: token,
        },
      });
      toast.current.show({
        severity: "success",
        summary: "สำเร็จ",
        detail: "ลบรายการเรียบร้อยแล้ว",
        life: 3000,
      });
      fetchKPInames(); // refresh table
    } catch (error) {
      console.error("Failed to delete KPI:", error);
    }
  };

  const confirm1 = (rowId) => {
    confirmDialog({
      message: "ต้องการบันทึกรายการนี้หรือไม่",
      header: "บันทึกรายการ",
      acceptClassName: "p-button-success",
      accept: () => handleEditSave(rowId),
    });
  };

  const confirm2 = (rowId) => {
    confirmDialog({
      message: "ต้องการลบรายการนี้หรือไม่",
      header: "ลบรายการ",
      acceptClassName: "p-button-danger",
      accept: () => handleDelete(rowId),
    });
  };

  const editActionBody = (rowData) => {
    if (editRowId === rowData.id) {
      return (
        <div className="flex gap-2">
          <Button
            icon={<FontAwesomeIcon icon={faCheck} />}
            className="p-button-success p-button-sm"
            onClick={() => confirm1(rowData.id)}
          />
          <Button
            icon={<FontAwesomeIcon icon={faXmark} />}
            className="p-button-secondary p-button-sm"
            onClick={cancelEdit}
          />
        </div>
      );
    }

    return (
      <Button
        icon={<FontAwesomeIcon icon={faEdit} />}
        className="p-button-warning p-button-sm"
        onClick={() => {
          setEditRowId(rowData.id);
          setEditValue(rowData.kpi_name);
        }}
      />
    );
  };

  const deleteActionBody = (rowData) => {
    return (
      <Button
        icon={<FontAwesomeIcon icon={faTrash} />}
        className="p-button-danger p-button-sm"
        onClick={() => confirm2(rowData.id)}
      />
    );
  };

  const kpiNameBody = (rowData) => {
    return editRowId === rowData.id ? (
      <InputText
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="w-full"
      />
    ) : (
      rowData.kpi_name
    );
  };

  const cancelEdit = () => {
    setEditRowId(null);
    setEditValue("");
  };

  const onCellEditComplete = async (e) => {
    let { rowData, newValue, field, originalEvent: event } = e;

    if (!newValue || newValue === rowData[field]) {
      event.preventDefault(); // ยกเลิกถ้าไม่มีการเปลี่ยนแปลง
      return;
    }

    try {
      let valueToSend = newValue;

      // If editing timestamp (month picker), normalize to YYYY-MM-01
      if (field === "timestamp" && newValue instanceof Date) {
        const year = newValue.getFullYear();
        const month = (newValue.getMonth() + 1).toString().padStart(2, "0");
        valueToSend = `${year}-${month}-01`;
      }

      const updatedRow = { ...rowData, [field]: valueToSend };

      await axios.put(
        `${API_BASE}/updateKPIData`,
        [updatedRow], // backend รับ array
        {
          headers: { token },
        }
      );

      rowData[field] = valueToSend;

      toast.current.show({
        severity: "success",
        summary: "สำเร็จ",
        detail: "อัพเดตข้อมูลเรียบร้อยแล้ว",
        life: 3000,
      });
    } catch (error) {
      console.error("Failed to update KPI:", error);
      event.preventDefault(); // rollback ถ้า save ไม่สำเร็จ
    }
  };

  // editor (ช่องที่แก้ไขได้)
  const textEditor = (options) => {
    return (
      <InputText
        type="text"
        value={options.value ?? ""}
        onChange={(e) => options.editorCallback(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()} // ป้องกัน key event ไปชน DataTable
        className="w-full"
      />
    );
  };

  const kpiNameEditor = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={kpiNames}
        onChange={(e) => options.editorCallback(e.value)}
        placeholder="Select KPI"
        className="w-full"
      />
    );
  };

  const typeOptions = [
    { label: "ไทย", value: "ไทย" },
    { label: "ต่างชาติ", value: "ต่างชาติ" },
  ];

  const dropdownEditor = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={typeOptions}
        onChange={(e) => options.editorCallback(e.value)}
        placeholder="เลือกประเภท"
        className="w-full"
      />
    );
  };

  const monthEditor = (options) => {
    return (
      <Calendar
        value={options.value ? new Date(options.value) : null}
        onChange={(e) => options.editorCallback(e.value)}
        view="month"
        dateFormat="mm/yy"
        showIcon
      />
    );
  };

  return (
    <div className="Home-page h-dvh flex overflow-hidden">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div
        className={`flex-1 transition-all duration-300 p-4 sm:p-8 pt-5 overflow-auto`}
      >
        <div className="flex items-center mb-5">
          <h5 className="text-2xl font-semibold">เพิ่มข้อมูล</h5>
        </div>

        {isEditMode ? (
          <div className="flex gap-2">
            <Button
              label="บันทึกทั้งหมด"
              icon={<FontAwesomeIcon icon={faSave} />}
              className="p-button-success"
              onClick={handleSaveAll}
            />
            <Button
              label="ยกเลิก"
              icon={<FontAwesomeIcon icon={faTimes} />}
              className="p-button-secondary"
              onClick={() => {
                setIsEditMode(false);
                setEditedData(kpiData); // reset changes
              }}
            />
          </div>
        ) : (
          <Button
            label="แก้ไขทั้งหมด"
            icon={<FontAwesomeIcon icon={faEdit} />}
            className="p-button-warning"
            onClick={() => setIsEditMode(true)}
          />
        )}

        <div className="">
          <div className="flex gap-2 my-3">
            <InputText
              value={newKPI}
              onChange={(e) => setNewKPI(e.target.value)}
              placeholder="ชื่อตัวชี้วัดใหม่"
            />
            <Button
              icon={<FontAwesomeIcon icon={faPlus} />}
              className="p-button-success"
              onClick={handleAdd}
            />
          </div>
          <DataTable
            value={kpiData}
            editMode="cell"
            showGridlines
            tableStyle={{ minWidth: "60rem" }}
            // resizableColumns
          >
            <Column field="id" header="ID" style={{ width: "5%" }} />
            <Column
              field="kpi_name"
              header="ชื่อตัวชี้วัด"
              body={(rowData) => {
                // Find the label from kpiNames based on kpi_id
                const option = kpiNames.find(
                  (item) => item.value === rowData.kpi_name
                );
                return option ? option.label : rowData.kpi_name;
              }}
              editor={kpiNameEditor}
              onCellEditComplete={onCellEditComplete}
            />
            <Column
              field="a_name"
              header="a_name"
              editor={textEditor}
              onCellEditComplete={onCellEditComplete}
            />
            <Column
              field="b_name"
              header="b_name"
              editor={textEditor}
              onCellEditComplete={onCellEditComplete}
            />
            <Column
              field="a_value"
              header="a_value"
              editor={textEditor}
              onCellEditComplete={onCellEditComplete}
            />
            <Column
              field="b_value"
              header="b_value"
              editor={textEditor}
              onCellEditComplete={onCellEditComplete}
            />
            <Column
              field="type"
              header="type"
              editor={dropdownEditor}
              onCellEditComplete={onCellEditComplete}
            />
            <Column
              field="timestamp"
              header="timestamp"
              editor={monthEditor}
              onCellEditComplete={onCellEditComplete}
              body={(rowData) => {
                const date = new Date(rowData.timestamp);
                return date.toLocaleDateString("en-GB", {
                  month: "2-digit",
                  year: "numeric",
                });
              }}
            />
          </DataTable>
        </div>
      </div>
    </div>
  );
}

export default KpiFormPage;
