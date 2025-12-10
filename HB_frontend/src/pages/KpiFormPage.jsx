import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { debounce } from "lodash";
import { classNames } from "primereact/utils";
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
import { Skeleton } from "primereact/skeleton";
import { InputTextarea } from "primereact/inputtextarea";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { ScrollTop } from "primereact/scrolltop";
import { FileUpload } from "primereact/fileupload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEdit,
  faCheck,
  faXmark,
  faMagnifyingGlass,
  faFileImport,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";
import KpiFormDialog from "../components/KpiFormDialog";
import DuplicateDialog from "../components/DuplicateDialog";
import axiosInstance, { setAuthErrorInterceptor } from "../utils/axiosInstance";

import { handleFileUpload } from "../utils/importUtils";
function KpiFormPage() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";
  const { logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [sinceDate, setSinceDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const toast = useRef(null);
  const fileUploadRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogQualityVisible, setDialogQualityVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const [kpiNames, setKpiNames] = useState([]);
  const [kpiNamesActive, setKpiNamesActive] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiData, setKpiData] = useState([]);
  const [duplicatePairs, setDuplicatePairs] = useState([]);

  const [editRowId, setEditRowId] = useState(null);
  const [editRowData, setEditRowData] = useState({});
  const [previousValues, setPreviousValues] = useState({});

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const onFileUpload = (event) => {
    handleFileUpload({
      event,
      kpiNamesActive,
      showToast,
      fileUploadRef,
      setRows,
    });
  };

  //เรียกดูข้อมูลตามชื่อตัวชี้วัด
  const handleKpiChange = (e) => {
    setSelectedKpi(e.value);
    fetchKpiData(e.value, searchTerm);
  };

  const normalizeDate = useCallback((date) => {
    if (!(date instanceof Date)) return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  }, []);

  const fetchKpiData = useCallback(
    async (kpiId, search = "") => {
      if (!kpiId) return;
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/kpi-data`, {
          params: {
            kpi_name: kpiId,
            search,
            sinceDate: sinceDate ? normalizeDate(sinceDate) : "",
            endDate: endDate ? normalizeDate(endDate) : "",
          },
        });
        setKpiData(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        showToast("error", "ผิดพลาด", err.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    },
    [showToast, sinceDate, endDate, normalizeDate]
  );

  useEffect(() => {
    setAuthErrorInterceptor(logout, showToast, navigate);
  }, [logout, showToast, navigate]);

  useEffect(() => {
    const fetchKpiNames = async () => {
      try {
        const res = await axios.get(`${API_BASE}/kpi-name`, {
          params: { includeDeleted: true },
        });

        const filtered = res.data.filter((item) => item.kpi_type === 2);

        const options = filtered.map((item) => ({
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

  useEffect(() => {
    if (!selectedKpi) return;
    const debounced = debounce(
      () => fetchKpiData(selectedKpi, searchTerm),
      500
    );
    debounced();
    return () => debounced.cancel();
  }, [searchTerm, selectedKpi, fetchKpiData, sinceDate, endDate]);

  useEffect(() => {
    if (showDuplicateDialog && duplicatePairs.length > 0) {
      const allNewRows = duplicatePairs.filter((p) => p.status === "ใหม่");
      setSelectedRows(allNewRows);
    }
  }, [showDuplicateDialog, duplicatePairs]);

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
      if (
        rows.some((r) => !r.kpi_name || !r.a_value || !r.b_value || !r.type)
      ) {
        showToast("error", "ผิดพลาด", "กรุณากรอกข้อมูลให้ครบ");
        return;
      }

      const payload = buildPayload();
      if (payload.length === 0) {
        showToast("error", "ผิดพลาด", "กรุณาเพิ่มข้อมูลอย่างน้อย 1 แถว");
        return;
      }
      const res = await axiosInstance.post(
        `${API_BASE}/kpi-data/check-duplicates`,
        payload,
        {
          headers: { token },
        }
      );
      // console.log("submit payload", payload);
      if (res.data.pairs.length > 0) {
        setDuplicatePairs(res.data.pairs);

        const allNewRows = res.data.pairs.filter((p) => p.status === "ใหม่");
        setSelectedRows(allNewRows);

        // console.log("submit DuplicatePairs", res.data.pairs);
        setShowDuplicateDialog(true);
      } else {
        await axiosInstance.post(
          `${API_BASE}/kpi-data`,
          { data: payload, mode: "skip" },
          { headers: { token } }
        );
        showToast("success", "สำเร็จ", "เพิ่มข้อมูลเรียบร้อยแล้ว");
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
    showToast,
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
        // console.log("selectedRows", selectedRows);
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

      if (payload.length === 0) {
        showToast("info", "สำเร็จ", "ไม่มีข้อมูลใหม่ที่จะเพิ่ม");
        setDialogVisible(false);
        setShowDuplicateDialog(false);
        fetchKpiData(selectedKpi);
        resetRows();
        return;
      }

      const mode = choice === "overwrite" ? "overwrite" : "skip";
      // console.log("confirm payload", payload);
      try {
        await axiosInstance.post(
          `${API_BASE}/kpi-data`,
          { data: payload, mode },
          { headers: { token } }
        );
        showToast(
          "success",
          "สำเร็จ",
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
        showToast("error", "ผิดพลาด", "ไม่สามารถดำเนินการได้");
      }
    },
    [
      API_BASE,
      token,
      buildPayload,
      duplicatePairs,
      selectedRows,
      fetchKpiData,
      resetRows,
      showToast,
      normalizeDate,
    ]
  );

  const chooseOptions = {
    icon: <FontAwesomeIcon icon={faFileImport} />,
    className: "gap-3",
  };

  const dialogFooterTemplate = (
    <div className="flex justify-between border-t-1 pt-3 border-gray-300">
      <FileUpload
        chooseOptions={chooseOptions}
        ref={fileUploadRef}
        mode="basic"
        name="kpiFile"
        accept=".xlsx,.xls"
        maxFileSize={5000000}
        auto
        chooseLabel="Import Excel"
        customUpload
        uploadHandler={onFileUpload}
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
        // await fetchKpiData(selectedKpi);
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
      <Dropdown
        value={selectedKpi}
        options={kpiNames}
        onChange={handleKpiChange}
        optionLabel="label"
        placeholder="เลือก KPI"
        className="mr-5"
        filter
        filterDelay={400}
      />

      <div className="flex gap-5">
        <div className="flex items-center">
          <Calendar
            value={sinceDate}
            onChange={(e) => setSinceDate(e.value)}
            view="month"
            dateFormat="mm/yy"
            className="mr-3 w-35"
            placeholder="เริ่มต้น"
            showIcon
          />
          <p> - </p>
          <Calendar
            value={endDate}
            onChange={(e) => setEndDate(e.value)}
            view="month"
            placeholder="สิ้นสุด"
            dateFormat="mm/yy"
            className="ml-3 w-35"
            showIcon
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
    </div>
  );

  return (
    <div className="Home-page overflow-hidden min-h-dvh flex flex-col justify-between">
      <ScrollTop />
      <Toast ref={toast} />
      <ConfirmDialog />
      <div
        className={`flex-1 transition-all duration-300 p-4 sm:p-8 pt-5 overflow-auto`}
      >
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-2xl font-semibold">จัดการข้อมูลตัวชี้วัด</h5>
          <div className="flex justify-between gap-3">
            <Button
              label="+ เพิ่มข้อมูลตัวชี้วัด"
              onClick={() => setDialogVisible(true)}
              severity="success"
            />
          </div>
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

      <KpiFormDialog
        dialogVisible={dialogVisible}
        setDialogVisible={() => setDialogVisible(false)}
        kpiNamesActive={kpiNamesActive}
        rows={rows}
        handleInputChange={handleInputChange}
        addRow={addRow}
        removeRow={removeRow}
        dialogFooterTemplate={dialogFooterTemplate}
      />

      <DuplicateDialog
        showDuplicateDialog={showDuplicateDialog}
        setShowDuplicateDialog={() => setShowDuplicateDialog(false)}
        duplicatePairs={duplicatePairs}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        dialogFooterDuplicate={dialogFooterDuplicate}
      />
      <Footer />
    </div>
  );
}

export default KpiFormPage;
