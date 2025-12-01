import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { ToggleButton } from "primereact/togglebutton";
import { ScrollTop } from "primereact/scrolltop";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserLock,
  faSliders,
  faArrowUpWideShort,
  faArrowDownWideShort,
} from "@fortawesome/free-solid-svg-icons";
import SideBarFilter from "../components/SideBarFilter";
import Card from "../components/Card";
import DetailCard from "../components/DetailCard";
import BarChart from "../components/BarChart";
import Footer from "../components/Footer";
import Logo from "../assets/logo.png";
import { formatWaitTime } from "../utils/dateTime";

function Home() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";
  const { user } = useAuth();
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState(null);
  const [allOpdChoices, setAllOpdChoices] = useState([]);
  const [sortField, setSortField] = useState("ALL_USER");
  const [sortOrder, setSortOrder] = useState("desc");
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

  const sortFieldOptions = useMemo(
    () => [
      { label: "ผู้ป่วยลงทะเบียน", value: "ALL_USER" },
      { label: "ผู้ป่วยรอรับบริการ", value: "WAIT_PTS" },
      { label: "ตรวจเสร็จ", value: "COMPLETED" },
      { label: "ผู้ป่วยผิดนัด", value: "NOSHOW_PTS" },
      { label: "เวลารอตรวจเฉลี่ย", value: "avg_wait_screen" },
      { label: "เวลารอยาเฉลี่ย", value: "avg_wait_drug" },
      { label: "เวลารวมเฉลี่ย", value: "avg_wait_all" },
    ],
    []
  );

  const sortOrderOptions = useMemo(
    () => [
      { label: "น้อยไปมาก", value: "asc" },
      { label: "มากไปน้อย", value: "desc" },
    ],
    []
  );

  // Function to fetch summary data
  const fetchSummary = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        opdNames: selectedOpdNames.join(","),
      });
      const { data: res } = await axios.get(
        `${API_BASE}/summary?${queryParams}`
      );
      if (res.length) {
        setSummary({
          ...res[0],
          AVG_WAIT_TIME: formatWaitTime(res[0].AVG_WAIT_TIME),
        });
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, [API_BASE, selectedOpdNames]);

  const fetchAllOpdChoices = useCallback(async () => {
    try {
      const { data: res } = await axios.get(`${API_BASE}/departments/state`);
      setAllOpdChoices(res.map((item) => item.OPD_NAME));
    } catch (error) {
      console.error("Error fetching OPD names:", error);
    }
  }, [API_BASE]);

  const fetchDepartmentState = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        sortField,
        sortOrder,
        opdNames: selectedOpdNames.join(","),
      });
      const { data: res } = await axios.get(
        `${API_BASE}/departments/state?${queryParams}`
      );
      setData(res);
    } catch (error) {
      console.error("Error fetching department data:", error);
    }
  }, [API_BASE, sortField, sortOrder, selectedOpdNames]);

  useEffect(() => {
    fetchAllOpdChoices();
    fetchDepartmentState();
    fetchSummary();

    const interval = setInterval(() => {
      fetchDepartmentState();
      fetchSummary();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchDepartmentState, fetchSummary, fetchAllOpdChoices]);

  const handleCheckboxChange = useCallback((opdName) => {
    setSelectedOpdNames((prev) =>
      prev.includes(opdName)
        ? prev.filter((name) => name !== opdName)
        : [...prev, opdName]
    );
  }, []);

  return (
    <div className="Home-page overflow-hidden min-h-dvh flex flex-col justify-between">
      <ScrollTop />
      <SideBarFilter
        visible={visible}
        setVisible={setVisible}
        allOpdChoices={allOpdChoices}
        selectedOpdNames={selectedOpdNames}
        handleCheckboxChange={handleCheckboxChange}
        setSelectedOpdNames={setSelectedOpdNames}
      />
      <div
        className={`flex-1 transition-all duration-300 p-8 overflow-auto ${
          !user ? "pt-2" : ""
        }`}
      >
        {!user && (
          <div className="flex justify-end">
            <Button
              icon={<FontAwesomeIcon icon={faUserLock} />}
              label=" เข้าสู่ระบบ"
              unstyled
              className="text-sm p-1 px-2 bg-linear-65 from-indigo-400 to-cyan-400 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-md cursor-pointer  transition-colors duration-150 ease-in-out"
              onClick={() => navigate("/login")}
            />
          </div>
        )}

        <div className="sm lg:flex justify-between items-center mb-4">
          <div className="flex items-center">
            <img className="w-17" src={Logo} alt="" />
            <div className="ml-2">
              <h5 className="text-2xl font-semibold text-[#5bc1ac]">
                MaeSot Hospital
              </h5>
              <p className="font-semibold text-[#5a6f80]">
                แผนผังแสดงข้อมูลผู้ใช้บริการโรงพยาบาลแม่สอด
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="hidden sm:block">
              <Dropdown
                value={sortOrder}
                onChange={(e) => setSortOrder(e.value)}
                options={sortOrderOptions}
                optionLabel="label"
                placeholder="เลือกเรียงลำดับ"
                checkmark={true}
                highlightOnSelect={false}
                className="mr-5"
              />
            </div>
            <Dropdown
              value={sortField}
              onChange={(e) => setSortField(e.value)}
              options={sortFieldOptions}
              optionLabel="label"
              placeholder="เลือกประเภทการจัดเรียง"
              checkmark={true}
              highlightOnSelect={false}
              className="mr-5"
            />
            <div className="block sm:hidden">
              <ToggleButton
                checked={sortOrder === "asc"}
                onChange={(e) => setSortOrder(e.value ? "asc" : "desc")}
                onLabel=""
                offLabel=""
                onIcon={<FontAwesomeIcon icon={faArrowUpWideShort} />}
                offIcon={<FontAwesomeIcon icon={faArrowDownWideShort} />}
                className="mr-5"
              />
            </div>
            <Button
              label={<FontAwesomeIcon icon={faSliders} />}
              onClick={() => setVisible(true)}
            />
          </div>
        </div>

        {summary && (
          <>
            <div className="card-board grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-8">
              <Card count={summary.ALL_USER} keyword="ผู้ป่วยลงทะเบียน" />
              <Card count={summary.WAIT_PTS} keyword="ผู้ป่วยรอรับบริการ" />
              <Card count={summary.COMPLETED} keyword="ตรวจเสร็จ" />
              <Card count={summary.NOSHOW_PTS} keyword="ผู้ป่วยผิดนัด" />

              <Card count={summary.AVG_WAIT_TIME} keyword="เวลารวมเฉลี่ย" />
            </div>
          </>
        )}

        <div className="bg-grey-900 p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
          {data?.length > 0 ? (
            <BarChart data={data} type="opd" />
          ) : (
            <p>ไม่พบข้อมูล...</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data?.map((item, index) => (
            <DetailCard
              key={index}
              OPD_name={item.OPD_NAME}
              all_user={item.ALL_USER}
              NOSHOW_PTS={item.NOSHOW_PTS}
              WAIT_PTS={item.WAIT_PTS}
              pending={item.PENDING}
              completed={item.COMPLETED}
              avg_wait_screen={formatWaitTime(parseFloat(item.AVG_WAIT_SCREEN))}
              avg_wait_drug={formatWaitTime(parseFloat(item.AVG_WAIT_DRUG))}
              avg_wait_all={formatWaitTime(parseFloat(item.AVG_WAIT_ALL))}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
