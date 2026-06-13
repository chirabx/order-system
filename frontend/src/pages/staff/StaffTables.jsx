import { ChevronDown, ChevronRight, Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api.js";
import Skeleton from "../../components/Skeleton.jsx";

const groupLabel = {
  A: "A类 1-2人",
  B: "B类 3-6人",
  C: "C类 6人以上"
};

export default function StaffTables() {
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState({ prefix: "A", start: 1, count: 8 });
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState({ A: false, B: false, C: false });

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allFreeSelected = selectedIds.length > 0;
  const groupedTables = useMemo(() => {
    return ["A", "B", "C"].reduce((acc, group) => {
      acc[group] = tables.filter((table) => (table.capacityGroup || "A") === group);
      return acc;
    }, {});
  }, [tables]);

  async function load() {
    setLoading(true);
    try {
      const [tableData, reservationData] = await Promise.all([
        api("/api/tables"),
        api("/api/reservations")
      ]);
      setTables(tableData.tables);
      setReservations(reservationData.reservations);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createTables(event) {
    event.preventDefault();
    await api("/api/tables", { method: "POST", body: form });
    toast.success("桌位已生成");
    load();
  }

  function toggleSelected(table) {
    if (table.status === "occupied") {
      toast.error("占用桌位不能删除");
      return;
    }
    setSelectedIds((current) =>
      current.includes(table._id)
        ? current.filter((id) => id !== table._id)
        : [...current, table._id]
    );
  }

  async function deleteTables(ids) {
    if (!ids.length) return;
    if (!window.confirm(`确认删除 ${ids.length} 个桌位吗？`)) return;
    await api("/api/tables", {
      method: "DELETE",
      body: { ids }
    });
    toast.success("桌位已删除");
    setSelectedIds([]);
    load();
  }

  async function setTableFree(table) {
    await api(`/api/tables/${table._id}`, {
      method: "PATCH",
      body: { status: "free" }
    });
    toast.success(`${table.number} 已设为空闲`);
    load();
  }

  async function copyScanLink(table) {
    const url = `${window.location.origin}/scan/${table.number}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    toast.success(`${table.number} 点餐链接已复制`);
  }

  function toggleGroup(group) {
    setCollapsedGroups((current) => ({ ...current, [group]: !current[group] }));
  }

  return (
    <div className="space-y-5">
      <form onSubmit={createTables} className="panel flex flex-wrap items-end gap-3 p-5">
        <label className="text-sm font-semibold">
          前缀
          <input className="input mt-1 w-24" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} />
        </label>
        <label className="text-sm font-semibold">
          起始号
          <input className="input mt-1 w-28" type="number" value={form.start} onChange={(e) => setForm({ ...form, start: Number(e.target.value) })} />
        </label>
        <label className="text-sm font-semibold">
          数量
          <input className="input mt-1 w-28" type="number" value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} />
        </label>
        <button className="btn-primary"><Plus size={17} />批量生成</button>
        <button
          type="button"
          disabled={!allFreeSelected}
          onClick={() => deleteTables(selectedIds)}
          className="btn-secondary text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={17} />
          批量删除
        </button>
      </form>

      <section className="panel p-5">
        <h2 className="text-xl font-black">待处理预定</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {reservations.map((reservation) => (
            <article key={reservation._id} className="rounded-lg border border-stone-200 p-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{reservation.name}</p>
                  <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{reservation.phone}</p>
                </div>
                <span className="status-pill bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">{groupLabel[reservation.capacityGroup]}</span>
              </div>
              <p className="mt-3 text-sm text-stone-600 dark:text-slate-300">人数：{reservation.partySize}</p>
              {reservation.remark && <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{reservation.remark}</p>}
            </article>
          ))}
          {!reservations.length && <p className="text-sm text-stone-500 dark:text-slate-400">暂无预定。</p>}
        </div>
      </section>

      <div className="space-y-4">
        {loading ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-lg" />)}
          </section>
        ) : ["A", "B", "C"].map((group) => (
          <section key={group} className="panel p-4">
            <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => toggleGroup(group)}>
              <div className="flex items-center gap-2">
                {collapsedGroups[group] ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                <h3 className="text-lg font-black">{groupLabel[group]}</h3>
              </div>
              <span className="text-sm font-semibold text-stone-500 dark:text-slate-400">{groupedTables[group].length} 张桌</span>
            </button>
            {!collapsedGroups[group] && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {groupedTables[group].map((table) => (
                  <article className={`group rounded-lg border border-stone-200 bg-white p-4 transition dark:border-slate-800 dark:bg-slate-950 ${selectedSet.has(table._id) ? "ring-2 ring-rose-400" : ""}`} key={table._id}>
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(table._id)}
                          disabled={table.status === "occupied"}
                          onChange={() => toggleSelected(table)}
                        />
                        选择
                      </label>
                      <button
                        className="btn-secondary h-9 w-9 p-0 text-rose-600 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
                        disabled={table.status === "occupied"}
                        onClick={() => deleteTables([table._id])}
                        title="删除桌位"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-start justify-between">
                      <div>
                        <p className="text-sm text-stone-500 dark:text-slate-400">桌号</p>
                        <h2 className="text-3xl font-black">{table.number}</h2>
                      </div>
                      <span className={`status-pill ${table.status === "free" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{table.status === "free" ? "空闲" : "占用"}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        className="btn-secondary flex-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
                        onClick={() => copyScanLink(table)}
                        title="复制点餐链接"
                      >
                        <Copy size={16} />
                        复制链接
                      </button>
                    </div>
                    {table.status === "occupied" && (
                      <button className="btn-secondary mt-3 w-full" onClick={() => setTableFree(table)}>
                        设为空闲
                      </button>
                    )}
                  </article>
                ))}
                {!groupedTables[group].length && <p className="text-sm text-stone-500 dark:text-slate-400">该分类暂无桌位。</p>}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
