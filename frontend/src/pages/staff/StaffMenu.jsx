import { AnimatePresence, motion } from "framer-motion";
import { Plus, Save, Tag, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api.js";
import Skeleton from "../../components/Skeleton.jsx";

const spicyOptions = [
  { value: 0, label: "不辣" },
  { value: 1, label: "微辣" },
  { value: 2, label: "中辣" },
  { value: 3, label: "特辣" }
];

const emptyItem = {
  name: "",
  image: "",
  price: 0,
  category: "",
  sold: 0,
  spicyLevel: 0,
  available: true,
  description: "",
  tagsInput: ""
};

function tagList(item) {
  if (typeof item.tagsInput === "string") return item.tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean);
  if (Array.isArray(item.tags)) return item.tags;
  return [];
}

function spicyLabel(level) {
  return spicyOptions.find((item) => item.value === Number(level))?.label || "不辣";
}

function MenuForm({ value, setValue, categories, onSubmit, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input className="input" placeholder="菜品名称" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} required />
      <input className="input" placeholder="图片 URL" value={value.image} onChange={(e) => setValue({ ...value, image: e.target.value })} />
      <div className="grid grid-cols-3 gap-3">
        <label className="block text-sm font-semibold">
          价格
          <div className="mt-1 flex rounded-md border border-stone-300 bg-white dark:border-slate-700 dark:bg-slate-950">
            <span className="grid w-9 place-items-center text-stone-500">¥</span>
            <input className="w-full rounded-r-md bg-transparent px-2 py-2 text-sm outline-none" type="number" min="0" step="0.01" value={value.price} onChange={(e) => setValue({ ...value, price: e.target.value })} />
          </div>
        </label>
        <label className="block text-sm font-semibold">
          已售
          <input className="input mt-1" type="number" min="0" value={value.sold} onChange={(e) => setValue({ ...value, sold: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold">
          辣度
          <select className="input mt-1" value={value.spicyLevel} onChange={(e) => setValue({ ...value, spicyLevel: e.target.value })}>
            {spicyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm font-semibold">
        菜品分类
        <select className="input mt-1" value={value.category} onChange={(e) => setValue({ ...value, category: e.target.value })}>
          <option value="">未分类</option>
          {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        标签
        <input className="input mt-1" placeholder="例如：招牌, 新品" value={value.tagsInput} onChange={(e) => setValue({ ...value, tagsInput: e.target.value })} />
      </label>
      <textarea className="input min-h-24" placeholder="描述" value={value.description} onChange={(e) => setValue({ ...value, description: e.target.value })} />
      <button className="btn-primary" type="submit"><Save size={17} />{submitLabel}</button>
    </form>
  );
}

export default function StaffMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [draft, setDraft] = useState(emptyItem);
  const [editing, setEditing] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const groupedItems = useMemo(() => {
    const groups = categories.map((category) => ({
      id: category._id,
      name: category.name,
      items: items.filter((item) => item.category?._id === category._id)
    }));
    const uncategorized = items.filter((item) => !item.category);
    if (uncategorized.length) groups.push({ id: "uncategorized", name: "未分类", items: uncategorized });
    return groups.filter((group) => group.items.length);
  }, [items, categories]);

  async function load() {
    setLoading(true);
    try {
      const [itemData, categoryData] = await Promise.all([
        api("/api/menu/items"),
        api("/api/menu/categories")
      ]);
      setItems(itemData.items);
      setCategories(categoryData.categories);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createCategory(event) {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    const data = await api("/api/menu/categories", {
      method: "POST",
      body: { name: newCategoryName.trim(), sort: categories.length + 1 }
    });
    toast.success("分类已新增");
    setCategories((current) => [...current, data.category]);
    setDraft((current) => ({ ...current, category: data.category._id }));
    setNewCategoryName("");
  }

  async function deleteCategory(category) {
    if (!window.confirm(`确认删除分类「${category.name}」吗？相关菜品会变为未分类。`)) return;
    await api("/api/menu/categories", {
      method: "DELETE",
      body: { id: category._id }
    });
    toast.success("分类已删除");
    setCategories((current) => current.filter((item) => item._id !== category._id));
    setItems((current) => current.map((item) => item.category?._id === category._id ? { ...item, category: null } : item));
    setDraft((current) => current.category === category._id ? { ...current, category: "" } : current);
    setEditing((current) => current?.category === category._id ? { ...current, category: "" } : current);
  }

  function buildBody(value) {
    const body = {
      ...value,
      price: Number(value.price),
      sold: Number(value.sold),
      spicyLevel: Number(value.spicyLevel),
      tags: tagList(value)
    };
    delete body.tagsInput;
    delete body.stock;
    return body;
  }

  async function createItem(event) {
    event.preventDefault();
    await api("/api/menu/items", { method: "POST", body: buildBody(draft) });
    toast.success("菜品已新增");
    setDraft(emptyItem);
    load();
  }

  async function saveEdit(event) {
    event.preventDefault();
    await api(`/api/menu/items/${editing._id}`, { method: "PUT", body: buildBody(editing) });
    toast.success("菜品已更新");
    setEditing(null);
    load();
  }

  async function toggle(item) {
    await api(`/api/menu/items/${item._id}/available`, {
      method: "PATCH",
      body: { available: !item.available }
    });
    toast.success(!item.available ? "已上架" : "已下架");
    load();
  }

  async function deleteItem(item) {
    if (!window.confirm(`确认删除菜品「${item.name}」吗？`)) return;
    await api(`/api/menu/items/${item._id}`, { method: "DELETE" });
    toast.success("菜品已删除");
    setItems((current) => current.filter((entry) => entry._id !== item._id));
    setEditing((current) => current?._id === item._id ? null : current);
  }

  function openEdit(item) {
    setEditing({
      ...item,
      category: item.category?._id || "",
      sold: item.sold || 0,
      spicyLevel: item.spicyLevel || 0,
      tagsInput: (item.tags || []).join(", ")
    });
  }

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-black">分类管理</h2>
          <form onSubmit={createCategory} className="flex min-w-72 gap-2">
            <input className="input" placeholder="分类名称" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            <button className="btn-primary shrink-0" type="submit"><Plus size={17} />新增</button>
          </form>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
              <div key={category._id} className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 dark:border-slate-800">
                <span className="text-sm font-semibold">{category.name}</span>
                <button type="button" className="btn-secondary h-8 w-8 p-0 text-rose-600" onClick={() => deleteCategory(category)} title="删除分类">
                  <Trash2 size={15} />
                </button>
              </div>
          ))}
          {!categories.length && <p className="text-sm text-stone-500 dark:text-slate-400">暂无分类。</p>}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="panel p-5 lg:sticky lg:top-24 lg:self-start">
          <h1 className="text-xl font-black">新增菜品</h1>
          <div className="mt-4">
            <MenuForm value={draft} setValue={setDraft} categories={categories} onSubmit={createItem} submitLabel="新增" />
          </div>
        </section>

        <section className="space-y-6">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-lg" />)
            : groupedItems.map((group) => (
              <div key={group.id}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-black">{group.name}</h2>
                  <span className="text-sm font-semibold text-stone-500 dark:text-slate-400">{group.items.length} 道菜</span>
                </div>
                <div className="grid content-start gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((item) => (
                    <article className="panel overflow-hidden p-3" key={item._id}>
                      <div className="flex gap-3">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-stone-100 dark:bg-slate-900">
                          {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-2xl font-black text-emerald-700">{item.name.slice(0, 1)}</div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h2 className="truncate font-black">{item.name}</h2>
                              <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">已售 {item.sold || 0} · {spicyLabel(item.spicyLevel)}</p>
                            </div>
                            <p className="shrink-0 font-black text-emerald-700 dark:text-emerald-300">¥{Number(item.price).toFixed(2)}</p>
                          </div>
                          {!!item.tags?.length && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
                                  <Tag size={11} />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-3 flex gap-2">
                            <button className="btn-secondary flex-1 py-1.5" onClick={() => openEdit(item)}>编辑</button>
                            <button className="btn-secondary flex-1 py-1.5" onClick={() => toggle(item)}>{item.available ? "下架" : "上架"}</button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
        </section>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section
              className="panel max-h-[90vh] w-full max-w-2xl overflow-auto p-5"
              initial={{ opacity: 0, y: -24, clipPath: "inset(0 0 100% 0)" }}
              animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
              exit={{ opacity: 0, y: 16, clipPath: "inset(100% 0 0 0)" }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">编辑菜品</h2>
                <button className="btn-secondary h-10 w-10 p-0" onClick={() => setEditing(null)}><X size={18} /></button>
              </div>
              <MenuForm value={editing} setValue={setEditing} categories={categories} onSubmit={saveEdit} submitLabel="保存" />
              <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-400/30 dark:bg-rose-400/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-rose-700 dark:text-rose-200">危险操作</p>
                    <p className="mt-1 text-sm text-rose-600 dark:text-rose-200/80">删除后该菜品会从菜单中移除。</p>
                  </div>
                  <button className="btn-secondary text-rose-600" onClick={() => deleteItem(editing)}>
                    <Trash2 size={17} />
                    删除菜品
                  </button>
                </div>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
