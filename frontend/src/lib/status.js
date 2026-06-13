export const orderSteps = ["pending", "confirmed", "preparing", "ready", "completed"];

export const statusLabel = {
  pending: "待确认",
  confirmed: "已确认",
  preparing: "制作中",
  ready: "待取餐",
  completed: "已完成",
  cancelled: "已取消"
};

export const statusTone = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  confirmed: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200",
  preparing: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-400/15 dark:text-fuchsia-200",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  completed: "bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-slate-200",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200"
};
