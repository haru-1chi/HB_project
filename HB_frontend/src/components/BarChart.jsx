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
import ChartDataLabels from "chartjs-plugin-datalabels";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ChartDataLabels);

const BarChart = ({ data, type }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  let labels = [];
  let datasets = [];

  if (type === "kpi") {
    labels = data.map((item) => item.month);
    datasets = [
      {
        label: data[0]?.a_name || "A Value",
        data: data.map((item) => item.a_value),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: data[0]?.b_name || "B Value",
        data: data.map((item) => item.b_value),
        backgroundColor: "rgba(255, 206, 86, 0.6)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
    ];
  } else if (type === "opd") {
    labels = data.map((item) => item.OPD_NAME);
    datasets = [
      {
        label: "ผู้ป่วยลงทะเบียน",
        data: data.map((item) => item.ALL_USER),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "ผู้ป่วยรอรับบริการ",
        data: data.map((item) => item.WAIT_PTS),
        backgroundColor: "rgba(255, 206, 86, 0.6)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
      {
        label: "ตรวจเสร็จ",
        data: data.map((item) => item.COMPLETED),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "ผู้ป่วยผิดนัด",
        data: data.map((item) => item.NOSHOW_PTS),
        backgroundColor: "rgba(128, 128, 128, 0.6)",
        borderColor: "rgba(128, 128, 128, 1)",
        borderWidth: 1,
      },
    ];
  }

  const chartData = { labels, datasets };

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
            if (label) label += ": ";
            label += tooltipItem.raw;
            return label;
          },
        },
      },
       datalabels: {
        color: "#555555",
        anchor: "end",
        align: "end",
        formatter: (value) => value,
        font: { weight: "bold" },
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

export default BarChart;
