import React from 'react'

function DuplicateRecordModal() {
  return (
    <div>
       <Dialog
        header="พบข้อมูลซ้ำ!"
        visible={showDuplicateDialog}
        style={{ width: "75vw" }}
        maximizable
        modal
        onHide={() => setShowDuplicateDialog(false)}
        contentStyle={{ minHeight: "500px" }}
      >
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
          <Column field="id" header="ID" style={{ width: "5%" }} sortable />
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
        </DataTable>

        <DataTable
          value={rows}
          showGridlines
          tableStyle={{ minWidth: "60rem" }}
          size="small"
        >
          <Column
            field="id"
            header="ลำดับ"
            body={(row, opt) => opt.rowIndex + 1}
            style={{ width: "50px" }}
          />

          <Column
            field="kpi_name"
            header="ชื่อตัวชี้วัด"
            className="w-75"
            body={(row, opt) => (
              <Dropdown
                value={row.kpi_name}
                options={kpiNames}
                onChange={(e) => {
                  const selectedId = e.value;
                  const selectedOption = kpiNames.find(
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
                placeholder="เลือก KPI"
                className="w-75"
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
        </DataTable>
      </Dialog>
    </div>
  )
}

export default DuplicateRecordModal
