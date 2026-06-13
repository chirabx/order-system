import { AnimatePresence, motion } from "framer-motion";
import { Check, ChefHat, Eye, PackageCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api.js";
import { useSSE } from "../../hooks/useSSE.js";
import { statusLabel, statusTone } from "../../lib/status.js";
import Skeleton from "../../components/Skeleton.jsx";

const nextAction = {
  pending: ["confirmed", "确认订单", Check],
  confirmed: ["preparing", "开始制作", ChefHat],
  preparing: ["ready", "出餐", PackageCheck],
  ready: ["completed", "完成", Check]
};

export default function StaffOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [range, setRange] = useState("day");
  const [stats, setStats] = useState({ revenue: 0, completedCount: 0, orderCount: 0 });
  const [loading, setLoading] = useState(true);
  const [detailOrder, setDetailOrder] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api(`/api/orders?status=${status}&range=${range}`);
      setOrders(data.items);
      setStats(data.stats || { revenue: 0, completedCount: 0, orderCount: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status, range]);

  useSSE("staff", {
    "order:created": (payload) => {
      toast.success(payload.message);
      load();
    },
    "order:status": (payload) => {
      toast(payload.message);
      load();
    }
  });

  async function advance(order) {
    const action = nextAction[order.status];
    if (!action) return;
    const data = await api(`/api/orders/${order._id}/status`, {
      method: "PATCH",
      body: { status: action[0], version: order.version }
    });
    setOrders((current) => current.map((item) => item._id === order._id ? data.order : item));
    toast.success("订单状态已更新");
  }

  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black">订单管理</h1>
          <div className="flex flex-wrap gap-2">
            <select className="input w-36" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="day">近一天</option>
              <option value="week">近一周</option>
              <option value="month">近一月</option>
              <option value="">全部时间</option>
            </select>
            <select className="input w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">全部状态</option>
              {Object.entries(statusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="panel p-5">
          <p className="text-sm text-stone-500 dark:text-slate-400">筛选订单数</p>
          <p className="mt-2 text-3xl font-black">{stats.orderCount || 0}</p>
        </section>
        <section className="panel p-5">
          <p className="text-sm text-stone-500 dark:text-slate-400">已完成订单</p>
          <p className="mt-2 text-3xl font-black">{stats.completedCount || 0}</p>
        </section>
        <section className="panel p-5">
          <p className="text-sm text-stone-500 dark:text-slate-400">收入统计</p>
          <p className="mt-2 text-3xl font-black text-emerald-700 dark:text-emerald-300">¥{Number(stats.revenue || 0).toFixed(2)}</p>
        </section>
      </div>

      <div className="panel p-5">
      <div className="mt-5 grid gap-4">
        {loading ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-32" />) : orders.map((order) => {
          const action = nextAction[order.status];
          const Icon = action?.[2];
          return (
            <motion.article layout key={order._id} className="rounded-lg border border-stone-200 p-4 dark:border-slate-800">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black">{order.table?.number} 桌</h2>
                    <span className={`status-pill ${statusTone[order.status]}`}>{statusLabel[order.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{order.orderNo}</p>
                  <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">创建时间：{new Date(order.createdAt).toLocaleString()}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items.map((item) => <span className="rounded-md bg-stone-100 px-2 py-1 text-sm dark:bg-slate-900" key={`${order._id}-${item.menuItem}`}>{item.name} x{item.quantity}</span>)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black">¥{order.totalAmount.toFixed(2)}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-secondary" onClick={() => setDetailOrder(order)}><Eye size={17} />详情</button>
                    {action && <button className="btn-primary" onClick={() => advance(order)}><Icon size={17} />{action[1]}</button>}
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
      <AnimatePresence>
        {detailOrder && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section className="panel max-h-[90vh] w-full max-w-2xl overflow-auto p-5" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">订单详情</h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{detailOrder.orderNo}</p>
                </div>
                <button className="btn-secondary h-10 w-10 p-0" onClick={() => setDetailOrder(null)}><X size={18} /></button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-stone-100 p-3 text-sm dark:bg-slate-900">桌位：{detailOrder.table?.number || "-"}</div>
                <div className="rounded-lg bg-stone-100 p-3 text-sm dark:bg-slate-900">状态：{statusLabel[detailOrder.status]}</div>
                <div className="rounded-lg bg-stone-100 p-3 text-sm dark:bg-slate-900">创建时间：{new Date(detailOrder.createdAt).toLocaleString()}</div>
                <div className="rounded-lg bg-stone-100 p-3 text-sm dark:bg-slate-900">金额：¥{Number(detailOrder.totalAmount).toFixed(2)}</div>
              </div>
              <div className="mt-5 divide-y divide-stone-200 dark:divide-slate-800">
                {detailOrder.items.map((item) => (
                  <div key={`${detailOrder._id}-${item.menuItem}-${item.name}`} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="font-bold">{item.name} x{item.quantity}</p>
                      {item.remark && <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">备注：{item.remark}</p>}
                    </div>
                    <p className="font-semibold">¥{(item.unitPrice * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              {detailOrder.remark && <p className="mt-4 rounded-lg bg-stone-100 p-3 text-sm dark:bg-slate-900">订单备注：{detailOrder.remark}</p>}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </section>
  );
}
