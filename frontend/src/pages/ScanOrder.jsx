import { AnimatePresence, motion } from "framer-motion";
import { Copy, Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CartProvider, useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { useSSE } from "../hooks/useSSE.js";
import Skeleton from "../components/Skeleton.jsx";

const spicyLabels = {
  0: "不辣",
  1: "微辣",
  2: "中辣",
  3: "特辣"
};

function MenuImage({ item }) {
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-md bg-stone-200 dark:bg-slate-800">
      {item.image ? (
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-3xl font-black text-emerald-700 dark:text-emerald-300">{item.name.slice(0, 1)}</div>
      )}
    </div>
  );
}

function CartDrawer({ open, setOpen, tableId }) {
  const { cart, update, remove, guest, accessCode } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const mine = cart.participants?.find((person) => person.customerId === (user?._id || guest.guestId));

  async function submitOrder() {
    const data = await api("/api/orders", {
      method: "POST",
      body: { tableId, accessCode, ...guest }
    });
    toast.success("下单成功，厨房已收到");
    navigate(`/order-status/${data.order._id}`);
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed inset-y-0 right-0 z-[9998] flex w-full max-w-md flex-col border-l border-stone-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">我的购物车</h2>
            <button className="btn-secondary h-10 w-10 p-0" onClick={() => setOpen(false)}><X size={18} /></button>
          </div>
          <div className="mt-5 flex-1 space-y-3 overflow-auto">
            {!mine?.items?.length && <p className="rounded-lg bg-stone-100 p-4 text-sm text-stone-500 dark:bg-slate-900 dark:text-slate-400">还没有添加菜品。</p>}
            {mine?.items?.map((entry) => (
              <div key={entry.menuItem._id} className="rounded-lg border border-stone-200 p-3 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{entry.menuItem.name}</p>
                    <p className="text-sm text-stone-500 dark:text-slate-400">¥{entry.unitPrice.toFixed(2)}</p>
                  </div>
                  <button className="text-rose-500" onClick={() => remove(entry.menuItem._id)}><Trash2 size={18} /></button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button className="btn-secondary h-9 w-9 p-0" onClick={() => update(entry.menuItem._id, Math.max(1, entry.quantity - 1), entry.remark)}><Minus size={15} /></button>
                  <span className="w-8 text-center font-black">{entry.quantity}</span>
                  <button className="btn-secondary h-9 w-9 p-0" onClick={() => update(entry.menuItem._id, entry.quantity + 1, entry.remark)}><Plus size={15} /></button>
                </div>
                <input className="input mt-3" placeholder="口味备注" defaultValue={entry.remark} onBlur={(e) => update(entry.menuItem._id, entry.quantity, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="border-t border-stone-200 pt-4 dark:border-slate-800">
            <div className="mb-3 flex justify-between text-lg font-black">
              <span>合计</span>
              <span>¥{(cart.totalAmount || 0).toFixed(2)}</span>
            </div>
            <button className="btn-primary w-full" disabled={!mine?.items?.length} onClick={submitOrder}>提交订单</button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body
  );
}

function FloatingCartButton({ count, onOpen }) {
  return createPortal(
    <button
      className="fixed bottom-6 right-6 z-[9999] inline-flex h-16 min-w-16 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-base font-black text-white shadow-soft transition hover:bg-emerald-500"
      onClick={onOpen}
      title="打开购物车"
      type="button"
    >
      <ShoppingCart size={22} />
      <span>{count}</span>
    </button>,
    document.body
  );
}

function ScanOrderInner({ tableId }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [table, setTable] = useState(null);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [spicy, setSpicy] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requiresAccessCode, setRequiresAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState(() => searchParams.get("code") || localStorage.getItem(`table_access_code_${tableId}`) || "");
  const [accessInput, setAccessInput] = useState("");
  const { cart, setCart, refresh, add } = useCart();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api(`/api/tables/${tableId}?accessCode=${encodeURIComponent(accessCode)}`),
      api("/api/menu/categories"),
      api("/api/menu/items")
    ]).then(([tableData, categoryData, itemData]) => {
      if (tableData.requiresAccessCode) {
        setTable(tableData.table);
        setRequiresAccessCode(true);
        return;
      }
      setTable(tableData.table);
      setRequiresAccessCode(false);
      localStorage.setItem("current_table_number", tableData.table.number);
      if (accessCode) localStorage.setItem(`table_access_code_${tableData.table.number}`, accessCode);
      setCategories(categoryData.categories);
      setItems(itemData.items);
      refresh();
    }).finally(() => setLoading(false));
  }, [tableId, accessCode]);

  useEffect(() => {
    api(`/api/menu/items?category=${category}&search=${encodeURIComponent(search)}&spicy=${spicy}`).then((data) => setItems(data.items));
  }, [category, search, spicy]);

  useSSE(table ? `table-${table._id}` : null, {
    "cart:updated": (payload) => {
      setCart(payload.cart);
      setMessages((current) => [payload.message, ...current].slice(0, 5));
      toast(payload.message);
    },
    "order:created": (payload) => toast.success(payload.message),
    "order:status": (payload) => toast(payload.message)
  });

  const totalCount = useMemo(
    () => cart.participants?.reduce((sum, person) => sum + person.items.reduce((s, item) => s + item.quantity, 0), 0) || 0,
    [cart]
  );
  const groupedItems = useMemo(() => {
    const visibleCategories = category
      ? categories.filter((item) => item._id === category)
      : categories;
    const sections = visibleCategories.map((item) => ({
      id: item._id,
      name: item.name,
      items: items.filter((menuItem) => menuItem.category?._id === item._id || menuItem.category === item._id)
    }));
    const uncategorized = items.filter((menuItem) => !menuItem.category);
    if (!category && uncategorized.length) {
      sections.push({ id: "uncategorized", name: "未分类", items: uncategorized });
    }
    return sections.filter((section) => section.items.length);
  }, [items, categories, category]);

  async function copyTableLink() {
    const code = accessCode || localStorage.getItem(`table_access_code_${table?.number || tableId}`) || "";
    const url = `${window.location.origin}/scan/${table?.number || tableId}${code ? `?code=${code}` : ""}`;
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
    toast.success("点餐链接已复制");
  }

  function submitAccessCode(event) {
    event.preventDefault();
    const value = accessInput.trim();
    if (!value) return;
    localStorage.setItem(`table_access_code_${table?.number || tableId}`, value);
    setAccessCode(value);
    setSearchParams({ code: value });
  }

  async function leaveTable() {
    if (!window.confirm("确认退出并释放当前桌位吗？")) return;
    await api(`/api/tables/${table?._id || tableId}`, {
      method: "PATCH",
      body: { status: "free", accessCode }
    });
    localStorage.removeItem(`table_access_code_${table?.number || tableId}`);
    localStorage.removeItem("current_table_number");
    toast.success("已退出当前桌位");
    window.location.href = "/customer";
  }

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-[220px_1fr_300px]">
        <Skeleton className="h-80" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-72" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (requiresAccessCode) {
    return (
      <form onSubmit={submitAccessCode} className="mx-auto max-w-md panel p-6">
        <h1 className="text-2xl font-black">{table?.number || tableId} 桌需要授权码</h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">该桌位已被占用，请输入开桌顾客分享的授权码。</p>
        <input className="input mt-5" value={accessInput} onChange={(event) => setAccessInput(event.target.value)} placeholder="请输入 6 位授权码" />
        <button className="btn-primary mt-4 w-full" type="submit">进入点餐</button>
      </form>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr_300px]">
      <aside className="panel p-4 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-black">{table?.number || tableId} 桌点餐</h1>
          <button className="btn-secondary h-10 w-10 p-0" onClick={copyTableLink} title="复制点餐链接">
            <Copy size={17} />
          </button>
        </div>
        {accessCode && <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">授权码：{accessCode}</p>}
        <button className="btn-secondary mt-3 w-full text-rose-600" onClick={leaveTable}>退出当前桌</button>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-2.5 text-stone-400" size={17} />
          <input className="input pl-9" placeholder="搜索菜品" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input mt-3" value={spicy} onChange={(e) => setSpicy(e.target.value)}>
          <option value="">全部辣度</option>
          <option value="0">不辣</option>
          <option value="1">微辣</option>
          <option value="2">中辣</option>
          <option value="3">特辣</option>
        </select>
        <div className="mt-4 flex gap-2 overflow-auto lg:flex-col">
          <button className={`rounded-md px-3 py-2 text-left text-sm font-bold ${!category ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" : ""}`} onClick={() => setCategory("")}>全部</button>
          {categories.map((item) => (
            <button key={item._id} className={`rounded-md px-3 py-2 text-left text-sm font-bold ${category === item._id ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" : ""}`} onClick={() => setCategory(item._id)}>{item.name}</button>
          ))}
        </div>
      </aside>
      <section className="space-y-6">
        {groupedItems.map((section) => (
          <div key={section.id}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-black">{section.name}</h2>
              <span className="text-sm font-semibold text-stone-500 dark:text-slate-400">{section.items.length} 道菜</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.items.map((item) => (
                <motion.article whileHover={{ y: -4 }} key={item._id} className="panel overflow-hidden p-3">
                  <MenuImage item={item} />
                  <div className="mt-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{item.name}</h3>
                        <p className="mt-1 text-xs font-semibold text-stone-500 dark:text-slate-400">
                          已售 {item.sold || 0} · {spicyLabels[item.spicyLevel] || "不辣"}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-slate-400">{item.description || "新鲜现做，口味稳定。"}</p>
                      </div>
                      <span className="font-black text-emerald-700 dark:text-emerald-300">¥{item.price.toFixed(2)}</span>
                    </div>
                    {!!item.tags?.length && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">{tag}</span>
                        ))}
                      </div>
                    )}
                    <button className="btn-primary mt-4 w-full" disabled={!item.available} onClick={() => add(item)}>
                      <Plus size={17} /> 加入购物车
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        ))}
        {!groupedItems.length && <div className="panel p-6 text-sm text-stone-500 dark:text-slate-400">暂无符合条件的菜品。</div>}
      </section>
      <aside className="panel p-4 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-black">同桌小伙伴正在点餐</h2>
          <div className="mt-3 space-y-2">
            {messages.map((message, index) => (
              <motion.p initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} key={`${message}-${index}`} className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100">{message}</motion.p>
            ))}
            {!messages.length && <p className="text-sm text-stone-500 dark:text-slate-400">实时显示同桌加菜和订单变化。</p>}
          </div>
          <div className="mt-5 space-y-3">
            {cart.participants?.map((person) => (
              <div key={person.customerId} className="rounded-lg border border-stone-200 p-3 dark:border-slate-800">
                <p className="font-bold">{person.name}</p>
                <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{person.items.map((item) => `${item.menuItem.name} x${item.quantity}`).join("，") || "还没选菜"}</p>
              </div>
            ))}
          </div>
      </aside>
      <FloatingCartButton count={totalCount} onOpen={() => setDrawerOpen(true)} />
      <CartDrawer open={drawerOpen} setOpen={setDrawerOpen} tableId={table?._id || tableId} />
    </div>
  );
}

export default function ScanOrder() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const accessCode = searchParams.get("code") || localStorage.getItem(`table_access_code_${tableId}`) || "";
  return (
    <CartProvider tableId={tableId} accessCode={accessCode}>
      <ScanOrderInner tableId={tableId} />
    </CartProvider>
  );
}
