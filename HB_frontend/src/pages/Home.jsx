import axios from "axios";
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import SideBarFilter from "../components/SideBarFilter";
import Card from "../components/Card";
import { ToggleButton } from "primereact/togglebutton";
import DetailCard from "../components/DetailCard";
import BarChart from "../components/BarChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SideBarMenu from "../components/SideBarMenu";
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
import { useOutletContext } from "react-router-dom";
function Home() {
  const { collapsed } = useOutletContext();
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

  // Function to fetch summary data
  const fetchSummary = () => {
    const queryParams = new URLSearchParams({
      opdNames: selectedOpdNames.join(","),
    }).toString();

    axios
      .get(`http://172.16.190.17:3000/api/summary?${queryParams}`)
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

  const fetchAllOpdChoices = () => {
    axios
      .get(`http://172.16.190.17:3000/api/departments/state`)
      .then((response) => {
        // Extract unique OPD_NAME values from the response
        const opdNames = response.data.map((item) => item.OPD_NAME);
        setAllOpdChoices(opdNames);
      })
      .catch((error) => console.error("Error fetching OPD names:", error));
  };

  const fetchDepartmentState = () => {
    const queryParams = new URLSearchParams({
      sortField,
      sortOrder,
      opdNames: selectedOpdNames.join(","),
    }).toString();

    axios
      .get(`http://172.16.190.17:3000/api/departments/state?${queryParams}`)
      .then((response) => setData(response.data))
      .catch((error) =>
        console.error("Error fetching department data:", error)
      );
  };

  useEffect(() => {
    // Initial fetch
    fetchDepartmentState();
    fetchSummary();
    fetchAllOpdChoices();

    // Set interval to fetch data every 1 minute (60,000ms)
    const interval = setInterval(() => {
      fetchDepartmentState();
      fetchSummary();
    }, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [sortField, sortOrder, selectedOpdNames]);

  const handleCheckboxChange = (opdName) => {
    setSelectedOpdNames((prevSelected) =>
      prevSelected.includes(opdName)
        ? prevSelected.filter((name) => name !== opdName)
        : [...prevSelected, opdName]
    );
  };

  return (
    <div className="Home-page flex h-screen overflow-hidden">
      <SideBarFilter
        visible={visible}
        setVisible={setVisible}
        allOpdChoices={allOpdChoices}
        selectedOpdNames={selectedOpdNames}
        handleCheckboxChange={handleCheckboxChange}
        setSelectedOpdNames={setSelectedOpdNames}
      />
      <div
        //  className="w-full ml-75 p-4 sm:p-8 pt-5"
        className={`flex-1 transition-all duration-300 p-4 sm:p-8 pt-5 overflow-auto`}
        style={{ marginLeft: collapsed ? "4rem" : "18.75rem" }} // 75px vs 300px example
      >
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

        <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-auto border-1 border-gray-200">
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
    </div>
  );
}

export default Home;
