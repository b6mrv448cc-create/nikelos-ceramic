import { Hono } from 'hono';
import { cors } from "hono/cors"
import payment from "./payment";
import cdek from "./cdek";
import admin from "./admin";
import productsApi from "./products";

const app = new Hono()
  .basePath('api')
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))
  .get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }))
  .get('/health', (c) => c.json({ status: 'ok' }))
  .route('/payment', payment)
  .route('/cdek', cdek)
  .route('/admin', admin)
  .route('/products', productsApi);

export type AppType = typeof app;
export default app;
