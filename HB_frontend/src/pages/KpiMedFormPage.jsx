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
import { ScrollTop } from "primereact/scrolltop";
import { FileUpload } from "primereact/fileupload";
import { InputNumber } from "primereact/inputnumber";
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
function KpiMedFormPage() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";
  const { logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [sinceDate, setSinceDate] = useState(null); //for filter
  const [endDate, setEndDate] = useState(null); //for filter

  const toast = useRef(null);
  const fileUploadRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const [kpiNames, setKpiNames] = useState([]);
  const [kpiNamesActive, setKpiNamesActive] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiData, setKpiData] = useState([]);
  const [duplicatePairs, setDuplicatePairs] = useState([]);

  const [selectedOPD, setSelectedOPD] = useState(null);
  const [OPDNames, setOPDNames] = useState([]);

  const [editRowId, setEditRowId] = useState(null);
  const [editRowData, setEditRowData] = useState({});
  const [previousValues, setPreviousValues] = useState({});

  //form
  const [selectedOPDForm, setSelectedOPDForm] = useState(null);
  const [reportDateForm, setReportDateForm] = useState(null);

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  useEffect(() => {
    const fetchKpiNames = async () => {
      try {
        const res = await axios.get(`${API_BASE}/kpi-name-med`, {
          params: { includeDeleted: true },
        });

        const options = res.data.map((item) => ({
          label: item.kpi_name,
          value: item.id,
          created_by: item.created_by,
          deleted: item.deleted_at !== null,
        }));

        const active = options.filter((opt) => !opt.deleted);
        setKpiNames(active);

        const resOPD = await axios.get(`${API_BASE}/opd-name`, {
          params: { includeDeleted: true },
        });

        const optionsresOPD = resOPD.data.map((item) => ({
          label: item.opd_name,
          value: item.id,
          deleted: item.deleted_at !== null,
        }));

        const activeresOPD = optionsresOPD.filter((opt) => !opt.deleted);
        setOPDNames(activeresOPD);

        if (active.length > 0) {
          const first = active[0].value;
          setSelectedKpi(first);
          fetchKpiData(first);
        }
      } catch (err) {
        showToast("error", "ผิดพลาด", err.message || "โหลดชื่อ KPI ล้มเหลว");
        console.error(err);
      }
    };

    fetchKpiNames();
  }, []);

  // 🟢 Fetch KPI data (your KPI detail endpoint)
  const fetchKpiData = useCallback(
    async (kpiId, search = "") => {
      if (!kpiId) return;

      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/kpi-data-med`, {
          params: { kpi_id: kpiId, search },
        });
        setKpiData(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        showToast("error", "ผิดพลาด", err.message || "โหลดข้อมูลไม่สำเร็จ");
        console.error("❌ Error fetching KPI MED data:", err);
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // 🟢 Auto refetch on search
  useEffect(() => {
    if (!selectedKpi) return;
    const debounced = debounce(
      () => fetchKpiData(selectedKpi, searchTerm),
      500
    );
    debounced();
    return () => debounced.cancel();
  }, [searchTerm, selectedKpi, fetchKpiData]);

  // ✅ For table header form
  const handleKpiFormChange = (e) => setSelectedKpi(e.value);
  const handleOPDFormChange = (e) => setSelectedOPDForm(e.value);

  //handle change
  const handleKpiChange = (e) => {
    setSelectedKpi(e.value);
    fetchKpiData(e.value, searchTerm);
  };

  const handleOPDChange = (e) => {
    setSelectedOPD(e.value);
    fetchKpiData(e.value, searchTerm);
  };

  const handleInputChange = useCallback((rowIndex, field, value) => {
    setRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== rowIndex) return row;
        const updated = { ...row, [field]: Number(value) || 0 };
        const total =
          updated.A +
          updated.B +
          updated.C +
          updated.D +
          updated.E +
          updated.F +
          updated.G +
          updated.H +
          updated.I;
        return { ...updated, total };
      })
    );
  }, []);

  //add rows
  const [rows, setRows] = useState([
    {
      id: 1,
      kpi_id: null,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
      G: 0,
      H: 0,
      I: 0,
      total: 0,
    },
  ]);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        kpi_id: null,
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        E: 0,
        F: 0,
        G: 0,
        H: 0,
        I: 0,
        total: 0,
      },
    ]);
  }, []);

  const removeRow = useCallback((rowIndex) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
  }, []);

 const handleSave = async () => {
  if (!reportDateForm) {
    showToast("warn", "ข้อมูลไม่ครบ", "กรุณาเลือกเดือน/ปี");
    return;
  }

  // Validate rows
  if (rows.length === 0) {
    showToast("error", "ผิดพลาด", "กรุณาเพิ่มข้อมูลอย่างน้อย 1 แถว");
    return;
  }

  if (rows.some((r) => !r.kpi_id)) {
    showToast("error", "ผิดพลาด", "กรุณาเลือก KPI ให้ครบทุกแถว");
    return;
  }

  const formattedDate = reportDateForm.toISOString().split("T")[0]; // e.g. "2025-11-12"

  // ✅ Build payload per row
  const payload = rows.map((r) => ({
    kpi_id: r.kpi_id,
    opd_id: selectedOPDForm, // OPD / department
    A: Number(r.A) || 0,
    B: Number(r.B) || 0,
    C: Number(r.C) || 0,
    D: Number(r.D) || 0,
    E: Number(r.E) || 0,
    F: Number(r.F) || 0,
    G: Number(r.G) || 0,
    H: Number(r.H) || 0,
    I: Number(r.I) || 0,
    report_date: formattedDate,
  }));

  console.log(payload)
  try {
    setLoading(true);

    // ✅ POST as array (backend expects req.body to be an array)
    const res = await axios.post(`${API_BASE}/kpi-data-med`, payload, {
      headers: { token },
    });

    showToast("success", "สำเร็จ", res.data.message || "เพิ่มข้อมูลเรียบร้อยแล้ว");

    setDialogVisible(false);
    fetchKpiData(selectedKpi); // refresh
  } catch (err) {
    console.error("❌ Error saving KPI MED Error:", err);
    showToast("error", "ผิดพลาด", err.response?.data?.message || err.message);
  } finally {
    setLoading(false);
  }
};


  //for edit mode
  const cancelEdit = useCallback(() => {
    setEditRowId(null);
    setEditRowData({});
  }, []);

  const renderActionCell = useCallback(
    (row) =>
      editRowId === row.id ? (
        <div className="flex justify-center gap-2">
          <Button
            rounded
            icon={<FontAwesomeIcon icon={faCheck} />}
            className="p-button-success p-button-sm"
            // onClick={confirmSaveRow}
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
          // onClick={() => startEditRow(row)}
        />
      ),
    [
      editRowId,
      // confirmSaveRow,
      cancelEdit,
      // startEditRow,
    ]
  );

  //for deleted

  const confirmDelete = useCallback(
    (rowId) => {
      confirmDialog({
        message: "ต้องการลบรายการนี้หรือไม่?",
        header: "ยืนยันการลบ",
        icon: "pi pi-exclamation-triangle",
        acceptClassName: "p-button-danger",
        // accept: () => handleDelete(rowId),
        reject: () => showToast("info", "ยกเลิก", "การลบถูกยกเลิก"),
      });
    },
    [
      // handleDelete,
      showToast,
    ]
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

  const dialogFooterTemplate = (
    <div className="flex justify-end border-t-1 pt-3 border-gray-300">
      <Button label="บันทึกข้อมูล" severity="success" onClick={handleSave} />
    </div>
  );

  const header = (
    <div className="p-2 flex items-end justify-start">
      <Dropdown
        value={selectedKpi}
        options={kpiNames}
        onChange={handleKpiChange}
        optionLabel="label"
        placeholder="เลือก KPI"
        className="mr-5"
      />

      {/* <Dropdown
        value={selectedOPD}
        options={OPDNames}
        onChange={handleOPDChange}
        optionLabel="label"
        placeholder="เลือก OPD"
        className="mr-5"
      />

      <Calendar
        value={sinceDate}
        onChange={(e) => setSinceDate(e.value)}
        view="month"
        dateFormat="mm/yy"
        placeholder="เดือน/ปี"
        showIcon
      /> */}
    </div>
  );

  const headerForm = (
    <div className="p-2 flex items-end justify-start">
      <Dropdown
        value={selectedOPDForm}
        options={OPDNames}
        onChange={handleOPDFormChange}
        optionLabel="label"
        placeholder="เลือก OPD"
        className="mr-5"
      />

      <Calendar
        value={reportDateForm}
        onChange={(e) => setReportDateForm(e.value)}
        view="month"
        dateFormat="mm/yy"
        placeholder="เดือน/ปี"
        showIcon
      />
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
          <h5 className="text-2xl font-semibold">
            จัดการข้อมูลตัวชี้วัดความเสี่ยง
          </h5>
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
            // rowsPerPageOptions={[10, 25, 50]}
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
            <Column field="report_date" header="เดือน/ปี" sortable />
            <Column field="opd_name" header="OPD" sortable />
            <Column field="A" header="A" />
            <Column field="B" header="B" />
            <Column field="C" header="C" />
            <Column field="D" header="D" />
            <Column field="E" header="E" />
            <Column field="F" header="F" />
            <Column field="G" header="G" />
            <Column field="H" header="H" />
            <Column field="I" header="I" />
            <Column field="total" header="รวม" />
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
        contentStyle={{ minHeight: "500px" }}
        footer={dialogFooterTemplate}
      >
        <DataTable
          header={headerForm}
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
                value={row.kpi_id}
                options={kpiNames}
                optionLabel="label"
                placeholder="เลือก KPI"
                className="w-full"
                onChange={(e) => {
                  const selectedId = e.value;
                  const selectedOption = kpiNames.find(
                    (o) => o.value === selectedId
                  );

                  handleInputChange(opt.rowIndex, "kpi_id", selectedId);

                  handleInputChange(
                    opt.rowIndex,
                    "kpi_label",
                    selectedOption?.label || ""
                  );
                }}
              />
            )}
          />

          {["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((field) => (
            <Column
              key={field}
              field={field}
              header={field}
              style={{ width: "100px" }}
              body={(row, opt) => (
                <InputText
                  value={row[field]}
                  onChange={(e) =>
                    handleInputChange(opt.rowIndex, field, e.target.value)
                  }
                  className="w-full text-center"
                />
              )}
            />
          ))}

          <Column
            field="total"
            header="รวม"
            style={{ width: "100px" }}
            body={(row) => (
              <InputText
                value={row.total}
                disabled
                className="w-full text-center bg-gray-100"
              />
            )}
          />

          <Column
            align="center"
            header="ลบ"
            style={{ width: "50px" }}
            body={(_, opt) => (
              <Button
                icon={<FontAwesomeIcon icon={faXmark} />}
                severity="danger"
                rounded
                text
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

      {/* <KpiFormDialog
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
      /> */}

      <Footer />
    </div>
  );
}

export default KpiMedFormPage;
