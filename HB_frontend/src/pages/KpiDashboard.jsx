import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { Button } from "primereact/button";
import KPILineChart from "../components/KPILineChart";
import BarChart from "../components/BarChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExport,
  faArrowTrendUp,
  faArrowTrendDown,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";
const currentDate = new Date();

const defaultSinceDate = new Date(currentDate.getFullYear(), 0, 1);

const defaultEndDate = new Date(
  currentDate.getFullYear(),
  currentDate.getMonth(),
  currentDate.getDate()
);

const formatDateForSQL = (date, endOfMonth = false) => {
  if (!date) return null;
  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();

  if (endOfMonth) {
    // Move to next month, then subtract one day
    let lastDay = new Date(year, month + 1, 0);
    return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(lastDay.getDate()).padStart(2, "0")} 23:59:59`;
  }

  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )} 00:00:00`;
};

const formatMonthYear = (date) => {
  if (!date) return "";
  const monthTH = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const d = new Date(date);
  const month = monthTH[d.getMonth()];
  const year = d.getFullYear().toString().slice(-2); // 2025 → 25
  return `${month} ${year}`;
};

function KpiDashboard() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";
  const dt = useRef(null);
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [dataCurrentMonth, setDataCurrentMonth] = useState([]);
  const [selectedTypeOptions, setselectedTypeOptions] = useState("รวม");
  const [selectedKPIName, setSelectedKPIName] = useState("1");
  const [allKPIChoices, setAllKPIChoices] = useState([]);
  const [selectedChartType, setSelectedChartType] = useState("percent");
  const [sinceDate, setSinceDate] = useState(defaultSinceDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const selectedOptions = [
    { label: "รวมทั้งหมด", value: "รวม" },
    { label: "ชาวไทย", value: "ไทย" },
    { label: "ชาวต่างชาติ", value: "ต่างชาติ" },
  ];

  const selectedChart = [
    { label: "ร้อยละ", value: "percent" },
    { label: "A,B", value: "ratio" },
  ];

  const fetchKPInames = async () => {
    try {
      const response = await axios.get(`${API_BASE}/kpi-name`);
      const options = response.data.map((item) => ({
        label: item.kpi_name,
        value: item.id.toString(),
      }));
      setAllKPIChoices(options);
    } catch (error) {
      console.error("Failed to fetch KPI names:", error);
    }
  };

  const fetchDepartmentState = () => {
    const queryParams = new URLSearchParams({
      kpi_name: selectedKPIName,
      type: selectedTypeOptions,
      chart: selectedChartType,
      since: formatDateForSQL(sinceDate),
      until: formatDateForSQL(endDate, true),
    }).toString();

    axios
      .get(`${API_BASE}/kpi-data/chart?${queryParams}`)
      .then((response) => {
        setData(response.data);
      })
      .catch((error) =>
        console.error("Error fetching department data:", error)
      );
  };

  const fetchDetailTable = () => {
    const queryParams = new URLSearchParams({
      kpi_name: selectedKPIName,
      type: selectedTypeOptions,
      chart: selectedChartType,
      since: formatDateForSQL(sinceDate),
      until: formatDateForSQL(endDate, true),
    }).toString();

    axios
      .get(`${API_BASE}/kpi-data/detail?${queryParams}`)
      .then((response) => {
        setDetail(response.data);
      })
      .catch((error) =>
        console.error("Error fetching department data:", error)
      );
  };

  useEffect(() => {
    fetchDepartmentState();
    fetchKPInames();
    fetchDetailTable();
    fetchDataCurrentMonth();
  }, [
    selectedChartType,
    selectedKPIName,
    selectedTypeOptions,
    sinceDate,
    endDate,
  ]);

  const noteBodyTemplate = (rowData) => {
    const value = rowData.note;

    if (!value) return null;

    const isPositive = value.startsWith("+");

    return (
      <div
        className={`w-fit flex items-center px-2 rounded-md ${
          isPositive ? "bg-red-100" : "bg-green-100"
        }`}
      >
        <FontAwesomeIcon
          icon={isPositive ? faArrowTrendUp : faArrowTrendDown}
          className={isPositive ? "text-red-500" : "text-green-500"}
        />
        <p className={`ml-2 ${isPositive ? "text-red-500" : "text-green-500"}`}>
          {value}
        </p>
      </div>
    );
  };

  const fetchDataCurrentMonth = () => {
    const queryParams = new URLSearchParams({
      kpi_name: selectedKPIName,
      since: formatDateForSQL(sinceDate),
      until: formatDateForSQL(endDate, true),
    }).toString();

    axios
      .get(`${API_BASE}/kpi-data/summary?${queryParams}`)
      .then((res) => {
        setDataCurrentMonth(res.data);
      })
      .catch((error) =>
        console.error("Error fetching department data:", error)
      );
  };

  const getTrendText = (note) => {
    if (!note || note === "null") return null;

    const isPositive = true;
    // const isPositive = note.startsWith("+");
    return (
      <span
        className={`w-fit flex items-center px-2 py-1 gap-2 rounded-md ${
          isPositive ? "bg-red-100" : "bg-green-100"
        }`}
      >
        <FontAwesomeIcon
          icon={isPositive ? faArrowTrendUp : faArrowTrendDown}
          className={isPositive ? "text-red-500" : "text-green-500"}
        />
        เกินเป้าหมาย 1.5%
        {/* {isPositive ? `เพิ่มขึ้นจากเดือนก่อนหน้า` : `ลดลงจากเดือนก่อนหน้า`}{" "}
        {note} */}
      </span>
    );
  };
  const getTitle = (type) => {
    const startLabel = formatMonthYear(sinceDate);
    const endLabel = formatMonthYear(endDate);

    const rangeText =
      startLabel && endLabel ? ` | ${startLabel} - ${endLabel}` : "";

    switch (type) {
      case "sum_rate":
        return `ร้อยละการเสียชีวิตรวมทั้งหมด${rangeText}`;
      case "thai_rate":
        return `ร้อยละการเสียชีวิตชาวไทยรวม${rangeText}`;
      case "foreigner_rate":
        return `ร้อยละการเสียชีวิตชาวต่างชาติรวม${rangeText}`;
      default:
        return `ร้อยละการเสียชีวิต (${type})${rangeText}`;
    }
  };

  const totalA = detail?.reduce(
    (sum, row) => sum + Number(row.a_value || 0),
    0
  );
  const totalB = detail?.reduce(
    (sum, row) => sum + Number(row.b_value || 0),
    0
  );
  const rate = totalB ? ((totalA / totalB) * 100).toFixed(2) : 0;

  const selectedKPINameLabel =
    allKPIChoices.find((item) => item.value === selectedKPIName)?.label || "";
  const selectedTypeLabel =
    selectedOptions.find((item) => item.value === selectedTypeOptions)?.label ||
    "";

  const exportExcel = () => {
    import("xlsx").then((xlsx) => {
      const data = [
        ["รายการตัวชี้วัดคุณภาพในกลุ่มโรคสำคัญ ที่ผู้บริหารติดตาม"], // hard text
        [selectedKPINameLabel], // KPI name
        ["ประเภท", selectedTypeLabel], // type info row
        [
          "เดือน/ปี",
          "A (จำนวนผู้เสียชีวิต)",
          "B (จำนวนผู้ป่วยทุกสถานะ)",
          "อัตราการเสียชีวิต (%)",
          "แนวโน้ม",
        ], // table header
        // map your detail data to each row
        ...detail.map((item) => [
          item.month,
          Number(item.a_value || 0),
          Number(item.b_value || 0),
          Number(item.result || 0),
          item.note || "",
        ]),
        ["รวม", totalA, totalB, Number(rate), ""], // summary row
      ];

      // const worksheet = xlsx.utils.json_to_sheet(detail);
      const worksheet = xlsx.utils.aoa_to_sheet(data);
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // merge first header row
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // merge KPI name row
      ];

      worksheet["!cols"] = [
        { wch: 10 },
        { wch: 20 },
        { wch: 25 },
        { wch: 25 },
        { wch: 15 },
      ];

      // const maxWidths = [10, 20, 25, 25, 15];
      // worksheet["!cols"] = maxWidths.map((w) => ({ wch: w }));

      const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const fileName = `สรุป_${selectedKPINameLabel
        .replace(/[\\/:*?"<>|]/g, "_")
        .trim()}`;
      saveAsExcelFile(excelBuffer, fileName);
    });
  };

  const saveAsExcelFile = (buffer, fileName) => {
    import("file-saver").then((module) => {
      if (module && module.default) {
        let EXCEL_TYPE =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        let EXCEL_EXTENSION = ".xlsx";
        const data = new Blob([buffer], {
          type: EXCEL_TYPE,
        });

        module.default.saveAs(data, `${fileName}${EXCEL_EXTENSION}`);
      }
    });
  };

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-lg">อัตราการเสียชีวิต</h1>
      <Button
        type="button"
        label="Export to Excel"
        severity="info"
        onClick={exportExcel}
        data-pr-tooltip="XLS"
        className="p-button-icon-right-custom"
      >
        {" "}
        <FontAwesomeIcon icon={faFileExport} style={{ marginLeft: "0.5rem" }} />
      </Button>
    </div>
  );

  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column footer="รวม" />
        <Column footer={totalA?.toLocaleString()} />
        <Column footer={totalB?.toLocaleString()} />
        <Column footer={rate} />
        <Column />
      </Row>
    </ColumnGroup>
  );

  return (
    <div className="Home-page overflow-hidden">
      <div
        className={`flex-1 transition-all duration-300 p-4 sm:p-8 pt-5 overflow-auto`}
      >
        <div className="flex items-center mb-4">
          <h5 className="text-2xl font-semibold">
            แผนผังตัวชี้วัดอัตราการเสียชีวิต
          </h5>
        </div>

        <div className="flex justify-between mb-4">
          <div className="flex">
            <div className="hidden sm:block">
              <Dropdown
                value={selectedKPIName}
                onChange={(e) => setSelectedKPIName(e.value)}
                options={allKPIChoices}
                optionLabel="label"
                checkmark
                className="mr-5"
              />
            </div>

            <div className="hidden sm:block">
              <Dropdown
                value={selectedChartType}
                onChange={(e) => setSelectedChartType(e.value)}
                options={selectedChart}
                optionLabel="label"
                checkmark={true}
                className="mr-5"
              />
            </div>
            <div className="hidden sm:block">
              <Dropdown
                value={selectedTypeOptions}
                onChange={(e) => setselectedTypeOptions(e.value)}
                options={selectedOptions}
                optionLabel="label"
                checkmark={true}
                className="mr-5"
              />
            </div>
          </div>
          <div className="flex items-center">
            <p className="mr-3">ช่วงเวลา</p>
            <Calendar
              value={sinceDate}
              onChange={(e) => setSinceDate(e.value)}
              view="month"
              dateFormat="mm/yy"
              className="mr-3 w-50"
            />
            <p> - </p>
            <Calendar
              value={endDate}
              onChange={(e) => setEndDate(e.value)}
              view="month"
              dateFormat="mm/yy"
              className="ml-3 w-50"
            />
          </div>
        </div>

        <div className="card-board grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-8">
          {dataCurrentMonth.map((item, index) => (
            <div
              key={`${item.type}-${index}`}
              className="bg-white shadow-md border-1 border-gray-200 h-[100px] md:h-[136px] p-3 md:p-5 rounded-xl flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-5xl font-semibold">
                  {item.value}
                  <span className="text-3xl">%</span>
                </h1>
                {getTrendText(item.type)}
              </div>
              <p>{getTitle(item.type)}</p>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
          {data?.length > 0 ? (
            selectedChartType === "percent" ? (
              <KPILineChart data={data} />
            ) : (
              <BarChart data={data} type="kpi" />
            )
          ) : (
            <p>ไม่พบข้อมูล...</p>
          )}
        </div>

        <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
          <DataTable
            ref={dt}
            header={header}
            value={detail}
            tableStyle={{ minWidth: "50rem" }}
            footerColumnGroup={footerGroup}
          >
            <Column field="month" header="เดือน-ปี"></Column>
            <Column field="a_value" header="A (จำนวนผู้เสียชีวิต)"></Column>
            <Column field="b_value" header="B (จำนวนผู้ป่วยทุกสถานะ)"></Column>
            <Column field="result" header="อัตราการเสียชีวิต (%)"></Column>
            <Column header="หมายเหตุ" body={noteBodyTemplate}></Column>
          </DataTable>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default KpiDashboard;
