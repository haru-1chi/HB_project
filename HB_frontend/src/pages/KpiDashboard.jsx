import axios from "axios";
import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import SideBarMenu from "../components/SideBarMenu";
import KPILineChart from "../components/KPILineChart";
import BarChart from "../components/BarChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faArrowTrendDown,
} from "@fortawesome/free-solid-svg-icons";

const currentDate = new Date();

// January of current year
const defaultSinceDate = new Date(currentDate.getFullYear(), 0, 1);
// Current month and year
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

function KpiDashboard() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";

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
      const response = await axios.get(`${API_BASE}/getKPIName`);
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
      .get(`${API_BASE}/getData?${queryParams}`)
      .then((response) => {
        setData(response.data);
        console.log(response.data);
        console.log("kpi_name", selectedKPIName);
        console.log("type", selectedTypeOptions);
        console.log("chart", selectedChartType);
        console.log("since", formatDateForSQL(sinceDate));
        console.log("until", formatDateForSQL(endDate, true));
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
      .get(`${API_BASE}/getDetail?${queryParams}`)
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
      .get(`${API_BASE}/dataCurrentMonth?${queryParams}`)
      .then((res) => {
        const order = ["รวม", "ไทย", "ต่างชาติ"];
        const sortedData = res.data.sort(
          (a, b) => order.indexOf(a.type) - order.indexOf(b.type)
        );
        setDataCurrentMonth(sortedData);
      })
      .catch((error) =>
        console.error("Error fetching department data:", error)
      );
  };

  const getTrendText = (note, prevMonth) => {
    if (!note || note === "null") return null;

    const isPositive = note.startsWith("+");
    const prevMonthShort = prevMonth?.split(" ")[0] || "";

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
        {isPositive
          ? `เพิ่มขึ้นจากเดือนก่อนหน้า ${prevMonthShort}`
          : `ลดลงจากเดือนก่อนหน้า ${prevMonthShort}`}{" "}
        {note}
      </span>
    );
  };
  const getTitle = (type, prevMonth) => {
    const prevMonthShort = prevMonth?.split(" ")[0] || "";

    if (type === "รวม")
      return `ร้อยละการเสียชีวิตรวมทั้งหมด เดือนล่าสุด ${prevMonthShort}`;
    if (type === "ไทย")
      return `ร้อยละการเสียชีวิตชาวไทยรวม เดือนล่าสุด ${prevMonthShort}`;
    if (type === "ต่างชาติ")
      return `ร้อยละการเสียชีวิตชาวต่างชาติรวม เดือนล่าสุด ${prevMonthShort}`;
    return `ร้อยละการเสียชีวิต (${type})`;
  };
  return (
    <div className="Home-page sm:flex overflow-hidden">
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
                highlightOnSelect={false}
                className="mr-5"
              />
            </div>

            <div className="hidden sm:block">
              <Dropdown
                value={selectedChartType}
                onChange={(e) => setSelectedChartType(e.value)}
                options={selectedChart}
                optionLabel="label"
                placeholder="เลือกเรียงลำดับ"
                checkmark={true}
                highlightOnSelect={false}
                className="mr-5"
              />
            </div>
            <div className="hidden sm:block">
              <Dropdown
                value={selectedTypeOptions}
                onChange={(e) => setselectedTypeOptions(e.value)}
                options={selectedOptions}
                optionLabel="label"
                placeholder="เลือกเรียงลำดับ"
                checkmark={true}
                highlightOnSelect={false}
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
                  {item.result.replace("%", "")}
                  <span className="text-3xl">%</span>
                </h1>
                {getTrendText(item.note, item.prev_month)}
              </div>
              <p>{getTitle(item.type, item.month)}</p>
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
          <DataTable value={detail} tableStyle={{ minWidth: "50rem" }}>
            <Column field="month" header="เดือน-ปี"></Column>
            <Column field="a_value" header="A (จำนวนผู้เสียชีวิต)"></Column>
            <Column field="b_value" header="B (จำนวนผู้ป่วยทุกสถานะ)"></Column>
            <Column field="result" header="อัตราการเสียชีวิต (%)"></Column>
            <Column header="หมายเหตุ" body={noteBodyTemplate}></Column>
          </DataTable>
        </div>
      </div>
    </div>
  );
}

export default KpiDashboard;
