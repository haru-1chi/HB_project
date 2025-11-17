import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { debounce } from "lodash";
import { classNames } from "primereact/utils";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { TreeTable } from "primereact/treetable";
import { Column } from "primereact/column";
import { Row } from "primereact/row";
import { ColumnGroup } from "primereact/columngroup";
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
  const [selectedKpiForm, setSelectedKpiForm] = useState(null);
  const [reportDateForm, setReportDateForm] = useState(null);
  const [displayMode, setDisplayMode] = useState("byMonth");

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

          // 👉 fetch latest month automatically
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, "0");

          fetchKpiData(`${yyyy}-${mm}-01`);
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
    async (month) => {
      if (!month) return;

      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/kpi-data-med`, {
          params: { month },
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

  // const fetchKpiData = useCallback(
  //   async (kpiId, search = "") => {
  //     if (!kpiId) return;

  //     setLoading(true);
  //     try {
  //       const res = await axios.get(`${API_BASE}/kpi-data-med`, {
  //         params: { kpi_id: kpiId, search },
  //       });
  //       setKpiData(Array.isArray(res.data) ? res.data : []);
  //     } catch (err) {
  //       showToast("error", "ผิดพลาด", err.message || "โหลดข้อมูลไม่สำเร็จ");
  //       console.error("❌ Error fetching KPI MED data:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   },
  //   [showToast]
  // );

  // 🟢 Auto refetch on search
  // useEffect(() => {
  //   if (!selectedKpi) return;
  //   const debounced = debounce(
  //     () => fetchKpiData(selectedKpi, searchTerm),
  //     500
  //   );
  //   debounced();
  //   return () => debounced.cancel();
  // }, [searchTerm, selectedKpi, fetchKpiData]);

  //*สำหรับ filter header
  const handleMonthChange = (date) => {
    setSinceDate(date);
    if (!date) return;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    // send YYYY-MM-01
    const monthString = `${yyyy}-${mm}-01`;
    fetchKpiData(monthString);
  };

  const handleKpiChange = (e) => {
    setSelectedKpi(e.value);
    fetchKpiData();
    // fetchKpiData(e.value, searchTerm);
  };
  //*สำหรับ filter header

  //*สำหรับ form
  const handleKpiFormChange = (e) => setSelectedKpiForm(e.value);

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
  //*สำหรับ form

  //add rows //////////////////////////////////////////////////////////////
  const normalizeDate = useCallback((date) => {
    if (!(date instanceof Date)) return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  }, []);

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

    if (rows.some((r) => !r.opd_id)) {
      showToast("error", "ผิดพลาด", "กรุณาเลือก OPD ให้ครบทุกแถว");
      return;
    }

    // ✅ Build payload per row
    const payload = rows.map((r) => ({
      opd_id: r.opd_id,
      kpi_id: selectedKpiForm, // OPD / department
      A: Number(r.A) || 0,
      B: Number(r.B) || 0,
      C: Number(r.C) || 0,
      D: Number(r.D) || 0,
      E: Number(r.E) || 0,
      F: Number(r.F) || 0,
      G: Number(r.G) || 0,
      H: Number(r.H) || 0,
      I: Number(r.I) || 0,
      report_date: normalizeDate(reportDateForm),
    }));

    try {
      setLoading(true);

      // ✅ POST as array (backend expects req.body to be an array)
      const res = await axios.post(`${API_BASE}/kpi-data-med`, payload, {
        headers: { token },
      });

      showToast(
        "success",
        "สำเร็จ",
        res.data.message || "เพิ่มข้อมูลเรียบร้อยแล้ว"
      );

      setDialogVisible(false);
      fetchKpiData(selectedKpi); // refresh
      resetRows();
    } catch (err) {
      console.error("❌ Error saving KPI MED Error:", err);
      showToast("error", "ผิดพลาด", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetRows = useCallback(() => {
    setRows([
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
  }, []);

  //*for edit mode//////////////////////////////////////////////////////////////
  const startEditRow = useCallback((rowNode) => {
    if (rowNode.children && rowNode.children.length > 0) return;

    setEditRowId(rowNode.key);
    setEditRowData(rowNode.data);
    setPreviousValues({
      report_date: rowNode.data.report_date,
      type: rowNode.data.type,
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditRowId(null);
    setEditRowData({});
  }, []);

  const confirmSaveRow = useCallback(async () => {
    confirmDialog({
      message: "ต้องการบันทึกรายการนี้หรือไม่",
      header: "บันทึกรายการ",
      acceptClassName: "p-button-success",
      accept: async () => {
        try {
          // make sure required fields exist
          const payload = {
            id: editRowId,
            kpi_id: editRowData.kpi_id, // add this
            opd_id: editRowData.opd_id, // add this
            A: parseInt(editRowData.A) || 0,
            B: parseInt(editRowData.B) || 0,
            C: parseInt(editRowData.C) || 0,
            D: parseInt(editRowData.D) || 0,
            E: parseInt(editRowData.E) || 0,
            F: parseInt(editRowData.F) || 0,
            G: parseInt(editRowData.G) || 0,
            H: parseInt(editRowData.H) || 0,
            I: parseInt(editRowData.I) || 0,
          };

          await axios.put(`${API_BASE}/kpi-data-med`, payload, {
            headers: { token },
          });

          setKpiData((prev) =>
            prev.map((row) =>
              row.id === editRowId ? { ...row, ...payload } : row
            )
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

  const renderInputCell = useCallback(
    (field, width) => (rowNode) => {
      const isParent = rowNode.children && rowNode.children.length > 0;
      if (isParent) return rowNode.data[field]; // parent always read-only

      if (editRowId !== rowNode.key) return rowNode.data[field]; // only active row

      return (
        <InputText
          style={{ width }}
          value={editRowData[field] || ""}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              setEditRowData((prev) => ({ ...prev, [field]: "" }));
              return;
            }
            if (!/^\d+$/.test(value)) return;

            setEditRowData((prev) => {
              const updated = { ...prev, [field]: parseInt(value) || 0 };

              // recalc row total
              const rowTotal = [
                "A",
                "B",
                "C",
                "D",
                "E",
                "F",
                "G",
                "H",
                "I",
              ].reduce((sum, key) => sum + (parseInt(updated[key]) || 0), 0);

              updated.total = rowTotal;

              // recalc parent totals live
              setKpiData((prevData) =>
                prevData.map((row) =>
                  row.id === rowNode.key
                    ? updated
                    : row.kpi_id === rowNode.data.kpi_id
                    ? { ...row } // leave other children
                    : row
                )
              );

              return updated;
            });
          }}
        />
      );
    },
    [editRowId, editRowData]
  );

  const renderActionCell = useCallback(
    (rowNode) => {
      if (rowNode.children && rowNode.children.length > 0) return null; // parent row

      const row = rowNode.data;

      return editRowId === rowNode.key ? (
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
          onClick={() => startEditRow(rowNode)}
        />
      );
    },
    [editRowId, confirmSaveRow, cancelEdit, startEditRow]
  );

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

  const renderDropdownCell = useCallback(
    (row) =>
      editRowId === row.id ? (
        <Dropdown
          className={editRowData.isInvalid ? "p-invalid" : ""}
          value={editRowData.opd_id} // 👈 assuming your field is opd_id
          options={OPDNames} // 👈 now using dynamic options
          onChange={(e) => {
            const newOpdId = e.value;

            // check for duplicate by OPD and date (optional)
            const duplicate = kpiData.some(
              (r) =>
                r.id !== editRowData.id &&
                r.kpi_name === editRowData.kpi_name &&
                r.report_date?.slice(0, 7) ===
                  (editRowData.report_date
                    ? editRowData.report_date.slice(0, 7)
                    : "") &&
                r.opd_id === newOpdId
            );

            if (duplicate) {
              showToast(
                "warn",
                "ไม่สามารถเปลี่ยนแปลงได้",
                "ข้อมูลจะซ้ำกับแถวอื่น"
              );

              setEditRowData((prev) => ({
                ...prev,
                opd_id: previousValues.opd_id,
              }));
              return;
            }

            setEditRowData((prev) => ({ ...prev, opd_id: newOpdId }));
          }}
          placeholder="เลือก OPD"
          style={{ width: "160px" }}
        />
      ) : (
        // display OPD name instead of ID when not editing
        OPDNames.find((o) => o.value === row.opd_id)?.label || "-"
      ),
    [editRowId, editRowData, OPDNames]
  );

  //for deleted////////////////////////////////////
  const handleDelete = useCallback(
    async (id) => {
      try {
        await axios.delete(`${API_BASE}/kpi-data-med/${id}`, {
          headers: { token },
        });

        setKpiData((prev) => {
          const updated = prev.filter((row) => row.id !== id);

          // collapse parents with no children left
          setExpandedKeys((prevExp) => {
            const newExp = { ...prevExp };
            for (const key in newExp) {
              const hasChild = updated.some((r) => r.kpi_id == key);
              if (!hasChild) delete newExp[key];
            }
            return newExp;
          });

          return updated;
        });

        showToast("success", "Success", "Deleted successfully");
      } catch (err) {
        console.error("Delete failed:", err);
        showToast("error", "Error", err.message || "Delete failed");
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
    (rowNode) => {
      const isParent = rowNode.children && rowNode.children.length > 0;

      // ❌ Parent -> no delete button
      if (isParent) return null;

      return (
        <Button
          icon={<FontAwesomeIcon icon={faTrash} />}
          severity="danger"
          rounded
          onClick={() => confirmDelete(rowNode.key)}
        />
      );
    },
    [confirmDelete]
  );

  const dialogFooterTemplate = (
    <div className="flex justify-end border-t-1 pt-3 border-gray-300">
      <Button label="บันทึกข้อมูล" severity="success" onClick={handleSave} />
    </div>
  );

  const header = (
    <div className="flex items-end justify-start">
      {/* <Dropdown
        value={displayMode}
        options={[
          { label: "เลือกดูตามเดือน", value: "byMonth" },
          { label: "เลือกดูตามตัวชี้วัด", value: "byKpi" },
        ]}
        onChange={(e) => setDisplayMode(e.value)}
        optionLabel="label"
        placeholder="เลือกรูปแบบการแสดงข้อมูล"
        className="mr-5"
      /> */}

      {displayMode === "byMonth" && (
        <Calendar
          value={sinceDate}
          onChange={(e) => handleMonthChange(e.value)}
          view="month"
          dateFormat="mm/yy"
          placeholder="เดือน/ปี"
          showIcon
        />
      )}

      {displayMode === "byKpi" && (
        <Dropdown
          value={selectedKpi}
          options={kpiNames}
          onChange={handleKpiChange}
          optionLabel="label"
          placeholder="เลือก KPI"
          className="mr-5"
        />
      )}
    </div>
  );

  const headerForm = (
    <div className="p-2 flex items-end justify-start">
      <Dropdown
        value={selectedKpiForm}
        options={kpiNames}
        optionLabel="label"
        placeholder="เลือก KPI"
        className="min-w-xs mr-3"
        onChange={handleKpiFormChange}
      />

      <Calendar
        value={reportDateForm}
        onChange={(e) => setReportDateForm(e.value)}
        view="month"
        dateFormat="mm/yy"
        placeholder="เดือน/ปี"
        className="w-50"
        showIcon
      />
    </div>
  );

  const totals = useMemo(() => {
    const sumField = (field) =>
      rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);

    return {
      A: sumField("A"),
      B: sumField("B"),
      C: sumField("C"),
      D: sumField("D"),
      E: sumField("E"),
      F: sumField("F"),
      G: sumField("G"),
      H: sumField("H"),
      I: sumField("I"),
      total: sumField("total"),
    };
  }, [rows]);

  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column />
        <Column footer="รวม" />
        <Column footer={totals.A} />
        <Column footer={totals.B} />
        <Column footer={totals.C} />
        <Column footer={totals.D} />
        <Column footer={totals.E} />
        <Column footer={totals.F} />
        <Column footer={totals.G} />
        <Column footer={totals.H} />
        <Column footer={totals.I} />
        <Column footer={totals.total} />
        <Column />
      </Row>
    </ColumnGroup>
  );

  const [expandedKeys, setExpandedKeys] = useState({});

  const nodes = Object.values(
    kpiData.reduce((acc, row) => {
      if (!acc[row.kpi_id]) {
        acc[row.kpi_id] = {
          kpi_id: row.kpi_id,
          kpi_label: row.kpi_label,
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
          details: [],
        };
      }

      acc[row.kpi_id].details.push(row);

      // sum children for parent
      ["A", "B", "C", "D", "E", "F", "G", "H", "I", "total"].forEach(
        (key) => (acc[row.kpi_id][key] += parseInt(row[key]) || 0)
      );

      return acc;
    }, {})
  ).map((kpi) => ({
    key: kpi.kpi_id,
    data: {
      kpi_label: kpi.kpi_label,
      A: kpi.A,
      B: kpi.B,
      C: kpi.C,
      D: kpi.D,
      E: kpi.E,
      F: kpi.F,
      G: kpi.G,
      H: kpi.H,
      I: kpi.I,
      total: kpi.total,
    },
    children: kpi.details.map((opd) => ({
      key: opd.id,
      data: {
        ...opd, // include id, kpi_id, opd_id, totals
        opd_name: opd.opd_name,
      },
    })),
  }));

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
          <TreeTable
            header={header}
            value={nodes}
            tableStyle={{ minWidth: "50rem" }}
            expandedKeys={expandedKeys}
            onToggle={(e) => setExpandedKeys(e.value)}
            showGridlines
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
          >
            <Column
              header="อุบัติการณ์ความเสี่ยง"
              style={{ width: "320px" }}
              body={
                (rowNode) =>
                  rowNode.children?.length
                    ? rowNode.data.kpi_label // parent
                    : rowNode.data.opd_name // child
              }
              expander
            />
            <Column field="A" header="A" body={renderInputCell("A", "80px")} />
            <Column field="B" header="B" body={renderInputCell("B", "80px")} />
            <Column field="C" header="C" body={renderInputCell("C", "80px")} />
            <Column field="D" header="D" body={renderInputCell("D", "80px")} />
            <Column field="E" header="E" body={renderInputCell("E", "80px")} />
            <Column field="F" header="F" body={renderInputCell("F", "80px")} />
            <Column field="G" header="G" body={renderInputCell("G", "80px")} />
            <Column field="H" header="H" body={renderInputCell("H", "80px")} />
            <Column field="I" header="I" body={renderInputCell("I", "80px")} />
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
          </TreeTable>

          {/* <DataTable
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
            <Column
              field="report_date"
              header="เดือน/ปี"
              body={renderDateCell}
              sortable
              style={{ width: "160px" }}
            />
            <Column
              field="opd_name"
              header="OPD"
              body={renderDropdownCell}
              sortable
              style={{ width: "160px" }}
            />
            <Column field="A" header="A" body={renderInputCell("A", "80px")} />
            <Column field="B" header="B" body={renderInputCell("B", "80px")} />
            <Column field="C" header="C" body={renderInputCell("C", "80px")} />
            <Column field="D" header="D" body={renderInputCell("D", "80px")} />
            <Column field="E" header="E" body={renderInputCell("E", "80px")} />
            <Column field="F" header="F" body={renderInputCell("F", "80px")} />
            <Column field="G" header="G" body={renderInputCell("G", "80px")} />
            <Column field="H" header="H" body={renderInputCell("H", "80px")} />
            <Column field="I" header="I" body={renderInputCell("I", "80px")} />
            <Column
              field="total"
              header="รวม"
              body={(row) =>
                editRowId === row.id ? editRowData.total || 0 : row.total || 0
              }
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
          </DataTable> */}
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
          footerColumnGroup={footerGroup}
        >
          <Column
            header="ลำดับ"
            body={(_, opt) => opt.rowIndex + 1}
            style={{ width: "50px" }}
            align="center"
          />

          <Column
            field="opd_name"
            header="ชื่อ OPD"
            body={(row, opt) => (
              <Dropdown
                value={row.opd_id}
                options={OPDNames}
                onChange={(e) => {
                  const selectedId = e.value;
                  const selectedOption = OPDNames.find(
                    (o) => o.value === selectedId
                  );
                  handleInputChange(opt.rowIndex, "opd_id", selectedId);
                  handleInputChange(
                    opt.rowIndex,
                    "opd_label",
                    selectedOption?.label || ""
                  );
                }}
                optionLabel="label"
                placeholder="เลือก OPD"
                className="w-full"
              />
            )}
          />

          {["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((field) => (
            <Column
              key={field}
              field={field}
              header={field}
              body={(row, opt) => (
                <InputText
                  value={row[field]}
                  onChange={(e) =>
                    handleInputChange(opt.rowIndex, field, e.target.value)
                  }
                  className="w-full"
                />
              )}
            />
          ))}

          <Column
            field="total"
            header="รวม"
            body={(row) => (
              <InputText
                value={row.total}
                disabled
                className="w-full bg-gray-100"
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
