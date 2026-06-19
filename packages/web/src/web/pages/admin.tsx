import { useState, useEffect, useCallback } from "react";

interface Product {
  id: number;
  name: string;
  desc: string;
  price: string;
  priceNum: number;
  img: string;
  tag: string;
  weight: number;
  boxL: number;
  boxW: number;
  boxH: number;
  stock?: number;
  hidden?: boolean;
}

const TAGS = ["Стакан", "Кружка", "Пиала", "Тарелка", "Декор", "Украшения", "Тест"];

const EMPTY: Omit<Product, "id"> = {
  name: "", desc: "", price: "", priceNum: 0,
  img: "", tag: "Стакан", weight: 450,
  boxL: 20, boxW: 15, boxH: 15,
  stock: undefined, hidden: false,
};

function getToken() { return localStorage.getItem("admin_token") ?? ""; }
function authHeader() { return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }; }

/* ── Field input ── */
function Field({ label, value, onChange, type = "text", hint }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] tracking-[0.15em] uppercase text-graphite-light font-medium">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        className="border border-sand rounded-none px-3 py-2 text-sm font-body bg-warm-white text-graphite focus:outline-none focus:border-graphite transition-colors"
      />
      {hint && <span className="text-[10px] text-beige">{hint}</span>}
    </label>
  );
}

