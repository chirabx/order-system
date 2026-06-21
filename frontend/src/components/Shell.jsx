import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, Moon, Sun, UserRound, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button className="btn-secondary h-10 w-10 p-0" onClick={toggleTheme} title="切换主题">
      <Icon size={18} />
    </button>
  );
}

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isStaff = user?.role === "staff";
  const navItems = isStaff
    ? [
        { label: "工作台", to: "/staff/dashboard" },
        { label: "订单", to: "/staff/orders" },
        { label: "桌位", to: "/staff/tables" },
        { label: "菜单", to: "/staff/menu" },
        { label: "评论", to: "/comments" }
      ]
    : user
      ? [
          { label: "就餐", to: "/customer", end: true },
          { label: "订单", to: "/customer/orders" },
          { label: "评论", to: "/comments" }
        ]
      : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950 transition dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto grid max-w-7xl grid-cols-[240px_1fr_240px] items-center px-4 py-3">
          <Link to={isStaff ? "/staff/dashboard" : user ? "/customer" : "/login"} className="text-lg font-black text-emerald-700 dark:text-emerald-300">
            餐饮订单系统
          </Link>
          <nav className="hidden items-center justify-center gap-2 md:flex">
            {navItems.map(({ label, to, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `inline-flex w-20 justify-center rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" : "text-stone-600 hover:text-emerald-700 dark:text-slate-300"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-2">
            <ThemeButton />
            {user ? (
              <>
                <Link className="btn-secondary hidden md:inline-flex" to={isStaff ? "/staff/profile" : "/profile"}>
                  <UserRound size={17} />
                  {user.name}
                </Link>
                <button className="btn-secondary hidden h-10 w-10 p-0 md:inline-flex" onClick={handleLogout} title="退出">
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <Link className="btn-primary hidden md:inline-flex" to="/login">登录</Link>
            )}
            <button className="btn-secondary h-10 w-10 p-0 md:hidden" onClick={() => setOpen((v) => !v)}>
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="border-t border-stone-200 px-4 py-3 md:hidden dark:border-slate-800">
            <div className="flex flex-col gap-2">
              {navItems.map(({ label, to }) => <Link key={to} to={to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 font-semibold">{label}</Link>)}
              {user && <Link to={isStaff ? "/staff/profile" : "/profile"} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 font-semibold">个人资料</Link>}
              {user && <button onClick={handleLogout} className="text-left rounded-md px-3 py-2 font-semibold">退出登录</button>}
            </div>
          </motion.div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
