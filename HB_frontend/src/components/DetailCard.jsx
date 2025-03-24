import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faHourglassHalf, faCheck } from "@fortawesome/free-solid-svg-icons";

function DetailCard({ OPD_name, all_user, pending, completed, avg_wait_screen, avg_wait_drug, avg_wait_all }) {

  const [prevData, setPrevData] = useState({ all_user, pending, completed, avg_wait_screen, avg_wait_drug, avg_wait_all  });
  const [updatedFields, setUpdatedFields] = useState({ all_user: false, pending: false, completed: false, avg_wait_screen: false, avg_wait_drug: false, avg_wait_all: false });

  useEffect(() => {
    const changes = {
      all_user: all_user !== prevData.all_user,
      pending: pending !== prevData.pending,
      completed: completed !== prevData.completed,
      avg_wait_screen: avg_wait_screen !== prevData.avg_wait_screen,
      avg_wait_drug: avg_wait_drug !== prevData.avg_wait_drug,
      avg_wait_all: avg_wait_all !== prevData.avg_wait_all,
    };

    setUpdatedFields(changes);

    setTimeout(() => {
      setUpdatedFields({ all_user: false, pending: false, completed: false, avg_wait_screen: false, avg_wait_drug: false, avg_wait_all: false });
    }, 2000); // Reset after 2 seconds

    setPrevData({ all_user, pending, completed, avg_wait_screen, avg_wait_drug, avg_wait_all });
  }, [all_user, pending, completed, avg_wait_screen, avg_wait_drug, avg_wait_all]);

  return (
    <div className="bg-white shadow-md border-1 border-gray-200 h-[350px] p-5 rounded-xl flex flex-col justify-between">
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
          <p className="text-xl">เวลารอตรวจเฉลี่ย</p>
        </div>
        <p className={`text-xl ${updatedFields.avg_wait_screen ? "text-red-500" : "text-orange-500"}`}>
          <span className="text-xl font-bold">{avg_wait_screen}</span>
        </p>
      </div>
      <div className="flex items-center justify-between ">
        <div className="flex items-center">
        <FontAwesomeIcon
            icon={faHourglassHalf}
            className="text-3xl mb-1 text-orange-500 mr-2"
          />
          <p className="text-xl">เวลารอยาเฉลี่ย</p>
        </div>
        <p className={`text-xl ${updatedFields.avg_wait_drug ? "text-red-500" : "text-orange-500"}`}>
          <span className="text-xl font-bold">{avg_wait_drug}</span>
        </p>
      </div>
      <div className="flex items-center justify-between ">
        <div className="flex items-center">
        <FontAwesomeIcon
            icon={faHourglassHalf}
            className="text-3xl mb-1 text-orange-500 mr-2"
          />
          <p className="text-xl">เวลาที่ใช้เฉลี่ย</p>
        </div>
        <p className={`text-xl ${updatedFields.avg_wait_all ? "text-red-500" : "text-orange-500"}`}>
          <span className="text-xl font-bold">{avg_wait_all}</span>
        </p>
      </div>
    </div>
  );
}

export default DetailCard;
