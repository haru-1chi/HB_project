export const formatWaitTime = (minutes) => {
  if (!minutes || isNaN(minutes)) return "0 นาที";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hrs > 0 ? `${hrs} ชม. ${mins} นาที` : `${mins} นาที`;
};

export const formatDateForSQL = (date, endOfMonth = false) => {
  if (!date) return null;
  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();

  if (endOfMonth) {
    let lastDay = new Date(year, month + 1, 0);
    return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(lastDay.getDate()).padStart(2, "0")} 23:59:59`;
  }

  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )} 00:00:00`;
};

export const formatMonthYear = (date) => {
  if (!date) return "";
  const monthTH = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const d = new Date(date);
  const month = monthTH[d.getMonth()];
  const year = d.getFullYear().toString().slice(-2); // 2025 → 25
  return `${month} ${year}`;
};