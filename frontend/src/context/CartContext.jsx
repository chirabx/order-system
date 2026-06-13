import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../lib/api";

const CartContext = createContext(null);

function ensureGuest() {
  let id = localStorage.getItem("guest_id");
  if (!id) {
    id = `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("guest_id", id);
  }
  let name = localStorage.getItem("guest_name");
  if (!name) {
    name = `顾客${id.slice(-4)}`;
    localStorage.setItem("guest_name", name);
  }
  return { guestId: id, guestName: name };
}

export function CartProvider({ tableId, accessCode = "", children }) {
  const [cart, setCart] = useState({ participants: [], totalAmount: 0 });
  const guest = ensureGuest();

  async function refresh() {
    const data = await api(`/api/cart?tableId=${tableId}&accessCode=${encodeURIComponent(accessCode)}`);
    setCart(data);
    return data;
  }

  async function add(menuItem, quantity = 1) {
    const data = await api("/api/cart/add", {
      method: "POST",
      body: { tableId, accessCode, menuItemId: menuItem._id, quantity, ...guest }
    });
    setCart(data);
    return data;
  }

  async function update(menuItemId, quantity, remark = "") {
    const data = await api("/api/cart/update", {
      method: "PUT",
      body: { tableId, accessCode, menuItemId, quantity, remark, ...guest }
    });
    setCart(data);
    return data;
  }

  async function remove(menuItemId) {
    const data = await api("/api/cart/remove", {
      method: "DELETE",
      body: { tableId, accessCode, menuItemId, ...guest }
    });
    setCart(data);
    return data;
  }

  const value = useMemo(
    () => ({ cart, setCart, refresh, add, update, remove, guest, accessCode }),
    [cart, tableId, accessCode]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
