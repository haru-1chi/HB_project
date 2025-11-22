import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export default function KpiFormDialog({
  dialogVisible,
  setDialogVisible,
  kpiNamesActive,
  rows,
  handleInputChange,
  addRow,
  removeRow,
  dialogFooterTemplate,
}) {
  return (
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
              filter
              filterDelay={400}
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
              onChange={(e) => handleInputChange(opt.rowIndex, "type", e.value)}
              placeholder="เลือกประเภท"
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
  );
}
