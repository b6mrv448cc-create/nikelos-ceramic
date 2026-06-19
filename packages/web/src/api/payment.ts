import { Hono } from "hono";
import { createHash } from "crypto";

const TERMINAL_KEY = process.env.TBANK_TERMINAL_KEY ?? "";
const SECRET_KEY = process.env.TBANK_SECRET_KEY ?? "";
const TBANK_API = "https://securepay.tinkoff.ru/v2";

/* ── Token: только плоские строковые/числовые поля, без Receipt/DATA ── */
function generateToken(params: Record<string, string | number | boolean>): string {
  const withSecret: Record<string, string | number | boolean> = { ...params, Password: SECRET_KEY };
  const sorted = Object.keys(withSecret)
    .sort()
    .map(key => String(withSecret[key]))
    .join("");
  return createHash("sha256").update(sorted).digest("hex");
}

const payment = new Hono()

  /* POST /api/payment/init */
  .post("/init", async (c) => {
    try {
      const body = await c.req.json<{
        orderId: string;
        amount: number;          // в копейках
        description: string;
        customerName: string;
        customerPhone: string;
        customerEmail?: string;
        successUrl?: string;
        failUrl?: string;
      }>();

      if (!TERMINAL_KEY || !SECRET_KEY) {
        console.error("TBANK keys missing! TERMINAL_KEY:", !!TERMINAL_KEY, "SECRET_KEY:", !!SECRET_KEY);
        return c.json({ ok: false, error: "Платёжный терминал не настроен" }, 500);
      }

      /* Плоские поля для токена */
      const flatParams: Record<string, string | number> = {
        TerminalKey: TERMINAL_KEY,
        Amount: body.amount,
        OrderId: body.orderId,
        Description: body.description.slice(0, 140),
        CustomerKey: body.customerPhone.replace(/\D/g, "").slice(0, 36),
        SuccessURL: body.successUrl ?? "",
        FailURL: body.failUrl ?? "",
      };

      const token = generateToken(flatParams as Record<string, string | number | boolean>);

      /* Полный payload — Receipt только если есть email или телефон */
      const receipt = {
        Phone: body.customerPhone,
        ...(body.customerEmail ? { Email: body.customerEmail } : {}),
        Taxation: "usn_income",
        Items: [
          {
            Name: body.description.slice(0, 128),
            Price: body.amount,       // цена в копейках
            Quantity: 1,
            Amount: body.amount,      // сумма = цена * кол-во
            Tax: "none",
            PaymentMethod: "full_prepayment",
            PaymentObject: "commodity",
          },
        ],
      };

      const payload = {
        ...flatParams,
        Token: token,
        DATA: {
          Phone: body.customerPhone,
          Name: body.customerName,
          ...(body.customerEmail ? { Email: body.customerEmail } : {}),
        },
        Receipt: receipt,
      };

      console.log("Sending to Т-Банк:", JSON.stringify({ ...payload, Token: "***" }, null, 2));

      const resp = await fetch(`${TBANK_API}/Init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json() as {
        Success: boolean;
        PaymentURL?: string;
        PaymentId?: string;
        Message?: string;
        Details?: string;
        ErrorCode?: string;
      };

      console.log("Т-Банк response:", JSON.stringify(data));

      if (!data.Success) {
        return c.json({
          ok: false,
          error: data.Message ?? "Ошибка Т-Банк",
          details: data.Details,
          code: data.ErrorCode,
        }, 400);
      }

      return c.json({ ok: true, paymentUrl: data.PaymentURL, paymentId: data.PaymentId });
    } catch (e) {
      console.error("Payment init error:", e);
      return c.json({ ok: false, error: "Внутренняя ошибка сервера" }, 500);
    }
  })

  /* GET /api/payment/status?paymentId=xxx */
  .get("/status", async (c) => {
    const paymentId = c.req.query("paymentId");
    if (!paymentId) return c.json({ ok: false, error: "paymentId required" }, 400);

    const params: Record<string, string | number | boolean> = {
      TerminalKey: TERMINAL_KEY,
      PaymentId: paymentId,
    };
    const token = generateToken(params);

    const resp = await fetch(`${TBANK_API}/GetState`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, Token: token }),
    });
    const data = await resp.json() as { Success: boolean; Status?: string; Message?: string };

    return c.json({ ok: data.Success, status: data.Status, error: data.Message });
  });

export default payment;
