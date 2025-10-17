import React, { useState, useCallback, useMemo } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import axios from "axios";

function KpiFormDialog({
  API_BASE,
  token,
  kpiNames,
  fetchKpiData,
  selectedKpi,
  showSuccess,
  showError,
}) {
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
  const [dialogVisible, setDialogVisible] = useState(false);
  const [duplicatePairs, setDuplicatePairs] = useState([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // ✅ Memoized helpers
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

  // ✅ Efficient state update (no mutation)
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

      if (res.data.pairs.length > 0) {
        setDuplicatePairs(res.data.pairs);
        setShowDuplicateDialog(true);
      } else {
        await axios.post(
          `${API_BASE}/create-or-update`,
          { data: payload, mode: "skip" },
          { headers: { token } }
        );
        showSuccess("เพิ่มข้อมูลเรียบร้อยแล้ว");
        fetchKpiData(selectedKpi);
        setDialogVisible(false);
      }
    } catch (err) {
      console.error(err);
      showError("เกิดข้อผิดพลาดในการส่งข้อมูล");
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
      const mode = choice === "overwrite" ? "overwrite" : "skip";
      const payload = buildPayload();

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
        setDialogVisible(false);
        setShowDuplicateDialog(false);
      } catch (err) {
        console.error(err);
        showError("ไม่สามารถดำเนินการได้");
      }
    },
    [API_BASE, token, buildPayload, showError, showSuccess]
  );

  const dialogFooterTemplate = useMemo(
    () => (
      <div className="border-t-1 pt-3 border-gray-300">
        <Button label="บันทึกข้อมูล" severity="success" onClick={submitRows} />
      </div>
    ),
    [submitRows]
  );

  return (
    <>
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
        <DataTable value={rows} showGridlines size="small">
          <Column
            header="ID"
            body={(_, opt) => opt.rowIndex + 1}
            style={{ width: "50px" }}
          />
          <Column
            header="ชื่อตัวชี้วัด"
            body={(row, opt) => (
              <Dropdown
                value={row.kpi_name}
                options={kpiNames}
                placeholder="เลือก KPI"
                className="w-75"
                onChange={(e) => {
                  const selected = kpiNames.find((o) => o.value === e.value);
                  handleInputChange(opt.rowIndex, "kpi_name", e.value);
                  handleInputChange(
                    opt.rowIndex,
                    "a_name",
                    selected?.a_name || ""
                  );
                  handleInputChange(
                    opt.rowIndex,
                    "b_name",
                    selected?.b_name || ""
                  );
                }}
              />
            )}
          />
          <Column header="ชื่อตัวตั้ง" body={(row) => row.a_name || "-"} />
          <Column header="ชื่อตัวหาร" body={(row) => row.b_name || "-"} />
          <Column
            header="เดือน/ปี"
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
            header="ค่าตัวตั้ง"
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
            header="ค่าตัวหาร"
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
            header="ประเภท"
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
            body={(_, opt) => (
              <Button
                icon="pi pi-times"
                severity="danger"
                text
                onClick={() => removeRow(opt.rowIndex)}
              />
            )}
          />
        </DataTable>
        <div className="flex justify-end mt-3">
          <Button label="+ เพิ่มแถว" onClick={addRow} size="small" />
        </div>
      </Dialog>

      <Dialog
        header="พบข้อมูลซ้ำ!"
        visible={showDuplicateDialog}
        style={{ width: "75vw" }}
        maximizable
        modal
        onHide={() => setShowDuplicateDialog(false)}
        contentStyle={{ minHeight: "500px" }}
      >
        <DataTable value={duplicatePairs} showGridlines size="small">
          <Column field="status" header="สถานะ" style={{ width: "8rem" }} />
          <Column field="kpi_name" header="ตัวชี้วัด" />
          <Column field="a_value" header="ค่าตัวตั้ง" />
          <Column field="b_value" header="ค่าตัวหาร" />
          <Column field="report_date" header="เดือน/ปี" />
          <Column field="type" header="ประเภท" />
        </DataTable>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            label="ยกเลิก"
            severity="secondary"
            onClick={() => setShowDuplicateDialog(false)}
          />
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
      </Dialog>
    </>
  );
}
export default KpiFormDialog;