import { MessageSquare, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Skeleton from "../components/Skeleton.jsx";

const quickTags = ["服务好", "上菜快", "味道好", "环境好", "性价比高"];

export default function Comments() {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 5, content: "", tags: [] });

  const isStaff = user?.role === "staff";
  const statsText = useMemo(() => `${averageRating.toFixed(1)} / 5.0`, [averageRating]);

  async function load() {
    setLoading(true);
    try {
      const data = await api("/api/comments");
      setComments(data.comments);
      setAverageRating(data.averageRating || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggleTag(tag) {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tag)
        ? current.tags.filter((item) => item !== tag)
        : [...current.tags, tag]
    }));
  }

  async function submit(event) {
    event.preventDefault();
    const data = await api("/api/comments", {
      method: "POST",
      body: form
    });
    toast.success("评论已发布");
    setComments((current) => [data.comment, ...current]);
    setForm({ rating: 5, content: "", tags: [] });
    load();
  }

  async function remove(comment) {
    if (!window.confirm("确认删除该评论吗？")) return;
    await api("/api/comments", {
      method: "DELETE",
      body: { id: comment._id }
    });
    toast.success("评论已删除");
    setComments((current) => current.filter((item) => item._id !== comment._id));
    load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">店铺评论区</p>
            <h1 className="mt-2 text-3xl font-black">顾客反馈</h1>
            <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">查看顾客评价，登录后可发布评论。</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-right dark:bg-emerald-400/10">
            <p className="text-sm text-stone-500 dark:text-slate-400">平均评分</p>
            <p className="mt-1 text-3xl font-black text-emerald-700 dark:text-emerald-300">{statsText}</p>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="panel p-5">
        <h2 className="text-xl font-black">发布评论</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setForm({ ...form, rating })}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition ${
                form.rating >= rating
                  ? "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200"
                  : "border-stone-300 text-stone-400 dark:border-slate-700"
              }`}
            >
              <Star size={18} fill={form.rating >= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                form.tags.includes(tag)
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
                  : "bg-stone-100 text-stone-600 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <textarea
          className="input mt-4 min-h-28"
          placeholder="写下你的用餐体验"
          value={form.content}
          onChange={(event) => setForm({ ...form, content: event.target.value })}
          required
        />
        <button className="btn-primary mt-4" type="submit">
          <MessageSquare size={17} />
          发布评论
        </button>
      </form>

      <section className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)
        ) : comments.length ? (
          comments.map((comment) => (
            <article key={comment._id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{comment.user?.name || "匿名顾客"}</p>
                  <div className="mt-1 flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={15} fill={index < comment.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-500 dark:text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                  {isStaff && (
                    <button className="btn-secondary h-9 w-9 p-0 text-rose-600" onClick={() => remove(comment)} title="删除评论">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-slate-200">{comment.content}</p>
              {!!comment.tags?.length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {comment.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600 dark:bg-slate-900 dark:text-slate-300">{tag}</span>
                  ))}
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="panel p-6 text-sm text-stone-500 dark:text-slate-400">暂无评论。</div>
        )}
      </section>
    </div>
  );
}
