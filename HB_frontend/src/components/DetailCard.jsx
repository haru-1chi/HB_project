import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faHourglassHalf, faCheck } from "@fortawesome/free-solid-svg-icons";

function DetailCard({ OPD_name, all_user, pending, completed, avg_wait_time }) {

  const [prevData, setPrevData] = useState({ all_user, pending, completed, avg_wait_time  });
  const [updatedFields, setUpdatedFields] = useState({ all_user: false, pending: false, completed: false, avg_wait_time: false });

  useEffect(() => {
    const changes = {
      all_user: all_user !== prevData.all_user,
      pending: pending !== prevData.pending,
      completed: completed !== prevData.completed,
      avg_wait_time: avg_wait_time !== prevData.avg_wait_time,
    };

    setUpdatedFields(changes);

    setTimeout(() => {
      setUpdatedFields({ all_user: false, pending: false, completed: false, avg_wait_time: false });
    }, 2000); // Reset after 2 seconds

    setPrevData({ all_user, pending, completed, avg_wait_time });
  }, [all_user, pending, completed, avg_wait_time]);

  return (
    <div className="bg-white shadow-md border-1 border-gray-200 h-[275px] p-5 rounded-xl flex flex-col justify-between">
      <h1 className="text-3xl font-semibold">{OPD_name}</h1>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faUser}
            className="text-3xl mb-1 text-blue-500 mr-2"
          />
          <p className="text-2xl">ผู้เข้าใช้บริการ</p>
        </div>
        <p className={`text-2xl ${updatedFields.all_user ? "text-red-500" : "text-blue-500"}`}>
          <span className="text-3xl font-bold">{all_user}</span> คน
        </p>
      </div>
      <div className="flex items-center justify-between ">
        <div className="flex items-center">
        <FontAwesomeIcon
            icon={faHourglassHalf}
            className="text-3xl mb-1 text-orange-500 mr-2"
          />
          <p className="text-2xl">กำลังรอรับบริการ</p>
        </div>
        <p className={`text-2xl ${updatedFields.pending ? "text-red-500" : "text-orange-500"}`}>
          <span className="text-3xl font-bold">{pending}</span> คน
        </p>
      </div>
      <div className="flex items-center justify-between ">
        <div className="flex items-center">
        <FontAwesomeIcon
            icon={faCheck}
            className="text-3xl mb-1 text-green-500 mr-2"
          />
          <p className="text-2xl">เสร็จสิ้น</p>
        </div>
        <p className={`text-2xl ${updatedFields.completed ? "text-red-500" : "text-green-500"}`}>
          <span className="text-3xl font-bold">{completed}</span> คน
        </p>
      </div>
      <div className="flex items-center justify-between ">
        <div className="flex items-center">
        <FontAwesomeIcon
            icon={faHourglassHalf}
            className="text-3xl mb-1 text-orange-500 mr-2"
          />
          <p className="text-2xl">เวลารอเฉลี่ย</p>
        </div>
        <p className={`text-2xl ${updatedFields.avg_wait_time ? "text-red-500" : "text-orange-500"}`}>
          <span className="text-2xl font-bold">{avg_wait_time}</span>
        </p>
      </div>
    </div>
  );
}

export default DetailCard;
