import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import Logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    // Basic validation
    if (!username || !password) {
      setError("กรุณากรอก username และ password");
      return;
    }

    try {
      const res = await fetch("http://172.16.190.17:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Save token to localStorage for authentication
      localStorage.setItem("token", data.token);

      // Navigate to /lookup page
      navigate("/kpi");
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="h-dvh bg-linear-65 from-indigo-400 to-cyan-300 flex justify-center items-center">
      {/* from-sky-300 to-teal-300  */}
      <div className="card justify-content-center bg-white p-5 rounded-xl shadow-md">
        <div className="flex items-center pb-3 border-b-1 border-gray-300 ">
          <img className="w-13 mr-3" src={Logo} alt="" />
          <div className="">
            <h1 className="text-2xl font-semibold text-cyan-700">
              ระบบแผนผังตัวชี้วัด
            </h1>
            <p className="font-semibold text-teal-500">โรงพยาบาลแม่สอด</p>
          </div>
        </div>

        <div className="flex flex-col my-3">
          <label htmlFor="username">Username</label>
          <InputText
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ชื่อผู้ใช้"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="password">Password</label>
          <Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            toggleMask
            feedback={false}
            placeholder="รหัสผ่าน"
          />
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <Button
          label="เข้าสู่ระบบ"
          unstyled
          className="w-full p-2 bg-linear-65 from-indigo-400 to-cyan-400 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-md mt-5 cursor-pointer  transition-colors duration-150 ease-in-out"
          onClick={handleLogin}
        />
      </div>
    </div>
  );
}

export default Login;
