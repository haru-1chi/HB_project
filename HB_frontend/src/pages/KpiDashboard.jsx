import axios from "axios";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { Button } from "primereact/button";
import { Fieldset } from "primereact/fieldset";
import { Card } from "primereact/card";
import { Panel } from "primereact/panel";
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
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  formatDateForSQL,
  formatMonthYear,
  multiplierToThaiUnit,
} from "../utils/dateTime";
import { sumField, exportToExcel } from "../utils/exportUtils";
import { ScrollTop } from "primereact/scrolltop";

function KpiDashboard() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";
  const dt = useRef(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get("type");

  const now = new Date();
  const [sinceDate, setSinceDate] = useState(new Date(now.getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState(now);

  const [data, setData] = useState([]);
  const [detail, setDetail] = useState([]);
  const [qualityData, setQualityData] = useState([]);

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
    { label: "ไทย", value: "ไทย" },
    { label: "ต่างชาติ", value: "ต่างชาติ" },
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

  const selectedKPI = allKPIChoices.find(
    (item) => item.value === selectedKPIName
  );

  const selectedKPINameLabel = selectedKPI?.label || "";

  const selectedTypeLabel =
    selectedOptions.find((item) => item.value === selectedTypeOptions)?.label ||
    "";
  const selectedUnitValue = selectedKPI?.unit_value || 100; // default 100
  const unitLabel = multiplierToThaiUnit(selectedUnitValue);
  const exportExcel = () => {
    exportToExcel(detail, selectedKPINameLabel, selectedTypeLabel, sortedData);
  };

  useEffect(() => {
    const fetchKPInames = async () => {
      try {
        const res = await axios.get(`${API_BASE}/kpi-name`, {
          params: { type },
        });
        const mapped = res.data.map((item) => ({
          label: item.kpi_name,
          value: item.id.toString(),
          unit_type: item.unit_type,
          unit_value: item.unit_value,
          unit_label: item.unit_label,
          target_direction: item.target_direction,
          max_value: item.max_value,
        }));

        setAllKPIChoices(mapped);

        if (mapped.length > 0) {
          setSelectedKPIName(mapped[0].value);
        } else {
          setSelectedKPIName("");
        }
      } catch (err) {
        console.error(err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    };

    fetchKPInames();
  }, [API_BASE, type, setError]);

  // ✅ Build query params once
  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    if (selectedKPIName) params.append("kpi_name", selectedKPIName);
    if (selectedTypeOptions) params.append("type", selectedTypeOptions);
    if (selectedChartType) params.append("chart", selectedChartType);
    if (sinceDate) params.append("since", formatDateForSQL(sinceDate));
    if (endDate) params.append("until", formatDateForSQL(endDate, true));

    return params.toString();
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
      // console.log(summaryRes.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching KPI dashboard data:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, getQueryParams]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = new URLSearchParams({
          kpi_name: selectedKPIName,
          type: selectedTypeOptions,
          since: formatDateForSQL(sinceDate),
          until: formatDateForSQL(endDate, true),
        }).toString();

        const res = await axios.get(`${API_BASE}/kpi-quality?${query}`);
        setQualityData(res.data);
        // console.log(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [selectedKPIName, selectedTypeOptions, sinceDate, endDate]);

  const renderPanelContent = (data, keyName) => {
    const grouped = {};

    data.forEach((item) => {
      const value = item[keyName];
      if (!value) return;

      const typeKey = item.type;
      const monthKey = item.report_date.slice(0, 7); // keep grouping by YYYY-MM

      if (!grouped[typeKey]) grouped[typeKey] = {};
      if (!grouped[typeKey][monthKey]) grouped[typeKey][monthKey] = [];

      grouped[typeKey][monthKey].push(item);
    });

    if (Object.keys(grouped).length === 0) {
      return <p className="m-0">ยังไม่มีข้อมูล</p>;
    }

    return Object.entries(grouped).map(([type, months]) => (
      <div key={type}>
        <h3>ประเภท: {type}</h3>

        {Object.entries(months).map(([month, items]) => (
          <div key={month} style={{ paddingLeft: 20 }}>
            {/* Show Thai month-year, e.g., เม.ย. 25 */}
            <p>{items[0].report_date_formatted}:</p>

            {items.map((item, idx) =>
              (item[keyName] || "").split("\n").map((line, i) => (
                <p key={`${idx}-${i}`} style={{ paddingLeft: 20, margin: 0 }}>
                  {line}
                </p>
              ))
            )}
          </div>
        ))}
      </div>
    ));
  };

  const noteBodyTemplate = (rowData) => {
    const value = rowData.note;
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      parseFloat(value) === 0 ||
      !selectedKPI
    ) {
      return null;
    }

    const { target_direction } = selectedKPI;
    const isPositive = value.startsWith("+");

    // Determine good/bad based on KPI rule
    let isGood = false;

    if (target_direction === "less_than") {
      isGood = !isPositive;
    } else if (target_direction === "more_than") {
      isGood = isPositive;
    }

    const color = isGood ? "text-green-500" : "text-red-500";
    const bg = isGood ? "bg-green-100" : "bg-red-100";
    const icon = isPositive ? faArrowTrendUp : faArrowTrendDown;

    return (
      <div className={`w-fit flex items-center px-2 rounded-md ${bg}`}>
        <FontAwesomeIcon icon={icon} className={color} />
        <p className={`ml-2 ${color}`}>{value}</p>
      </div>
    );
  };

  const getGaugeChart = (type, value) => {
    if (!type || type === "null" || !selectedKPI) return null;
    // Make sure the value is a number (assuming value is numeric already)
    const percentage = Number(value); // Ensure value is treated as a number

    switch (type) {
      case "sum_rate":
      case "thai_rate":
        // Pass the numeric value to the chart
        return <GaugeChart value={percentage} selectedKPI={selectedKPI} />;
      default:
        return <GaugeChart value={percentage} selectedKPI={selectedKPI} />;
    }
  };
  const getTitle = (type) => {
    const startLabel = formatMonthYear(sinceDate);
    const endLabel = formatMonthYear(endDate);

    const rangeText =
      startLabel && endLabel ? ` | ${startLabel} - ${endLabel}` : "";

    switch (type) {
      case "sum_rate":
        return `รวมทั้งหมด${rangeText}`;
      case "thai_rate":
        return `ไทยรวม${rangeText}`;
      case "foreigner_rate":
        return `ต่างชาติรวม${rangeText}`;
      default:
        return `(${type})${rangeText}`;
    }
  };

  const getValueColorClass = (item, selectedKPI) => {
    if (!selectedKPI) return "";

    const { target_direction, max_value } = selectedKPI;
    const value = item.value;

    if (target_direction === "less_than") {
      return value > max_value ? "text-red-500" : "text-green-600";
    }

    if (target_direction === "more_than") {
      return value < max_value ? "text-red-500" : "text-green-600";
    }

    return "";
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

  const legendTemplate = (
    <div className="bg-red-700 flex align-items-center gap-2 px-2">
      <span className="font-bold">ปัญหาและอุปสรรค</span>
    </div>
  );

  return (
    <div className="Home-page overflow-hidden min-h-dvh flex flex-col justify-between">
      <ScrollTop />
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
                placeholder="ตัวชี้วัด"
                optionLabel="label"
                checkmark
                className="mr-5"
                filter
                filterDelay={400}
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
              showIcon
            />
            <p> - </p>
            <Calendar
              value={endDate}
              onChange={(e) => setEndDate(e.value)}
              view="month"
              dateFormat="mm/yy"
              className="ml-3 w-50"
              showIcon
            />
          </div>
        </div>

        <div className="card-board grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-8">
          {dataCurrentMonth.map((item, index) => {
            const valueColor = getValueColorClass(item, selectedKPI);

            return (
              <div
                key={`${item.type}-${index}`}
                className="bg-white shadow-md border-1 border-gray-200 h-[100px] md:h-[136px] p-3 md:p-5 rounded-xl flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-end">
                    <h1 className={`text-5xl font-semibold ${valueColor}`}>
                      {item.value}
                      <span
                        className={unitLabel === 100 ? "text-2xl" : "text-3xl"}
                      >
                        {unitLabel}
                      </span>
                    </h1>
                    <h1 className={`ml-2 mb-1 text-xl ${valueColor}`}>
                      ({item.raw_value} ราย)
                    </h1>
                  </div>

                  {getGaugeChart(item.type, item.value)}
                </div>
                <p>{getTitle(item.type)}</p>
              </div>
            );
          })}
        </div>
        <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
          {/* <div className="bg-grey-900 p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200"> */}
          {data?.length > 0 ? (
            selectedChartType === "percent" ? (
              <KPILineChart data={data} unitLabel={unitLabel} />
            ) : (
              <BarChart data={data} type="kpi" unitLabel={unitLabel} />
            )
          ) : (
            <p>ไม่พบข้อมูล...</p>
          )}
        </div>

        {/* <div className="flex gap-5">
          <Card
            title="ปัญหาและอุปสรรค"
            className="w-full"
            style={{
              backgroundColor: "oklch(97.1% 0.013 17.38)",
            }}
            pt={{
              title: {
                style: {
                  paddingBottom: "15px",
                  borderBottom: "5px solid #ffffff",
                },
              },
            }}
          >
            {renderPanelContent(qualityData, "issue_details")}
          </Card>
          <Card
            title="สิ่งที่ต้องการสนับสนุนให้บรรลุเป้าหมาย"
            className="w-full"
            style={{
              backgroundColor: "oklch(98.2% 0.018 155.826)",
            }}
             pt={{
              title: {
                style: {
                  paddingBottom: "15px",
                  borderBottom: "5px solid #ffffff",
                },
              },
            }}
          >
            {renderPanelContent(qualityData, "support_details")}
          </Card>
        </div> */}

        <div className="flex items-stretch gap-5">
          <Panel
            header="ปัญหาและอุปสรรค"
            className="flex-1 flex flex-col"
            pt={{
              header: {
                style: {
                  // backgroundColor: "oklch(70.4% 0.191 22.216)",
                  backgroundColor: "oklch(93.6% 0.032 17.717)",
                },
              },
              toggleableContent: {
                style: {
                  flex: 1,
                },
              },
              content: {
                style: {
                  height: "100%",
                },
              },
            }}
          >
            {renderPanelContent(qualityData, "issue_details")}
          </Panel>

          <Panel
            header="สิ่งที่ต้องการสนับสนุนให้บรรลุเป้าหมาย"
            className="flex-1 flex flex-col"
            pt={{
              header: {
                style: {
                  backgroundColor: "oklch(96.2% 0.044 156.743)",
                },
              },
              toggleableContent: {
                style: {
                  flex: 1,
                },
              },
              content: {
                style: {
                  height: "100%",
                },
              },
            }}
          >
            {renderPanelContent(qualityData, "support_details")}
          </Panel>
        </div>

        {/* <div className="flex gap-5">
          <Fieldset
            className="w-full"
            legend="ปัญหาและอุปสรรค"
            pt={{
              legend: {
                style: {
                  backgroundColor: "oklch(93.6% 0.032 17.717)",
                },
              },
            }}
          >
            <p className="m-0">
              - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              <p className="m-0">
                - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                do
              </p>
              <p className="m-0">
                - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                do
              </p>
            </p>
          </Fieldset>
          <Fieldset
            className="w-full"
            legend="สิ่งที่ต้องการสนับสนุนให้บรรลุเป้าหมาย"
            pt={{
              legend: {
                style: {
                  backgroundColor: "oklch(96.2% 0.044 156.743)",
                },
              },
            }}
          >
            <p className="m-0">
              - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            </p>
            <p className="m-0">
              - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            </p>
            <p className="m-0">
              - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            </p>
            <p className="m-0">
              - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            </p>
          </Fieldset>
        </div> */}

        <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
          <DataTable
            ref={dt}
            header={header}
            value={detail}
            tableStyle={{ minWidth: "50rem" }}
            footerColumnGroup={footerGroup}
          >
            <Column field="month" header="เดือน-ปี"></Column>
            <Column field="result_thai" header={`ไทย (${unitLabel})`}></Column>
            <Column
              field="result_foreign"
              header={`ต่างชาติ (${unitLabel})`}
            ></Column>
            <Column field="result_total" header={`รวม (${unitLabel})`}></Column>
            <Column
              header={`แนวโน้ม (${unitLabel})`}
              body={noteBodyTemplate}
            ></Column>
          </DataTable>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default KpiDashboard;
