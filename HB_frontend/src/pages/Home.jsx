import axios from "axios";
import React, { useState, useEffect } from "react";

import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import DetailCard from "../components/DetailCard";
import OpdBarChart from "../components/OpdBarChart";

//เอาใส่ util ภายหลัง
const formatWaitTime = (minutes) => {
  if (!minutes) return "0 นาที";

  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hrs > 0 ? `${hrs} ชม. ${mins} นาที` : `${mins} นาที`;
};

function Home() {
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState(null);
  const [sortField, setSortField] = useState("ALL_USER");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchDepartmentState = () => {
    axios
      .get("http://172.16.190.17:3000/api/departments/state")
      .then((response) => setData(response.data))
      .catch((error) =>
        console.error("Error fetching department data:", error)
      );
  };

  // Function to fetch summary data
  const fetchSummary = () => {
    axios
      .get("http://172.16.190.17:3000/api/summary")
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

  useEffect(() => {
    // Initial fetch
    fetchDepartmentState();
    fetchSummary();

    // Set interval to fetch data every 1 minute (60,000ms)
    const interval = setInterval(() => {
      fetchDepartmentState();
      fetchSummary();
    }, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const sortedData = data ? [...data].sort((a, b) => {
    const fieldA = a[sortField];
    const fieldB = b[sortField];

    if (sortOrder === "asc") {
      return fieldA < fieldB ? -1 : 1;
    } else {
      return fieldA > fieldB ? -1 : 1;
    }
  }) : [];

  return (
    <div className="Home-page flex">
      <div className="w-95">
        <Sidebar />
      </div>
      <div className="w-full p-8">
        <div className="card-board flex justify-between">
          {summary && (
            <>
              <Card count={summary.ALL_USER} keyword="ผู้ใช้บริการทั้งหมด" />
              <Card count={summary.PENDING} keyword="กำลังรอ" />
              <Card count={summary.COMPLETED} keyword="เสร็จสิ้น" />
              <Card count={summary.AVG_WAIT_TIME} keyword="เวลารอเฉลี่ย" />
            </>
          )}
        </div>
        <div className="bg-white p-4 my-8 w-full rounded-xl shadow-md h-[500px] border-1 border-gray-200">
          {sortedData?.length > 0 ? (
            <OpdBarChart data={sortedData} />
          ) : (
            <p>Loading chart...</p>
          )}
        </div>

        <div className="my-4">
          <select
            className="border p-2 mr-4"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="ALL_USER">ผู้เข้าใช้บริการ</option>
            <option value="PENDING">กำลังรอ</option>
            <option value="COMPLETED">เสร็จสิ้น</option>
            <option value="AVG_WAIT_TIME">เวลารอเฉลี่ย</option>
          </select>

          <select
            className="border p-2"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="asc">น้อยไปมาก</option>
            <option value="desc">มากไปน้อย</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {sortedData?.map((item, index) => (
            <DetailCard
              key={index}
              OPD_name={item.OPD_NAME}
              all_user={item.ALL_USER}
              pending={item.PENDING}
              completed={item.COMPLETED}
              avg_wait_time={formatWaitTime(parseFloat(item.AVG_WAIT_TIME))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
