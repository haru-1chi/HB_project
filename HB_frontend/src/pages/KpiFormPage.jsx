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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEdit,
  faPlus,
  faCheck,
  faXmark,
  faSave,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import KpiFormDialog from "../components/KpiFormDialog";
import Footer from "../components/Footer";
import { Checkbox } from "primereact/checkbox";
const API_BASE =
  import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";

function KpiFormPage() {
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

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  //เรียกดูข้อมูลตามชื่อตัวชี้วัด
  const handleKpiChange = (e) => {
    setSelectedKpi(e.value);
    fetchKpiData(e.value, searchTerm); // immediate fetch for dropdown
  };

  useEffect(() => {
    const fetchKpiNames = async () => {
      try {
        const res = await axios.get(`${API_BASE}/getKPIName`, {
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
        const res = await axios.get(`${API_BASE}/getKPIData`, {
          params: { kpi_name: kpiId, search },
        });
        setKpiData(res.data);
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
    setEditRowData(row); // use reference, not copy entire object
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

          await axios.put(`${API_BASE}/updateKPIData`, [payload], {
            headers: { token },
          });

          setKpiData((prev) =>
            prev.map((row) => (row.id === editRowId ? payload : row))
          );

          showToast("success", "สำเร็จ", "อัพเดตข้อมูลเรียบร้อยแล้ว");
          cancelEdit();
        } catch (err) {
          showToast("error", "ผิดพลาด", err.message || "การอัพเดตล้มเหลว");
        }
      },
    });
  }, [editRowData, editRowId, token, cancelEdit, showToast]);

  const renderDateCell = (row) =>
    editRowId === row.id ? (
      <Calendar
        value={
          editRowData.report_date ? new Date(editRowData.report_date) : null
        }
        onChange={(e) =>
          setEditRowData({ ...editRowData, report_date: e.value })
        }
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
          value={editRowData.type}
          options={[
            { label: "ไทย", value: "ไทย" },
            { label: "ต่างชาติ", value: "ต่างชาติ" },
          ]}
          onChange={(e) =>
            setEditRowData((prev) => ({ ...prev, type: e.value }))
          }
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
        <div className="flex justify-center gap-2">
          <Button
            rounded
            icon={<FontAwesomeIcon icon={faEdit} />}
            className="p-button-warning p-button-sm"
            onClick={() => startEditRow(row)}
          />
        </div>
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

      const res = await axios.post(`${API_BASE}/checkDuplicates`, payload, {
        headers: { token },
      });
      console.log("submit payload", payload);
      if (res.data.pairs.length > 0) {
        setDuplicatePairs(res.data.pairs);

        const allNewRows = res.data.pairs.filter((p) => p.status === "ใหม่");
        setSelectedRows(allNewRows);

        console.log("submit DuplicatePairs", res.data.pairs);
        setShowDuplicateDialog(true);
      } else {
        await axios.post(
          `${API_BASE}/create-or-update`,
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

      if (choice === "overwrite") {
        const overwriteRows = normalizeSelectedRows(selectedRows);
        const allRows = buildPayload();

        const nonDuplicateRows = allRows.filter(
          (row) =>
            !selectedRows.some(
              (sel) =>
                sel.kpi_name === row.kpi_name &&
                sel.type === row.type &&
                normalizeDate(sel.report_date) ===
                  normalizeDate(row.report_date)
            )
        );

        payload = [...overwriteRows, ...nonDuplicateRows];
      } else {
        payload = buildPayload();
      }

      const mode = choice === "overwrite" ? "overwrite" : "skip";
      console.log("confirm payload", payload);
      try {
        await axios.post(
          `${API_BASE}/create-or-update`,
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
    <div className="border-t-1 pt-3 border-gray-300">
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
        await axios.delete(`${API_BASE}/deleteKPIData/${id}`, {
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

  return (
    <div className="Home-page overflow-hidden">
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
            <Column
              header="ลำดับ"
              body={(rowData) => kpiData.indexOf(rowData) + 1}
              sortable
              field="id"
              style={{ width: "5%" }}
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
            />

            <Column
              header="ลบ"
              body={renderDeleteButton}
              style={{ width: "80px", textAlign: "center" }}
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
