import { Camera, Save } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    avatarUrl: user?.avatarUrl || "",
    oldPassword: "",
    newPassword: "",
    confirm: ""
  });

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 2) {
      toast.error("头像请控制在 2MB 内");
      return;
    }
    const avatarUrl = await readFileAsDataUrl(file);
    setForm((current) => ({ ...current, avatarUrl }));
  }

  async function submit(event) {
    event.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirm) {
      toast.error("两次输入的新密码不一致");
      return;
    }
    const data = await api("/api/auth/profile", {
      method: "PUT",
      body: {
        name: form.name,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      }
    });
    setUser(data.user);
    toast.success("资料已保存");
    setForm((current) => ({ ...current, oldPassword: "", newPassword: "", confirm: "" }));
  }

  if (!user) return <div className="panel p-8">请先登录。</div>;

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl panel p-6">
      <h1 className="text-2xl font-black">个人资料</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[180px_1fr]">
        <label className="group grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-100 dark:border-slate-700 dark:bg-slate-900">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="头像" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center text-stone-500 dark:text-slate-400">
              <Camera className="mx-auto" />
              <p className="mt-2 text-sm font-semibold">上传头像</p>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </label>
        <div className="space-y-4">
          <label className="block text-sm font-semibold">
            姓名
            <input className="input mt-1" value={form.name} onChange={update("name")} />
          </label>
          <label className="block text-sm font-semibold">
            {user.role === "customer" ? "手机号" : "账号"}
            <input className="input mt-1" value={user.role === "customer" ? user.phone || "" : user.account || ""} disabled />
          </label>
          <label className="block text-sm font-semibold">
            个人简介
            <textarea className="input mt-1 min-h-28" value={form.bio} onChange={update("bio")} />
          </label>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-semibold">
          旧密码
          <input className="input mt-1" type="password" value={form.oldPassword} onChange={update("oldPassword")} />
        </label>
        <label className="block text-sm font-semibold">
          新密码
          <input className="input mt-1" type="password" value={form.newPassword} onChange={update("newPassword")} />
        </label>
        <label className="block text-sm font-semibold">
          确认新密码
          <input className="input mt-1" type="password" value={form.confirm} onChange={update("confirm")} />
        </label>
      </div>
      <button className="btn-primary mt-6" type="submit"><Save size={17} />保存资料</button>
    </form>
  );
}
