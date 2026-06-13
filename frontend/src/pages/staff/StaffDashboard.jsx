import { Bell, ClipboardList, Table2, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api.js";
import { useSSE } from "../../hooks/useSSE.js";
import { statusLabel, statusTone } from "../../lib/status.js";
import Skeleton from "../../components/Skeleton.jsx";

export default function StaffDashboard() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [orderData, tableData] = await Promise.all([
        api("/api/kitchen/orders"),
        api("/api/tables")
      ]);
      setOrders(orderData.orders);
      setTables(tableData.tables);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useSSE("staff", {
    "order:created": (payload) => {
      toast.success(payload.message);
      setEvents((current) => [payload.message, ...current].slice(0, 8));
      load();
    },
    "order:status": (payload) => {
      toast(payload.message);
      setEvents((current) => [payload.message, ...current].slice(0, 8));
      load();
    },
    "cart:updated": (payload) => {
      setEvents((current) => [payload.message, ...current].slice(0, 8));
    },
    "table:freed": (payload) => {
      toast(payload.message);
      setEvents((current) => [payload.message, ...current].slice(0, 8));
      load();
    },
    "table:status": (payload) => {
      toast(payload.message);
      load();
    }
  });

  const stats = useMemo(() => [
    ["今日待处理", orders.filter((order) => order.status === "pending").length, ClipboardList],
    ["制作中", orders.filter((order) => ["confirmed", "preparing"].includes(order.status)).length, Utensils],
    ["空闲桌位", tables.filter((table) => table.status === "free").length, Table2],
    ["实时通知", events.length, Bell]
  ], [orders, tables, events]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36" />) : stats.map(([label, value, Icon]) => (
          <section key={label} className="panel p-5">
            <Icon className="text-emerald-600" />
            <p className="mt-4 text-sm text-stone-500 dark:text-slate-400">{label}</p>
            <p className="text-3xl font-black">{value}</p>
          </section>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="panel p-5">
          <h1 className="text-xl font-black">厨房待办</h1>
          <div className="mt-4 grid gap-3">
            {loading ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />) : orders.map((order) => (
              <article key={order._id} className="rounded-lg border border-stone-200 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{order.table?.number} 桌 · {order.orderNo}</p>
                    <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{order.items.map((item) => `${item.name}x${item.quantity}`).join("，")}</p>
                  </div>
                  <span className={`status-pill ${statusTone[order.status]}`}>{statusLabel[order.status]}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="text-xl font-black">实时通知</h2>
          <div className="mt-4 space-y-2">
            {loading ? <Skeleton className="h-24" /> : events.map((event, index) => <p className="rounded-md bg-stone-100 p-3 text-sm dark:bg-slate-900" key={`${event}-${index}`}>{event}</p>)}
            {!loading && !events.length && <p className="text-sm text-stone-500 dark:text-slate-400">新订单和购物车变化会出现在这里。</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
