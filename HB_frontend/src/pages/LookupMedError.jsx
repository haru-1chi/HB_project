import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { TreeTable } from "primereact/treetable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { AutoComplete } from "primereact/autocomplete";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputNumber } from "primereact/inputnumber";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEdit,
  faPlus,
  faCheck,
  faXmark,
  faMagnifyingGlass,
  faRightLong,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";
import { ScrollTop } from "primereact/scrolltop";

function LookupMedError() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [allKPIChoices, setAllKPIChoices] = useState([]);

  const [mainKPI, setMainKPI] = useState("");
  const [subKPIs, setSubKPIs] = useState([]);

  const [editRowId, setEditRowId] = useState(null);
  const [editValues, setEditValues] = useState({ kpi_name: "" });

  const [formErrors, setFormErrors] = useState({});

  const toast = useRef(null);
  const token = localStorage.getItem("token");

  const showToast = (severity, summary, detail) => {
    toast.current?.show({
      severity,
      summary,
      detail,
      life: 3000,
    });
  };

  const fetchKPInames = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/kpi-name-med`);
      setAllKPIChoices(res.data);
    } catch (err) {
      showToast("error", "ผิดพลาด", "ไม่สามารถดึงข้อมูลได้");
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchKPInames();
  }, [fetchKPInames]);

  //สำหรับหัวข้อย่อย
  const handleAddSub = () => setSubKPIs([...subKPIs, ""]);
  const handleSubChange = (index, value) => {
    const updated = [...subKPIs];
    updated[index] = value;
    setSubKPIs(updated);
  };
  const handleRemoveSub = (index) => {
    const updated = subKPIs.filter((_, i) => i !== index);
    setSubKPIs(updated);
  };

  // // ฟังก์ชันแปลงข้อมูลให้เป็น tree structure
  const transformData = (nodes) => {
    return nodes.map((node) => ({
      key: String(node.id),
      data: {
        id: node.id,
        kpi_name: node.kpi_name,
        parent_id: node.parent_id,
      },
      children:
        node.children && node.children.length > 0
          ? transformData(node.children)
          : [],
    }));
  };

  const treeData = transformData(allKPIChoices);
  // console.log(treeData);

  const validate = () => {
    if (!mainKPI.trim()) return "กรุณากรอกหัวข้อหลัก";
    if (subKPIs.some((s) => !s.trim())) return "กรุณากรอกหัวข้อย่อยให้ครบ";
    return null;
  };

  const handleAdd = async () => {
    const error = validate();
    if (error) {
      showToast("warn", "คำเตือน", error);
      return;
    }

    const payload = [
      {
        mainKPI,
        subKPIs: subKPIs.filter((s) => s.trim()),
      },
    ];

    try {
      await axios.post(`${API_BASE}/kpi-name-med`, payload, {
        headers: { token },
      });
      showToast("success", "สำเร็จ", "บันทึกรายการเรียบร้อยแล้ว");
      fetchKPInames();
      setMainKPI("");
      setSubKPIs([]);
      setDialogVisible(false);
    } catch (err) {
      showToast("error", "ผิดพลาด", "ไม่สามารถเพิ่มข้อมูลได้");
      console.error(err);
    }
  };

  const handleEditSave = async (id) => {
    // if (!editValues.kpi_name || editValues.kpi_name.trim() === "") {
    //   showToast("warn", "คำเตือน", "กรุณากรอกตัวชี้วัดหลัก");
    //   return;
    // }

    // plain object (not array)
    const payload = {
      id,
      mainKPI: editValues.kpi_name.trim(),
      subKPIs: subKPIs.filter((s) => s.trim() !== ""),
    };

    try {
      const res = await axios.put(`${API_BASE}/kpi-name-med`, payload, {
        headers: { token },
      });

      if (res.data.success) {
        showToast("success", "บันทึกสำเร็จ", res.data.message);
        setEditRowId(null);
        setEditValues({ kpi_name: "" });
        setSubKPIs([]);
        await fetchKPInames();
      } else {
        showToast("error", "บันทึกไม่สำเร็จ", res.data.message);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE}/kpi-name-med/${id}`, {
        headers: { token },
      });
      showToast("success", "สำเร็จ", res.data.message);
      fetchKPInames(); // refresh table
    } catch (error) {
      console.error("Failed to delete KPI:", error);
      showToast("error", "ผิดพลาด", "ไม่สามารถลบข้อมูลได้");
    }
  };

  const confirmSave = (id) => {
    // const errors = validate(editValues);
    // setFormErrors(errors);
    // if (Object.keys(errors).length > 0) {
    //   showToast("warn", "คำเตือน", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
    //   return;
    // }

    confirmDialog({
      message: "ต้องการบันทึกรายการนี้หรือไม่",
      header: "บันทึกรายการ",
      acceptClassName: "p-button-success",
      accept: () => handleEditSave(id),
    });
  };
  const confirmDelete = (rowData) => {
    const isMainKPI = rowData.isRoot; // use the flag from transformData
    const message = isMainKPI
      ? "คุณกำลังลบ KPI หลักพร้อมหัวข้อย่อยทั้งหมด ต้องการดำเนินการต่อหรือไม่?"
      : "คุณต้องการลบหัวข้อย่อยนี้หรือไม่?";

    confirmDialog({
      message,
      header: "ลบรายการ",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => handleDelete(rowData.data.id),
    });
  };

  const cancelEdit = () => {
    setEditRowId(null);
    setEditValues({ kpi_name: "" });
  };

  const filterTreeData = (nodes, term) => {
    const lowerTerm = term.toLowerCase();

    return nodes
      .map((node) => {
        // Check if current node matches
        const isMatch = node.data.kpi_name.toLowerCase().includes(lowerTerm);

        // Recursively filter children
        const filteredChildren = node.children
          ? filterTreeData(node.children, lowerTerm)
          : [];

        // Keep node if it matches or has matching children
        if (isMatch || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          };
        }

        // Otherwise, remove node
        return null;
      })
      .filter(Boolean);
  };

  const filteredTreeData = searchTerm
    ? filterTreeData(treeData, searchTerm)
    : treeData;

  const editActionBody = (rowData) =>
    editRowId === rowData.key ? (
      <div className="flex justify-center gap-2">
        <Button
          rounded
          aria-label="Save"
          icon={<FontAwesomeIcon icon={faCheck} />}
          className="p-button-success p-button-sm"
          onClick={() => confirmSave(rowData.data.id)}
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
            const hasSubKPIValue = subKPIs.some((sub) => sub.trim() !== "");

            if (editRowId && editRowId !== rowData.key && hasSubKPIValue) {
              confirmDialog({
                message: "คุณต้องการบันทึกการแก้ไขก่อนเปลี่ยนหรือไม่?",
                header: "ยืนยันการเปลี่ยนแถว",
                icon: "pi pi-exclamation-triangle",
                acceptLabel: "บันทึกก่อน",
                rejectLabel: "ข้าม",
                acceptClassName: "p-button-success",
                rejectClassName: "p-button-secondary",
                accept: () => {
                  // ✅ save old data first
                  handleEditSave(editRowId);
                  setEditRowId(rowData.key);
                  setEditValues({ kpi_name: rowData.data.kpi_name });
                  setSubKPIs([]); // reset new sub list
                },
                reject: () => {
                  // ❌ discard old unsaved data
                  setEditRowId(rowData.key);
                  setEditValues({ kpi_name: rowData.data.kpi_name });
                  setSubKPIs([]);
                },
              });
            } else {
              // 🟢 normal switch or first edit
              setEditRowId(rowData.key);
              setEditValues({ kpi_name: rowData.data.kpi_name });
              setSubKPIs([]); // reset subKPIs for new row
            }
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
        onClick={() => confirmDelete(rowData)}
      />
    </div>
  );

  const kpiNameBody = (rowData) => {
    const currentValue = rowData.data?.kpi_name || "";
    const isMainKPI = rowData.data.parent_id === null; // root node
    const isEditing = editRowId === rowData.key;
    if (!isEditing) return <span>{currentValue}</span>;

    return (
      <div className="inline-flex w-19/20 flex-col gap-2">
        {/* ✅ Main KPI input */}
        <div className="flex items-center gap-2">
          <InputText
            value={editValues.kpi_name}
            onChange={(e) =>
              setEditValues({ ...editValues, kpi_name: e.target.value })
            }
            className="flex-1"
            placeholder="ตัวชี้วัดหลัก"
          />

          {/* ✅ Add sub button only for main KPI */}
          {isMainKPI && (
            <Button
              label="เพิ่มหัวข้อย่อย"
              icon={<FontAwesomeIcon icon={faPlus} />}
              className="p-button-info"
              size="small"
              outlined
              onClick={handleAddSub}
            />
          )}
        </div>

        {/* ✅ Show subKPI inputs if exist */}
        {isMainKPI && subKPIs.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {subKPIs.map((sub, i) => (
              <div
                key={i}
                className="flex items-center justify-end gap-2 transition-all"
              >
                <FontAwesomeIcon icon={faRightLong} className="text-gray-500" />
                <InputText
                  value={sub}
                  onChange={(e) => handleSubChange(i, e.target.value)}
                  className="flex-1"
                  placeholder={`หัวข้อย่อย ${i + 1}`}
                />
                <Button
                  rounded
                  icon={<FontAwesomeIcon icon={faXmark} />}
                  severity="danger"
                  text
                  size="small"
                  onClick={() => handleRemoveSub(i)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
    <div className="Home-page overflow-hidden min-h-dvh flex flex-col justify-between">
      <Toast ref={toast} />
      <ScrollTop />
      <ConfirmDialog />
      <div
        className={`flex-1 transition-all duration-300 p-4 sm:p-8 pt-5 overflow-auto`}
      >
        <div className="flex items-center mb-5">
          <h5 className="text-2xl font-semibold">
            จัดการชื่อตัวชี้วัดความเสี่ยง
          </h5>
        </div>

        <div>
          <TreeTable
            header={header}
            value={filteredTreeData}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25]}
            tableStyle={{ minWidth: "50rem" }}
            showGridlines
          >
            <Column
              field="kpi_name"
              header="ชื่อตัวชี้วัด"
              expander
              sortable
              body={kpiNameBody}
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
          </TreeTable>
        </div>

        <Dialog
          header="เพิ่มตัวชี้วัด"
          visible={dialogVisible}
          modal
          onHide={() => setDialogVisible(false)}
          style={{ width: "50vw" }}
        >
          <div className="mt-3 ">
            <div className="flex">
              <div className="w-full mr-3">
                <InputText
                  value={mainKPI || ""}
                  onChange={(e) => setMainKPI(e.target.value)}
                  className="w-full"
                  placeholder="หัวข้อหลัก"
                />
              </div>
              <Button
                label="เพิ่มหัวข้อย่อย"
                icon={<FontAwesomeIcon icon={faPlus} />}
                className="p-button-info w-35"
                size="small"
                outlined
                style={{ padding: "5px 10px" }}
                onClick={handleAddSub}
              />
            </div>
          </div>

          {subKPIs.length > 0 && (
            <div className="mt-4">
              {subKPIs.map((sub, i) => (
                <div
                  key={i}
                  className="mt-3 flex justify-end items-center transition-all"
                >
                  <FontAwesomeIcon
                    icon={faRightLong}
                    className="mr-3 text-gray-500"
                  />
                  <InputText
                    value={sub || ""}
                    onChange={(e) => handleSubChange(i, e.target.value)}
                    className="w-full"
                    placeholder={`หัวข้อย่อย ${i + 1}`}
                  />
                  <div className="ml-3">
                    <Button
                      rounded
                      icon={<FontAwesomeIcon icon={faXmark} />}
                      severity="danger"
                      text
                      size="small"
                      onClick={() => handleRemoveSub(i)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

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

export default LookupMedError;
