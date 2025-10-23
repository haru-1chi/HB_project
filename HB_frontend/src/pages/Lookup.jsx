import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import {
  faTrash,
  faEdit,
  faPlus,
  faCheck,
  faXmark,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";

function Lookup() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [allKPIChoices, setAllKPIChoices] = useState([]);
  const [filteredKPIChoices, setFilteredKPIChoices] = useState([]);

  const [formValues, setFormValues] = useState({
    kpi_name: "",
    a_name: "",
    b_name: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const [editRowId, setEditRowId] = useState(null);
  const [editValues, setEditValues] = useState({
    kpi_name: "",
    a_name: "",
    b_name: "",
  });

  const toast = useRef(null);
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";
  const token = localStorage.getItem("token");

  const showToast = (severity, summary, detail) => {
    toast.current?.show({
      severity,
      summary,
      detail,
      life: 3000,
    });
  };

  const fetchKPInames = async () => {
    try {
      const response = await axios.get(`${API_BASE}/kpi-name`);
      setAllKPIChoices(response.data);
    } catch (error) {
      console.error("Failed to fetch KPI names:", error);
    }
  };

  useEffect(() => {
    fetchKPInames();
  }, []);

  useEffect(() => {
    const filtered = allKPIChoices.filter((item) => {
      const search = searchTerm.toLowerCase();
      return (
        item.kpi_name?.toLowerCase().includes(search) ||
        item.a_name?.toLowerCase().includes(search) ||
        item.b_name?.toLowerCase().includes(search)
      );
    });
    setFilteredKPIChoices(filtered);
  }, [searchTerm, allKPIChoices]);

  const validateForm = () => {
    const errors = {};
    if (!formValues.kpi_name.trim()) errors.kpi_name = "กรุณากรอกชื่อตัวชี้วัด";
    if (!formValues.a_name.trim()) errors.a_name = "กรุณากรอกชื่อตัวตั้ง";
    if (!formValues.b_name.trim()) errors.b_name = "กรุณากรอกชื่อตัวหาร";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    try {
      await axios.post(`${API_BASE}/kpi-name`, [formValues], {
        headers: { token },
      });
      showToast("success", "สำเร็จ", "บันทึกรายการเรียบร้อยแล้ว");
      fetchKPInames();
      setFormValues({ kpi_name: "", a_name: "", b_name: "" });
      setFormErrors({});
      setDialogVisible(false);
    } catch (error) {
      showToast("error", "ผิดพลาด", "ไม่สามารถเพิ่มข้อมูลได้");
      console.error("Failed to add KPI:", error);
    }
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editValues.kpi_name || !editValues.kpi_name.trim()) {
      errors.kpi_name = "กรุณากรอกชื่อตัวชี้วัด";
    }
    if (!editValues.a_name || !editValues.a_name.trim()) {
      errors.a_name = "กรุณากรอกชื่อตัวตั้ง";
    }
    if (!editValues.b_name || !editValues.b_name.trim()) {
      errors.b_name = "กรุณากรอกชื่อตัวหาร";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSave = async (id) => {
    try {
      await axios.put(`${API_BASE}/kpi-name`, [{ id, ...editValues }], {
        headers: { token },
      });
      showToast("success", "สำเร็จ", "อัปเดตรายการเรียบร้อยแล้ว");
      fetchKPInames();
      cancelEdit();
    } catch (error) {
      showToast("error", "ผิดพลาด", "ไม่สามารถแก้ไขข้อมูลได้");
      console.error("Failed to update KPI:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/kpi-name/${id}`, {
        headers: { token },
      });
      showToast("success", "สำเร็จ", "ลบรายการเรียบร้อยแล้ว");
      fetchKPInames();
    } catch (error) {
      showToast("error", "ผิดพลาด", "ไม่สามารถลบข้อมูลได้");
      console.error("Failed to delete KPI:", error);
    }
  };

  const confirmSave = (id) => {
    if (!validateEditForm()) {
      showToast("warn", "คำเตือน", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    confirmDialog({
      message: "ต้องการบันทึกรายการนี้หรือไม่",
      header: "บันทึกรายการ",
      acceptClassName: "p-button-success",
      accept: () => handleEditSave(id),
    });
  };
  const confirmDelete = (id) =>
    confirmDialog({
      message: "ต้องการลบรายการนี้หรือไม่",
      header: "ลบรายการ",
      acceptClassName: "p-button-danger",
      accept: () => handleDelete(id),
    });

  const editActionBody = (rowData) =>
    editRowId === rowData.id ? (
      <div className="flex justify-center gap-2">
        <Button
          rounded
          aria-label="Save"
          icon={<FontAwesomeIcon icon={faCheck} />}
          className="p-button-success p-button-sm"
          onClick={() => confirmSave(rowData.id)}
        />
        <Button
          rounded
          aria-label="Cancel"
          icon={<FontAwesomeIcon icon={faXmark} />}
          className="p-button-secondary p-button-sm"
          onClick={cancelEdit}
        />
      </div>
    ) : (
      <div className="flex justify-center">
        <Button
          rounded
          aria-label="Edit"
          icon={<FontAwesomeIcon icon={faEdit} />}
          className="p-button-warning p-button-sm"
          onClick={() => {
            setEditRowId(rowData.id);
            setEditValues({
              kpi_name: rowData.kpi_name,
              a_name: rowData.a_name,
              b_name: rowData.b_name,
            });
          }}
        />
      </div>
    );

  const deleteActionBody = (rowData) => (
    <div className="flex justify-center">
      <Button
        rounded
        aria-label="Delete"
        icon={<FontAwesomeIcon icon={faTrash} />}
        className="p-button-danger p-button-sm"
        onClick={() => confirmDelete(rowData.id)}
      />
    </div>
  );

  const kpiNameBody = (rowData) =>
    editRowId === rowData.id ? (
      <div className="flex flex-col gap-2">
        {["kpi_name", "a_name", "b_name"].map((field, idx) => (
          <>
            <InputText
              key={idx}
              value={editValues[field]}
              onChange={(e) =>
                setEditValues({ ...editValues, [field]: e.target.value })
              }
              placeholder={
                field === "kpi_name"
                  ? "ชื่อตัวชี้วัด"
                  : field === "a_name"
                  ? "ค่าตัวตั้ง"
                  : "ค่าตัวหาร"
              }
              className={`w-full ${formErrors[field] ? "p-invalid" : ""}`}
            />
            {formErrors[field] && (
              <small className="p-error">{formErrors[field]}</small>
            )}
          </>
        ))}
      </div>
    ) : (
      <div>
        <p>
          <b>ชื่อ:</b> {rowData.kpi_name}
        </p>
        <p>
          <b>ตัวตั้ง:</b> {rowData.a_name}
        </p>
        <p>
          <b>ตัวหาร:</b> {rowData.b_name}
        </p>
      </div>
    );

  const cancelEdit = () => {
    setEditRowId(null);
    setEditValues({ kpi_name: "", a_name: "", b_name: "" });
  };

  const header = (
    <div className="flex items-end justify-between">
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
      <Button
        label="+ เพิ่มข้อมูล"
        onClick={() => setDialogVisible(true)}
        severity="success"
      />
    </div>
  );

  return (
    <div className="Home-page overflow-hidden">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div
        className={`flex-1 transition-all duration-300 p-4 sm:p-8 pt-5 overflow-auto`}
      >
        <div className="flex items-center mb-5">
          <h5 className="text-2xl font-semibold">จัดการชื่อตัวชี้วัด</h5>
        </div>

        <div>
          <DataTable
            header={header}
            value={filteredKPIChoices}
            tableStyle={{ minWidth: "50rem" }}
            emptyMessage="ไม่พบข้อมูล"
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            showGridlines
          >
            <Column
              field="id"
              header="ลำดับ"
              style={{ width: "5%" }}
              body={(rowData) => allKPIChoices.indexOf(rowData) + 1}
              align="center"
              sortable
            />
            <Column
              field="kpi_name"
              header="ชื่อตัวชี้วัด"
              body={kpiNameBody}
              sortable
            />
            <Column
              header="แก้ไข"
              body={editActionBody}
              style={{ width: "10%" }}
              alignHeader="center"
            />
            <Column
              header="ลบ"
              body={deleteActionBody}
              style={{ width: "10%" }}
              alignHeader="center"
            />
          </DataTable>
        </div>

        <Dialog
          header="เพิ่มตัวชี้วัด"
          visible={dialogVisible}
          modal
          onHide={() => setDialogVisible(false)}
          style={{ width: "50vw" }}
        >
          {["kpi_name", "a_name", "b_name"].map((field, idx) => (
            <div key={idx} className="mt-3">
              <label htmlFor={field}>
                {field === "kpi_name"
                  ? "ชื่อตัวชี้วัดใหม่"
                  : field === "a_name"
                  ? "ชื่อตัวตั้ง"
                  : "ชื่อตัวหาร"}
              </label>
              <InputText
                id={field}
                value={formValues[field]}
                onChange={(e) =>
                  setFormValues({ ...formValues, [field]: e.target.value })
                }
                className={`w-full ${formErrors[field] ? "p-invalid" : ""}`} // PrimeReact red border
              />
              {formErrors[field] && (
                <small className="p-error">{formErrors[field]}</small> // error message
              )}
            </div>
          ))}

          <div className="flex justify-end mt-6">
            <Button
              label="บันทึกข้อมูล"
              icon={<FontAwesomeIcon icon={faPlus} />}
              className="p-button-success"
              onClick={handleAdd}
            />
          </div>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}

export default Lookup;
