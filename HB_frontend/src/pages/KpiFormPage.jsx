import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
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

const API_BASE =
  import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";

function KpiFormPage() {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiData, setKpiData] = useState([]);
  const [kpiNames, setKpiNames] = useState([]);
  const toast = useRef(null);
  const token = localStorage.getItem("token");

  const fetchKpiData = async (kpiName = null) => {
    try {
      const params = {};
      if (kpiName) params.kpi_name = kpiName;

      const response = await axios.get(`${API_BASE}/getKPIData`, { params });
      setKpiData(response.data);
    } catch (error) {
      console.error("Failed to fetch KPI data:", error);
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

      if (options.length > 0) {
        setSelectedKpi(options[0].value);

        fetchKpiData(options[0].value);
      }
    } catch (error) {
      console.error("Failed to fetch KPI names:", error);
    }
  };

  useEffect(() => {
    fetchKpiData();
    fetchKpiNames();
  }, []);

  const handleKpiChange = (e) => {
    setSelectedKpi(e.value);
    fetchKpiData(e.value);
  };

  const onCellEditComplete = async (e) => {
    let { rowData, newValue, field, originalEvent: event } = e;

    if (!newValue || newValue === rowData[field]) {
      event.preventDefault();
      return;
    }

    try {
      let valueToSend = newValue;
      if (field === "timestamp" && newValue instanceof Date) {
        const year = newValue.getFullYear();
        const month = (newValue.getMonth() + 1).toString().padStart(2, "0");
        valueToSend = `${year}-${month}-01`;
      }

      const updatedRow = { ...rowData, [field]: valueToSend };

      await axios.put(`${API_BASE}/updateKPIData`, [updatedRow], {
        headers: { token },
      });

      rowData[field] = valueToSend;

      toast.current.show({
        severity: "success",
        summary: "สำเร็จ",
        detail: "อัพเดตข้อมูลเรียบร้อยแล้ว",
        life: 3000,
      });
    } catch (error) {
      console.error("Failed to update KPI:", error);
      event.preventDefault();
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "การอัพเดตล้มเหลว",
        life: 3000,
      });
    }
  };

  const textEditor = (options) => {
    return (
      <InputText
        type="text"
        value={options.value ?? ""}
        onChange={(e) => options.editorCallback(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
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

  const dropdownEditor = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={[
          { label: "ไทย", value: "ไทย" },
          { label: "ต่างชาติ", value: "ต่างชาติ" },
        ]}
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

  const dialogFooterTemplate = () => {
    return (
      <Button
        label="Ok"
        icon="pi pi-check"
        onClick={() => setDialogVisible(false)}
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

        <div className="bg-white rounded-2xl shadow-md p-5 mb-5">
          <h1>ชื่อตัวชี้วัด</h1>
          <Dropdown
            value={selectedKpi}
            options={kpiNames}
            onChange={handleKpiChange}
            optionLabel="label"
            placeholder="เลือก KPI"
            className="mr-5"
          />
        </div>
        <Button
          label="Show"
          icon="pi pi-external-link"
          onClick={() => setDialogVisible(true)}
        />

        <Dialog
          header="Flex Scroll"
          visible={dialogVisible}
          style={{ width: "75vw" }}
          maximizable
          modal
          onHide={() => setDialogVisible(false)}
          footer={dialogFooterTemplate}
        >
          <DataTable
            value={kpiData}
            scrollable
            scrollHeight="flex"
            tableStyle={{ minWidth: "50rem" }}
            editMode="cell"
            showGridlines
            size="small"
          >
            <Column field="id" header="ID" style={{ width: "5%" }} sortable />
            <Column
              field="kpi_name"
              header="ชื่อตัวชี้วัด"
              body={(rowData) => {
                const option = kpiNames.find(
                  (item) => item.value === rowData.kpi_name
                );
                return option ? option.label : rowData.kpi_name;
              }}
              editor={kpiNameEditor}
              onCellEditComplete={onCellEditComplete}
              sortable
            />
            <Column
              field="a_name"
              header="ชื่อตัวตั้ง"
              editor={textEditor}
              onCellEditComplete={onCellEditComplete}
              sortable
            />
            <Column
              field="b_name"
              header="ชื่อตัวหาร"
              editor={textEditor}
              onCellEditComplete={onCellEditComplete}
              sortable
            />
            <Column
              field="timestamp"
              header="เดือน/ปี"
              editor={monthEditor}
              onCellEditComplete={onCellEditComplete}
              body={(rowData) => {
                const date = new Date(rowData.timestamp);
                return date.toLocaleDateString("en-GB", {
                  month: "2-digit",
                  year: "numeric",
                });
              }}
              sortable
            />
            <Column
              field="a_value"
              header="ค่าตัวตั้ง"
              editor={textEditor}
              onCellEditComplete={onCellEditComplete}
              sortable
            />
            <Column
              field="b_value"
              header="ค่าตัวหาร"
              editor={textEditor}
              onCellEditComplete={onCellEditComplete}
              sortable
            />
            <Column
              field="type"
              header="ประเภท"
              editor={dropdownEditor}
              onCellEditComplete={onCellEditComplete}
              sortable
            />
          </DataTable>
        </Dialog>

        <div className="">
          <DataTable
            value={kpiData}
            editMode="cell"
            showGridlines
            tableStyle={{ minWidth: "60rem" }}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            size="small"
          >
            <Column field="id" header="ID" style={{ width: "5%" }} sortable />
            <Column
              field="kpi_name"
              header="ชื่อตัวชี้วัด"
              body={(rowData) => {
                const option = kpiNames.find(
                  (item) => item.value === rowData.kpi_name
                );
                return option ? option.label : rowData.kpi_name;
              }}
              sortable
            />
            <Column field="a_name" header="ชื่อตัวตั้ง" sortable />
            <Column field="b_name" header="ชื่อตัวหาร" sortable />
            <Column
              field="timestamp"
              header="เดือน/ปี"
              editor={monthEditor}
              onCellEditComplete={onCellEditComplete}
              body={(rowData) => {
                const date = new Date(rowData.timestamp);
                return date.toLocaleDateString("en-GB", {
                  month: "2-digit",
                  year: "numeric",
                });
              }}
              sortable
              style={{ width: "160px" }}
            />
            <Column
              field="a_value"
              header="ค่าตัวตั้ง"
              editor={textEditor}
              onCellEditComplete={onCellEditComplete}
              sortable
              style={{ width: "120px" }}
            />
            <Column
              field="b_value"
              header="ค่าตัวหาร"
              editor={textEditor}
              onCellEditComplete={onCellEditComplete}
              sortable
              style={{ width: "120px" }}
            />
            <Column
              field="type"
              header="ประเภท"
              editor={dropdownEditor}
              onCellEditComplete={onCellEditComplete}
              sortable
              style={{ width: "150px" }}
            />
          </DataTable>
        </div>
      </div>
    </div>
  );
}

export default KpiFormPage;
