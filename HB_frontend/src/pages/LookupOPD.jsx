import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { IconField } from "primereact/iconfield";
import { Dropdown } from "primereact/dropdown";
import { InputIcon } from "primereact/inputicon";
import { AutoComplete } from "primereact/autocomplete";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEdit,
  faPlus,
  faCheck,
  faXmark,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";
import { ScrollTop } from "primereact/scrolltop";
import { TabView, TabPanel } from "primereact/tabview";
import { Message } from "primereact/message";
function LookupOPD() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";

  const [missionList, setMissionList] = useState([]);
  const [workList, setWorkList] = useState([]);
  const [opdList, setOpdList] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [allKPIChoices, setAllKPIChoices] = useState([]); //rename
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("opd");
  const [formValues, setFormValues] = useState({});

  const [editMissionId, setEditMissionId] = useState(null);
  const [editMissionValues, setEditMissionValues] = useState({
    mission_name: "",
  });

  const [editWorkId, setEditWorkId] = useState(null);
  const [editWorkValues, setEditWorkValues] = useState({ work_name: "" });

  const [editOpdId, setEditOpdId] = useState(null);
  const [editOpdValues, setEditOpdValues] = useState({ opd_name: "" });

  const [missionMismatch, setMissionMismatch] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const formConfig = {
    mission: [
      { field: "mission_name", label: "ชื่อกลุ่มภารกิจ", type: "text" },
    ],

    work: [
      {
        field: "mission_id",
        label: "ชื่อกลุ่มภารกิจ",
        type: "autocomplete",
        source: "mission",
      },
      { field: "work_name", label: "ชื่อกลุ่มงาน", type: "text" },
    ],

    opd: [
      {
        field: "mission_id",
        label: "ชื่อกลุ่มภารกิจ",
        type: "autocomplete",
        source: "mission",
      },
      {
        field: "work_id",
        label: "ชื่อกลุ่มงาน",
        type: "autocomplete",
        source: "work",
      },
      { field: "opd_name", label: "ชื่อหน่วยงาน", type: "text" },
    ],
  };

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

  const [suggestions, setSuggestions] = useState({});

  const searchSuggestion = (field, query, editValues, rowData) => {
    let list = [];

    if (field === "mission_id") {
      list = missionList.map((m) => ({
        label: m.mission_name,
        id: m.id,
      }));
    }

    if (field === "work_id") {
      const selectedMissionId =
        editValues?.mission_id ?? rowData?.mission_id ?? formValues.mission_id;

      list = workList
        .filter((w) => w.mission_id === selectedMissionId)
        .map((w) => ({
          label: w.work_name,
          id: w.id,
        }));
    }

    setSuggestions((prev) => ({
      ...prev,
      [field]: list.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      ),
    }));
  };

  const fetchMissions = useCallback(async (search = "") => {
    const res = await axios.get(`${API_BASE}/mission-name`, {
      params: { search },
    });
    setMissionList(res.data);
  }, []);

  const fetchWorks = useCallback(async (search = "") => {
    const res = await axios.get(`${API_BASE}/work-name`, {
      params: { search },
    });
    setWorkList(res.data);
  }, []);

  const fetchOPDs = useCallback(async (search = "") => {
    const res = await axios.get(`${API_BASE}/opd-name`, {
      params: { search },
    });
    setOpdList(res.data);
  }, []);

  useEffect(() => {
    fetchMissions();
    fetchWorks();
    fetchOPDs();
  }, []);

  useEffect(() => {
    const run = debounce(() => {
      if (activeTab === "mission") fetchMissions(searchTerm);
      if (activeTab === "work") fetchWorks(searchTerm);
      if (activeTab === "opd") fetchOPDs(searchTerm);
    }, 400);

    run();
    return () => run.cancel();
  }, [searchTerm, activeTab, fetchMissions, fetchWorks, fetchOPDs]);

  useEffect(() => {
    if (activeTab === "mission") fetchMissions("");
    if (activeTab === "work") fetchWorks("");
    if (activeTab === "opd") fetchOPDs("");
  }, [activeTab, fetchMissions, fetchWorks, fetchOPDs]);

  const validate = (values) => {
    const errors = {};
    if (activeTab === "mission" && !values.mission_name?.trim())
      errors.mission_name = "กรุณากรอกชื่อกลุ่มภารกิจ";
    if (activeTab === "work") {
      if (!values.mission_id) errors.mission_id = "กรุณาเลือกกลุ่มภารกิจ";
      if (!values.work_name?.trim()) errors.work_name = "กรุณากรอกชื่อกลุ่มงาน";
    }
    if (activeTab === "opd") {
      if (!values.work_id) errors.work_id = "กรุณาเลือกกลุ่มงาน";
      if (!values.opd_name?.trim()) errors.opd_name = "กรุณากรอกชื่อหน่วยงาน";
    }
    return errors;
  };

  const handleAdd = async () => {
    const errors = validate(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (activeTab === "opd" || activeTab === "work") {
      const selectedWork = workList.find((w) => w.id === formValues.work_id);

      if (selectedWork) {
        const correctMissionId = selectedWork.mission_id;

        if (
          formValues.mission_id &&
          formValues.mission_id !== correctMissionId
        ) {
          setMissionMismatch(true);

          setFormValues((prev) => ({
            ...prev,
            mission_id: correctMissionId,
          }));

          const correctMission = missionList.find(
            (m) => m.id === correctMissionId
          );

          setSuggestions((prev) => ({
            ...prev,
            mission_id: [
              { id: correctMission.id, label: correctMission.mission_name },
            ],
          }));

          return;
        }
      }
    }

    let apiUrl = "";
    if (activeTab === "mission") apiUrl = `${API_BASE}/mission-name`;
    if (activeTab === "work") apiUrl = `${API_BASE}/work-name`;
    if (activeTab === "opd") apiUrl = `${API_BASE}/opd-name`;

    try {
      await axios.post(apiUrl, [formValues], { headers: { token } });
      showToast("success", "สำเร็จ", "บันทึกรายการเรียบร้อยแล้ว");

      if (activeTab === "mission") fetchMissions();
      if (activeTab === "work") fetchWorks();
      if (activeTab === "opd") fetchOPDs();

      setFormValues({});
      setDialogVisible(false);
      setMissionMismatch(false);
    } catch (error) {
      showToast("error", "ผิดพลาด", "ไม่สามารถเพิ่มข้อมูลได้");
      console.error("Failed to add:", error);
    }
  };

  const handleEditSave = async (type, id, values) => {
    try {
      const payload = [{ id, ...values }];

      let url = "";
      if (type === "mission") url = `${API_BASE}/mission-name`;
      if (type === "work") url = `${API_BASE}/work-name`;
      if (type === "opd") url = `${API_BASE}/opd-name`;

      await axios.put(url, payload, { headers: { token } });

      showToast("success", "สำเร็จ", "บันทึกข้อมูลเรียบร้อย");

      if (type === "mission") fetchMissions();
      if (type === "work") fetchWorks();
      if (type === "opd") fetchOPDs();

      cancelEdit(type);
    } catch (error) {
      console.error(error);
      showToast("error", "ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  const handleDelete = async (id, type) => {
    let apiUrl = "";

    switch (type) {
      case "mission":
        apiUrl = `${API_BASE}/mission-name/${id}`;
        break;
      case "work":
        apiUrl = `${API_BASE}/work-name/${id}`;
        break;
      case "opd":
        apiUrl = `${API_BASE}/opd-name/${id}`;
        break;
      default:
        return;
    }

    try {
      await axios.delete(apiUrl, { headers: { token } });
      showToast("success", "สำเร็จ", "ลบรายการเรียบร้อยแล้ว");

      // Refresh list based on type
      if (type === "mission") fetchMissions();
      if (type === "work") fetchWorks();
      if (type === "opd") fetchOPDs();
    } catch (error) {
      showToast("error", "ผิดพลาด", "ไม่สามารถลบข้อมูลได้");
      console.error(`Failed to delete ${type}:`, error);
    }
  };

  const confirmSave = (type, id, values) => {
    const errors = validate(values);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      showToast("warn", "คำเตือน", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    confirmDialog({
      message: "ต้องการบันทึกข้อมูลนี้หรือไม่?",
      header: "บันทึกข้อมูล",
      acceptClassName: "p-button-success",
      accept: () => handleEditSave(type, id, values),
    });
  };

  const confirmDelete = (id, type) =>
    confirmDialog({
      message: "ต้องการลบรายการนี้หรือไม่",
      header: "ลบรายการ",
      acceptClassName: "p-button-danger",
      accept: () => handleDelete(id, type),
    });

  const cancelEdit = (type) => {
    if (type === "mission") {
      setEditMissionId(null);
      setEditMissionValues({ mission_name: "" });
    }
    if (type === "work") {
      setEditWorkId(null);
      setEditWorkValues({ mission_id: "", work_name: "" });
    }
    if (type === "opd") {
      setEditOpdId(null);
      setEditOpdValues({ work_id: "", opd_name: "" });
    }
    setFormErrors({});
  };

  const filteredList = allKPIChoices.filter((item) => {
    const term = searchTerm.toLowerCase();
    return item.opd_name?.toLowerCase().includes(term);
  });

  const editActionBody = (
    rowData,
    type,
    editId,
    setEditId,
    editValues,
    setEditValues
  ) =>
    editId === rowData.id ? (
      <div className="flex justify-center gap-2">
        <Button
          rounded
          aria-label="Save"
          icon={<FontAwesomeIcon icon={faCheck} />}
          className="p-button-success p-button-sm"
          onClick={() => confirmSave(type, rowData.id, editValues)}
        />
        <Button
          rounded
          aria-label="Cancel"
          icon={<FontAwesomeIcon icon={faXmark} />}
          className="p-button-secondary p-button-sm"
          onClick={() => cancelEdit(type)}
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
            const newValues = {
              ...rowData,
              mission_id: rowData.mission_id ?? null,
              work_id: rowData.work_id ?? null,
            };

            setEditId(rowData.id);
            setEditValues(newValues);
          }}
        />
      </div>
    );

  const deleteActionBody = (rowData, type) => (
    <div className="flex justify-center">
      <Button
        rounded
        aria-label="Delete"
        icon={<FontAwesomeIcon icon={faTrash} />}
        className="p-button-danger p-button-sm"
        onClick={() => confirmDelete(rowData.id, type)}
      />
    </div>
  );

  const getAutocompleteOptions = (field, editValues, rowData) => {
    if (field === "mission_name") {
      return missionList.map((m) => ({
        label: m.mission_name,
        id: m.id,
      }));
    }

    if (field === "work_name") {
      const selectedMission = editValues.mission_id ?? rowData.mission_id;

      return workList
        .filter((w) => w.mission_id === selectedMission)
        .map((w) => ({
          label: w.work_name,
          id: w.id,
        }));
    }

    return [];
  };

  const renderTextBody = (
    rowData,
    field,
    editValues,
    editRowId,
    formErrors,
    setEditValues,
    mode // "mission" | "work" | "opd"
  ) => {
    // Not editing → show plain text
    if (editRowId !== rowData.id) return <p>{rowData[field]}</p>;

    // Determine if this field should be a dropdown
    const dropdownFields = {
      work: ["mission_name"], // inside Work tab
      opd: ["mission_name", "work_name"], // inside OPD tab
    };

    const isDropdown =
      dropdownFields[mode] && dropdownFields[mode].includes(field);

    // Render dropdown
    if (isDropdown) {
      const options = getAutocompleteOptions(field, editValues, rowData);
      const idField = field === "mission_name" ? "mission_id" : "work_id";

      return (
        <AutoComplete
          dropdown
          field="label"
          value={
            options.find(
              (item) => item.id === (editValues[idField] ?? rowData[idField])
            ) ||
            (typeof editValues[idField] === "string"
              ? editValues[idField]
              : null)
          }
          suggestions={suggestions[idField] || []}
          completeMethod={(e) =>
            searchSuggestion(idField, e.query, editValues, rowData)
          }
          onChange={(e) => {
            const valueId = typeof e.value === "object" ? e.value.id : e.value;

            setEditValues({
              ...editValues,
              [idField]: valueId,
              ...(field === "mission_name" ? { work_id: null } : {}),
            });
          }}
          className={`w-full ${formErrors[idField] ? "p-invalid" : ""}`}
          forceSelection={false}
        />
      );
    }

    // Otherwise normal input text
    return (
      <InputText
        value={editValues[field]}
        onChange={(e) =>
          setEditValues({ ...editValues, [field]: e.target.value })
        }
        className={`w-full ${formErrors[field] ? "p-invalid" : ""}`}
      />
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
        onClick={() => {
          // Set default formValues depending on active tab
          if (activeTab === "mission") setFormValues({ mission_name: "" });
          if (activeTab === "work")
            setFormValues({ mission_id: "", work_name: "" });
          if (activeTab === "opd") setFormValues({ work_id: "", opd_name: "" });
          setFormErrors({});
          setDialogVisible(true);
        }}
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
          <h5 className="text-2xl font-semibold">จัดการชื่อหน่วยงาน</h5>
        </div>

        <div>
          <TabView
            activeIndex={activeIndex}
            onTabChange={(e) => {
              setActiveIndex(e.index);

              if (e.index === 0) setActiveTab("opd");
              if (e.index === 1) setActiveTab("mission");
              if (e.index === 2) setActiveTab("work");

              setSearchTerm(""); 
            }}
          >
            <TabPanel header="ชื่อหน่วยงาน">
              <DataTable
                header={header}
                value={opdList}
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
                  body={(rowData, options) => options.rowIndex + 1}
                  align="center"
                  sortable
                />
                <Column
                  field="mission_name"
                  header="กลุ่มภารกิจ"
                  body={(rowData) =>
                    renderTextBody(
                      rowData,
                      "mission_name",
                      editOpdValues,
                      editOpdId,
                      formErrors,
                      setEditOpdValues,
                      "opd"
                    )
                  }
                  sortable
                />
                <Column
                  field="work_name"
                  header="กลุ่มงาน"
                  body={(rowData) =>
                    renderTextBody(
                      rowData,
                      "work_name",
                      editOpdValues,
                      editOpdId,
                      formErrors,
                      setEditOpdValues,
                      "opd"
                    )
                  }
                  sortable
                />
                <Column
                  field="opd_name"
                  header="ชื่อหน่วยงาน"
                  body={(rowData) =>
                    renderTextBody(
                      rowData,
                      "opd_name",
                      editOpdValues,
                      editOpdId,
                      formErrors,
                      setEditOpdValues
                    )
                  }
                  sortable
                />
                <Column
                  header="แก้ไข"
                  body={(rowData) =>
                    editActionBody(
                      rowData,
                      "opd",
                      editOpdId,
                      setEditOpdId,
                      editOpdValues,
                      setEditOpdValues
                    )
                  }
                  style={{ width: "10%" }}
                  alignHeader="center"
                />
                <Column
                  header="ลบ"
                  body={(rowData) => deleteActionBody(rowData, "opd")}
                  style={{ width: "10%" }}
                  alignHeader="center"
                />
              </DataTable>
            </TabPanel>
            <TabPanel header="ชื่อกลุ่มภารกิจ">
              <DataTable
                header={header}
                value={missionList}
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
                  body={(rowData, options) => options.rowIndex + 1}
                  align="center"
                  sortable
                />
                <Column
                  field="mission_name"
                  header="ชื่อกลุ่มภารกิจ"
                  body={(rowData) =>
                    renderTextBody(
                      rowData,
                      "mission_name",
                      editMissionValues,
                      editMissionId,
                      formErrors,
                      setEditMissionValues
                    )
                  }
                  sortable
                />
                <Column
                  header="แก้ไข"
                  body={(rowData) =>
                    editActionBody(
                      rowData,
                      "mission",
                      editMissionId,
                      setEditMissionId,
                      editMissionValues,
                      setEditMissionValues
                    )
                  }
                  style={{ width: "10%" }}
                  alignHeader="center"
                />
                <Column
                  header="ลบ"
                  body={(rowData) => deleteActionBody(rowData, "mission")}
                  style={{ width: "10%" }}
                  alignHeader="center"
                />
              </DataTable>
            </TabPanel>
            <TabPanel header="ชื่อกลุ่มงาน">
              <DataTable
                header={header}
                value={workList}
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
                  body={(rowData, options) => options.rowIndex + 1}
                  align="center"
                  sortable
                />
                <Column
                  field="mission_name"
                  header="กลุ่มภารกิจ"
                  body={(rowData) =>
                    renderTextBody(
                      rowData,
                      "mission_name",
                      editWorkValues,
                      editWorkId,
                      formErrors,
                      setEditWorkValues,
                      "work"
                    )
                  }
                  sortable
                />
                <Column
                  field="work_name"
                  header="ชื่อกลุ่มงาน"
                  body={(rowData) =>
                    renderTextBody(
                      rowData,
                      "work_name",
                      editWorkValues,
                      editWorkId,
                      formErrors,
                      setEditWorkValues
                    )
                  }
                  sortable
                />
                <Column
                  header="แก้ไข"
                  body={(rowData) =>
                    editActionBody(
                      rowData,
                      "work",
                      editWorkId,
                      setEditWorkId,
                      editWorkValues,
                      setEditWorkValues
                    )
                  }
                  style={{ width: "10%" }}
                  alignHeader="center"
                />
                <Column
                  header="ลบ"
                  body={(rowData) => deleteActionBody(rowData, "work")}
                  style={{ width: "10%" }}
                  alignHeader="center"
                />
              </DataTable>
            </TabPanel>
          </TabView>
        </div>

        <Dialog
          header={`เพิ่มชื่อ ${
            activeTab === "mission"
              ? "กลุ่มภารกิจ"
              : activeTab === "work"
              ? "กลุ่มงาน"
              : "หน่วยงาน"
          }`}
          visible={dialogVisible}
          modal
          onHide={() => {
            setDialogVisible(false);
            setMissionMismatch(false);
          }}
          style={{ width: "50vw" }}
        >
          {formConfig[activeTab].map((cfg) => (
            <div key={cfg.field} className="mt-3">
              <label>{cfg.label}</label>

              {cfg.type === "text" && (
                <InputText
                  value={formValues[cfg.field] || ""}
                  onChange={(e) =>
                    setFormValues({
                      ...formValues,
                      [cfg.field]: e.target.value,
                    })
                  }
                  className={`w-full ${
                    formErrors[cfg.field] ? "p-invalid" : ""
                  }`}
                />
              )}

              {cfg.type === "autocomplete" && (
                <AutoComplete
                  dropdown
                  value={
                    // If stored as ID, convert to label for display
                    suggestions[cfg.field]?.find(
                      (x) => x.id === formValues[cfg.field]
                    ) ||
                    formValues[cfg.field] ||
                    null
                  }
                  suggestions={suggestions[cfg.field] || []}
                  completeMethod={(e) => searchSuggestion(cfg.field, e.query)}
                  field="label"
                  forceSelection={false}
                  onChange={(e) => {
                    setMissionMismatch(false);

                    const valueId =
                      typeof e.value === "object" ? e.value.id : e.value;

                    if (cfg.field === "mission_id") {
                      setFormValues({
                        ...formValues,
                        mission_id: valueId,
                        work_id: null,
                      });
                      return;
                    }

                    // normal case
                    setFormValues({
                      ...formValues,
                      [cfg.field]: valueId,
                    });
                  }}
                  className={`w-full ${
                    formErrors[cfg.field] ||
                    (activeTab === "opd" &&
                      cfg.field === "mission_id" &&
                      missionMismatch)
                      ? "p-invalid"
                      : ""
                  }`}
                />
              )}

              {formErrors[cfg.field] && (
                <small className="p-error">{formErrors[cfg.field]}</small>
              )}
              {activeTab === "opd" &&
                cfg.field === "mission_id" &&
                missionMismatch && (
                  <div className="mt-3">
                    <Message
                      severity="warn"
                      text="ชื่อภารกิจไม่ถูกต้อง ได้ปรับเปลี่ยนโดยอ้างอิงจากชื่อกลุ่มงานแล้ว"
                      className="w-full"
                    />
                  </div>
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

export default LookupOPD;
