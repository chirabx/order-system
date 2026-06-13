import { motion } from "framer-motion";
import { CalendarClock, ClipboardList, Utensils, UsersRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const partyOptions = [
  { key: "A", label: "A类", range: "1-2人", defaultSize: 2 },
  { key: "B", label: "B类", range: "3-6人", defaultSize: 4 },
  { key: "C", label: "C类", range: "6人以上", defaultSize: 7 }
];

export default function CustomerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState("A");
  const [partySize, setPartySize] = useState(2);
  const [needsReservation, setNeedsReservation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    remark: ""
  });
  const currentTable = localStorage.getItem("current_table_number");

  function choose(option) {
    setSelected(option.key);
    setPartySize(option.defaultSize);
    setNeedsReservation(false);
  }

  async function assignTable() {
    setLoading(true);
    try {
      const data = await api("/api/tables/assign", {
        method: "POST",
        body: { partySize }
      });
      if (data.needsReservation) {
        setNeedsReservation(true);
        toast("当前没有合适空桌，请提交预定");
        return;
      }
      toast.success(`已安排 ${data.table.number} 桌`);
      localStorage.setItem("current_table_number", data.table.number);
      localStorage.setItem(`table_access_code_${data.table.number}`, data.accessCode);
      navigate(`/scan/${data.table.number}?code=${data.accessCode}`);
    } finally {
      setLoading(false);
    }
  }

  async function submitReservation(event) {
    event.preventDefault();
    const data = await api("/api/reservations", {
      method: "POST",
      body: {
        ...reservation,
        partySize
      }
    });
    toast.success("预定已提交，请等待员工安排");
    setNeedsReservation(false);
    setReservation((current) => ({ ...current, remark: "" }));
    return data;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="panel p-6">
        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">顾客就餐</p>
        <h1 className="mt-2 text-3xl font-black">请选择本次就餐人数</h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
          系统会按人数分组分配空闲桌位。没有合适空桌时进入预定流程。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <button className="panel p-5 text-left transition hover:border-emerald-500" disabled={!currentTable} onClick={() => navigate(`/scan/${currentTable}`)}>
          <Utensils className="text-emerald-600 dark:text-emerald-300" />
          <p className="mt-3 text-lg font-black">继续当前桌点餐</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{currentTable ? `当前桌位：${currentTable}` : "暂无已入座桌位"}</p>
        </button>
        <button className="panel p-5 text-left transition hover:border-emerald-500" onClick={() => navigate("/customer/orders")}>
          <ClipboardList className="text-emerald-600 dark:text-emerald-300" />
          <p className="mt-3 text-lg font-black">历史订单</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">查看已提交过的订单和状态。</p>
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {partyOptions.map((option) => (
          <motion.button
            type="button"
            whileHover={{ y: -4 }}
            key={option.key}
            onClick={() => choose(option)}
            className={`panel p-6 text-left transition ${
              selected === option.key ? "border-emerald-500 ring-2 ring-emerald-500/20" : ""
            }`}
          >
            <UsersRound className="text-emerald-600 dark:text-emerald-300" />
            <p className="mt-4 text-xl font-black">{option.label}</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{option.range}</p>
          </motion.button>
        ))}
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block text-sm font-semibold">
            实际人数
            <input
              className="input mt-1 w-40"
              type="number"
              min="1"
              value={partySize}
              onChange={(event) => {
                setPartySize(Number(event.target.value));
                setNeedsReservation(false);
              }}
            />
          </label>
          <button className="btn-primary" disabled={loading} onClick={assignTable}>
            <UsersRound size={17} />
            安排桌位
          </button>
        </div>
      </section>

      {needsReservation && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submitReservation}
          className="panel p-6"
        >
          <div className="flex items-center gap-3">
            <CalendarClock className="text-amber-600" />
            <div>
              <h2 className="text-xl font-black">提交预定</h2>
              <p className="text-sm text-stone-500 dark:text-slate-400">员工端会收到预定通知。</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold">
              联系人
              <input
                className="input mt-1"
                required
                value={reservation.name}
                onChange={(event) => setReservation({ ...reservation, name: event.target.value })}
              />
            </label>
            <label className="block text-sm font-semibold">
              手机号
              <input
                className="input mt-1"
                required
                value={reservation.phone}
                onChange={(event) => setReservation({ ...reservation, phone: event.target.value })}
              />
            </label>
          </div>
          <label className="mt-4 block text-sm font-semibold">
            备注
            <textarea
              className="input mt-1 min-h-24"
              value={reservation.remark}
              onChange={(event) => setReservation({ ...reservation, remark: event.target.value })}
            />
          </label>
          <button className="btn-primary mt-5" type="submit">
            <CalendarClock size={17} />
            提交预定
          </button>
        </motion.form>
      )}
    </div>
  );
}
