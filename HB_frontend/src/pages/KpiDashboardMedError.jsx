import axios from "axios";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { BreadCrumb } from "primereact/breadcrumb";
import { TreeSelect } from "primereact/treeselect";
import { Button } from "primereact/button";
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

  const formatDate = (date) =>
    date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-01`
      : null;

  const fetchChart = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/kpi-data-med/chart`, {
        params: {
          mission_id: selectedMission === "all" ? null : selectedMission,
          work_id: selectedWork === "all" ? null : selectedWork,
          opd_id: selectedOPD === "all" ? null : selectedOPD,
          sinceDate: formatDate(sinceDate),
          endDate: formatDate(endDate),
          type: selectedType,
        },
      });

      setCharts(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching stacked bar chart:", err);
    }
  }, [
    API_BASE,
    selectedOPD,
    selectedType,
    sinceDate,
    endDate,
    selectedMission,
    selectedWork,
  ]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  const fetchStackChart = async () => {
    try {
      const res = await axios.get(`${API_BASE}/kpi-data-med/stack`, {
        params: {
          kpi_id: selectedKPI,
          mission_id: selectedMission === "all" ? null : selectedMission,
          work_id: selectedWork === "all" ? null : selectedWork,
          opd_id: selectedOPD === "all" ? null : selectedOPD,
          sinceDate: formatDate(sinceDate),
          endDate: endDate,
          type: selectedType, // detail or group
        },
      });
      // console.log(endDate);
      setStackData(res.data);
    } catch (err) {
      console.error("❌ Error fetching stacked bar chart:", err);
    }
  };

  const convertToTreeNodes = (list) => {
    return list.map((node) => ({
      key: String(node.id),
      label: node.kpi_name,
      data: node.id,
      ...(node.children?.length
        ? { children: convertToTreeNodes(node.children) }
        : {}),
    }));
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

      setMissionList([
        { label: "ทั้งหมด", value: "all" },
        ...resMission.data
          .filter((i) => !i.deleted_at)
          .map((i) => ({ label: i.mission_name, value: i.id })),
      ]);

      setWorkList([
        { label: "ทั้งหมด", value: "all" },
        ...resWork.data
          .filter((i) => !i.deleted_at)
          .map((i) => ({
            label: i.work_name,
            value: i.id,
            mission_id: i.mission_id,
          })),
      ]);

      setOpdList([
        { label: "ทั้งหมด", value: "all" },
        ...resOPD.data
          .filter((i) => !i.deleted_at)
          .map((i) => ({
            label: i.opd_name,
            value: i.id,
            work_id: i.work_id,
          })),
      ]);

      const tree = convertToTreeNodes(resKPI.data);
      setAllKpis(tree);

      if (resKPI.data?.length > 0 && !selectedKPI) {
        setSelectedKPI(resKPI.data[0].id);
      }
    };

    fetchNames();
  }, [API_BASE]);

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
  }, [
    pickerMode,
    selectedKPI,
    selectedMission,
    selectedWork,
    selectedOPD,
    sinceDate,
    endDate,
    selectedType,
  ]);

  const isAllZero = (obj) =>
    !obj || Object.values(obj).every((v) => Number(v) === 0);

  const parentCharts = charts;

  const currentCharts = activeParent
    ? parentCharts.find((p) => p.id === activeParent)?.children || []
    : parentCharts;
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
                      label: allKpis.find((x) => Number(x.key) === activeParent)
                        ?.label,
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
                  <TreeSelect
                    value={selectedKPI}
                    onChange={(e) => setSelectedKPI(e.value)}
                    options={allKpis} // from API
                    placeholder="Select KPI"
                    className="mr-5"
                    filter
                  />

                  // <Dropdown
                  //   value={selectedKPI}
                  //   options={kpiOptions}
                  //   optionLabel="label"
                  //   placeholder="เลือก KPI"
                  //   className="min-w-xs mr-5"
                  //   onChange={(e) => setSelectedKPI(e.value)}
                  //   filter
                  //   filterDelay={400}
                  // />
                )}

                <Dropdown
                  value={selectedMission}
                  onChange={(e) => {
                    setSelectedMission(e.value);
                    setSelectedWork(null);
                    setSelectedOPD(null);
                  }}
                  options={missionList}
                  optionLabel="label"
                  placeholder="เลือก กลุ่มภารกิจ"
                  className="mr-3"
                  filter
                  filterDelay={400}
                />

                <Dropdown
                  value={selectedWork}
                  onChange={(e) => {
                    setSelectedWork(e.value);
                    setSelectedOPD(null);
                  }}
                  options={
                    selectedMission === "all"
                      ? workList
                      : workList.filter(
                          (w) =>
                            w.mission_id === selectedMission ||
                            w.value === "all"
                        )
                  }
                  optionLabel="label"
                  className="mr-3"
                  placeholder="เลือก กลุ่มงาน"
                  filter
                  filterDelay={400}
                />

                <Dropdown
                  value={selectedOPD}
                  onChange={(e) => setSelectedOPD(e.value)}
                  options={
                    selectedWork === "all"
                      ? opdList
                      : opdList.filter(
                          (o) => o.work_id === selectedWork || o.value === "all"
                        )
                  }
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
            <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
              <BarChart data={stackData} type="stack" dataType={selectedType} />
            </div>
          ) : (
            <p>ไม่พบข้อมูล...</p>
          ))}

        {pickerMode === "month" && (
          <div>
            {loading && <p className="text-center">Loading...</p>}
            {currentCharts?.length === 0 && <p>ไม่พบข้อมูล...</p>}
            {!activeParent && currentCharts?.length > 0 && (
              <div className="grid grid-cols-3 gap-5">
                {currentCharts
                  .filter((item) => !isAllZero(item.data))
                  .map((item) => (
                    <KpiChartCard
                      key={item.id}
                      kpiId={item.id}
                      label={item.kpi_name}
                      data={item.data}
                      selectedType={selectedType}
                      hasChildren={item.children?.length > 0}
                      onOpenSub={() => setActiveParent(item.id)}
                    />
                  ))}
              </div>
            )}
            {activeParent && currentCharts?.length > 0 && (
              <div className="grid grid-cols-3 gap-5">
                {currentCharts
                  .filter((sub) => !isAllZero(sub.data))
                  .map((sub) => (
                    <KpiChartCard
                      key={sub.id}
                      kpiId={sub.id}
                      label={sub.kpi_name}
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
