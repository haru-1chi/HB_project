import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";

import SideBarMenu from "../components/SideBarMenu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSliders,
  faTrash,
  faEdit,
  faPlus,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import Logo from "../assets/logo.png";

function Lookup() {
  const [visible, setVisible] = useState(false);
  const [allKPIChoices, setAllKPIChoices] = useState([]);
  const [newKPI, setNewKPI] = useState("");
  const [editRowId, setEditRowId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const toast = useRef(null);
  const API_BASE = "http://172.16.190.17:3000/api";
  const token = localStorage.getItem("token");

  const fetchKPInames = async () => {
    try {
      const response = await axios.get(`${API_BASE}/getKPIName`);
      setAllKPIChoices(response.data);
    } catch (error) {
      console.error("Failed to fetch KPI names:", error);
    }
  };

  useEffect(() => {
    fetchKPInames();
  }, []);

  const handleAdd = async () => {
    if (newKPI.trim() === "") return;

    try {
      const response = await axios.post(
        `${API_BASE}/createKPIName`,
        [{ kpi_name: newKPI }],
        {
          headers: {
            token: token,
          },
        }
      );
      console.log(response.data);
      fetchKPInames();
      setNewKPI("");
    } catch (error) {
      console.error("Failed to add KPI:", error);
    }
  };

  const handleEditSave = async (id) => {
    try {
      await axios.put(
        `${API_BASE}/updateKPIName`,
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

  return (
    <div className="Home-page h-dvh flex">
      <Toast ref={toast} />
      <ConfirmDialog />
      <SideBarMenu visible={visible} setVisible={setVisible} />
      <div className="ml-75 w-full p-4 sm:p-8 pt-5">
        <div className="flex items-center mb-5">
          <h5 className="text-2xl font-semibold">เพิ่มตัวชี้วัด</h5>
        </div>

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
          <DataTable value={allKPIChoices} tableStyle={{ minWidth: "50rem" }}>
            <Column field="id" header="ID" style={{ width: "5%" }}></Column>
            <Column
              field="kpi_name"
              header="ชื่อตัวชี้วัด"
              body={kpiNameBody}
            ></Column>
            <Column
              header="แก้ไข"
              body={editActionBody}
              style={{ width: "10%" }}
            />
            <Column
              header="ลบ"
              body={deleteActionBody}
              style={{ width: "10%" }}
            />
          </DataTable>
        </div>
      </div>
    </div>
  );
}

export default Lookup;
