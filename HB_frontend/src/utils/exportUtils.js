// exportUtils.js
import("xlsx");
import("file-saver");

// Helper to sum fields safely
export const sumField = (data = [], field) => {
  return data.reduce((sum, row) => sum + Number(row[field] || 0), 0);
};

export const createExcelData = (detail, kpiLabel, typeLabel) => {
  const totalA = sumField(detail, "a_value");
  const totalB = sumField(detail, "b_value");
  const rate = totalB ? ((totalA / totalB) * 100).toFixed(2) : 0;

  const headerTitle = ["รายการตัวชี้วัดคุณภาพในกลุ่มโรคสำคัญ ที่ผู้บริหารติดตาม"];
  const headerInfo = [kpiLabel];
  const typeRow = ["ประเภท", typeLabel];
  const tableHeader = [
    "เดือน/ปี",
    "A (จำนวนผู้เสียชีวิต)",
    "B (จำนวนผู้ป่วยทุกสถานะ)",
    "อัตราการเสียชีวิต (%)",
    "แนวโน้ม",
  ];

  const rows = detail.map((item) => [
    item.month,
    Number(item.a_value || 0),
    Number(item.b_value || 0),
    Number(item.result || 0),
    item.note || "",
  ]);

  const summary = ["รวม", totalA, totalB, Number(rate), ""];

  return [headerTitle, headerInfo, typeRow, tableHeader, ...rows, summary];
};

export const exportToExcel = async (detail, kpiLabel, typeLabel) => {
  try {
    const [{ utils, write }, fileSaver] = await Promise.all([
      import("xlsx"),
      import("file-saver"),
    ]);

    const data = createExcelData(detail, kpiLabel, typeLabel);
    const worksheet = utils.aoa_to_sheet(data);

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    ];

    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
    ];

    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = write(workbook, { bookType: "xlsx", type: "array" });

    const fileName = `สรุป_${kpiLabel.replace(/[\\/:*?"<>|]/g, "_").trim()}.xlsx`;
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    fileSaver.default.saveAs(blob, fileName);
  } catch (error) {
    console.error("Error exporting Excel:", error);
    alert("เกิดข้อผิดพลาดระหว่างการส่งออกไฟล์ Excel");
  }
};
