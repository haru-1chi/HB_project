import axios from "axios";
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import SideBarMenu from "../components/SideBarMenu";
import Card from "../components/Card";
import { ToggleButton } from "primereact/togglebutton";
import DetailCard from "../components/DetailCard";
import KPILineChart from "../components/KPILineChart";
import BarChart from "../components/BarChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSliders,
  faArrowUpWideShort,
  faArrowDownWideShort,
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/logo.png";
//เอาใส่ util ภายหลัง
const formatWaitTime = (minutes) => {
  if (!minutes) return "0 นาที";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hrs > 0 ? `${hrs} ชม. ${mins} นาที` : `${mins} นาที`;
};

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
  const [visible, setVisible] = useState(false);
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [allOpdChoices, setAllOpdChoices] = useState([]);
  const [sortField, setSortField] = useState("ALL_USER");
  const [sortOrder, setSortOrder] = useState("desc");

  const [selectedTypeOptions, setselectedTypeOptions] = useState("รวม");
  const [selectedKPIName, setSelectedKPIName] = useState("1");
  const [allKPIChoices, setAllKPIChoices] = useState([]);
  const [selectedChartType, setSelectedChartType] = useState("percent");
  const [sinceDate, setSinceDate] = useState(defaultSinceDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedOpdNames, setSelectedOpdNames] = useState([
    "Napha Clinic",
    "อายุรกรรมชั้น2",
    "กุมารเวชกรรมชั้น4",
    "โรคทั่วไป",
    "ทันตกรรม",
    "ตา",
    "แม่สอดพัฒน์ ชั้น 6",
    "ศัลยกรรมกระดูก",
    "หู คอ จมูก",
    "อุบัติเหตุและฉุกเฉิน",
    "TSET",
  ]);

  const sortFieldOptions = [
    { label: "ผู้ป่วยลงทะเบียน", value: "ALL_USER" },
    { label: "ผู้ป่วยรอรับบริการ", value: "WAIT_PTS" },
    { label: "ตรวจเสร็จ", value: "COMPLETED" },
    { label: "ผู้ป่วยผิดนัด", value: "NOSHOW_PTS" },
    { label: "เวลารอตรวจเฉลี่ย", value: "avg_wait_screen" },
    { label: "เวลารอยาเฉลี่ย", value: "avg_wait_drug" },
    { label: "เวลารวมเฉลี่ย", value: "avg_wait_all" },
  ];

  const sortOrderOptions = [
    { label: "น้อยไปมาก", value: "asc" },
    { label: "มากไปน้อย", value: "desc" },
  ];

  const selectedOptions = [
    { label: "รวมทั้งหมด", value: "รวม" },
    { label: "ชาวไทย", value: "ไทย" },
    { label: "ชาวต่างชาติ", value: "ต่างชาติ" },
  ];

  const selectedChart = [
    { label: "ร้อยละ", value: "percent" },
    { label: "A,B", value: "ratio" },
  ];

  // Function to fetch summary data
  const fetchSummary = () => {
    const queryParams = new URLSearchParams({
      opdNames: selectedOpdNames.join(","),
    }).toString();

    axios
      .get(`http://172.16.39.6:3000/api/summary?${queryParams}`)
      .then((response) => {
        if (response.data.length > 0) {
          const formattedSummary = {
            ...response.data[0],
            AVG_WAIT_TIME: formatWaitTime(response.data[0].AVG_WAIT_TIME), // Format here
          };
          setSummary(formattedSummary);
        }
      })
      .catch((error) => console.error("Error fetching summary data:", error));
  };

  const fetchKPInames = async () => {
    try {
      const response = await axios.get(
        "http://172.16.39.6:3000/api/getKPIName"
      );
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
      .get(`http://172.16.39.6:3000/api/getData?${queryParams}`)
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
      .get(`http://172.16.39.6:3000/api/getDetail?${queryParams}`)
      .then((response) => {
        setDetail(response.data);
      })
      .catch((error) =>
        console.error("Error fetching department data:", error)
      );
  };

  useEffect(() => {
    fetchDepartmentState();
    fetchSummary();
    fetchKPInames();
    fetchDetailTable();
  }, [
    sortField,
    sortOrder,
    selectedOpdNames,
    selectedChartType,
    selectedKPIName,
    selectedTypeOptions,
    sinceDate,
    endDate,
  ]);

  const handleCheckboxChange = (opdName) => {
    setSelectedOpdNames((prevSelected) =>
      prevSelected.includes(opdName)
        ? prevSelected.filter((name) => name !== opdName)
        : [...prevSelected, opdName]
    );
  };

  return (
    <div className="Home-page flex">
      <SideBarMenu
        visible={visible}
        // setVisible={setVisible}
        allOpdChoices={allOpdChoices}
        selectedOpdNames={selectedOpdNames}
        handleCheckboxChange={handleCheckboxChange}
        setSelectedOpdNames={setSelectedOpdNames}
      />
      <div className="w-full p-4 sm:p-8 pt-5">
        <div className="sm lg:flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h5 className="text-2xl font-semibold">
              แผนผังตัวชี้วัดอัตราการเสียชีวิต
            </h5>
          </div>
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

        {summary && (
          <>
            <div className="card-board grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-8">
              <div className="bg-white shadow-md border-1 border-gray-200 h-[100px] md:h-[136px] p-3 md:p-5 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <h1 className="text-5xl font-semibold">
                    18<span className="text-3xl">%</span>
                  </h1>
                  <p>เพิ่มขึ้น 7%</p>
                </div>
                <p>ร้อยละการเสียชีวิตรวม</p>
              </div>

              <div className="bg-white shadow-md border-1 border-gray-200 h-[100px] md:h-[136px] p-3 md:p-5 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <h1 className="text-5xl font-semibold">
                    18<span className="text-3xl">%</span>
                  </h1>
                  <p>เพิ่มขึ้น 7%</p>
                </div>
                <p>ร้อยละการเสียชีวิตชาวไทย</p>
              </div>

              <div className="bg-white shadow-md border-1 border-gray-200 h-[100px] md:h-[136px] p-3 md:p-5 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <h1 className="text-5xl font-semibold">
                    18<span className="text-3xl">%</span>
                  </h1>
                  <p>เพิ่มขึ้น 7%</p>
                </div>
                <p>ร้อยละการเสียชีวิตชาวต่างชาติ</p>
              </div>
            </div>
          </>
        )}

        <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
          {data?.length > 0 ? (
            selectedChartType === "percent" ? (
              <KPILineChart data={data} />
            ) : (
              <BarChart data={data} type="kpi" />
            )
          ) : (
            <p>Loading chart...</p>
          )}
        </div>
        <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
          <DataTable value={detail} tableStyle={{ minWidth: "50rem" }}>
            <Column field="month" header="เดือน-ปี"></Column>
            <Column field="a_value" header="A (จำนวนผู้เสียชีวิต)"></Column>
            <Column field="b_value" header="B (จำนวนผู้ป่วยทุกสถานะ)"></Column>
            <Column field="result" header="อัตราการเสียชีวิต (%)"></Column>
            <Column field="note" header="หมายเหตุ"></Column>
          </DataTable>
        </div>
      </div>
    </div>
  );
}

export default KpiDashboard;
