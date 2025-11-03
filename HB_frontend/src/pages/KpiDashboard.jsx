import axios from "axios";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { Button } from "primereact/button";
import GaugeChart from "../components/GaugeChart";
import KPILineChart from "../components/KPILineChart";
import BarChart from "../components/BarChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExport,
  faArrowTrendUp,
  faArrowTrendDown,
  faLessThanEqual,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";
import { formatDateForSQL, formatMonthYear } from "../utils/dateTime";
import { sumField, exportToExcel } from "../utils/exportUtils";
function KpiDashboard() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";
  const dt = useRef(null);

  const now = new Date();
  const [sinceDate, setSinceDate] = useState(new Date(now.getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState(now);

  const [data, setData] = useState([]);
  const [detail, setDetail] = useState([]);
  const [dataCurrentMonth, setDataCurrentMonth] = useState([]);

  const [allKPIChoices, setAllKPIChoices] = useState([]); //rename kpiOptions
  const [selectedKPIName, setSelectedKPIName] = useState("1"); //rename selectedKPI
  const [selectedTypeOptions, setselectedTypeOptions] = useState("รวม"); //rename selectedType

  const [selectedChartType, setSelectedChartType] = useState("percent");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedOptions = [
    //rename typeOptions
    { label: "รวมทั้งหมด", value: "รวม" },
    { label: "ชาวไทย", value: "ไทย" },
    { label: "ชาวต่างชาติ", value: "ต่างชาติ" },
  ];

  const selectedChart = [
    //chartOptions
    { label: "ร้อยละ", value: "percent" },
    { label: "เทียบไทย/ต่างชาติ", value: "ratio" },
  ];

  const order = ["thai_rate", "foreigner_rate", "sum_rate"];
  const sortedData = [...dataCurrentMonth].sort(
    (a, b) => order.indexOf(a.type) - order.indexOf(b.type)
  );

  const selectedKPINameLabel =
    allKPIChoices.find((item) => item.value === selectedKPIName)?.label || "";
  const selectedTypeLabel =
    selectedOptions.find((item) => item.value === selectedTypeOptions)?.label ||
    "";

  const exportExcel = () => {
    exportToExcel(detail, selectedKPINameLabel, selectedTypeLabel, sortedData);
  };

  const fetchKPInames = useCallback(async () => {
    //reanme fetchKpiOptions
    try {
      const res = await axios.get(`${API_BASE}/kpi-name`);
      const mapped = res.data.map((item) => ({
        label: item.kpi_name,
        value: item.id.toString(),
      }));
      setAllKPIChoices(mapped);
    } catch (err) {
      console.error("Error fetching KPI options:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      //เอา toast มาใส่
    }
  }, [API_BASE]);

  // ✅ Build query params once
  const getQueryParams = useCallback(() => {
    return new URLSearchParams({
      kpi_name: selectedKPIName,
      type: selectedTypeOptions,
      chart: selectedChartType,
      since: formatDateForSQL(sinceDate),
      until: formatDateForSQL(endDate, true),
    }).toString();
  }, [
    selectedKPIName,
    selectedTypeOptions,
    selectedChartType,
    sinceDate,
    endDate,
  ]);
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const query = getQueryParams();
      const [chartRes, detailRes, summaryRes] = await Promise.all([
        axios.get(`${API_BASE}/kpi-data/chart?${query}`),
        axios.get(`${API_BASE}/kpi-data/detail?${query}`),
        axios.get(`${API_BASE}/kpi-data/summary?${query}`),
      ]);
      setData(chartRes.data || []);
      setDetail(detailRes.data || []);
      setDataCurrentMonth(summaryRes.data || []);
      console.log(summaryRes.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching KPI dashboard data:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, getQueryParams]);

  useEffect(() => {
    fetchKPInames();
    fetchDashboardData();
  }, [fetchKPInames, fetchDashboardData]);

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
  const [value, setValue] = useState(0);
  const getTrendText = (type) => {
    if (!type || type === "null") return null;

    const isPositive = true;
    // const isPositive = note.startsWith("+");

    switch (type) {
      case "sum_rate":
        return <GaugeChart value={41.49} target={10} />;
      case "thai_rate":
        return <GaugeChart value={41.49} target={10} />;
      default:
        return (
          <span
            className={`w-fit flex items-center px-2 py-1 gap-2 rounded-md bg-green-100`}
          >
            <FontAwesomeIcon icon={faLessThanEqual} className="text-green-500" /> ค่าเป้าหมาย 50%
            {/* {" "}<FontAwesomeIcon icon={faLessThanEqual} className="text-blue-500" />{" "} */}
           
          </span>
        );
    }
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

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-lg">{selectedKPINameLabel}</h1>
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
        {sortedData.map((item, index) => (
          <Column key={index} footer={item.value?.toLocaleString()} />
        ))}
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
            คุณภาพและความปลอดภัยในการดูแลผู้ป่วยโรคสำคัญ
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
            {selectedChartType === "percent" && (
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
            )}
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
            <Column
              field="result_thai"
              header="อัตราการเสียชีวิตชาวไทย (%)"
            ></Column>
            <Column
              field="result_foreign"
              header="อัตราการเสียชีวิตชาวต่างชาติ (%)"
            ></Column>
            <Column
              field="result_total"
              header="อัตราการเสียชีวิตรวม (%)"
            ></Column>
            <Column header="แนวโน้ม" body={noteBodyTemplate}></Column>
          </DataTable>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default KpiDashboard;
