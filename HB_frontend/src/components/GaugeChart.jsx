import React from "react";

const GaugeChart = ({ value, target, selectedKPI }) => {
  const { unit_type, target_direction, max_value } = selectedKPI;
  let target_value;

  if (unit_type === "percent") {
    target_value = 100;
  } else {
    target_value = max_value + max_value * 0.5;
  }

  const radius = 30; // smaller radius
  const strokeWidth = 12; // smaller bar
  const center = radius + strokeWidth; // center coordinate
  const circumference = Math.PI * radius; // semicircle length

  // Clamp value 0-100
  const clampedValue = Math.min(Math.max(value, 0), target_value);
  const clampedTarget = Math.min(Math.max(max_value, 0), target_value);

  // Convert value to stroke-dashoffset for semicircle
  const dashOffset =
    circumference - (circumference * clampedValue) / target_value;

  // Needle rotation
  const needleAngle = (clampedValue / target_value) * 180 - 180; // -90 to start from left

  // Target angle
  const targetAngle = (clampedTarget / target_value) * 180 - 180;

  const targetDistance = radius + 10; // same distance as needle value text
  const targetWidth = 8; // width of triangle marker

  // ============================
  // 1️⃣ Determine Good or Bad
  // ============================
  let isGood = false;

  if (target_direction === "less_than") {
    isGood = clampedValue <= clampedTarget;
  } else if (target_direction === "more_than") {
    isGood = clampedValue >= clampedTarget;
  }

  const valueColorClass = isGood ? "fill-green-500" : "fill-red-500";
  const needleColor = isGood ? "#009f27" : "#fb2c36"; // line color
  return (
    <div className="flex flex-col items-center">
      <svg
        width={(radius + strokeWidth) * 2 + 15}
        height={radius + strokeWidth + 20 - 25}
        className="overflow-visible"
      >
        {/* Background semicircle */}
        <path
          d={`
            M ${center - radius}, ${center} 
            A ${radius} ${radius} 0 0 1 ${center + radius} ${center}
          `}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Gradient Bar */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {target_direction === "less_than" ? (
              <>
                <stop offset="0%" stopColor="#00c951" />
                <stop offset="50%" stopColor="#ffba00" />
                <stop offset="100%" stopColor="#fb2c36" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#fb2c36" />
                <stop offset="50%" stopColor="#ffba00" />
                <stop offset="100%" stopColor="#00c951" />
              </>
            )}
          </linearGradient>
        </defs>
        <path
          d={`
            M ${center - radius}, ${center} 
            A ${radius} ${radius} 0 0 1 ${center + radius} ${center}
          `}
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />

        {/* Needle */}
        <line
          x1={center}
          y1={center}
          x2={center + radius * Math.cos((needleAngle * Math.PI) / 180)}
          y2={center + radius * Math.sin((needleAngle * Math.PI) / 180)}
          stroke={needleColor}
          strokeWidth="3"
        />
        {/* Needle value */}
        <text
          x={center + (radius + 35) * Math.cos((needleAngle * Math.PI) / 180)}
          y={center + (radius + 20) * Math.sin((needleAngle * Math.PI) / 180)}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`text-sm font-bold ${valueColorClass}`}
        >
          {clampedValue}%
        </text>

        {/* Target marker */}
        <polygon
          points={`
            ${
              center + targetDistance * Math.cos((targetAngle * Math.PI) / 180)
            },${
            center + targetDistance * Math.sin((targetAngle * Math.PI) / 180)
          }
            ${
              center +
              (targetDistance + targetWidth) *
                Math.cos(((targetAngle - 4) * Math.PI) / 180)
            },${
            center +
            (targetDistance + targetWidth) *
              Math.sin(((targetAngle - 4) * Math.PI) / 180)
          }
            ${
              center +
              (targetDistance + targetWidth) *
                Math.cos(((targetAngle + 4) * Math.PI) / 180)
            },${
            center +
            (targetDistance + targetWidth) *
              Math.sin(((targetAngle + 4) * Math.PI) / 180)
          }
          `}
          fill="#e17100"
        />

        {/* Min & Max labels */}
        <text
          x={center - radius - 10}
          y={center + 10}
          textAnchor="end"
          className="text-sm fill-gray-600"
        >
          0
        </text>
        <text
          x={center + radius + 10}
          y={center + 10}
          textAnchor="ens"
          className="text-sm fill-gray-600"
        >
          {target_value}
        </text>
      </svg>
    </div>
  );
};

export default GaugeChart;