/* ── Product form modal ── */
function ProductModal({ product, onSave, onClose }: {
  product: Partial<Product> & { id?: number };
  onSave: (p: Partial<Product>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Product, "id">>({
    name: product.name ?? "",
    desc: product.desc ?? "",
    price: product.price ?? "",
    priceNum: product.priceNum ?? 0,
    img: product.img ?? "",
    tag: product.tag ?? "Стакан",
    weight: product.weight ?? 450,
    boxL: product.boxL ?? 20,
    boxW: product.boxW ?? 15,
    boxH: product.boxH ?? 15,
    stock: product.stock,
    hidden: product.hidden ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (v: string) =>
    setForm(prev => ({ ...prev, [key]: ["priceNum","weight","boxL","boxW","boxH","stock"].includes(key) ? (v === "" ? undefined : Number(v)) : v }));

  async function handleSave() {
    if (!form.name.trim()) { setError("Введите название"); return; }
    if (!form.priceNum) { setError("Введите цену (число)"); return; }
    setSaving(true);
    setError("");
    try { await onSave(form); onClose(); }
    catch (e: any) { setError(e.message ?? "Ошибка сохранения"); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-graphite/60 backdrop-blur-sm">
      <div className="bg-warm-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand">
          <h2 className="font-display text-xl font-light text-graphite">
            {product.id !== undefined ? "Редактировать товар" : "Новый товар"}
          </h2>
          <button onClick={onClose} className="text-beige hover:text-graphite transition-colors text-2xl leading-none">×</button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Название" value={form.name} onChange={set("name")} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Описание" value={form.desc} onChange={set("desc")} />
          </div>
          <Field label="Цена (текст)" value={form.price} onChange={set("price")} hint='Например: "от 1 900 ₽"' />
          <Field label="Цена (число, ₽)" value={form.priceNum} onChange={set("priceNum")} type="number" hint="Для корзины и оплаты" />
          <Field label="Фото (путь)" value={form.img} onChange={set("img")} hint='Например: /item-pause.jpg' />

          <label className="flex flex-col gap-1">
            <span className="text-[11px] tracking-[0.15em] uppercase text-graphite-light font-medium">Категория</span>
            <select
              value={form.tag}
              onChange={e => setForm(prev => ({ ...prev, tag: e.target.value }))}
              className="border border-sand px-3 py-2 text-sm font-body bg-warm-white text-graphite focus:outline-none focus:border-graphite transition-colors"
            >
              {TAGS.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>

          <Field label="Вес с упаковкой (г)" value={form.weight} onChange={set("weight")} type="number" />
          <Field label="Коробка: длина (см)" value={form.boxL} onChange={set("boxL")} type="number" />
          <Field label="Коробка: ширина (см)" value={form.boxW} onChange={set("boxW")} type="number" />
          <Field label="Коробка: высота (см)" value={form.boxH} onChange={set("boxH")} type="number" />
          <Field label="Остаток (шт.)" value={form.stock ?? ""} onChange={set("stock")} type="number" hint="Оставьте пустым — без ограничений" />

          <label className="flex items-center gap-3 cursor-pointer sm:col-span-2">
            <input
              type="checkbox"
              checked={form.hidden ?? false}
              onChange={e => setForm(prev => ({ ...prev, hidden: e.target.checked }))}
              className="w-4 h-4 accent-graphite"
            />
            <span className="text-sm text-graphite-light">Скрыть товар с сайта</span>
          </label>

          {error && <p className="sm:col-span-2 text-red-600 text-sm">{error}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-6 py-2.5 border border-sand text-sm font-body text-graphite-light hover:border-graphite transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-graphite text-warm-white text-sm font-body hover:bg-accent transition-colors disabled:opacity-50">
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN ADMIN PAGE
══════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [authed, setAuthed] = useState(!!getToken());
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null | "new">(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterTag, setFilterTag] = useState("Все");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/products", { headers: authHeader() });
      const d = await r.json() as { ok: boolean; products: Product[] };
      if (d.ok) setProducts(d.products);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) loadProducts(); }, [authed, loadProducts]);

  async function handleLogin() {
    setLoginLoading(true); setLoginError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const d = await r.json() as { ok: boolean; token?: string; error?: string };
      if (d.ok && d.token) {
        localStorage.setItem("admin_token", d.token);
        setAuthed(true);
      } else {
        setLoginError(d.error ?? "Ошибка входа");
      }
    } catch { setLoginError("Нет соединения"); }
    setLoginLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    setAuthed(false);
    setProducts([]);
  }

  async function handleSave(data: Partial<Product>) {
    if (editProduct === "new") {
      const r = await fetch("/api/admin/products", {
        method: "POST", headers: authHeader(), body: JSON.stringify(data),
      });
      const d = await r.json() as { ok: boolean };
      if (!d.ok) throw new Error("Не удалось создать товар");
      showToast("Товар добавлен");
    } else if (editProduct) {
      const r = await fetch(`/api/admin/products/${editProduct.id}`, {
        method: "PUT", headers: authHeader(), body: JSON.stringify(data),
      });
      const d = await r.json() as { ok: boolean };
      if (!d.ok) throw new Error("Не удалось обновить товар");
      showToast("Сохранено");
    }
    await loadProducts();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/products/${id}`, { method: "DELETE", headers: authHeader() });
    setDeleteId(null);
    showToast("Удалено");
    await loadProducts();
  }

  async function toggleHidden(p: Product) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT", headers: authHeader(),
      body: JSON.stringify({ hidden: !p.hidden }),
    });
    showToast(p.hidden ? "Товар показан" : "Товар скрыт");
    await loadProducts();
  }

  async function adjustStock(p: Product, delta: number) {
    const current = p.stock ?? null;
    const next = current === null ? (delta > 0 ? delta : 0) : Math.max(0, current + delta);
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT", headers: authHeader(),
      body: JSON.stringify({ stock: next }),
    });
    await loadProducts();
  }

  const filtered = products.filter(p =>
    (filterTag === "Все" || p.tag === filterTag) &&
    (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  /* ── Login screen ── */
  if (!authed) return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-warm-white shadow-lg p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <img src="/logo.png" alt="Nikolos Ceramic" className="w-16 h-auto mb-2" />
          <h1 className="font-display text-2xl font-light text-graphite">Вход в панель</h1>
          <p className="text-sm text-graphite-light">Только для администратора</p>
        </div>
        <div className="flex flex-col gap-3">
          <Field label="Пароль" value={password} onChange={setPassword} type="password" />
          {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
          <button
            onClick={handleLogin}
            disabled={loginLoading}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="w-full py-3 bg-graphite text-warm-white font-body text-sm tracking-[0.12em] uppercase hover:bg-accent transition-colors disabled:opacity-50"
          >
            {loginLoading ? "Вход..." : "Войти"}
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Admin panel ── */
  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Header */}
      <header className="bg-graphite text-warm-white px-6 md:px-10 py-4 flex items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src="/logo-white.png" alt="Nikolos" className="h-7 opacity-90" />
          <span className="text-[11px] tracking-[0.2em] uppercase text-warm-white/50">Админ-панель</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-[11px] tracking-[0.15em] uppercase text-warm-white/60 hover:text-warm-white transition-colors">
            ← На сайт
          </a>
          <button onClick={handleLogout} className="text-[11px] tracking-[0.15em] uppercase text-warm-white/60 hover:text-warm-white transition-colors">
            Выйти
          </button>
        </div>
      </header>

      <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-sand px-3 py-2 text-sm bg-warm-white text-graphite focus:outline-none focus:border-graphite w-52"
            />
            <select
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              className="border border-sand px-3 py-2 text-sm bg-warm-white text-graphite focus:outline-none focus:border-graphite"
            >
              {["Все", ...TAGS].map(t => <option key={t}>{t}</option>)}
            </select>
            <span className="text-sm text-graphite-light">{filtered.length} товаров</span>
          </div>
          <button
            onClick={() => setEditProduct("new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-graphite text-warm-white text-sm hover:bg-accent transition-colors"
          >
            <span className="text-lg leading-none">+</span> Добавить товар
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-graphite-light text-sm py-12 text-center">Загрузка...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-sand text-left">
                  <th className="pb-3 pr-4 text-[10px] tracking-[0.2em] uppercase text-beige font-medium w-12">Фото</th>
                  <th className="pb-3 pr-4 text-[10px] tracking-[0.2em] uppercase text-beige font-medium">Название</th>
                  <th className="pb-3 pr-4 text-[10px] tracking-[0.2em] uppercase text-beige font-medium">Категория</th>
                  <th className="pb-3 pr-4 text-[10px] tracking-[0.2em] uppercase text-beige font-medium">Цена</th>
                  <th className="pb-3 pr-4 text-[10px] tracking-[0.2em] uppercase text-beige font-medium text-center">Остаток</th>
                  <th className="pb-3 pr-4 text-[10px] tracking-[0.2em] uppercase text-beige font-medium text-center">Видимость</th>
                  <th className="pb-3 text-[10px] tracking-[0.2em] uppercase text-beige font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className={`border-b border-sand/60 hover:bg-warm-white transition-colors ${p.hidden ? "opacity-40" : ""}`}>
                    <td className="py-3 pr-4">
                      <img src={p.img} alt={p.name} className="w-10 h-10 object-cover" />
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-medium text-graphite">{p.name}</span>
                      <p className="text-[11px] text-beige mt-0.5 line-clamp-1 max-w-[220px]">{p.desc}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-[10px] tracking-[0.12em] uppercase bg-sand/50 px-2 py-1 text-graphite-light">{p.tag}</span>
                    </td>
                    <td className="py-3 pr-4 text-graphite-light whitespace-nowrap">{p.price}</td>
                    <td className="py-3 pr-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => adjustStock(p, -1)}
                          className="w-6 h-6 flex items-center justify-center border border-sand text-graphite-light hover:border-graphite hover:text-graphite transition-colors text-sm">−</button>
                        <span className="w-10 text-center text-graphite font-medium text-sm">
                          {p.stock !== undefined && p.stock !== null ? p.stock : "∞"}
                        </span>
                        <button onClick={() => adjustStock(p, +1)}
                          className="w-6 h-6 flex items-center justify-center border border-sand text-graphite-light hover:border-graphite hover:text-graphite transition-colors text-sm">+</button>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <button onClick={() => toggleHidden(p)}
                        className={`text-[10px] tracking-[0.1em] uppercase px-2 py-1 border transition-colors ${p.hidden ? "border-beige text-beige hover:border-graphite hover:text-graphite" : "border-graphite text-graphite hover:border-beige hover:text-beige"}`}>
                        {p.hidden ? "Скрыт" : "Виден"}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditProduct(p)}
                          className="text-[11px] tracking-[0.1em] uppercase text-accent hover:text-accent-dark transition-colors px-2 py-1">
                          Изменить
                        </button>
                        <button onClick={() => setDeleteId(p.id)}
                          className="text-[11px] tracking-[0.1em] uppercase text-red-400 hover:text-red-600 transition-colors px-2 py-1">
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-graphite-light">Ничего не найдено</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editProduct !== null && (
        <ProductModal
          product={editProduct === "new" ? { ...EMPTY } : editProduct}
          onSave={handleSave}
          onClose={() => setEditProduct(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-graphite/60 backdrop-blur-sm">
          <div className="bg-warm-white p-8 max-w-sm w-full shadow-2xl flex flex-col gap-5">
            <h3 className="font-display text-xl font-light text-graphite">Удалить товар?</h3>
            <p className="text-sm text-graphite-light">Это действие нельзя отменить.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-5 py-2 border border-sand text-sm text-graphite-light hover:border-graphite transition-colors">
                Отмена
              </button>
              <button onClick={() => handleDelete(deleteId)} className="px-5 py-2 bg-red-500 text-white text-sm hover:bg-red-600 transition-colors">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[400] bg-graphite text-warm-white px-5 py-3 text-sm shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
