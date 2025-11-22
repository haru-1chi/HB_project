import axios from "axios";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { BreadCrumb } from "primereact/breadcrumb";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { Button } from "primereact/button";
import { Fieldset } from "primereact/fieldset";
import { Card } from "primereact/card";
import { Panel } from "primereact/panel";
import GaugeChart from "../components/GaugeChart";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExport,
  faArrowTrendUp,
  faArrowTrendDown,
  faLessThanEqual,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";
import {
  formatDateForSQL,
  formatMonthYear,
  multiplierToThaiUnit,
} from "../utils/dateTime";
import { sumField, exportToExcel } from "../utils/exportUtils";
import { ScrollTop } from "primereact/scrolltop";

function KpiDashboardMedError() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";
  const [charts, setCharts] = useState([]);
  const [subCharts, setSubCharts] = useState([]);

  const now = new Date();
  const [OPDNames, setOPDNames] = useState([]);
  const [allKpis, setAllKpis] = useState([]);
  const [kpiList, setKpiList] = useState([]); // only parent KPIs
  const [pickerMode, setPickerMode] = useState("month");
  const [selectedOPD, setSelectedOPD] = useState(null);
  const [selectedType, setSelectedType] = useState("detail");

  const [sinceDate, setSinceDate] = useState(new Date(now.getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState(now);

  const [activeParentKpi, setActiveParentKpi] = useState(null);
  const [activeParentLabel, setActiveParentLabel] = useState("");

  const breadcrumbItems = [
    {
      label: "อุบัติการณ์ความเสี่ยง",
      command: () => {
        setActiveParentKpi(null);
        setActiveParentLabel("");
      },
    },
  ];

  if (activeParentKpi) {
    breadcrumbItems.push({ label: activeParentLabel });
  }

  const breadcrumbHome = {
    label: "อุบัติการณ์ความเสี่ยง",
    command: () => setActiveParentKpi(null), // resets to main section
  };

  const formatDate = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  };

  const fetchSubKpiCharts = async (parentId, label) => {
    setActiveParentKpi(parentId);
    setActiveParentLabel(label);

    const subKpis = allKpis.filter((kpi) => kpi.parent_id === parentId);
    if (!subKpis.length) return;

    try {
      const requests = subKpis.map((subKpi) =>
        axios
          .get(`${API_BASE}/kpi-data-med/chart`, {
            params: {
              kpi_id: subKpi.id,
              opd_id: selectedOPD,
              sinceDate: formatDate(sinceDate),
              endDate: formatDate(endDate),
              type: selectedType,
            },
          })
          .then((res) => ({
            kpi_id: subKpi.id,
            kpi_label: subKpi.kpi_name,
            data: res.data,
          }))
      );

      const collected = await Promise.all(requests);

      setSubCharts((prev) => ({ ...prev, [parentId]: collected }));
    } catch (err) {
      console.error("❌ Error fetching sub-KPI charts", err);
    }
  };

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const [resOPD, resKPI] = await Promise.all([
          axios.get(`${API_BASE}/opd-name`, {
            params: { includeDeleted: true },
          }),
          axios.get(`${API_BASE}/kpi-name-med`),
        ]);

        const activeOPD = resOPD.data
          .filter((item) => !item.deleted_at)
          .map((item) => ({
            label: item.opd_name,
            value: item.id,
            parent_id: item.parent_id,
          }));

        setOPDNames(activeOPD);
        setAllKpis(resKPI.data);
        setKpiList(resKPI.data.filter((k) => k.parent_id === null));
      } catch (err) {
        console.error(err);
      }
    };

    fetchNames();
  }, [API_BASE]);

  // ---- Fetch charts whenever filters change
  useEffect(() => {
    if (!kpiList.length) return;

    const fetchCharts = async () => {
      try {
        // Fetch all parent KPI charts concurrently instead of sequentially
        const requests = kpiList.map((kpi) =>
          axios
            .get(`${API_BASE}/kpi-data-med/chart`, {
              params: {
                kpi_id: kpi.id,
                opd_id: selectedOPD,
                sinceDate: formatDate(sinceDate),
                endDate: formatDate(endDate),
                type: selectedType,
              },
            })
            .then((res) => ({
              kpi_id: kpi.id,
              kpi_label: kpi.kpi_name,
              data: res.data,
            }))
        );

        const collected = await Promise.all(requests);
        setCharts(collected);
      } catch (err) {
        console.error("❌ Error fetching parent KPI charts", err);
      }
    };

    fetchCharts();
  }, [kpiList, selectedOPD, selectedType, sinceDate, endDate]);

  useEffect(() => {
    // Re-fetch subcharts only for parents that have been loaded before
    const parents = Object.keys(subCharts);
    if (!parents.length) return;

    parents.forEach((parentId) => {
      fetchSubKpiCharts(Number(parentId));
    });
  }, [selectedOPD, selectedType, sinceDate, endDate]);

  const isAllZero = (obj) =>
    !obj || Object.values(obj).every((v) => Number(v) === 0);

  return (
    <div className="Home-page overflow-hidden min-h-dvh flex flex-col justify-between">
      <ScrollTop />
      <div
        className={`flex-1 transition-all duration-300 p-4 sm:p-8 pt-5 overflow-auto`}
      >
        <div className="flex items-center mb-4">
          <BreadCrumb
            model={breadcrumbItems}
            pt={{
              root: {
                style: {
                  backgroundColor: "transparent",
                  border: "none",
                  boxShadow: "none",
                },
              },
            }}
          />
          {/* <h5 className="text-2xl font-semibold">อุบัติการณ์ความเสี่ยง</h5> */}
        </div>

        <div className="flex justify-between mb-4 items-end">
          <div>
            <div className="flex items-center mb-3">
              <Dropdown
                value={pickerMode}
                onChange={(e) => setPickerMode(e.value)}
                options={[
                  { label: "เดือน", value: "month" },
                  { label: "ไตรมาส", value: "quarter" },
                  { label: "ปี", value: "year" },
                ]}
                optionLabel="label"
                placeholder="รายงานโดยใช้"
                className="mr-3"
              />
              {pickerMode === "month" && (
                <>
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
                </>
              )}

              {pickerMode === "year" && (
                <>
                  <Calendar
                    value={sinceDate}
                    onChange={(e) => setSinceDate(e.value)}
                    view="year"
                    dateFormat="yy"
                    className="mr-3 w-50"
                    showIcon
                  />
                  <p> - </p>
                  <Calendar
                    value={endDate}
                    onChange={(e) => setEndDate(e.value)}
                    view="year"
                    dateFormat="yy"
                    className="ml-3 w-50"
                    showIcon
                  />
                </>
              )}
            </div>
            <div className="flex">
              <div className="hidden sm:block  mr-5">
                <Dropdown
                  value={selectedOPD}
                  onChange={(e) => setSelectedOPD(e.value)}
                  options={OPDNames}
                  optionLabel="label"
                  placeholder="เลือก OPD"
                  className="w-full"
                  filter
                  filterDelay={400}
                />
              </div>
              {/* <div className="hidden sm:block  mr-5">
                <Dropdown
                  value={selectedOPD}
                  onChange={(e) => setSelectedOPD(e.value)}
                  options={OPDNames}
                  optionLabel="label"
                  placeholder="เลือก OPD"
                  className="w-full"
                  filter
                  filterDelay={400}
                />
              </div>
              <div className="hidden sm:block  mr-5">
                <Dropdown
                  value={selectedOPD}
                  onChange={(e) => setSelectedOPD(e.value)}
                  options={OPDNames}
                  optionLabel="label"
                  placeholder="เลือก OPD"
                  className="w-full"
                  filter
                  filterDelay={400}
                />
              </div> */}
            </div>
          </div>
          <div className="hidden sm:block">
            <Dropdown
              value={selectedType}
              onChange={(e) => setSelectedType(e.value)}
              options={[
                { label: "ตามระดับความรุนแรง", value: "detail" },
                { label: "รวบระดับความรุนแรง", value: "group" },
              ]}
              optionLabel="label"
              checkmark
              className="mr-5"
              placeholder="เลือกรูปแบบ"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-5 mt-5">
          {charts.length === 0 && (
            <p className="text-center w-full">Loading...</p>
          )}

          {!activeParentKpi && (
            <div className="flex flex-wrap gap-5 mt-5">
              {charts
                .filter((item) => !isAllZero(item.data))
                .map((item) => (
                  <div
                    key={item.kpi_id}
                    className="p-4 w-[500px] rounded-xl shadow-md border border-gray-200"
                  >
                    <p className="text-center font-semibold text-xl mb-3">
                      {item.kpi_label}
                    </p>

                    <PieChart data={item.data} type={selectedType} />

                    {allKpis.some((k) => k.parent_id === item.kpi_id) && (
                      <Button
                        label="ดูตามหัวข้อย่อย"
                        onClick={() =>
                          fetchSubKpiCharts(item.kpi_id, item.kpi_label)
                        }
                      />
                    )}
                  </div>
                ))}
            </div>
          )}
          {activeParentKpi && (
            <div className="flex flex-wrap gap-5 mt-5">
              {subCharts[activeParentKpi]
                ?.filter((sub) => !isAllZero(sub.data))
                .map((sub) => (
                  <div
                    key={sub.kpi_id}
                    className="p-4 w-[450px] rounded-xl shadow-md border border-gray-200"
                  >
                    <p className="text-center font-medium text-lg mb-3">
                      {sub.kpi_label}
                    </p>
                    <PieChart data={sub.data} type={selectedType} />
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* <div className="flex h-full">
          <div>
            <div className="flex justify-between gap-5">
              <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
                <p className="text-center font-semibold text-md mb-3">
                  Prescribing error
                  (เกิดข้อผิดพลาด/อุบัติการณ์ในขั้นตอนการสั่งใช้ยา)
                </p>
                {chartData ? <PieChart data={chartData} /> : "Loading..."}
              </div>
              <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
                <p className="text-center font-semibold text-md mb-3">
                  Transcribing error
                  (เกิดข้อผิดพลาด/อุบัติการณ์ในขั้นตอนการคัดลอกยา)
                </p>
                {chartData ? <PieChart data={chartData} /> : "Loading..."}
              </div>
              <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
                <p className="text-center font-semibold text-md mb-3">
                  Pre-dispensing(เกิดข้อผิดพลาด/อุบัติการณ์ในขั้นตอนการจัดเตรียมจ่ายยา)
                </p>
                {chartData ? <PieChart data={chartData} /> : "Loading..."}
              </div>
            </div>

            <div className="flex justify-between gap-5">
              <div className="bg-white p-4 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
                <p className="text-center font-semibold text-md mb-3">
                  Dispensing error
                  (เกิดข้อผิดพลาด/อุบัติการณ์ในขั้นตอนการจ่ายยา)
                </p>
                {chartData ? <PieChart data={chartData} /> : "Loading..."}
              </div>
              <div className="bg-white p-4 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
                <p className="text-center font-semibold text-md mb-3">
                  Administration error
                  (เกิดข้อผิดพลาด/อุบัติการณ์ในขั้นตอนการให้ยา)
                </p>
                {chartData ? <PieChart data={chartData} /> : "Loading..."}
              </div>
            </div>
          </div>
        </div> */}
      </div>
      <Footer />
    </div>
  );
}

export default KpiDashboardMedError;
