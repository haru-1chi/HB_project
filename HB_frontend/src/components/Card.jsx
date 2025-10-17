import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faHourglassHalf,
  faCheck,
  faClock,
  faPersonCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";

function Card({ count, keyword }) {
  const [prevCount, setPrevCount] = useState(count);
  const [isUpdated, setIsUpdated] = useState(false);

  useEffect(() => {
    if (count !== prevCount) {
      setIsUpdated(true);
      setTimeout(() => setIsUpdated(false), 2000);
      setPrevCount(count);
    }
  }, [count, prevCount]);

  const iconMap = {
    ผู้ป่วยลงทะเบียน: { icon: faUser, bgColor: "bg-blue-500" },
    ผู้ป่วยรอรับบริการ: { icon: faHourglassHalf, bgColor: "bg-orange-500" },
    ผู้ป่วยผิดนัด: { icon: faPersonCircleQuestion, bgColor: "bg-gray-400" },
    ตรวจเสร็จ: { icon: faCheck, bgColor: "bg-green-500" },
    เวลารวมเฉลี่ย: { icon: faClock, bgColor: "bg-indigo-400" },
  };

  return (
    <div className="bg-white shadow-md border-1 border-gray-200 h-[100px] md:h-[136px] p-3 md:p-5 rounded-xl flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <div
          className={`${iconMap[keyword]?.bgColor} px-2 md:px-5 py-1 md:py-4 rounded-full text-md md:text-3xl text-white mr-2`}
        >
          <FontAwesomeIcon icon={iconMap[keyword]?.icon} />
        </div>
        <h1
          className={`${
            keyword == "เวลารวมเฉลี่ย" ? "text-xl md:text-4xl" : "text-4xl md:text-6xl"
          }  font-medium text-right ${isUpdated ? "text-red-500" : ""}`}
        >
          {count}
        </h1>
      </div>
      <p className="text-right text-xl">{keyword}</p>
    </div>
  );
}

export default Card;
