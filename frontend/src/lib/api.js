import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

export function getToken() {
  return localStorage.getItem("order_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("order_token", token);
  else localStorage.removeItem("order_token");
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
  });

  const payload = await response.json().catch(() => ({
    success: false,
    message: "服务器返回了无效响应"
  }));

  if (!response.ok || !payload.success) {
    toast.error(payload.message || "请求失败");
    throw new Error(payload.message || "请求失败");
  }
  return payload.data;
}

export async function apiWithToast(path, options, loadingText = "处理中...") {
  const id = toast.loading(loadingText);
  try {
    const data = await api(path, options);
    toast.success("操作成功", { id });
    return data;
  } catch (error) {
    toast.error(error.message, { id });
    throw error;
  }
}
