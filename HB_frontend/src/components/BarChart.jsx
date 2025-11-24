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

const BarChart = ({ data, type, unitLabel, dataType }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  let labels = [];
  let datasets = [];

  const colorsDetail = [
    "#00B8D4",
    "#00BFA5",
    "#00C853",
    "#64DD17",
    "#AEEA00",
    "#ffba00",
    "#ff8904",
    "#ff6540",
    "#ff6467",
  ];

  const colorsGroup = ["#00B8D4", "#64DD17", "#ffba00", "#ff6467"];

  if (type === "kpi") {
    labels = data.map((item) => item.month);
    datasets = [
      {
        label: "ไทย",
        data: data.map((item) => item.percent_th),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        yAxisID: "y",
        type: "bar",
      },
      {
        label: "ต่างชาติ",
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
  } else if (type === "stack") {
    if (dataType === "detail") {
      const fields = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
      datasets = fields.map((f, idx) => ({
        label: f,
        data: data.map((item) => item[f]),
        backgroundColor: colorsDetail[idx],
        borderColor: "#fff",
        borderWidth: 1,
      }));
    } else {
      const fields = ["AB", "CD", "EF", "GHI"];
      datasets = fields.map((f, idx) => ({
        label: f,
        data: data.map((item) => item[f]),
        backgroundColor: colorsGroup[idx],
        borderColor: "#fff",
        borderWidth: 1,
      }));
    }
  }
  let chartData;

  if (type === "stack") {
    chartData = {
      labels: data.map((d) => d.month),
      datasets,
    };
  } else {
    chartData = { labels, datasets };
  }

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
            return type === "kpi" ? `${label} ${unitLabel}` : `${label}`;
          },
        },
      },
      datalabels: {
        color: "#555555",
        anchor: "end",
        align: "end",
        formatter: (value) => `${value}`,
        font: { weight: "bold" },
      },
    },
    scales:
      type === "stack"
        ? {
            y: {
              stacked: true,
              beginAtZero: true,
            },
            x: {
              stacked: true,
            },
          }
        : {
            y: {
              beginAtZero: true,
              title: {
                display: type === "kpi",
                text: `ผลลัพธ์ (${unitLabel})`,
              },
            },
            x: {
              title: { display: type === "kpi", text: "เดือน" },
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
