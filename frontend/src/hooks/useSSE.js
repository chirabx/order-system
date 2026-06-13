import { useEffect } from "react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

export function useSSE(room, handlers = {}) {
  useEffect(() => {
    if (!room) return undefined;
    const source = new EventSource(`${API_URL}/api/events?room=${encodeURIComponent(room)}`);

    Object.entries(handlers).forEach(([event, handler]) => {
      source.addEventListener(event, (message) => {
        try {
          handler(JSON.parse(message.data));
        } catch {
          handler(message.data);
        }
      });
    });

    source.addEventListener("connected", () => {});
    source.onerror = () => {
      toast("实时连接正在重试", { icon: "•" });
    };

    return () => source.close();
  }, [room]);
}
