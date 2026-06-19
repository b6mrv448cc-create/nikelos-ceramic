import { Hono } from "hono";
import { loadProducts, saveProducts, nextId, type Product } from "./products-store";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "nikolos2025";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "nk-admin-secret-f7x9q2025";

const admin = new Hono()

  /* POST /api/admin/login */
  .post("/login", async (c) => {
    const { password } = await c.req.json<{ password: string }>();
    if (password !== ADMIN_PASSWORD) {
      return c.json({ ok: false, error: "Неверный пароль" }, 401);
    }
    return c.json({ ok: true, token: ADMIN_TOKEN }, 200);
  })

  /* Auth middleware for all routes below */
  .use("/*", async (c, next) => {
    const auth = c.req.header("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token !== ADMIN_TOKEN) {
      return c.json({ ok: false, error: "Unauthorized" }, 401);
    }
    await next();
  })

  /* GET /api/admin/products */
  .get("/products", (c) => {
    const products = loadProducts();
    return c.json({ ok: true, products }, 200);
  })

  /* POST /api/admin/products — create */
  .post("/products", async (c) => {
    const body = await c.req.json<Omit<Product, "id">>();
    const products = loadProducts();
    const product: Product = { ...body, id: nextId(products) };
    products.push(product);
    saveProducts(products);
    return c.json({ ok: true, product }, 200);
  })

  /* PUT /api/admin/products/:id — update */
  .put("/products/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json<Partial<Product>>();
    const products = loadProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return c.json({ ok: false, error: "Не найден" }, 404);
    products[idx] = { ...products[idx], ...body, id };
    saveProducts(products);
    return c.json({ ok: true, product: products[idx] }, 200);
  })

  /* DELETE /api/admin/products/:id */
  .delete("/products/:id", (c) => {
    const id = Number(c.req.param("id"));
    const products = loadProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return c.json({ ok: false, error: "Не найден" }, 404);
    products.splice(idx, 1);
    saveProducts(products);
    return c.json({ ok: true }, 200);
  })

  /* POST /api/admin/products/reorder — save order */
  .post("/products/reorder", async (c) => {
    const { ids } = await c.req.json<{ ids: number[] }>();
    const products = loadProducts();
    const sorted = ids.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
    // append any products not in ids list
    const rest = products.filter(p => !ids.includes(p.id));
    saveProducts([...sorted, ...rest]);
    return c.json({ ok: true }, 200);
  });

export default admin;
