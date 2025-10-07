import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
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
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
const API_BASE =
  import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";

function KpiFormPage() {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiData, setKpiData] = useState([]);
  const [kpiNames, setKpiNames] = useState([]);
  const toast = useRef(null);
  const token = localStorage.getItem("token");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [editRowId, setEditRowId] = useState(null);
  const [editRowData, setEditRowData] = useState({});

  const fetchKpiNames = async () => {
    try {
      const res = await axios.get(`${API_BASE}/getKPIName`);
      const options = res.data.map((item) => ({
        label: item.kpi_name,
        value: item.id,
        a_name: item.a_name,
        b_name: item.b_name,
      }));
      setKpiNames(options);

      if (options.length > 0) {
        setSelectedKpi(options[0].value);
        fetchKpiData(options[0].value);
      }
    } catch (error) {
      showError("โหลดชื่อตัวชี้วัดล้มเหลว");
    }
  };

  const fetchKpiData = async (kpiName, search = "") => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/getKPIData`, {
        params: { kpi_name: kpiName, search },
      });
      setKpiData(res.data);
    } catch (err) {
      showError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpiNames();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchKpiData(selectedKpi, searchTerm);
    }, 500); // wait 500ms after user stops typing

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedKpi]);

  const showSuccess = (msg) =>
    toast.current.show({
      severity: "success",
      summary: "สำเร็จ",
      detail: msg,
      life: 3000,
    });
  const showError = (msg) =>
    toast.current.show({
      severity: "error",
      summary: "ผิดพลาด",
      detail: msg,
      life: 3000,
    });

  const handleKpiChange = (e) => {
    setSelectedKpi(e.value);
    fetchKpiData(e.value);
  };

  // start editing a row
  const startEditRow = (rowData) => {
    setEditRowId(rowData.id);
    setEditRowData({ ...rowData });
  };

  // cancel edit
  const cancelEdit = () => {
    setEditRowId(null);
    setEditRowData({});
  };

  // save row after confirm
  const confirmSaveRow = () => {
    confirmDialog({
      message: "ต้องการบันทึกรายการนี้หรือไม่",
      header: "บันทึกรายการ",
      acceptClassName: "p-button-success",
      accept: async () => {
        try {
          let payload = { ...editRowData };
          if (payload.report_date instanceof Date) {
            const year = payload.report_date.getFullYear();
            const month = (payload.report_date.getMonth() + 1)
              .toString()
              .padStart(2, "0");
            payload.report_date = `${year}-${month}-01`; // e.g. 2025-10-01
          }

          await axios.put(`${API_BASE}/updateKPIData`, [payload], {
            headers: { token },
          });

          setKpiData((prev) =>
            prev.map((row) => (row.id === editRowId ? payload : row))
          );

          toast.current.show({
            severity: "success",
            summary: "สำเร็จ",
            detail: "อัพเดตข้อมูลเรียบร้อยแล้ว",
            life: 3000,
          });
          cancelEdit(); // exit edit mode
        } catch (err) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "การอัพเดตล้มเหลว",
            life: 3000,
          });
        }
      },
    });
  };
  const renderDateCell = (row) =>
    editRowId === row.id ? (
      <Calendar
        value={editRowData.report_date ? new Date(editRowData.report_date) : null}
        onChange={(e) => setEditRowData({ ...editRowData, report_date: e.value })}
        view="month"
        dateFormat="mm/yy"
        showIcon
      />
    ) : row.report_date ? (
      new Date(row.report_date).toLocaleDateString("en-GB", {
        month: "2-digit",
        year: "numeric",
      })
    ) : (
      "-"
    );

  const renderInputCell = (field, width) => (row) =>
    editRowId === row.id ? (
      <InputText
        style={{ width }}
        value={editRowData[field] || ""}
        onChange={(e) =>
          setEditRowData({ ...editRowData, [field]: e.target.value })
        }
      />
    ) : (
      row[field]
    );

  const renderDropdownCell = (row) =>
    editRowId === row.id ? (
      <Dropdown
        value={editRowData.type}
        options={[
          { label: "ไทย", value: "ไทย" },
          { label: "ต่างชาติ", value: "ต่างชาติ" },
        ]}
        onChange={(e) => setEditRowData({ ...editRowData, type: e.value })}
        placeholder="เลือกประเภท"
        style={{ width: "140px" }}
      />
    ) : (
      row.type
    );

  const renderActionCell = (row) =>
    editRowId === row.id ? (
      <div className="flex justify-center gap-2">
        <Button
          rounded
          icon={<FontAwesomeIcon icon={faCheck} />}
          className="p-button-success p-button-sm"
          onClick={confirmSaveRow}
        />
        <Button
          rounded
          icon={<FontAwesomeIcon icon={faXmark} />}
          className="p-button-secondary p-button-sm"
          onClick={cancelEdit}
        />
      </div>
    ) : (
      <div className="flex justify-center gap-2">
        <Button
          rounded
          icon={<FontAwesomeIcon icon={faEdit} />}
          className="p-button-warning p-button-sm"
          onClick={() => startEditRow(row)}
        />
      </div>
    );
  //for add

  const [rows, setRows] = useState([
    {
      id: 1,
      kpi_name: null,
      a_name: "",
      b_name: "",
      report_date: null,
      a_value: "",
      b_value: "",
      type: "",
    },
  ]);

  const handleInputChange = (rowIndex, field, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex][field] = value;
      return updated;
    });
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: rows.length + 1, //อาจเอาออก
        kpi_name: null,
        a_name: "",
        b_name: "",
        report_date: null,
        a_value: "",
        b_value: "",
        type: "",
      },
    ]);
  };

  const removeRow = (rowIndex) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  const submitRows = async () => {
    try {
      if (rows.some((r) => !r.kpi_name || !r.a_value || !r.b_value)) {
        showError("กรุณากรอกข้อมูลให้ครบ");
        return;
      }

      await axios.post(`${API_BASE}/create`, rows, { headers: { token } });
      showSuccess("เพิ่มข้อมูลเรียบร้อยแล้ว");
      setDialogVisible(false);
      fetchKpiData(selectedKpi);
    } catch (err) {
      showError("เพิ่มข้อมูลล้มเหลว");
    }
  };

  const dialogFooterTemplate = (
    <div className="border-t-1 pt-3 border-gray-300">
      <Button label="บันทึกข้อมูล" severity="success" onClick={submitRows} />
    </div>
  );

  //ลบแถว
  const confirmDelete = (rowId) => {
    confirmDialog({
      message: "ต้องการลบรายการนี้หรือไม่?",
      header: "ยืนยันการลบ",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => handleDelete(rowId),
      reject: () => {
        toast.current.show({
          severity: "info",
          summary: "ยกเลิก",
          detail: "การลบถูกยกเลิก",
          life: 2000,
        });
      },
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/deleteKPIData/${id}`, {
        headers: { token },
      });

      setKpiData((prev) => prev.filter((row) => row.id !== id));

      toast.current.show({
        severity: "success",
        summary: "สำเร็จ",
        detail: "ลบข้อมูลเรียบร้อยแล้ว",
        life: 3000,
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "ลบข้อมูลล้มเหลว",
        life: 3000,
      });
    }
  };
  return (
    <div className="Home-page h-dvh flex overflow-hidden">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div
        className={`flex-1 transition-all duration-300 p-4 sm:p-8 pt-5 overflow-auto`}
      >
        <div className="flex items-center mb-5">
          <h5 className="text-2xl font-semibold">จัดการข้อมูลตัวชี้วัด</h5>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 mb-5">
          <h1>ชื่อตัวชี้วัด</h1>
          <div className="flex justify-between">
            <Dropdown
              value={selectedKpi}
              options={kpiNames}
              onChange={handleKpiChange}
              optionLabel="label"
              placeholder="เลือก KPI"
              className="mr-5"
            />
            <Button
              label="+ เพิ่มข้อมูล"
              onClick={() => setDialogVisible(true)}
              severity="success"
            />
          </div>
        </div>

        <div className="flex justify-end mb-3">
          <IconField iconPosition="left">
            <InputIcon>
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </InputIcon>
            <InputText
              placeholder="ค้นหา"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </IconField>
        </div>

        <Dialog
          header="เพิ่มข้อมูล"
          visible={dialogVisible}
          style={{ width: "75vw" }}
          maximizable
          modal
          onHide={() => setDialogVisible(false)}
          footer={dialogFooterTemplate}
          contentStyle={{ minHeight: "500px" }}
        >
          <DataTable
            value={rows}
            showGridlines
            tableStyle={{ minWidth: "60rem" }}
            size="small"
          >
            <Column
              field="id"
              header="ID"
              body={(row, opt) => opt.rowIndex + 1}
              style={{ width: "50px" }}
            />

            <Column
              field="kpi_name"
              header="ชื่อตัวชี้วัด"
              className="w-75"
              body={(row, opt) => (
                <Dropdown
                  value={row.kpi_name}
                  options={kpiNames}
                  onChange={(e) => {
                    const selectedId = e.value;
                    const selectedOption = kpiNames.find(
                      (o) => o.value === selectedId
                    );

                    handleInputChange(opt.rowIndex, "kpi_name", selectedId);
                    handleInputChange(
                      opt.rowIndex,
                      "a_name",
                      selectedOption?.a_name || ""
                    );
                    handleInputChange(
                      opt.rowIndex,
                      "b_name",
                      selectedOption?.b_name || ""
                    );
                  }}
                  placeholder="เลือก KPI"
                  className="w-75"
                />
              )}
            />

            <Column
              field="a_name"
              header="ชื่อตัวตั้ง"
              body={(row) => <p>{row.a_name || "-"}</p>}
            />
            <Column
              field="b_name"
              header="ชื่อตัวหาร"
              body={(row) => <p>{row.b_name || "-"}</p>}
            />
            <Column
              field="report_date"
              header="เดือน/ปี"
              style={{ width: "160px" }}
              body={(row, opt) => (
                <Calendar
                  value={row.report_date}
                  onChange={(e) =>
                    handleInputChange(opt.rowIndex, "report_date", e.value)
                  }
                  view="month"
                  dateFormat="mm/yy"
                  showIcon
                />
              )}
            />

            <Column
              field="a_value"
              header="ค่าตัวตั้ง"
              style={{ width: "120px" }}
              body={(row, opt) => (
                <InputText
                  value={row.a_value}
                  onChange={(e) =>
                    handleInputChange(opt.rowIndex, "a_value", e.target.value)
                  }
                  className="w-full"
                />
              )}
            />

            <Column
              field="b_value"
              header="ค่าตัวหาร"
              style={{ width: "120px" }}
              body={(row, opt) => (
                <InputText
                  value={row.b_value}
                  onChange={(e) =>
                    handleInputChange(opt.rowIndex, "b_value", e.target.value)
                  }
                  className="w-full"
                />
              )}
            />

            <Column
              field="type"
              header="ประเภท"
              style={{ width: "150px" }}
              body={(row, opt) => (
                <Dropdown
                  value={row.type}
                  options={[
                    { label: "ไทย", value: "ไทย" },
                    { label: "ต่างชาติ", value: "ต่างชาติ" },
                  ]}
                  onChange={(e) =>
                    handleInputChange(opt.rowIndex, "type", e.value)
                  }
                  placeholder="เลือกประเภท"
                  className="w-full"
                />
              )}
            />
            <Column
              header="ลบ"
              style={{ width: "50px" }}
              body={(row, opt) => (
                <Button
                  icon={<FontAwesomeIcon icon={faXmark} />}
                  severity="danger"
                  rounded
                  text
                  aria-label="Cancel"
                  onClick={() => removeRow(opt.rowIndex)}
                />
              )}
            />
          </DataTable>
          <div className="flex justify-end mt-3">
            <Button
              label="+ เพิ่มแถว"
              onClick={addRow}
              className="mr-2"
              size="small"
            />
          </div>
        </Dialog>

        <div className="">
          <DataTable
            value={kpiData}
            editMode="row"
            dataKey="id"
            showGridlines
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            tableStyle={{ minWidth: "60rem" }}
            size="small"
            emptyMessage="ไม่พบข้อมูล"
          >
            <Column field="id" header="ID" style={{ width: "5%" }} sortable />
            <Column
              field="kpi_label"
              header="ตัวชี้วัด"
              sortable
            />
            <Column field="a_name" header="ตัวตั้ง" sortable />
            <Column field="b_name" header="ตัวหาร" sortable />
            <Column
              field="report_date"
              header="เดือน/ปี"
              body={renderDateCell}
              sortable
              style={{ width: "160px" }}
            />
            <Column
              field="a_value"
              header="ค่าตัวตั้ง"
              body={renderInputCell("a_value", "120px")}
              sortable
              style={{ width: "120px" }}
            />
            <Column
              field="b_value"
              header="ค่าตัวหาร"
              body={renderInputCell("b_value", "120px")}
              sortable
              style={{ width: "120px" }}
            />

            <Column
              field="type"
              header="ประเภท"
              body={renderDropdownCell}
              sortable
              style={{ width: "150px" }}
            />
            <Column
              header="แก้ไข"
              body={renderActionCell}
              style={{ width: "130px" }}
            />

            <Column
              header="ลบ"
              body={(rowData) => (
                <Button
                  icon={<FontAwesomeIcon icon={faTrash} />}
                  severity="danger"
                  rounded
                  onClick={() => confirmDelete(rowData.id)}
                />
              )}
              style={{ width: "80px", textAlign: "center" }}
            />
          </DataTable>
        </div>
      </div>
    </div>
  );
}

export default KpiFormPage;
