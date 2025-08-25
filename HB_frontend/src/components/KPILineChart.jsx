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

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const KPILineChart = ({ data }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 1️⃣ Get unique months for x-axis
  const labels = [...new Set(data.map(item => item.month))];

  // 2️⃣ Group data by type (or by kpi_name if you have multiple)
  const types = [...new Set(data.map(item => item.type))];

  // 3️⃣ Build datasets dynamically
  const datasets = types.map((type, idx) => {
    const typeData = labels.map(month => {
      const item = data.find(d => d.type === type && d.month === month);
      return item ? item.result : 0;
    });

    // Pick a color for each line
    const colors = [
      "rgba(54, 162, 235, 1)",
      "rgba(255, 206, 86, 1)",
      "rgba(75, 192, 192, 1)",
      "rgba(255, 99, 132, 1)"
    ];

    return {
      label: type,
      data: typeData,
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length] + "55",
      fill: false,
      tension: 0.3,
    };
  });

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}%`;
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Result (%)" } },
      x: { title: { display: true, text: "Month" } },
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
