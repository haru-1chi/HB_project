import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { FloatLabel } from "primereact/floatlabel";
import { Dialog } from "primereact/dialog";
import { Password } from "primereact/password";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputNumber } from "primereact/inputnumber";
import { Message } from "primereact/message";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEdit,
  faPlus,
  faCheck,
  faXmark,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";

function Profile() {
  const API_BASE =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";
  const { user, setUser, token, setToken } = useAuth();

  const [visible, setVisible] = useState(false);
  const [formValues, setFormValues] = useState({
    firstname: "",
    lastname: "",
    username: "",
  });

  const [formCreateAccount, setFormCreateAccount] = useState({
    firstname: "",
    lastname: "",
    username: "",
    password: "",
    confirm_password: "",
  });

  const [formPasswordValues, setFormPasswordValues] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const toast = useRef(null);

  const showToast = (severity, summary, detail) => {
    toast.current?.show({
      severity,
      summary,
      detail,
      life: 3000,
    });
  };

  useEffect(() => {
    if (user) {
      const [firstname, lastname = ""] = user.name?.split(" ") || ["", ""];
      setFormValues({
        firstname,
        lastname,
        username: user.username,
      });
    }
    console.log(user);
  }, [user]);

  const handleSave = async () => {
    const fullName =
      `${formValues.firstname.trim()} ${formValues.lastname.trim()}`.trim();

    try {
      const res = await axios.put(
        `${API_BASE}/user/update`,
        {
          username: user.username,
          newUsername: formValues.username,
          name: fullName,
        },
        {
          headers: { token },
        }
      );

      showToast("success", "สำเร็จ", res.data.message);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token); // update AuthContext token
      }

      // Update user info in AuthContext
      setUser((prev) => ({
        ...prev,
        username: res.data.data.username,
        name: res.data.data.name,
      }));

      setIsEditMode(false);
    } catch (error) {
      console.log(error);
      const msg =
        error.response?.data?.message || "เกิดข้อผิดพลาดระหว่างอัปเดตข้อมูล";
      showToast("error", "ไม่สำเร็จ", msg);
    }
  };

  const handleCreateAccout = async () => {
    const fullName =
      `${formValues.firstname.trim()} ${formValues.lastname.trim()}`.trim();

    try {
      const res = await axios.post(
        `${API_BASE}/user/create`,
        {
          username: user.username,
          newUsername: formValues.username,
          name: fullName,
        },
        {
          headers: { token },
        }
      );

      showToast("success", "สำเร็จ", res.data.message);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token); // update AuthContext token
      }

      // Update user info in AuthContext
      setUser((prev) => ({
        ...prev,
        username: res.data.data.username,
        name: res.data.data.name,
      }));

      setIsEditMode(false);
    } catch (error) {
      console.log(error);
      const msg =
        error.response?.data?.message || "เกิดข้อผิดพลาดระหว่างอัปเดตข้อมูล";
      showToast("error", "ไม่สำเร็จ", msg);
    }
  };

  const handleChangePassword = async () => {
    // Basic validation
    if (
      !formPasswordValues.current_password ||
      !formPasswordValues.new_password ||
      !formPasswordValues.confirm_password
    ) {
      showToast("warn", "ข้อมูลไม่ครบ", "กรุณากรอกทุกช่องให้ครบ");
      return;
    }

    try {
      const res = await axios.put(
        `${API_BASE}/user/password`,
        {
          username: user.username,
          current_password: formPasswordValues.current_password,
          new_password: formPasswordValues.new_password,
          confirm_password: formPasswordValues.confirm_password,
        },
        {
          headers: { token },
        }
      );

      const data = res.data;
      showToast("success", "สำเร็จ", data.message);

      // Clear password fields
      setFormPasswordValues((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: "",
      }));
      setVisible(false); // close dialog if using modal
    } catch (err) {
      console.log(err);
      showToast("error", "ไม่สำเร็จ", err.response.data.message);
    }
  };

  const handleToggleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  const handleCancel = () => {
    if (user) {
      const [firstname, lastname = ""] = user.name?.split(" ") || ["", ""];
      setFormValues({
        firstname,
        lastname,
        username: user.username,
      });
    }
    setIsEditMode(false);
  };

  return (
    <div className="Home-page overflow-hidden h-dvh flex flex-col justify-between">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div
        className={`flex-1  transition-all duration-300 p-4 sm:p-8 pt-5 overflow-auto`}
      >
        <div className="flex items-center mb-5">
          <h5 className="text-2xl font-semibold">บัญชีของฉัน</h5>
        </div>
        <div className="card w-125 bg-white p-5 rounded-xl shadow-md">
          {user.verify === 0 && (
            <div className="mb-4">
              <Message
                severity="warn"
                text="กรุณากรอกข้อมูลเพื่อยืนยันบัญชี"
                className="w-full"
              />
            </div>
          )}
          <div className="flex justify-between items-center">
            <p className="text-xl font-semibold">ข้อมูลส่วนตัว</p>
            {user.verify === 0 ? (
              <div>
                <Button
                  onClick={handleCreateAccout}
                  label="บันทึก"
                  severity="success"
                  style={{ padding: "5px 10px" }}
                />
              </div>
            ) : !isEditMode ? (
              <Button
                onClick={handleToggleEdit}
                label={
                  <>
                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                    แก้ไข
                  </>
                }
                severity="warning"
                style={{ padding: "5px 10px" }}
              />
            ) : (
              <div className="flex">
                <div className="mr-3">
                  <Button
                    onClick={handleCancel}
                    label="ยกเลิก"
                    severity="secondary"
                    style={{ padding: "5px 10px" }}
                  />
                </div>
                <div>
                  <Button
                    onClick={handleSave}
                    label="บันทึก"
                    severity="success"
                    style={{ padding: "5px 10px" }}
                  />
                </div>
              </div>
            )}
          </div>

          {user.verify === 0 ? (
            <>
              <div className="mt-4 grid grid-cols-4 items-center">
                <p>ชื่อ - สกุล</p>
                <div className="col-span-3">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="w-full">
                      <InputText
                        value={formCreateAccount.firstname}
                        className="w-full"
                        placeholder="ชื่อ"
                        onChange={(e) =>
                          setFormCreateAccount({
                            ...formCreateAccount,
                            firstname: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="w-full">
                      <InputText
                        value={formCreateAccount.lastname}
                        className="w-full"
                        placeholder="นามสกุล"
                        onChange={(e) =>
                          setFormCreateAccount({
                            ...formCreateAccount,
                            lastname: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 mt-8 items-center">
                <p>สิทธิ์การใช้งาน</p>
                <div className="col-span-3">
                  <InputText
                    value=""
                    className="w-full"
                    placeholder="ผู้ใช้ทั่วไป"
                    variant="filled"
                    disabled
                  />
                </div>
              </div>
              <p className="text-xl font-semi mt-8">ข้อมูลบัญชี</p>
              <div className="grid grid-cols-4 mt-8 items-center">
                <p>username</p>
                <div className="col-span-3">
                  <InputText
                    value={formCreateAccount.username}
                    className="w-full"
                    onChange={(e) =>
                      setFormCreateAccount({ ...formCreateAccount, username: e.target.value })
                    }
                  />
                </div>
              </div>
            </>
          ) : !isEditMode ? (
            // ------------------ VIEW MODE ------------------
            <>
              <div className="mt-8 grid grid-cols-4">
                <p>ชื่อ - สกุล</p>
                <p className="col-span-3">
                  {formValues.firstname} {formValues.lastname}
                </p>
              </div>
              <div className="grid grid-cols-4 mt-8">
                <p>สิทธิ์การใช้งาน</p>
                <p className="col-span-3">ผู้ใช้ทั่วไป</p>
              </div>
              <p className="text-xl font-semibold mt-8">ข้อมูลบัญชี</p>
              <div className="mt-8 grid grid-cols-4">
                <p>username</p>
                <p className="col-span-3">{formValues.username}</p>
              </div>
            </>
          ) : (
            // ------------------ EDIT MODE ------------------ login first time
            <>
              {/* real edit mode */}
              <div className="mt-8 grid grid-cols-4 items-center">
                <p>ชื่อ - สกุล</p>
                <div className="col-span-3">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="w-full">
                      <InputText
                        value={formValues.firstname}
                        className="w-full"
                        placeholder="ชื่อ"
                        onChange={(e) =>
                          setFormValues({
                            ...formValues,
                            firstname: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="w-full">
                      <InputText
                        value={formValues.lastname}
                        className="w-full"
                        placeholder="นามสกุล"
                        onChange={(e) =>
                          setFormValues({
                            ...formValues,
                            lastname: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 mt-8 items-center">
                <p>สิทธิ์การใช้งาน</p>
                <div className="col-span-3">
                  <InputText
                    value=""
                    className="w-full"
                    placeholder="ผู้ใช้ทั่วไป"
                    variant="filled"
                    disabled
                  />
                </div>
              </div>
              <p className="text-xl font-semi mt-8">ข้อมูลบัญชี</p>
              <div className="grid grid-cols-4 mt-8 items-center">
                <p>username</p>
                <div className="col-span-3">
                  <InputText
                    value={formValues.username}
                    className="w-full"
                    onChange={(e) =>
                      setFormValues({ ...formValues, username: e.target.value })
                    }
                  />
                </div>
              </div>
            </>
          )}
          {user.verify === 0 ? (
            <>
              <div className="grid grid-cols-4 mt-8 items-center">
                <p>รหัสผ่าน</p>
                <div className="col-span-3">
                  <Password
                    value={formCreateAccount.password}
                    toggleMask
                    feedback={false}
                    className="w-full"
                    onChange={(e) =>
                      setFormCreateAccount({ ...formCreateAccount, password: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 mt-8 items-center">
                <p>ยืนยันรหัสผ่าน</p>
                <div className="col-span-3">
                  <Password
                    value={formCreateAccount.confirm_password}
                    toggleMask
                    feedback={false}
                    className="w-full"
                    onChange={(e) =>
                      setFormCreateAccount({
                        ...formCreateAccount,
                        confirm_password: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="mt-8 grid grid-cols-4">
              <p>รหัสผ่าน</p>
              <div className="col-span-3 flex justify-between">
                <p>ไม่แสดง</p>
                <Button
                  onClick={() => setVisible(true)}
                  text
                  label="เปลี่ยนรหัสผ่าน"
                  style={{ padding: "0" }}
                />
              </div>
            </div>
          )}
          <Dialog
            header="เปลี่ยนรหัสผ่าน"
            visible={visible}
            style={{ width: "350px" }}
            onHide={() => {
              if (!visible) return;
              setVisible(false);
            }}
            footer={
              <div className="flex justify-end">
                <Button
                  label="ยกเลิก"
                  severity="secondary"
                  style={{ padding: "10px 15px" }}
                  onClick={() => {
                    setVisible(false);
                  }}
                />
                <Button
                  label="บันทึก"
                  severity="success"
                  style={{ padding: "10px 15px" }}
                  onClick={handleChangePassword}
                />
              </div>
            }
          >
            <label htmlFor="">รหัสผ่านเดิม</label>
            <Password
              value={formPasswordValues.current_password}
              toggleMask
              feedback={false}
              className="w-full mb-3"
              onChange={(e) =>
                setFormPasswordValues({
                  ...formPasswordValues,
                  current_password: e.target.value,
                })
              }
            />
            <label htmlFor="">รหัสผ่านใหม่</label>
            <Password
              value={formPasswordValues.new_password}
              toggleMask
              feedback={false}
              className="w-full mb-3"
              onChange={(e) =>
                setFormPasswordValues({
                  ...formPasswordValues,
                  new_password: e.target.value,
                })
              }
            />
            <label htmlFor="">ยืนยันรหัสผ่านใหม่</label>
            <Password
              value={formPasswordValues.confirm_password}
              toggleMask
              feedback={false}
              className="w-full"
              onChange={(e) =>
                setFormPasswordValues({
                  ...formPasswordValues,
                  confirm_password: e.target.value,
                })
              }
            />
          </Dialog>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Profile;
