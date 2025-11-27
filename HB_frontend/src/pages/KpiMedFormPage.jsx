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
    [API_BASE, showToast]
  );

  const processKpiForDropdown = (tree) => {
    return tree.map((node) => {
      if (node.children && node.children.length > 0) {
        // Parent has children → parent not selectable
        return {
          label: node.kpi_name,
          items: node.children.map((child) => ({
            label: child.kpi_name,
            value: child.id,
          })),
        };
      } else {
        // Parent has no children → selectable
        return { items: [{ label: node.kpi_name, value: node.id }] };
      }
    });
  };

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const [resKpi, resOPD] = await Promise.all([
          axios.get(`${API_BASE}/kpi-name-med`),
          axios.get(`${API_BASE}/opd-name-group`, {
            params: { includeDeleted: true },
          }),
        ]);

        // const processData = (data, labelKey) =>
        //   data
        //     .filter((item) => !item.deleted_at) // filter active items
        //     .map((item) => ({
        //       label: item[labelKey],
        //       value: item.id,
        //       created_by: item.created_by,
        //     }));

        const activeKpi = processKpiForDropdown(resKpi.data);

        setKpiNames(activeKpi);
        setOPDNames(resOPD.data);
        console.log(activeKpi);
        if (activeKpi.length > 0) {
          setSelectedKpi(activeKpi[0].value);

          // 👉 Fetch latest month automatically
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, "0");
          fetchKpiData(`${yyyy}-${mm}-01`);
        }
      } catch (err) {
        showToast(
          "error",
          "ผิดพลาด",
          err.message || "โหลดชื่อ KPI หรือ OPD ล้มเหลว"
        );
        console.error(err);
      }
    };

    fetchNames();
  }, [API_BASE, fetchKpiData, showToast]);

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
  const fields = useMemo(
    () => ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
    []
  );

  const createEmptyRow = (id) =>
    fields.reduce((acc, f) => ({ ...acc, [f]: 0 }), {
      id,
      kpi_id: null,
      opd_id: null,
      opd_label: "",
      total: 0,
    });

  // -------------------------
  // Helper: normalize date
  const normalizeDate = useCallback((date) => {
    if (!(date instanceof Date)) return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  }, []);

  // -------------------------
  // Memoized OPD map for fast lookup
  const OPDMap = useMemo(
    () => new Map(OPDNames.map((o) => [o.value, o.label])),
    [OPDNames]
  );

  // -------------------------
  // Update single row efficiently
  const handleInputChange = useCallback((rowIndex, field, value) => {
    setRows((prev) => {
      const newRows = [...prev];
      const row = { ...newRows[rowIndex] };

      if (fields.includes(field)) {
        row[field] = Number(value) || 0;
        // total computed once per row
        row.total = fields.reduce((sum, f) => sum + row[f], 0);
      } else {
        row[field] = value; // opd_id or label
      }

      newRows[rowIndex] = row;
      return newRows;
    });
  }, []);
  //*สำหรับ form

  //add rows //////////////////////////////////////////////////////////////
  const [rows, setRows] = useState([createEmptyRow(1)]);

  const addRow = useCallback(
    () => setRows((prev) => [...prev, createEmptyRow(prev.length + 1)]),
    []
  );

  const removeRow = useCallback(
    (rowIndex) => setRows((prev) => prev.filter((_, i) => i !== rowIndex)),
    []
  );

  const resetRows = useCallback(() => setRows([createEmptyRow(1)]), []);

  const handleSave = useCallback(async () => {
    if (!reportDateForm) {
      showToast("warn", "ข้อมูลไม่ครบ", "กรุณาเลือกเดือน/ปี");
      return;
    }
    if (!rows.length) {
      showToast("error", "ผิดพลาด", "กรุณาเพิ่มข้อมูลอย่างน้อย 1 แถว");
      return;
    }
    if (rows.some((r) => !r.opd_id)) {
      showToast("error", "ผิดพลาด", "กรุณาเลือก OPD ให้ครบทุกแถว");
      return;
    }

    const payload = rows.map((r) => ({
      opd_id: r.opd_id,
      kpi_id: selectedKpiForm,
      report_date: normalizeDate(reportDateForm),
      ...fields.reduce((acc, f) => ({ ...acc, [f]: Number(r[f] || 0) }), {}),
    }));

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/kpi-data-med`, payload, {
        headers: { token },
      });

      showToast(
        "success",
        "สำเร็จ",
        res.data.message || "เพิ่มข้อมูลเรียบร้อยแล้ว"
      );
      resetRows();
      fetchKpiData(selectedKpi); //ดึงข้อมูล response เดือนที่เพิ่ม
      setDialogVisible(false);
    } catch (err) {
      console.error("❌ Error saving KPI MED Error:", err);
      showToast("error", "ผิดพลาด", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [
    rows,
    selectedKpiForm,
    reportDateForm,
    API_BASE,
    token,
    fetchKpiData,
    normalizeDate,
    resetRows,
    selectedKpi,
    showToast,
    setDialogVisible,
  ]);

  //*for edit mode//////////////////////////////////////////////////////////////
  const startEditRow = useCallback((rowNode) => {
    if (rowNode.children?.length) return; // parent row cannot edit
    setEditRowId(rowNode.key);
    setEditRowData(rowNode.data);
    setPreviousValues(rowNode.data);
  }, []);

  const cancelEdit = useCallback(() => {
    if (editRowId && previousValues) {
      setKpiData((prev) =>
        prev.map((r) => (r.id === editRowId ? previousValues : r))
      );
    }
    setEditRowId(null);
    setEditRowData({});
    setPreviousValues(null);
  }, [editRowId, previousValues]);

  const confirmSaveRow = useCallback(async () => {
    if (!editRowId) return;

    confirmDialog({
      message: "ต้องการบันทึกรายการนี้หรือไม่",
      header: "บันทึกรายการ",
      acceptClassName: "p-button-success",
      accept: async () => {
        try {
          const payload = { id: editRowId };
          fields.forEach((f) => (payload[f] = parseInt(editRowData[f]) || 0));
          payload.kpi_id = editRowData.kpi_id;
          payload.opd_id = editRowData.opd_id;

          await axios.put(`${API_BASE}/kpi-data-med`, payload, {
            headers: { token },
          });

          setKpiData((prev) =>
            prev.map((r) => (r.id === editRowId ? { ...r, ...payload } : r))
          );

          showToast("success", "สำเร็จ", "อัพเดตข้อมูลเรียบร้อยแล้ว");
          cancelEdit();
        } catch (err) {
          const isConflict = err.response?.status === 409;
          showToast(
            isConflict ? "warn" : "error",
            isConflict ? "ข้อมูลซ้ำ" : "ผิดพลาด",
            err.response?.data?.message || err.message
          );
          if (isConflict) {
            setEditRowData((prev) => ({
              ...prev,
              report_date: previousValues.report_date,
              type: previousValues.type,
              isInvalid: true,
            }));
            fetchKpiData(selectedKpi);
          }
        }
      },
    });
  }, [
    editRowData,
    editRowId,
    cancelEdit,
    previousValues,
    token,
    showToast,
    fetchKpiData,
    selectedKpi,
    fields,
  ]);

  const renderInputCell = useCallback(
    (field, width) => (rowNode) => {
      const isParent = rowNode.children?.length > 0;
      if (isParent) return rowNode.data[field]; // parent always read-only

      if (editRowId !== rowNode.key) return rowNode.data[field]; // only active row

      return (
        <InputText
          style={{ width }}
          value={editRowData[field] ?? ""}
          onChange={(e) => {
            const value = e.target.value;

            if (value === "") {
              setEditRowData((prev) => ({ ...prev, [field]: "" }));
              return;
            }
            if (!/^\d+$/.test(value)) return;

            const numericValue = parseInt(value) || 0;

            // Update the row and parent totals
            setKpiData((prevData) => {
              let parentTotals = {}; // store sums per kpi_id

              // 1️⃣ Compute new row total
              const updatedRow = prevData.find((r) => r.id === rowNode.key);
              const updated = { ...updatedRow, [field]: numericValue };
              updated.total = fields.reduce(
                (sum, f) =>
                  sum +
                  (parseInt(f === field ? numericValue : updatedRow[f]) || 0),
                0
              );

              // 2️⃣ Compute new parent totals for this KPI
              prevData.forEach((r) => {
                if (r.kpi_id === updated.kpi_id && r.id !== updated.id) {
                  // sum other children
                  fields.forEach((f) => {
                    parentTotals[f] =
                      (parentTotals[f] || 0) + (parseInt(r[f]) || 0);
                  });
                  parentTotals.total =
                    (parentTotals.total || 0) + (parseInt(r.total) || 0);
                }
              });

              // 3️⃣ Apply updated row and parent totals
              return prevData.map((r) => {
                if (r.id === updated.id) return updated;
                if (r.kpi_id === updated.kpi_id && r.children?.length === 0)
                  return r; // child untouched
                if (r.kpi_id === updated.kpi_id && r.children?.length > 0) {
                  // parent row
                  return { ...r, ...parentTotals };
                }
                return r;
              });
            });

            // Update editRowData for active row inputs
            setEditRowData((prev) => {
              const updated = { ...prev, [field]: numericValue };
              updated.total = fields.reduce(
                (sum, f) => sum + (updated[f] != null ? updated[f] : 0),
                0
              );
              return updated;
            });
          }}
        />
      );
    },
    [editRowId, editRowData, fields]
  );

  const renderActionCell = useCallback(
    (rowNode) => {
      if (rowNode.children?.length) return null;

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

  //for deleted////////////////////////////////////
  const handleDelete = useCallback(
    async (id) => {
      try {
        await axios.delete(`${API_BASE}/kpi-data-med/${id}`, {
          headers: { token },
        });

        setKpiData((prevData) => {
          // 1️⃣ Remove deleted row
          const updatedData = prevData.filter((row) => row.id !== id);

          // 2️⃣ Compute all parent keys with remaining children
          const childrenCount = updatedData.reduce((acc, row) => {
            acc[row.kpi_id] = (acc[row.kpi_id] || 0) + 1;
            return acc;
          }, {});

          // 3️⃣ Update expandedKeys in one go
          setExpandedKeys((prevExp) => {
            const newExp = {};
            for (const key in prevExp) {
              if (childrenCount[key]) newExp[key] = true; // keep only parents with children
            }
            return newExp;
          });

          return updatedData;
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
      if (rowNode.children?.length) return null;
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
          filter
          filterDelay={400}
        />
      )}
    </div>
  );

  const headerForm = useMemo(
    () => (
      <div className="p-2 flex items-end justify-start">
        <Dropdown
          value={selectedKpiForm}
          options={kpiNames}
          optionLabel="label"
          optionGroupLabel="label"
          optionGroupChildren="items"
          placeholder="เลือก KPI"
          className="min-w-xs mr-3"
          onChange={(e) => setSelectedKpiForm(e.value)}
          filter
          filterDelay={400}
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
    ),
    [selectedKpiForm, reportDateForm, kpiNames]
  );

  const totals = useMemo(() => {
    const sums = {};
    fields.forEach((f) => {
      sums[f] = rows.reduce((acc, r) => acc + (r[f] || 0), 0);
    });
    sums.total = rows.reduce((acc, r) => acc + (r.total || 0), 0);
    return sums;
  }, [rows]);

  const footerGroup = useMemo(
    () => (
      <ColumnGroup>
        <Row>
          <Column />
          <Column footer="รวม" />
          {fields.map((f) => (
            <Column key={f} footer={totals[f]} />
          ))}
          <Column footer={totals.total} />
          <Column />
        </Row>
      </ColumnGroup>
    ),
    [totals]
  );

  const [expandedKeys, setExpandedKeys] = useState({});

  const nodes = useMemo(() => {
    const map = new Map();

    kpiData.forEach((row) => {
      if (!map.has(row.kpi_id)) {
        map.set(row.kpi_id, {
          key: row.kpi_id,
          data: {
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
          },
          children: [],
        });
      }

      const parent = map.get(row.kpi_id);

      parent.children.push({
        key: row.id,
        data: { ...row, opd_name: row.opd_name },
      });

      fields.concat("total").forEach((f) => {
        parent.data[f] += parseInt(row[f]) || 0;
      });
    });

    return Array.from(map.values());
  }, [kpiData, fields]);

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
                  handleInputChange(opt.rowIndex, "opd_id", selectedId);
                  handleInputChange(
                    opt.rowIndex,
                    "opd_label",
                    OPDMap.get(selectedId) || ""
                  );
                }}
                optionLabel="label"
                placeholder="เลือก OPD"
                optionGroupLabel="label" // Mission
                optionGroupChildren="items"
                className="w-full"
                filter
                filterDelay={400}
              />
            )}
          />

          {fields.map((field) => (
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
