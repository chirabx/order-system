import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { statusLabel, statusTone } from "../lib/status.js";
import Skeleton from "../components/Skeleton.jsx";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api("/api/orders?pageSize=50")
      .then((data) => setOrders(data.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div className="panel p-5">
        <h1 className="text-2xl font-black">历史订单</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">仅显示当前账号提交过的订单。</p>
      </div>

      {loading ? (
        Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-32" />)
      ) : orders.length ? (
        orders.map((order) => (
          <article key={order._id} className="panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-black">{order.table?.number || "-"} 桌</h2>
                  <span className={`status-pill ${statusTone[order.status]}`}>{statusLabel[order.status]}</span>
                </div>
                <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{order.orderNo}</p>
                <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">创建时间：{new Date(order.createdAt).toLocaleString()}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.items.map((item) => (
                    <span className="rounded-md bg-stone-100 px-2 py-1 text-sm dark:bg-slate-900" key={`${order._id}-${item.menuItem}`}>{item.name} x{item.quantity}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black">¥{Number(order.totalAmount).toFixed(2)}</p>
                <button className="btn-secondary mt-3" onClick={() => navigate(`/order-status/${order._id}`)}>查看状态</button>
              </div>
            </div>
          </article>
        ))
      ) : (
        <div className="panel p-6 text-sm text-stone-500 dark:text-slate-400">暂无历史订单。</div>
      )}
    </section>
  );
}
