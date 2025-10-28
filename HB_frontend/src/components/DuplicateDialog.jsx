import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";

export default function DuplicateDialog({
  showDuplicateDialog,
  setShowDuplicateDialog,
  duplicatePairs,
  selectedRows,
  setSelectedRows,
  dialogFooterDuplicate,
}) {
  return (
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
  );
}
