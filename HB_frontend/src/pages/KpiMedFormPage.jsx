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

  const [sinceDate, setSinceDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

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

  const [editRowId, setEditRowId] = useState(null);
  const [editRowData, setEditRowData] = useState({});
  const [previousValues, setPreviousValues] = useState({});

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const [rows, setRows] = useState([
    {
      id: 1,
      kpi_id: null,
      a: 0,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: 0,
      g: 0,
      h: 0,
      i: 0,
      total: 0,
    },
  ]);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        kpi_id: null,
        a: 0,
        b: 0,
        c: 0,
        d: 0,
        e: 0,
        f: 0,
        g: 0,
        h: 0,
        i: 0,
        total: 0,
      },
    ]);
  }, []);

  const header = (
    <div className="p-2 flex items-end justify-start">
      <Dropdown
        value={selectedKpi}
        options={kpiNames}
        // onChange={handleKpiChange}
        optionLabel="label"
        placeholder="เลือก OPD"
        className="mr-5"
      />

      <div className="flex gap-5">
        <div className="flex items-center">
          <Calendar
            value={sinceDate}
            onChange={(e) => setSinceDate(e.value)}
            view="month"
            dateFormat="mm/yy"
            placeholder="เดือน/ปี"
            showIcon
          />
        </div>
      </div>
    </div>
  );

  const headerForm = (
    <div className="p-2 flex items-end justify-start">
      <Dropdown
        value={selectedKpi}
        options={kpiNames}
        // onChange={handleKpiChange}
        optionLabel="label"
        placeholder="เลือก OPD"
        className="mr-5"
      />

      <div className="flex gap-5">
        <div className="flex items-center">
          <Calendar
            value={sinceDate}
            onChange={(e) => setSinceDate(e.value)}
            view="month"
            dateFormat="mm/yy"
            placeholder="เดือน/ปี"
            showIcon
          />
        </div>
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
            // rows={10}
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
            <Column field="A" header="A" sortable />
            <Column field="B" header="B" sortable />
            <Column field="C" header="C" sortable />
            <Column field="D" header="D" sortable />
            <Column field="E" header="E" sortable />
            <Column field="F" header="F" sortable />
            <Column field="G" header="G" sortable />
            <Column field="H" header="H" sortable />
            <Column field="I" header="I" sortable />
            <Column field="I" header="รวม" sortable />
            <Column
              header="แก้ไข"
              // body={renderActionCell}
              style={{ width: "130px" }}
              align="center"
            />

            <Column
              header="ลบ"
              // body={renderDeleteButton}
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
                value={row.kpi_name}
                options={kpiNamesActive}
                placeholder="เลือก KPI"
                className="w-75"
                optionLabel="label"
              />
            )}
          />

          <Column
            field="a_value"
            header="A"
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
            header="B"
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
            field="b_value"
            header="C"
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
            field="b_value"
            header="D"
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
            field="b_value"
            header="E"
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
            field="b_value"
            header="F"
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
            field="b_value"
            header="G"
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
            field="b_value"
            header="H"
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
            field="b_value"
            header="I"
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
            field="b_value"
            header="รวม"
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
