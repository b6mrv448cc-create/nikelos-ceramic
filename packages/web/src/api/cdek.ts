import { Hono } from "hono";

const CLIENT_ID = process.env.CDEK_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.CDEK_CLIENT_SECRET ?? "";
const CDEK_API = "https://api.cdek.ru/v2";

const FROM_CITY_CODE = 424; // Казань
const DEFAULT_WEIGHT = 500; // г
const DEFAULT_LENGTH = 15;
const DEFAULT_WIDTH = 15;
const DEFAULT_HEIGHT = 15;

/* ── OAuth токен (кэш) ── */
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const res = await fetch(`${CDEK_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  const data = await res.json() as { access_token?: string; expires_in?: number; error?: string };
  if (!data.access_token) throw new Error(data.error ?? "CDEK auth failed");
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000 };
  return tokenCache.token;
}

const cdek = new Hono()

  /* GET /api/cdek/cities?q=... */
  .get("/cities", async (c) => {
    try {
      const q = decodeURIComponent(c.req.query("q") ?? "").trim();
      if (q.length < 2) return c.json({ ok: true, cities: [] });
      const token = await getToken();
      const res = await fetch(
        `${CDEK_API}/location/cities?country_codes=RU&city=${encodeURIComponent(q)}&size=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json() as Array<{ code: number; city: string; region?: string; sub_region?: string }>;
      const cities = Array.isArray(data)
        ? data.map(c => ({ code: c.code, name: c.city, region: c.region ?? "" }))
        : [];
      return c.json({ ok: true, cities });
    } catch (e) {
      console.error("[CDEK] cities:", e);
      return c.json({ ok: false, error: "Ошибка поиска города" }, 500);
    }
  })

  /* POST /api/cdek/tariffs */
  .post("/tariffs", async (c) => {
    try {
      const { cityCode, totalWeight, boxL, boxW, boxH } = await c.req.json<{ cityCode: number; totalWeight?: number; boxL?: number; boxW?: number; boxH?: number }>();
      const token = await getToken();
      const weight = totalWeight ?? DEFAULT_WEIGHT;
      const res = await fetch(`${CDEK_API}/calculator/tarifflist`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from_location: { code: FROM_CITY_CODE },
          to_location: { code: cityCode },
          packages: [{ weight, length: boxL ?? DEFAULT_LENGTH, width: boxW ?? DEFAULT_WIDTH, height: boxH ?? DEFAULT_HEIGHT }],
        }),
      });
      const data = await res.json() as {
        tariff_codes?: Array<{ tariff_code: number; tariff_name: string; delivery_sum: number; period_min: number; period_max: number }>;
        errors?: Array<{ message: string }>;
      };
      if (data.errors?.length) return c.json({ ok: false, error: data.errors[0].message }, 400);

      // ПВЗ тарифы (склад-склад, склад-постамат)
      const PVZ_CODES = [136, 366, 368, 378, 184, 233];
      // Курьер тарифы (склад-дверь)
      const COURIER_CODES = [137, 139, 367, 369];

      const all = (data.tariff_codes ?? []);
      let tariffs = all
        .filter(t => [...PVZ_CODES, ...COURIER_CODES].includes(t.tariff_code))
        .map(t => ({
          code: t.tariff_code,
          name: t.tariff_name,
          price: Math.round(t.delivery_sum),
          days: `${t.period_min}–${t.period_max}`,
          type: PVZ_CODES.includes(t.tariff_code) ? "pvz" as const : "courier" as const,
        }))
        .sort((a, b) => a.price - b.price);

      // Если фильтр не дал результатов — берём 6 дешевейших
      if (tariffs.length === 0) {
        tariffs = all
          .sort((a, b) => a.delivery_sum - b.delivery_sum)
          .slice(0, 6)
          .map(t => ({
            code: t.tariff_code,
            name: t.tariff_name,
            price: Math.round(t.delivery_sum),
            days: `${t.period_min}–${t.period_max}`,
            type: "pvz" as const,
          }));
      }

      return c.json({ ok: true, tariffs });
    } catch (e) {
      console.error("[CDEK] tariffs:", e);
      return c.json({ ok: false, error: "Ошибка расчёта доставки" }, 500);
    }
  })

  /* GET /api/cdek/pvz?cityCode=44&q=улица&page=0 */
  .get("/pvz", async (c) => {
    try {
      const cityCode = c.req.query("cityCode");
      const q = decodeURIComponent(c.req.query("q") ?? "").trim().toLowerCase();
      const page = parseInt(c.req.query("page") ?? "0", 10);
      const PAGE_SIZE = 20;

      if (!cityCode) return c.json({ ok: false, error: "cityCode required" }, 400);

      const token = await getToken();

      // Грузим до 500 ПВЗ (5 страниц по 100)
      const allPvz: Array<{
        code: string; name: string;
        location: { address: string; address_full?: string; latitude: number; longitude: number };
        work_time: string;
        phones?: Array<{ number: string }>;
        type: string;
      }> = [];

      for (let p = 0; p < 5; p++) {
        const res = await fetch(
          `${CDEK_API}/deliverypoints?city_code=${cityCode}&type=PVZ&is_handout=true&size=100&page=${p}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const batch = await res.json() as typeof allPvz;
        if (!Array.isArray(batch) || batch.length === 0) break;
        allPvz.push(...batch);
        if (batch.length < 100) break;
      }

      // Фильтр по строке поиска
      const filtered = q
        ? allPvz.filter(p =>
            (p.location.address_full ?? p.location.address).toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q)
          )
        : allPvz;

      const total = filtered.length;
      const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

      const pvz = paginated.map(p => ({
        code: p.code,
        name: p.name,
        address: p.location.address_full ?? p.location.address,
        workTime: p.work_time,
        phone: p.phones?.[0]?.number ?? "",
        lat: p.location.latitude,
        lon: p.location.longitude,
      }));

      return c.json({ ok: true, pvz, total, page, pages: Math.ceil(total / PAGE_SIZE) });
    } catch (e) {
      console.error("[CDEK] pvz:", e);
      return c.json({ ok: false, error: "Ошибка загрузки ПВЗ" }, 500);
    }
  })

  /* POST /api/cdek/order */
  .post("/order", async (c) => {
    try {
      const body = await c.req.json<{
        orderId: string; paymentId: string;
        customerName: string; customerPhone: string; customerEmail?: string;
        cityCode: number; tariffCode: number;
        pvzCode?: string; address?: string;
        items: Array<{ name: string; price: number; quantity: number }>;
        totalWeight?: number;
        boxL?: number; boxW?: number; boxH?: number;
      }>();

      const token = await getToken();
      const nameParts = body.customerName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? body.customerName;
      const lastName = nameParts[1] ?? "-";
      const weight = body.totalWeight ?? DEFAULT_WEIGHT * body.items.reduce((s, i) => s + i.quantity, 0);

      const delivery = body.pvzCode
        ? { delivery_point: body.pvzCode }
        : { to_location: { code: body.cityCode, address: body.address ?? "" } };

      const payload = {
        tariff_code: body.tariffCode,
        number: body.orderId,
        comment: `Оплата Т-Банк #${body.paymentId}`,
        from_location: { code: FROM_CITY_CODE },
        ...delivery,
        sender: { name: "Nikolos Ceramic", phones: [{ number: "+79534075007" }] },
        recipient: {
          name: `${lastName} ${firstName}`,
          phones: [{ number: body.customerPhone }],
          ...(body.customerEmail ? { email: body.customerEmail } : {}),
        },
        packages: [{
          number: "1", weight,
          length: body.boxL ?? DEFAULT_LENGTH, width: body.boxW ?? DEFAULT_WIDTH, height: body.boxH ?? DEFAULT_HEIGHT,
          items: body.items.map((item, i) => ({
            name: item.name,
            ware_key: String(i + 1),
            payment: { value: 0 },
            cost: item.price / 100,
            weight: Math.round(weight / body.items.reduce((s, it) => s + it.quantity, 0)),
            amount: item.quantity,
          })),
        }],
      };

      const res = await fetch(`${CDEK_API}/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as {
        entity?: { uuid: string };
        requests?: Array<{ state: string; errors?: Array<{ message: string }> }>;
      };
      const req0 = data.requests?.[0];
      if (req0?.errors?.length) return c.json({ ok: false, error: req0.errors.map(e => e.message).join(", ") }, 400);
      return c.json({ ok: true, uuid: data.entity?.uuid });
    } catch (e) {
      console.error("[CDEK] order:", e);
      return c.json({ ok: false, error: "Ошибка создания заказа СДЭК" }, 500);
    }
  });

export default cdek;
