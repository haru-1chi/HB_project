import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

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
        label: "อัตราการเสียชีวิตชาวไทย",
        data: data.map((item) => item.percent_th),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        yAxisID: "y",
        type: "bar",
      },
      {
        label: "อัตราการเสียชีวิตชาวต่างชาติ",
        data: data.map((item) => item.percent_en),
        backgroundColor: "rgba(255, 206, 86, 0.6)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
        yAxisID: "y",
        type: "bar",
      },
      {
        label: "ค่าเป้าหมาย",
        data: data.map((item) => item.max_value),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 1)",
        borderDash: [5, 5],
        pointStyle: "circle",
        pointRadius: 3,
        pointBackgroundColor: "rgba(255, 99, 132, 1)",
        tension: 0.3,
        yAxisID: "y",
        type: "line",
        fill: false,
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
        formatter: (value) => type === "kpi" ? `${value}%` : value,
        font: { weight: "bold" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: type === "kpi", text: "Result / Max Value" },
      },
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
