import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OpdBarChart = ({ data }) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen width
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768); // Tailwind md breakpoint

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Extract labels and values from the data
  const labels = data.map((item) => item.OPD_NAME);
  const allUsers = data.map((item) => item.ALL_USER);
  const pendingUsers = data.map((item) => item.WAIT_PTS);
  const completedUsers = data.map((item) => item.COMPLETED);
  const noShow = data.map((item) => item.NOSHOW_PTS);
  const chartData = {
    labels,
    datasets: [
      {
        label: "ผู้ป่วยลงทะเบียน",
        data: allUsers,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "ผู้ป่วยรอรับบริการ",
        data: pendingUsers,
        backgroundColor: "rgba(255, 206, 86, 0.6)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
      {
        label: "ตรวจเสร็จ",
        data: completedUsers,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "ผู้ป่วยผิดนัด",
        data: noShow,
        backgroundColor: "rgba(128, 128, 128, 0.6)", // light gray with transparency
        borderColor: "rgba(128, 128, 128, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: isMobile ? "y" : "x",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            let label = tooltipItem.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += tooltipItem.raw + " คน";
            return label;
          },
          title: function (tooltipItems) {
            return tooltipItems[0].label;
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const chartHeight = isMobile ? data.length * 60 : 400;

   return (
    <div style={{ height: chartHeight }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default OpdBarChart;
