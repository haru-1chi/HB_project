import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
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
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const KPILineChart = ({ data, unitLabel }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 1️⃣ Get unique months for x-axis
  const labels = [...new Set(data.map((item) => item.month))];

  // 2️⃣ Group data by type (or by kpi_name if you have multiple)
  const types = [...new Set(data.map((item) => item.type))];
  // Pick a color for each line
  const colors = [
    "rgba(54, 162, 235, 1)",
    "rgba(255, 206, 86, 1)",
    "rgba(75, 192, 192, 1)",
    "rgba(255, 99, 132, 1)",
  ];

  // 3️⃣ Build datasets dynamically
  const datasets = types.map((type, idx) => {
    const typeData = labels.map((month) => {
      const item = data.find((d) => d.type === type && d.month === month);
      return item ? item.result : 0;
    });

    return {
      label: type,
      data: typeData,
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length],
      fill: false,
      tension: 0.3,
    };
  });

  const maxValues = labels.map((month) => {
    const item = data.find((d) => d.month === month);
    return item ? item.max_value : null;
  });

  const maxDataset = {
    label: "ค่าเป้าหมาย",
    data: maxValues,
    borderColor: "rgba(255, 99, 132, 1)",
    backgroundColor: "rgba(255, 99, 132, 1)",
    borderDash: [5, 5],
    fill: false,
    tension: 0.2,
  };

  const chartData = {
    labels,
    datasets: [...datasets, maxDataset],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw} ${unitLabel}`;
          },
        },
      },
      datalabels: {
        color: "#555555", // text color
        align: "top",
        formatter: (value) => `${value}`, // show value with %
        font: {
          weight: "bold",
        },
      },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: `ผลลัพธ์ (${unitLabel})` } },
      x: { title: { display: true, text: "เดือน" } },
    },
  };

  const chartHeight = isMobile ? labels.length * 60 : 400;

  return (
    <div style={{ height: chartHeight }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default KPILineChart;
