import axios from "axios";
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import KpiChartCard from "../components/KpiChartCard";
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
import { classNames } from "primereact/utils";

function KpiDashboardMedError() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";

  const [selectedMission, setSelectedMission] = useState(null);
  const [selectedWork, setSelectedWork] = useState(null);
  const [missionList, setMissionList] = useState([]);
  const [workList, setWorkList] = useState([]);
  const [opdList, setOpdList] = useState([]);

  const [allKpis, setAllKpis] = useState([]);
  const [charts, setCharts] = useState({});
  const [stackData, setStackData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeParent, setActiveParent] = useState(null);

  // Filters
  const now = new Date();
  const [pickerMode, setPickerMode] = useState("month");
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [selectedOPD, setSelectedOPD] = useState(null);
  const [selectedType, setSelectedType] = useState("detail");
  const [sinceDate, setSinceDate] = useState(new Date(now.getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState(now);

  const parentKpis = useMemo(
    () => allKpis.filter((k) => k.parent_id === null),
    [allKpis]
  );

  const kpiOptions = useMemo(
    () =>
      allKpis.map((k) => ({
        label: k.kpi_name,
        value: k.id,
      })),
    [allKpis]
  );

  const formatDate = (date) =>
    date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-01`
      : null;

  const fetchChart = useCallback(
    (kpiId) =>
      axios.get(`${API_BASE}/kpi-data-med/chart`, {
        params: {
          kpi_id: kpiId,
          opd_id: selectedOPD,
          sinceDate: formatDate(sinceDate),
          endDate: formatDate(endDate),
          type: selectedType,
        },
      }),
    [API_BASE, selectedOPD, selectedType, sinceDate, endDate]
  );

  const fetchParentCharts = useCallback(async () => {
    if (!parentKpis.length) return;

    const responses = await Promise.all(
      parentKpis.map((k) =>
        fetchChart(k.id).then((res) => ({
          kpi_id: k.id,
          kpi_label: k.kpi_name,
          data: res.data,
        }))
      )
    );

    setCharts((prev) => ({ ...prev, root: responses }));
  }, [parentKpis, fetchChart]);

  const fetchSubCharts = useCallback(
    async (parentId) => {
      const children = allKpis.filter((k) => k.parent_id === parentId);
      if (!children.length) return;

      setActiveParent(parentId);

      const responses = await Promise.all(
        children.map((k) =>
          fetchChart(k.id).then((res) => ({
            kpi_id: k.id,
            kpi_label: k.kpi_name,
            data: res.data,
          }))
        )
      );

      setCharts((prev) => ({ ...prev, [parentId]: responses }));
    },
    [allKpis, fetchChart]
  );

  const fetchStackChart = async () => {
    try {
      const res = await axios.get(`${API_BASE}/kpi-data-med/stack`, {
        params: {
          kpi_id: selectedKPI,
          opd_id: selectedOPD,
          sinceDate: formatDate(sinceDate),
          endDate: endDate,
          type: selectedType, // detail or group
        },
      });
      console.log(endDate);
      setStackData(res.data);
    } catch (err) {
      console.error("❌ Error fetching stacked bar chart:", err);
    }
  };

  useEffect(() => {
    const fetchNames = async () => {
      const [resMission, resWork, resOPD, resKPI] = await Promise.all([
        axios.get(`${API_BASE}/mission-name`, {
          params: { includeDeleted: true },
        }),
        axios.get(`${API_BASE}/work-name`, {
          params: { includeDeleted: true },
        }),
        axios.get(`${API_BASE}/opd-name`, {
          params: { includeDeleted: true },
        }),
        axios.get(`${API_BASE}/kpi-name-med`),
      ]);

      setMissionList(
        resMission.data
          .filter((i) => !i.deleted_at)
          .map((i) => ({ label: i.mission_name, value: i.id }))
      );

      setWorkList(
        resWork.data
          .filter((i) => !i.deleted_at)
          .map((i) => ({
            label: i.work_name,
            value: i.id,
            mission_id: i.mission_id,
          }))
      );

      setOpdList(
        resOPD.data
          .filter((i) => !i.deleted_at)
          .map((i) => ({
            label: i.opd_name,
            value: i.id,
            work_id: i.work_id,
          }))
      );

      setAllKpis(resKPI.data);

      if (resKPI.data?.length > 0 && !selectedKPI) {
        setSelectedKPI(resKPI.data[0].id);
      }
    };

    fetchNames();
  }, [API_BASE]);

  useEffect(() => {
    fetchParentCharts();

    if (activeParent) fetchSubCharts(activeParent);
  }, [fetchParentCharts, fetchSubCharts]);

  useEffect(() => {
    if (pickerMode === "year") {
      const currentYear = now.getFullYear();
      setEndDate(new Date(currentYear, 11, 31, 23, 59, 59));
    }
  }, [pickerMode]);

  useEffect(() => {
    if (pickerMode !== "year") return;
    if (!selectedKPI) return;
    fetchStackChart();
  }, [pickerMode, selectedKPI, selectedOPD, sinceDate, endDate, selectedType]);

  const currentCharts = activeParent ? charts[activeParent] : charts.root;

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
            model={[
              {
                label: "อุบัติการณ์ความเสี่ยง",
                command: () => setActiveParent(null),
              },
              ...(activeParent
                ? [
                    {
                      label: allKpis.find((k) => k.id === activeParent)
                        ?.kpi_name,
                    },
                  ]
                : []),
            ]}
            pt={{
              root: {
                style: {
                  backgroundColor: "transparent",
                  border: "none",
                  boxShadow: "none",
                  padding: "0.4rem 0",
                  fontSize: "1.5rem",
                  fontWeight: "600",
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
                    onChange={(e) => {
                      const selectedYear = e.value.getFullYear();
                      setSinceDate(new Date(selectedYear, 0, 1, 0, 0, 0));
                    }}
                    view="year"
                    dateFormat="yy"
                    className="mr-3 w-50"
                    showIcon
                  />
                  <p> - </p>
                  <Calendar
                    value={endDate}
                    onChange={(e) => {
                      const selectedYear = e.value.getFullYear();
                      setEndDate(new Date(selectedYear, 11, 31, 23, 59, 59));
                    }}
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
                {pickerMode === "year" && (
                  <Dropdown
                    value={selectedKPI}
                    options={kpiOptions}
                    optionLabel="label"
                    placeholder="เลือก KPI"
                    className="min-w-xs mr-5"
                    onChange={(e) => setSelectedKPI(e.value)}
                    filter
                    filterDelay={400}
                  />
                )}
                {/* Mission dropdown */}
                <Dropdown
                  value={selectedMission}
                  onChange={(e) => {
                    setSelectedMission(e.value);
                    setSelectedWork(null); // reset work selection
                  }}
                  options={missionList}
                  optionLabel="label"
                  placeholder="เลือก กลุ่มภารกิจ"
                  className="mr-3"
                  filter
                  filterDelay={400}
                />

                {/* Work dropdown filtered by selectedMission */}
                <Dropdown
                  value={selectedWork}
                  onChange={(e) => setSelectedWork(e.value)}
                  options={workList.filter(
                    (w) => w.mission_id === selectedMission
                  )}
                  optionLabel="label"
                  className="mr-3"
                  placeholder="เลือก กลุ่มงาน"
                  filter
                  filterDelay={400}
                />

                {/* OPD dropdown filtered by selectedWork */}
                <Dropdown
                  value={selectedOPD}
                  onChange={(e) => setSelectedOPD(e.value)}
                  options={opdList.filter((o) => o.work_id === selectedWork)}
                  optionLabel="label"
                  placeholder="เลือก หน่วยงาน"
                  filter
                  filterDelay={400}
                />
              </div>
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
        {pickerMode === "year" &&
          (stackData?.length > 0 ? (
            <div className="p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
              <BarChart data={stackData} type="stack" dataType={selectedType} />
            </div>
          ) : (
            <p>ไม่พบข้อมูล...</p>
          ))}

        {pickerMode === "month" && (
          <div className="flex flex-wrap gap-5">
            {loading && <p className="text-center">Loading...</p>}

            {!activeParent && currentCharts?.length > 0 && (
              <div className="flex flex-wrap gap-5">
                {currentCharts
                  .filter((item) => !isAllZero(item.data))
                  .map((item) => (
                    <KpiChartCard
                      key={item.kpi_id}
                      kpiId={item.kpi_id}
                      label={item.kpi_label}
                      data={item.data}
                      selectedType={selectedType}
                      hasChildren={allKpis.some(
                        (k) => k.parent_id === item.kpi_id
                      )}
                      onOpenSub={(id) => fetchSubCharts(id)}
                    />
                  ))}
              </div>
            )}
            {activeParent && currentCharts?.length > 0 && (
              <div className="flex flex-wrap gap-5">
                {currentCharts
                  .filter((sub) => !isAllZero(sub.data))
                  .map((sub) => (
                    <KpiChartCard
                      key={sub.kpi_id}
                      kpiId={sub.kpi_id}
                      label={sub.kpi_label}
                      data={sub.data}
                      selectedType={selectedType}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default KpiDashboardMedError;
