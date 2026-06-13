export default function RoleSwitch({ role, setRole }) {
  return (
    <div className="grid grid-cols-2 rounded-lg bg-stone-200 p-1 dark:bg-slate-800">
      {[
        ["customer", "顾客"],
        ["staff", "员工"]
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setRole(value)}
          className={`rounded-md px-4 py-2 text-sm font-bold transition ${
            role === value
              ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300"
              : "text-stone-600 dark:text-slate-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
