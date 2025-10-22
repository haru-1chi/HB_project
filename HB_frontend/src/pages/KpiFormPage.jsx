import React, { useState, useEffect, useRef, useCallback } from "react";
import { classNames } from "primereact/utils";
import axios from "axios";
import { debounce } from "lodash";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Checkbox } from "primereact/checkbox";
import { ScrollTop } from "primereact/scrolltop";
import { FileUpload } from "primereact/fileupload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEdit,
  faPlus,
  faCheck,
  faXmark,
  faSave,
  faMagnifyingGlass,
  faFileImport
} from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Footer from "../components/Footer";
import axiosInstance, { setAuthErrorInterceptor } from "../utils/axiosInstance";
const API_BASE =
  import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";
import * as XLSX from "xlsx";

function KpiFormPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const fileUploadRef = useRef(null);
  const token = localStorage.getItem("token");
  const toast = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const [kpiNamesActive, setKpiNamesActive] = useState([]);
  const [kpiNames, setKpiNames] = useState([]);

  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiData, setKpiData] = useState([]);

  const [duplicatePairs, setDuplicatePairs] = useState([]);

  const [editRowId, setEditRowId] = useState(null);
  const [editRowData, setEditRowData] = useState({});
  const [previousValues, setPreviousValues] = useState({});

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const parseExcelDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;

    if (typeof value === "number") {
      const date = XLSX.SSF.parse_date_code(value);
      return date ? new Date(date.y, date.m - 1, date.d) : null;
    }

    if (typeof value === "string") {
      const parts = value.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        if (day && month && year) return new Date(year, month - 1, day);
      }
    }

    return null;
  };

  const handleFileUpload = (event) => {
    const file = event.files?.[0];
    if (!file) return;
    const validExtensions = ["xls", "xlsx", "csv"];
    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      showToast(
        "warn",
        "ประเภทไฟล์ไม่ถูกต้อง",
        "กรุณาอัปโหลดไฟล์ Excel (.xls, .xlsx, .csv) เท่านั้น"
      );
      fileUploadRef.current?.clear();
      return;
    }
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const workbook = XLSX.read(target.result, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!jsonData?.length || jsonData.length <= 1) {
        showToast(
          "warn",
          "ไม่พบข้อมูล",
          "ไฟล์ Excel ว่างหรือไม่มีข้อมูลให้นำเข้า"
        );
        fileUploadRef.current?.clear();
        return;
      }

      const importedRows = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !row.length) continue;

        // Skip truly empty rows
        const hasData = row.some(
          (cell) => cell != null && String(cell).trim() !== ""
        );
        if (!hasData) continue;

        // Excel structure: ลำดับ, ตัวชี้วัด, ตัวตั้ง, ตัวหาร, เดือน/ปี, ค่าตัวตั้ง, ค่าตัวหาร, ประเภท
        const [, kpiLabel, , , dateVal, a_value = "", b_value = "", type = ""] =
          row;

        // Try to match KPI label → ID
        const matchedKpi = kpiNamesActive.find(
          (k) => k.label.trim() === String(kpiLabel || "").trim()
        );

        const report_date = parseExcelDate(dateVal);

        importedRows.push({
          id: importedRows.length + 1,
          kpi_name: matchedKpi ? matchedKpi.value : null,
          a_name: matchedKpi?.a_name || "",
          b_name: matchedKpi?.b_name || "",
          report_date: report_date || null,
          a_value: a_value || "",
          b_value: b_value || "",
          type: type || "",
        });
      }

      if (!importedRows.length) {
        showToast(
          "warn",
          "ข้อมูลไม่ถูกต้อง",
          "ไม่พบข้อมูลที่มีรูปแบบถูกต้องให้นำเข้า"
        );
        fileUploadRef.current?.clear();
        return;
      }

      setRows((prev) => {
        const existing = prev.filter(
          (r) =>
            r.kpi_name ||
            r.a_name ||
            r.b_name ||
            r.a_value ||
            r.b_value ||
            r.type ||
            r.report_date
        );

        const startId = existing.length + 1;
        const merged = [
          ...existing,
          ...importedRows.map((r, i) => ({ ...r, id: startId + i })),
        ];

        return merged;
      });

      showToast("success", "สำเร็จ", "นำเข้าข้อมูลเรียบร้อยแล้ว");
      fileUploadRef.current?.clear();
    };

    reader.readAsBinaryString(file);
  };

  //เรียกดูข้อมูลตามชื่อตัวชี้วัด
  const handleKpiChange = (e) => {
    setSelectedKpi(e.value);
    fetchKpiData(e.value, searchTerm);
  };

  useEffect(() => {
    setAuthErrorInterceptor(logout, showToast, navigate);
  }, [logout, showToast, navigate]);

  useEffect(() => {
    const fetchKpiNames = async () => {
      try {
        const res = await axios.get(`${API_BASE}/kpi-name`, {
          params: { includeDeleted: true },
        });
        const options = res.data.map((item) => ({
          label: item.kpi_name,
          value: item.id,
          a_name: item.a_name,
          b_name: item.b_name,
          deleted: item.deleted_at !== null,
        }));
        setKpiNames(options);

        const optionsActive = options.filter((item) => !item.deleted);
        setKpiNamesActive(optionsActive);

        if (options.length > 0) {
          const firstKpi = options[0].value;
          setSelectedKpi(firstKpi);
          fetchKpiData(firstKpi);
        }
      } catch (err) {
        showToast(
          "error",
          "ผิดพลาด",
          err.message || "โหลดชื่อตัวชี้วัดล้มเหลว"
        );
      }
    };
    fetchKpiNames();
  }, [showToast]);

  const fetchKpiData = useCallback(
    async (kpiId, search = "") => {
      if (!kpiId) return;
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/kpi-data`, {
          params: { kpi_name: kpiId, search },
        });
        setKpiData(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        showToast("error", "ผิดพลาด", err.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!selectedKpi) return;
    const debounced = debounce(
      () => fetchKpiData(selectedKpi, searchTerm),
      500
    );
    debounced();
    return () => debounced.cancel();
  }, [searchTerm, selectedKpi, fetchKpiData]);

  useEffect(() => {
    if (showDuplicateDialog && duplicatePairs.length > 0) {
      const allNewRows = duplicatePairs.filter((p) => p.status === "ใหม่");
      setSelectedRows(allNewRows);
    }
  }, [showDuplicateDialog, duplicatePairs]);

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

  // start editing a row
  const startEditRow = useCallback((row) => {
    setEditRowId(row.id);
    setEditRowData(row);
    setPreviousValues({
      report_date: row.report_date,
      type: row.type,
    });
  }, []);

  // cancel edit
  const cancelEdit = useCallback(() => {
    setEditRowId(null);
    setEditRowData({});
  }, []);

  // save row after confirm
  // confirmSaveRow
  const confirmSaveRow = useCallback(async () => {
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

          await axiosInstance.put(`${API_BASE}/kpi-data`, [payload], {
            headers: { token },
          });

          setKpiData((prev) =>
            prev.map((row) => (row.id === editRowId ? payload : row))
          );

          showToast("success", "สำเร็จ", "อัพเดตข้อมูลเรียบร้อยแล้ว");
          cancelEdit();
        } catch (err) {
          if (err.response?.status === 409) {
            showToast("warn", "ข้อมูลซ้ำ", err.response.data.message);
            setEditRowData((prev) => ({
              ...prev,
              report_date: previousValues.report_date,
              type: previousValues.type,
              isInvalid: true,
            }));
            fetchKpiData(selectedKpi);
          } else {
            showToast("error", "ผิดพลาด", err.message || "การอัพเดตล้มเหลว");
          }
        }
      },
    });
  }, [editRowData, editRowId, token, cancelEdit, showToast]);

  const renderDateCell = (row) =>
    editRowId === row.id ? (
      <Calendar
        className={editRowData.isInvalid ? "p-invalid" : ""}
        value={
          editRowData.report_date ? new Date(editRowData.report_date) : null
        }
        onChange={(e) => {
          const newDate = e.value;
          const formatted = newDate
            ? `${newDate.getFullYear()}-${String(
                newDate.getMonth() + 1
              ).padStart(2, "0")}-01`
            : null;

          // Check duplicate
          const duplicate = kpiData.some(
            (r) =>
              r.id !== editRowData.id &&
              r.kpi_name === editRowData.kpi_name &&
              r.type === editRowData.type &&
              r.report_date?.slice(0, 7) === formatted?.slice(0, 7)
          );

          if (duplicate) {
            showToast(
              "warn",
              "ไม่สามารถเปลี่ยนแปลงได้",
              "ข้อมูลจะซ้ำกับแถวอื่น"
            );
            // revert
            setEditRowData((prev) => ({
              ...prev,
              report_date: previousValues.report_date,
            }));
            return;
          }

          setEditRowData((prev) => ({ ...prev, report_date: formatted }));
        }}
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

  const renderInputCell = useCallback(
    (field, width) => (row) =>
      editRowId === row.id ? (
        <InputText
          style={{ width }}
          value={editRowData[field] || ""}
          onChange={(e) =>
            setEditRowData((prev) => ({ ...prev, [field]: e.target.value }))
          }
        />
      ) : (
        row[field]
      ),
    [editRowId, editRowData]
  );

  const renderDropdownCell = useCallback(
    (row) =>
      editRowId === row.id ? (
        <Dropdown
          className={editRowData.isInvalid ? "p-invalid" : ""}
          value={editRowData.type}
          options={[
            { label: "ไทย", value: "ไทย" },
            { label: "ต่างชาติ", value: "ต่างชาติ" },
          ]}
          onChange={(e) => {
            const newType = e.value;

            const duplicate = kpiData.some(
              (r) =>
                r.id !== editRowData.id &&
                r.kpi_name === editRowData.kpi_name &&
                r.report_date?.slice(0, 7) ===
                  (editRowData.report_date
                    ? editRowData.report_date.slice(0, 7)
                    : "") &&
                r.type === newType
            );

            if (duplicate) {
              showToast(
                "warn",
                "ไม่สามารถเปลี่ยนแปลงได้",
                "ข้อมูลจะซ้ำกับแถวอื่น"
              );

              setEditRowData((prev) => ({
                ...prev,
                type: previousValues.type,
              }));
              return;
            }

            setEditRowData((prev) => ({ ...prev, type: newType }));
          }}
          placeholder="เลือกประเภท"
          style={{ width: "140px" }}
        />
      ) : (
        row.type
      ),
    [editRowId, editRowData]
  );

  const renderActionCell = useCallback(
    (row) =>
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
        <Button
          rounded
          icon={<FontAwesomeIcon icon={faEdit} />}
          className="p-button-warning p-button-sm"
          onClick={() => startEditRow(row)}
        />
      ),
    [editRowId, confirmSaveRow, cancelEdit, startEditRow]
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
  const [selectedRows, setSelectedRows] = useState([]);

  const resetRows = useCallback(() => {
    setRows([
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
  }, []);

  const normalizeDate = useCallback((date) => {
    if (!(date instanceof Date)) return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  }, []);

  const buildPayload = useCallback(() => {
    return rows.map((r) => ({
      ...r,
      report_date: normalizeDate(r.report_date),
    }));
  }, [rows, normalizeDate]);

  const handleInputChange = useCallback((rowIndex, field, value) => {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === rowIndex ? { ...row, [field]: value } : row
      )
    );
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        kpi_name: null,
        a_name: "",
        b_name: "",
        report_date: null,
        a_value: "",
        b_value: "",
        type: "",
      },
    ]);
  }, []);

  const removeRow = useCallback((rowIndex) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
  }, []);

  const submitRows = useCallback(async () => {
    try {
      if (rows.some((r) => !r.kpi_name || !r.a_value || !r.b_value)) {
        showError("กรุณากรอกข้อมูลให้ครบ");
        return;
      }

      const payload = buildPayload();

      const res = await axiosInstance.post(
        `${API_BASE}/kpi-data/check-duplicates`,
        payload,
        {
          headers: { token },
        }
      );
      console.log("submit payload", payload);
      if (res.data.pairs.length > 0) {
        setDuplicatePairs(res.data.pairs);

        const allNewRows = res.data.pairs.filter((p) => p.status === "ใหม่");
        setSelectedRows(allNewRows);

        console.log("submit DuplicatePairs", res.data.pairs);
        setShowDuplicateDialog(true);
      } else {
        await axiosInstance.post(
          `${API_BASE}/kpi-data`,
          { data: payload, mode: "skip" },
          { headers: { token } }
        );
        showSuccess("เพิ่มข้อมูลเรียบร้อยแล้ว");
        fetchKpiData(selectedKpi);
        resetRows();
        setDialogVisible(false);
      }
    } catch (err) {
      console.log(err);
    }
  }, [
    rows,
    API_BASE,
    token,
    showError,
    showSuccess,
    fetchKpiData,
    selectedKpi,
    buildPayload,
  ]);

  const handleUserChoice = useCallback(
    async (choice) => {
      if (choice === "cancel") return;

      const normalizeSelectedRows = (rows) =>
        rows.map((r) => ({
          ...r,
          report_date: normalizeDate(r.report_date),
          kpi_name: r.kpi_name,
        }));

      let payload = [];
      const allRows = buildPayload();

      const duplicateKeys = duplicatePairs
        .filter((p) => p.status === "ใหม่")
        .map((p) => `${p.kpi_name}_${p.type}_${normalizeDate(p.report_date)}`);

      if (choice === "overwrite") {
        console.log("selectedRows", selectedRows);
        const overwriteRows = normalizeSelectedRows(selectedRows);
        const selectedKeys = selectedRows.map(
          (s) => `${s.kpi_name}_${s.type}_${normalizeDate(s.report_date)}`
        );

        const filteredRows = allRows.filter((row) => {
          const key = `${row.kpi_name}_${row.type}_${normalizeDate(
            row.report_date
          )}`;
          return !duplicateKeys.includes(key) || selectedKeys.includes(key);
        });

        payload = [
          ...overwriteRows,
          ...filteredRows.filter(
            (r) =>
              !selectedKeys.includes(
                `${r.kpi_name}_${r.type}_${normalizeDate(r.report_date)}`
              )
          ),
        ];
      } else {
        payload = allRows.filter((row) => {
          const key = `${row.kpi_name}_${row.type}_${normalizeDate(
            row.report_date
          )}`;
          return !duplicateKeys.includes(key);
        });
      }

      const mode = choice === "overwrite" ? "overwrite" : "skip";
      console.log("confirm payload", payload);
      try {
        await axiosInstance.post(
          `${API_BASE}/kpi-data`,
          { data: payload, mode },
          { headers: { token } }
        );
        showSuccess(
          mode === "overwrite"
            ? "เขียนทับข้อมูลเรียบร้อยแล้ว"
            : "เพิ่มข้อมูลที่ไม่ซ้ำเรียบร้อยแล้ว"
        );
        fetchKpiData(selectedKpi);
        resetRows();
        setDialogVisible(false);
        setShowDuplicateDialog(false);
      } catch (err) {
        console.error(err);
        showError("ไม่สามารถดำเนินการได้");
      }
    },
    [API_BASE, token, buildPayload, showError, showSuccess]
  );

  const dialogFooterTemplate = (
    <div className="flex justify-between border-t-1 pt-3 border-gray-300">
      <FileUpload
        icon={<FontAwesomeIcon icon={faFileImport} />}
        ref={fileUploadRef}
        mode="basic"
        name="kpiFile"
        accept=".xlsx,.xls"
        maxFileSize={5000000}
        auto
        chooseLabel="Import Excel"
        customUpload
        uploadHandler={handleFileUpload}
      />
      <Button label="บันทึกข้อมูล" severity="success" onClick={submitRows} />
    </div>
  );

  const dialogFooterDuplicate = (
    <div className="flex justify-end gap-2 mt-4">
      <Button
        label="ข้ามข้อมูลนี้"
        severity="info"
        onClick={() => handleUserChoice("skip")}
      />
      <Button
        label="ใช่ เขียนทับข้อมูลเดิม"
        severity="danger"
        onClick={() => handleUserChoice("overwrite")}
      />
    </div>
  );

  //ลบแถว
  const handleDelete = useCallback(
    async (id) => {
      try {
        await axiosInstance.delete(`${API_BASE}/kpi-data/${id}`, {
          headers: { token },
        });

        setKpiData((prev) => prev.filter((row) => row.id !== id));

        showToast("success", "สำเร็จ", "ลบข้อมูลเรียบร้อยแล้ว");
      } catch (err) {
        console.error("Delete failed:", err);
        showToast("error", "Error", err.message || "ลบข้อมูลล้มเหลว");
      }
    },
    [token, showToast]
  );

  const confirmDelete = useCallback(
    (rowId) => {
      confirmDialog({
        message: "ต้องการลบรายการนี้หรือไม่?",
        header: "ยืนยันการลบ",
        icon: "pi pi-exclamation-triangle",
        acceptClassName: "p-button-danger",
        accept: () => handleDelete(rowId),
        reject: () => showToast("info", "ยกเลิก", "การลบถูกยกเลิก"),
      });
    },
    [handleDelete, showToast]
  );

  const renderDeleteButton = useCallback(
    (rowData) => (
      <Button
        icon={<FontAwesomeIcon icon={faTrash} />}
        severity="danger"
        rounded
        onClick={() => confirmDelete(rowData.id)}
      />
    ),
    [confirmDelete]
  );

  const header = (
    <div className="p-2 flex items-end justify-between">
      <div className="block">
        <Dropdown
          value={selectedKpi}
          options={kpiNames}
          onChange={handleKpiChange}
          optionLabel="label"
          placeholder="เลือก KPI"
          className="mr-5"
        />
      </div>

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
  );

  return (
    <div className="Home-page overflow-hidden">
      <ScrollTop />
      <Toast ref={toast} />
      <ConfirmDialog />
      <div
        className={`flex-1 transition-all duration-300 p-4 sm:p-8 pt-5 overflow-auto`}
      >
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-2xl font-semibold">จัดการข้อมูลตัวชี้วัด</h5>
          <Button
            label="+ เพิ่มข้อมูล"
            onClick={() => setDialogVisible(true)}
            severity="success"
          />
        </div>

        <div className="">
          <DataTable
            header={header}
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
            <Column
              header="ลำดับ"
              body={(rowData) => kpiData.indexOf(rowData) + 1}
              sortable
              field="id"
              style={{ width: "5%" }}
              align="center"
            />
            <Column field="kpi_label" header="ตัวชี้วัด" sortable />
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
              align="center"
            />

            <Column
              header="ลบ"
              body={renderDeleteButton}
              style={{ width: "80px", textAlign: "center" }}
              align="center"
            />
          </DataTable>
        </div>
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
            header="ลำดับ"
            body={(_, opt) => opt.rowIndex + 1}
            style={{ width: "50px" }}
            align="center"
          />

          <Column
            field="kpi_name"
            header="ชื่อตัวชี้วัด"
            className="w-75"
            body={(row, opt) => (
              <Dropdown
                value={row.kpi_name}
                options={kpiNamesActive}
                placeholder="เลือก KPI"
                className="w-75"
                onChange={(e) => {
                  const selectedId = e.value;
                  const selectedOption = kpiNamesActive.find(
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
                optionLabel="label"
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
            align="center"
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

      <Dialog
        header="พบข้อมูลซ้ำ!"
        visible={showDuplicateDialog}
        style={{ width: "75vw" }}
        maximizable
        modal
        onHide={() => setShowDuplicateDialog(false)}
        footer={dialogFooterDuplicate}
      >
        <DataTable
          value={duplicatePairs}
          showGridlines
          size="small"
          tableStyle={{ minWidth: "60rem" }}
          rowClassName={(rowData) => ({
            "new-row": rowData[0].status === "ใหม่",
            "old-row": rowData[0].status === "เดิม",
          })}
          selection={selectedRows}
          onSelectionChange={(e) => setSelectedRows(e.value)}
        >
          <Column
            headerStyle={{ width: "3rem", textAlign: "center" }}
            bodyStyle={{ textAlign: "center" }}
            body={(rowData) =>
              rowData.status === "ใหม่" ? (
                <Checkbox
                  checked={selectedRows.some((r) => r.id === rowData.id)}
                  onChange={(e) => {
                    setSelectedRows((prev) =>
                      e.checked
                        ? [...prev, rowData]
                        : prev.filter((r) => r.id !== rowData.id)
                    );
                  }}
                />
              ) : (
                <span>—</span>
              )
            }
          />

          <Column
            sortable
            field="status"
            header="สถานะ"
            style={{ width: "8rem" }}
          />
          <Column sortable field="kpi_label" header="ตัวชี้วัด" />
          <Column
            sortable
            field="a_value"
            header="ค่าตัวตั้ง"
            bodyClassName={(rowData) =>
              classNames({
                "old-cell": rowData[0].status === "เดิม",
                "new-cell": rowData[0].status === "ใหม่",
              })
            }
          />

          <Column
            sortable
            field="b_value"
            header="ค่าตัวหาร"
            bodyClassName={(rowData) =>
              classNames({
                "old-cell": rowData[0].status === "เดิม",
                "new-cell": rowData[0].status === "ใหม่",
              })
            }
          />
          <Column sortable field="report_date" header="เดือน/ปี" />
          <Column sortable field="type" header="ประเภท" />
        </DataTable>
      </Dialog>
      <Footer />
    </div>
  );
}

export default KpiFormPage;
