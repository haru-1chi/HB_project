import React, { useState } from "react";
import { Message } from "primereact/message";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import Logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Basic validation
    if (!username || !password) {
      setError("กรุณากรอก username และ password");
      return;
    }

    setLoading(true); // ⏳ start loading
    setError("");

    try {
      await login(username, password);
    } catch (err) {
      if (err.message.includes("ไม่พบผู้ใช้งาน")) {
        setError("ไม่พบผู้ใช้งานนี้ในระบบ");
      } else if (err.message.includes("รหัสผ่านไม่ถูกต้อง")) {
        setError("รหัสผ่านไม่ถูกต้อง");
      } else {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh bg-linear-65 from-indigo-400 to-cyan-300 flex justify-center items-center">
      {/* from-sky-300 to-teal-300  */}
      <div className="w-88 card justify-content-center bg-white p-5 rounded-xl shadow-md">
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

        {error && (
          <div className="flex justify-center mt-3">
            <Message severity="error" text={error} className="w-full" />
          </div>
        )}

        <div>
          <Button
            unstyled
            className="w-full p-2 bg-linear-65 from-indigo-400 to-cyan-400 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-md mt-5 cursor-pointer  transition-colors duration-150 ease-in-out"
            onClick={handleLogin}
            loading={loading}
          >
            <span className={`${loading ? "ml-2" : ""}`}>เข้าสู่ระบบ</span>
          </Button>
        </div>

        <div className="flex items-center my-1">
          <hr className="flex-grow border-t border-gray-300" />
          <span className="px-3 text-gray-500">or</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>

        <div
          className="w-full font-bold rounded-md cursor-pointer 
             transition-colors duration-150 ease-in-out 
             bg-gradient-to-r from-indigo-400 to-cyan-400 
             hover:from-indigo-500 hover:to-cyan-500
             bg-clip-text text-transparent 
             text-center mt-2"
        >
          <Link
            to="/"
            className="
             "
          >
            กลับไปหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
