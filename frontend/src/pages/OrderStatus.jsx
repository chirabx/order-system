import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { orderSteps, statusLabel } from "../lib/status.js";
import { useSSE } from "../hooks/useSSE.js";
import Skeleton from "../components/Skeleton.jsx";

export default function OrderStatus() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api(`/api/orders/${orderId}`).then((data) => setOrder(data.order));
  }, [orderId]);

  useSSE(order?.table?._id ? `table-${order.table._id}` : null, {
    "order:status": (payload) => {
      if (payload.order._id === orderId) {
        setOrder(payload.order);
        toast.success(payload.message);
      }
    }
  });

  async function cancel() {
    if (!window.confirm("确认取消该订单吗？")) return;
    const data = await api(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      body: { status: "cancelled", version: order.version }
    });
    setOrder(data.order);
    toast.success("订单已取消");
  }

  if (!order) return <Skeleton className="mx-auto h-96 max-w-3xl" />;
  const activeIndex = orderSteps.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl">
      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500 dark:text-slate-400">订单号</p>
            <h1 className="text-2xl font-black">{order.orderNo}</h1>
          </div>
          <span className="status-pill bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">{statusLabel[order.status]}</span>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-5">
          {orderSteps.map((step, index) => {
            const done = activeIndex >= index;
            return (
              <motion.div key={step} animate={{ scale: done ? 1.03 : 1 }} className="rounded-lg border border-stone-200 p-4 text-center dark:border-slate-800">
                <CheckCircle2 className={`mx-auto ${done ? "text-emerald-600" : "text-stone-300 dark:text-slate-700"}`} />
                <p className="mt-2 text-sm font-bold">{statusLabel[step]}</p>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-8 divide-y divide-stone-200 dark:divide-slate-800">
          {order.items.map((item) => (
            <div key={item.menuItem} className="flex justify-between py-3 text-sm">
              <span>{item.name} x{item.quantity}</span>
              <span>¥{(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between text-xl font-black">
          <span>合计</span>
          <span>¥{order.totalAmount.toFixed(2)}</span>
        </div>
        <div className="mt-6 flex gap-3">
          {order.status === "pending" && <button className="btn-secondary text-rose-600" onClick={cancel}><XCircle size={17} />取消订单</button>}
          <button className="btn-primary" onClick={() => navigate(-1)}>返回</button>
        </div>
      </section>
    </div>
  );
}
