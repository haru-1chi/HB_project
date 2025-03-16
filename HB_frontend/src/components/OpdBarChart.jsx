import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

// Register necessary components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const OpdBarChart = ({ data }) => {
  // Extract labels and values from the data
  const labels = data.map((item) => item.OPD_NAME);
  const allUsers = data.map((item) => item.ALL_USER);
  const pendingUsers = data.map((item) => item.PENDING);
  const completedUsers = data.map((item) => item.COMPLETED);

  const chartData = {
    labels,
    datasets: [
      {
        label: "All Users",
        data: allUsers,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Pending",
        data: pendingUsers,
        backgroundColor: "rgba(255, 206, 86, 0.6)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
      {
        label: "Completed",
        data: completedUsers,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "OPD Users Summary" },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default OpdBarChart;
