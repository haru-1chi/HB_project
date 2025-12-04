import React from "react";
import { Button } from "primereact/button";
import PieChart from "./PieChart";

export default function KpiChartCard({
  kpiId,
  label,
  data,
  selectedType,
  hasChildren = false,
  onOpenSub,
}) {
  return (
    <div
      key={kpiId}
      className="bg-white p-4 w-full rounded-xl shadow-md border border-gray-200"
    >
      <p className="text-center font-semibold text-xl mb-3">{label}</p>

      <PieChart data={data} type={selectedType} />

      {hasChildren && (
        <div className="flex justify-center mt-5">
          <Button
            label="ดูตามหัวข้อย่อย"
            onClick={() => onOpenSub(kpiId, label)}
            className="w-fit"
          />
        </div>
      )}
    </div>
  );
}
