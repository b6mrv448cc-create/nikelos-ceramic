import { Hono } from "hono";
import { loadProducts } from "./products-store";

const products = new Hono()

  /* GET /api/products — public, returns non-hidden products */
  .get("/", (c) => {
    const all = loadProducts();
    return c.json({ ok: true, products: all.filter(p => !p.hidden) }, 200);
  });

export default products;
