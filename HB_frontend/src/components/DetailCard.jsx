import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faHourglassHalf,
  faCheck,
  faPills,
  faClock,
  faChair,
  faPersonCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
function DetailCard({
  OPD_name,
  pending,
  WAIT_PTS,
  NOSHOW_PTS,
  all_user,
  completed,
  avg_wait_screen,
  avg_wait_drug,
  avg_wait_all,
}) {
  const [prevData, setPrevData] = useState({
    all_user,
    pending,
    NOSHOW_PTS,
    WAIT_PTS,
    completed,
    avg_wait_screen,
    avg_wait_drug,
    avg_wait_all,
  });
  const [updatedFields, setUpdatedFields] = useState({
    all_user: false,
    pending: false,
    WAIT_PTS: false,
    NOSHOW_PTS: false,
    completed: false,
    avg_wait_screen: false,
    avg_wait_drug: false,
    avg_wait_all: false,
  });

  useEffect(() => {
    const changes = {
      all_user: all_user !== prevData.all_user,
      pending: pending !== prevData.pending,
      WAIT_PTS: WAIT_PTS !== prevData.WAIT_PTS,
      NOSHOW_PTS: NOSHOW_PTS !== prevData.NOSHOW_PTS,
      completed: completed !== prevData.completed,
      avg_wait_screen: avg_wait_screen !== prevData.avg_wait_screen,
      avg_wait_drug: avg_wait_drug !== prevData.avg_wait_drug,
      avg_wait_all: avg_wait_all !== prevData.avg_wait_all,
    };

    setUpdatedFields(changes);

    setTimeout(() => {
      setUpdatedFields({
        all_user: false,
        pending: false,
        WAIT_PTS: false,
        NOSHOW_PTS: false,
        completed: false,
        avg_wait_screen: false,
        avg_wait_drug: false,
        avg_wait_all: false,
      });
    }, 2000); // Reset after 2 seconds

    setPrevData({
      all_user,
      pending,
      NOSHOW_PTS,
      WAIT_PTS,
      completed,
      avg_wait_screen,
      avg_wait_drug,
      avg_wait_all,
    });
  }, [
    all_user,
    pending,
    NOSHOW_PTS,
    WAIT_PTS,
    completed,
    avg_wait_screen,
    avg_wait_drug,
    avg_wait_all,
  ]);

  return (
    <div className="bg-white shadow-md border-1 border-gray-200 h-[350px] p-5 rounded-xl flex flex-col justify-between">
      <h1 className="text-3xl font-semibold">{OPD_name}</h1>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faUser}
            className="text-3xl mb-1 text-blue-400 mr-4"
          />
          <p className="text-xl">ผู้ป่วยที่ลงทะเบียน</p>
        </div>
        <p
          className={`text-2xl ${
            updatedFields.all_user ? "text-red-500" : "text-blue-400"
          }`}
        >
          <span className="text-2xl font-bold">{all_user}</span> คน
        </p>
      </div>
      <div className="flex items-center justify-between ">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faHourglassHalf}
            className="text-3xl mb-1 text-orange-400 mr-5"
          />
          <p className="text-xl">ผู้ป่วยรอรับบริการ</p>
        </div>
        <p
          className={`text-2xl ${
            updatedFields.WAIT_PTS ? "text-red-500" : "text-orange-400"
          }`}
        >
          <span className="text-2xl font-bold">{WAIT_PTS}</span> คน
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faCheck}
            className="text-3xl mb-1 text-green-500 mr-4"
          />
          <p className="text-xl">เสร็จสิ้น</p>
        </div>
        <p
          className={`text-2xl ${
            updatedFields.completed ? "text-red-500" : "text-green-500"
          }`}
        >
          <span className="text-2xl font-bold">{completed}</span> คน
        </p>
      </div>
      <div className="flex items-center justify-between ">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faPersonCircleQuestion}
            className="text-3xl mb-1 text-gray-400 mr-5"
          />
          <p className="text-xl">ผู้ป่วยที่ยังไม่มาตามนัด</p>
        </div>
        <p
          className={`text-2xl ${
            updatedFields.NOSHOW_PTS ? "text-red-500" : "text-gray-400"
          }`}
        >
          <span className="text-2xl font-bold">{NOSHOW_PTS}</span> คน
        </p>
      </div>
      <div className="flex items-center justify-between ">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faChair}
            className="text-3xl mb-1 text-cyan-500 mr-4"
          />
          <p className="text-xl">เวลารอตรวจเฉลี่ย</p>
        </div>
        <p
          className={`text-xl ${
            updatedFields.avg_wait_screen ? "text-red-500" : "text-cyan-500"
          }`}
        >
          <span className="text-xl font-bold">{avg_wait_screen}</span>
        </p>
      </div>
      <div className="flex items-center justify-between ">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faPills}
            className="text-3xl mb-1 text-pink-400 mr-2"
          />
          <p className="text-xl">เวลารอยาเฉลี่ย</p>
        </div>
        <p
          className={`text-xl ${
            updatedFields.avg_wait_drug ? "text-red-500" : "text-pink-400"
          }`}
        >
          <span className="text-xl font-bold">{avg_wait_drug}</span>
        </p>
      </div>
      <div className="flex items-center justify-between ">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faClock}
            className="text-3xl mb-1 text-indigo-400 mr-3"
          />
          <p className="text-xl">เวลาที่ใช้เฉลี่ย</p>
        </div>
        <p
          className={`text-xl ${
            updatedFields.avg_wait_all ? "text-red-500" : "text-indigo-400"
          }`}
        >
          <span className="text-xl font-bold">{avg_wait_all}</span>
        </p>
      </div>
    </div>
  );
}

export default DetailCard;
