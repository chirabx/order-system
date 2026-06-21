import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useState } from "react";
import RoleSwitch from "./RoleSwitch.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPanel({ mode }) {
  const [role, setRole] = useState("customer");
  const [values, setValues] = useState({ name: "", phone: "", account: "", staffNo: "", password: "", confirm: "" });
  const { login, register, loading } = useAuth();
  const isRegister = mode === "register";

  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (isRegister && values.password !== values.confirm) {
      toast.error("两次输入的密码不一致");
      return;
    }
    const body = {
      role,
      name: values.name,
      phone: values.phone,
      account: values.account,
      credential: role === "customer" ? values.phone : values.account,
      staffNo: values.staffNo,
      password: values.password
    };
    await (isRegister ? register(body) : login(body));
    toast.success(isRegister ? "注册成功" : "登录成功");
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-110px)] max-w-5xl place-items-center">
      <div className="grid w-full gap-6 lg:grid-cols-[1fr_420px]">
        <section className="flex flex-col justify-center rounded-lg bg-emerald-700 p-8 text-white shadow-soft">
          <p className="text-sm font-bold uppercase tracking-normal text-emerald-100">Order Flow</p>
          <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">餐厅点餐、厨房处理、桌位协同一次串起来。</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50">顾客扫码点餐，员工实时处理订单，购物车变化和订单状态通过 SSE 即时同步。</p>
        </section>
        <motion.form layout onSubmit={submit} className="panel p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">{isRegister ? "注册账号" : "欢迎回来"}</h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{role === "customer" ? "顾客使用手机号" : "员工使用账号"}</p>
            </div>
          </div>
          <RoleSwitch role={role} setRole={setRole} />
          <motion.div layout className="mt-5 space-y-4">
            {isRegister && (
              <label className="block text-sm font-semibold">
                姓名
                <input className="input mt-1" value={values.name} onChange={update("name")} required />
              </label>
            )}
            {role === "customer" ? (
              <label className="block text-sm font-semibold">
                手机号
                <input className="input mt-1" value={values.phone} onChange={update("phone")} required />
              </label>
            ) : (
              <label className="block text-sm font-semibold">
                员工账号
                <input className="input mt-1" value={values.account} onChange={update("account")} required />
              </label>
            )}
            {isRegister && role === "staff" && (
              <label className="block text-sm font-semibold">
                工号
                <input className="input mt-1" value={values.staffNo} onChange={update("staffNo")} />
              </label>
            )}
            <label className="block text-sm font-semibold">
              密码
              <input className="input mt-1" type="password" value={values.password} onChange={update("password")} required minLength={6} />
            </label>
            {isRegister && (
              <label className="block text-sm font-semibold">
                确认密码
                <input className="input mt-1" type="password" value={values.confirm} onChange={update("confirm")} required minLength={6} />
              </label>
            )}
          </motion.div>
          <button disabled={loading} className="btn-primary mt-6 w-full" type="submit">
            {isRegister ? "注册并进入系统" : "登录"}
          </button>
          <p className="mt-5 text-center text-sm text-stone-500 dark:text-slate-400">
            {isRegister ? "已有账号？" : "还没有账号？"}
            <Link className="ml-1 font-bold text-emerald-700 dark:text-emerald-300" to={isRegister ? "/login" : "/register"}>
              {isRegister ? "去登录" : "去注册"}
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
