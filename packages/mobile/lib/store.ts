import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

// ─── Cart ──────────────────────────────────────────────────────────────────
export type CartItem = {
  id: number;
  name: string;
  price: string;
  priceNum: number;
  img: string;
  qty: number;
};

type CartStore = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (id: number) => void;
  inc: (id: number) => void;
  dec: (id: number) => void;
  clear: () => void;
  total: () => number;
};

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  add: (item) => {
    const existing = get().items.find((i) => i.id === item.id);
    if (existing) {
      set((s) => ({ items: s.items.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) }));
    } else {
      set((s) => ({ items: [...s.items, { ...item, qty: 1 }] }));
    }
  },
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  inc: (id) => set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, qty: i.qty + 1 } : i) })),
  dec: (id) => set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i) })),
  clear: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.priceNum * i.qty, 0),
}));

// ─── Admin auth ────────────────────────────────────────────────────────────
type AdminStore = {
  token: string | null;
  setToken: (t: string | null) => void;
};

export const useAdmin = create<AdminStore>((set) => ({
  token: null,
  setToken: (token) => {
    set({ token });
    if (token) {
      SecureStore.setItemAsync("admin_token", token).catch(() => {});
    } else {
      SecureStore.deleteItemAsync("admin_token").catch(() => {});
    }
  },
}));

export async function loadAdminToken() {
  try {
    const t = await SecureStore.getItemAsync("admin_token");
    if (t) useAdmin.getState().setToken(t);
  } catch {}
}

// ─── Orders ────────────────────────────────────────────────────────────────
export type Order = {
  id: string;
  date: string;
  status: "pending" | "paid" | "shipped" | "delivered";
  items: CartItem[];
  total: number;
};

type OrderStore = {
  orders: Order[];
  addOrder: (o: Order) => void;
};

export const useOrders = create<OrderStore>((set) => ({
  orders: [],
  addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
}));
