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
// Register necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const KPIBarChart = ({ data }) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen width
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Extract labels (months) and datasets (a_value and b_value)
  const labels = data.map((item) => item.month);

  const chartData = {
    labels,
    datasets: [
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

export default KPIBarChart;
