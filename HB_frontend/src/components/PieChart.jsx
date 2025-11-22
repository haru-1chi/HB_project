import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const PieChart = ({ data, type }) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Convert object into arrays
  const labels = Object.keys(data);
  const values = Object.values(data);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        // backgroundColor: [
        //   "oklch(71.5% 0.143 215.221)",
        //   "oklch(70.4% 0.14 182.503)",
        //   "oklch(69.6% 0.17 162.48)",
        //   "oklch(72.3% 0.219 149.579)",
        //   "oklch(76.8% 0.233 130.85)",
        //   "#efb100",
        //   "#fd9a00",
        //   "#ff6900",
        //   "#fb2c36",
        // ],
        backgroundColor:
          type === "detail"
            ? [
                "#00B8D4",
                "#00BFA5",
                "#00C853",
                "#64DD17",
                "#AEEA00",
                "#FFAB00",
                "#ff6900",
                "#ff4514",
                "#fb2c36",
              ]
            : ["#00B8D4", "#64DD17", "#FFAB00", "#fb2c36"],

        borderColor: "#fff",
        borderWidth: 1,
        cutout: "50%",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: isMobile ? "bottom" : "right" },
      datalabels: {
        color: "#ffffff",
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce(
            (a, b) => a + b,
            0
          );
          const percent = ((value / total) * 100).toFixed(1);
          const label = ctx.chart.data.labels[ctx.dataIndex];
          return [`${label}`, `${percent}%`]; // <-- returns 2 lines
        },
        anchor: "center",
        align: "center",
        textAlign: "center",
        font: { weight: "bold", size: isMobile ? 12 : 16 },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            let label = tooltipItem.label || "";
            return `${label}: ${tooltipItem.raw}`;
          },
        },
      },
    },
  };

  const chartHeight = isMobile ? 300 : 350;

  return (
    <div style={{ height: chartHeight }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default PieChart;
