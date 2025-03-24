import axios from "axios";
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import SideBarMenu from "../components/SideBarMenu";
import Card from "../components/Card";
import DetailCard from "../components/DetailCard";
import OpdBarChart from "../components/OpdBarChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders } from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/logo.png";
//เอาใส่ util ภายหลัง
const formatWaitTime = (minutes) => {
  if (!minutes) return "0 นาที";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hrs > 0 ? `${hrs} ชม. ${mins} นาที` : `${mins} นาที`;
};

function Home() {
  const [visible, setVisible] = useState(false);
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState(null);
  const [allOpdChoices, setAllOpdChoices] = useState([]);
  const [sortField, setSortField] = useState("ALL_USER");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedOpdNames, setSelectedOpdNames] = useState(['Napha Clinic', 'อายุรกรรมชั้น2', 'กุมารเวชกรรมชั้น4', 'โรคทั่วไป', 'ทันตกรรม', 'ตา', 'แม่สอดพัฒน์ ชั้น 6', 'ศัลยกรรมกระดูก', 'หู คอ จมูก', 'อุบัติเหตุและฉุกเฉิน']);

  const sortFieldOptions = [
    { label: "ผู้เข้าใช้บริการ", value: "ALL_USER" },
    { label: "กำลังรอ", value: "PENDING" },
    { label: "เสร็จสิ้น", value: "COMPLETED" },
    { label: "เวลารอตรวจเฉลี่ย", value: "avg_wait_screen" },
    { label: "เวลารอยาเฉลี่ย", value: "avg_wait_drug" },
    { label: "เวลาที่ใช้เฉลี่ย", value: "avg_wait_all" },
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
    <div className="Home-page flex">
      <SideBarMenu
        visible={visible}
        setVisible={setVisible}
        allOpdChoices={allOpdChoices}
        selectedOpdNames={selectedOpdNames}
        handleCheckboxChange={handleCheckboxChange}
        setSelectedOpdNames={setSelectedOpdNames}
      />
      <div className="w-full p-8 pt-5">
        <div className="flex justify-between items-center mb-3">
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
          <div>
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

            

            <Button
              label={<FontAwesomeIcon icon={faSliders} />}
              onClick={() => setVisible(true)}
            />
          </div>
        </div>

        <div className="card-board grid grid-cols-4 gap-8">
          {summary && (
            <>
              <Card count={summary.ALL_USER} keyword="ผู้ใช้บริการทั้งหมด" />
              <Card count={summary.PENDING} keyword="กำลังรอ" />
              <Card count={summary.COMPLETED} keyword="เสร็จสิ้น" />
              <Card count={summary.AVG_WAIT_TIME} keyword="เวลาที่ใช้เฉลี่ย" />
            </>
          )}
        </div>

        <div className="bg-white p-4 my-7 w-full rounded-xl shadow-md h-[500px] border-1 border-gray-200">
          {data?.length > 0 ? (
            <OpdBarChart data={data} />
          ) : (
            <p>Loading chart...</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-7">
          {data?.map((item, index) => (
            <DetailCard
              key={index}
              OPD_name={item.OPD_NAME}
              all_user={item.ALL_USER}
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
