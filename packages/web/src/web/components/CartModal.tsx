import { useState, useEffect, useRef, useCallback } from "react";
import { useCart } from "../lib/cart";
import gsap from "gsap";

/* ── helpers ─────────────────────────────────────────── */
function fmt(n: number) { return n.toLocaleString("ru-RU") + " ₽"; }
function generateOrderId() { return "NK-" + Date.now() + "-" + Math.floor(Math.random() * 1000); }

type Step = "cart" | "delivery" | "form" | "paying";

interface FormData { name: string; phone: string; email: string; comment: string; }
interface CityOption { code: number; name: string; region: string; }
interface Tariff { code: number; name: string; price: number; days: string; type: "pvz" | "courier"; }
interface PvzPoint { code: string; name: string; address: string; workTime: string; phone: string; lat: number; lon: number; }

/* ── CartModal ───────────────────────────────────────── */
export default function CartModal({ onClose }: { onClose: () => void }) {
  const { items, remove, updateQty, clear, total, count } = useCart();
  const [step, setStep] = useState<Step>("cart");

  /* delivery state */
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [tariffsLoading, setTariffsLoading] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);
  const [pvzList, setPvzList] = useState<PvzPoint[]>([]);
  const [pvzTotal, setPvzTotal] = useState(0);
  const [pvzPage, setPvzPage] = useState(0);
  const [pvzLoadingMore, setPvzLoadingMore] = useState(false);
  const [pvzLoading, setPvzLoading] = useState(false);
  const [pvzQuery, setPvzQuery] = useState("");
  const [selectedPvz, setSelectedPvz] = useState<PvzPoint | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  /* form state */
  const [form, setForm] = useState<FormData>({ name: "", phone: "", email: "", comment: "" });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* entrance animation */
  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35 });
    gsap.fromTo(panelRef.current, { x: "100%" }, { x: "0%", duration: 0.45, ease: "power3.out" });
  }, []);

  const handleClose = () => {
    gsap.to(panelRef.current, { x: "100%", duration: 0.35, ease: "power3.in" });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, onComplete: onClose });
  };

  useEffect(() => {
    gsap.fromTo(panelRef.current,
      { opacity: 0.6, scale: 0.99 },
      { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" }
    );
  }, [step]);

  /* ── City search ── */
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCityInput = useCallback((val: string) => {
    setCityQuery(val);
    setSelectedCity(null);
    setTariffs([]);
    setSelectedTariff(null);
    setPvzList([]);
    setPvzTotal(0);
    setPvzPage(0);
    setPvzQuery("");
    setSelectedPvz(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.length < 2) { setCities([]); return; }
    searchTimer.current = setTimeout(async () => {
      setCityLoading(true);
      try {
        const res = await fetch(`/api/cdek/cities?q=${encodeURIComponent(val)}`);
        const data = await res.json() as { ok: boolean; cities: CityOption[] };
        setCities(data.cities ?? []);
      } catch { /* ignore */ }
      setCityLoading(false);
    }, 400);
  }, []);

  /* ── Load tariffs when city selected ── */
  const handleSelectCity = useCallback(async (city: CityOption) => {
    setSelectedCity(city);
    setCityQuery(city.name + (city.region ? `, ${city.region}` : ""));
    setCities([]);
    setTariffs([]);
    setSelectedTariff(null);
    setPvzList([]);
    setSelectedPvz(null);
    setTariffsLoading(true);
    try {
      const totalWeight = items.reduce((s, i) => s + (i.weight ?? 500) * i.quantity, 0);
      const boxL = items.reduce((m, i) => Math.max(m, i.boxL ?? 15), 0);
      const boxW = items.reduce((m, i) => Math.max(m, i.boxW ?? 15), 0);
      const boxH = items.reduce((m, i) => Math.max(m, i.boxH ?? 15), 0);
      const res = await fetch("/api/cdek/tariffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityCode: city.code, totalWeight, boxL, boxW, boxH }),
      });
      const data = await res.json() as { ok: boolean; tariffs: Tariff[]; error?: string };
      if (data.ok) setTariffs(data.tariffs);
      else setApiError(data.error ?? "Ошибка расчёта доставки");
    } catch { setApiError("Не удалось рассчитать доставку"); }
    setTariffsLoading(false);
  }, [items]);

  /* ── Load PVZ (first page) ── */
  const fetchPvz = useCallback(async (cityCode: number, q: string, page: number, append: boolean) => {
    if (page === 1 && !append) setPvzLoading(true);
    else setPvzLoadingMore(true);
    try {
      const params = new URLSearchParams({
        cityCode: String(cityCode),
        page: String(page),
        ...(q.trim() ? { q: q.trim() } : {}),
      });
      const res = await fetch(`/api/cdek/pvz?${params}`);
      const data = await res.json() as { ok: boolean; pvz: PvzPoint[]; total: number; page: number; pages: number };
      if (data.ok) {
        setPvzList(prev => append ? [...prev, ...data.pvz] : data.pvz);
        setPvzTotal(data.total);
        setPvzPage(page);
      }
    } catch { /* ignore */ }
    setPvzLoading(false);
    setPvzLoadingMore(false);
  }, []);

  /* ── Load PVZ when PVZ-tariff selected ── */
  const handleSelectTariff = useCallback(async (tariff: Tariff) => {
    setSelectedTariff(tariff);
    setSelectedPvz(null);
    setDeliveryAddress("");
    setPvzQuery("");
    setPvzList([]);
    setPvzTotal(0);
    setPvzPage(0);
    if (tariff.type === "pvz" && selectedCity) {
      fetchPvz(selectedCity.code, "", 0, false);
    }
  }, [selectedCity, fetchPvz]);

  /* ── PVZ search debounce ── */
  const pvzSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlePvzSearch = useCallback((val: string) => {
    setPvzQuery(val);
    setSelectedPvz(null);
    if (pvzSearchTimer.current) clearTimeout(pvzSearchTimer.current);
    if (!selectedCity) return;
    pvzSearchTimer.current = setTimeout(() => {
      fetchPvz(selectedCity.code, val, 0, false);
    }, 400);
  }, [selectedCity, fetchPvz]);

  /* ── Form validation ── */
  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Введите имя";
    if (!/^[\d\+][\d\s\-\(\)]{8,}$/.test(form.phone.trim())) e.phone = "Введите корректный телефон";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Некорректный email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit → Т-Банк → после оплаты СДЭК ── */
  const handlePay = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    setStep("paying");

    const description = items.map(i => `${i.name} x${i.quantity}`).join(", ");
    const orderId = generateOrderId();
    const origin = window.location.origin;
    const deliveryPrice = selectedTariff?.price ?? 0;
    const grandTotal = total + deliveryPrice;

    // Сохраняем данные для СДЭК в sessionStorage — прочитаем после редиректа
    const cdekData = {
      orderId,
      cityCode: selectedCity?.code,
      tariffCode: selectedTariff?.code,
      pvzCode: selectedPvz?.code ?? null,
      address: deliveryAddress || selectedPvz?.address || "",
      items: items.map(i => ({ name: i.name, price: i.price * 100, quantity: i.quantity })),
      totalWeight: items.reduce((s, i) => s + (i.weight ?? 500) * i.quantity, 0),
      boxL: items.reduce((m, i) => Math.max(m, i.boxL ?? 15), 0),
      boxW: items.reduce((m, i) => Math.max(m, i.boxW ?? 15), 0),
      boxH: items.reduce((m, i) => Math.max(m, i.boxH ?? 15), 0),
      customerName: form.name,
      customerPhone: form.phone,
      customerEmail: form.email || null,
    };
    sessionStorage.setItem("cdek_pending", JSON.stringify(cdekData));

    try {
      const res = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: grandTotal * 100,
          description: description + (selectedTariff ? ` + доставка СДЭК` : ""),
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email || undefined,
          successUrl: `${origin}/?payment=success&orderId=${orderId}`,
          failUrl: `${origin}/?payment=fail&orderId=${orderId}`,
        }),
      });

      const data = await res.json() as { ok: boolean; paymentUrl?: string; paymentId?: string; error?: string };

      if (data.ok && data.paymentUrl) {
        // Сохраняем paymentId тоже
        const pending = JSON.parse(sessionStorage.getItem("cdek_pending") ?? "{}");
        sessionStorage.setItem("cdek_pending", JSON.stringify({ ...pending, paymentId: data.paymentId }));
        clear();
        window.location.href = data.paymentUrl;
      } else {
        setApiError(data.error ?? "Ошибка при создании платежа");
        setStep("form");
        setLoading(false);
      }
    } catch {
      setApiError("Нет соединения. Попробуйте ещё раз.");
      setStep("form");
      setLoading(false);
    }
  };

  const canProceedDelivery = selectedTariff && (
    selectedTariff.type === "courier" ? deliveryAddress.trim().length > 5 : selectedPvz !== null
  );
  const deliveryTotal = total + (selectedTariff?.price ?? 0);

  const stepLabels: Record<Step, string> = {
    cart: "Корзина",
    delivery: "Доставка",
    form: "Оформление",
    paying: "Оплата",
  };
  const stepOrder: Step[] = ["cart", "delivery", "form", "paying"];

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[9990] flex justify-end"
      style={{ background: "rgba(58,53,48,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="absolute inset-0" onClick={handleClose} />

      <div ref={panelRef} className="relative z-10 w-full max-w-[540px] h-full bg-cream flex flex-col shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-7 border-b border-sand">
          <div>
            <p className="font-body text-[11px] font-normal tracking-[0.2em] uppercase text-graphite-light mb-1">
              {stepLabels[step]}
            </p>
            <h2 className="font-display text-[28px] font-light text-graphite leading-tight">
              {step === "cart" && <>{count} {declItems(count)}</>}
              {step === "delivery" && "Способ доставки"}
              {step === "form" && "Ваши данные"}
              {step === "paying" && "Переходим к оплате…"}
            </h2>
          </div>
          <button onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center text-graphite-light hover:text-graphite transition-colors"
            aria-label="Закрыть">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Steps indicator ── */}
        <div className="flex gap-0 border-b border-sand">
          {stepOrder.slice(0, 3).map((s, i) => (
            <div key={s} className={`flex-1 h-0.5 transition-all duration-500 ${
              stepOrder.indexOf(step) >= i ? "bg-accent" : "bg-sand"
            }`} />
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* CART */}
          {step === "cart" && (
            <div className="p-8">
              {items.length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-display text-[22px] font-light text-graphite-light mb-3">Корзина пуста</p>
                  <p className="font-body text-sm text-beige">Выберите изделие из коллекции</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-5 items-start pb-5 border-b border-sand last:border-0 last:pb-0">
                      <div className="w-[80px] h-[96px] flex-shrink-0 overflow-hidden bg-sand">
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-[18px] font-normal text-graphite mb-1 leading-snug">{item.name}</h3>
                        <p className="font-body text-[13px] text-graphite-light mb-3">{item.priceLabel}</p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)}
                            className="w-7 h-7 border border-sand flex items-center justify-center text-graphite hover:border-graphite transition-colors font-light text-lg leading-none">−</button>
                          <span className="font-body text-sm font-normal text-graphite w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="w-7 h-7 border border-sand flex items-center justify-center text-graphite hover:border-graphite transition-colors font-light text-lg leading-none">+</button>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-3">
                        <span className="font-display text-[18px] font-normal text-graphite">{fmt(item.price * item.quantity)}</span>
                        <button onClick={() => remove(item.id)}
                          className="text-beige hover:text-graphite-light transition-colors" aria-label="Удалить">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DELIVERY */}
          {step === "delivery" && (
            <div className="p-8 flex flex-col gap-6">

              {/* City search */}
              <div>
                <label className={labelCls}>Город доставки *</label>
                <div className="relative">
                  <input
                    value={cityQuery}
                    onChange={e => handleCityInput(e.target.value)}
                    placeholder="Начните вводить город…"
                    className={fieldCls()}
                  />
                  {cityLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-sand border-t-accent rounded-full animate-spin" />
                    </div>
                  )}
                  {cities.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-cream border border-sand shadow-lg max-h-52 overflow-y-auto">
                      {cities.map(city => (
                        <button key={city.code} onClick={() => handleSelectCity(city)}
                          className="w-full text-left px-4 py-3 font-body text-[14px] text-graphite hover:bg-warm-white transition-colors border-b border-sand/50 last:border-0">
                          {city.name}{city.region ? <span className="text-graphite-light ml-2 text-[12px]">{city.region}</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tariffs */}
              {tariffsLoading && (
                <div className="flex items-center gap-3 py-4">
                  <div className="w-5 h-5 border-2 border-sand border-t-accent rounded-full animate-spin" />
                  <span className="font-body text-sm text-graphite-light">Рассчитываем стоимость…</span>
                </div>
              )}

              {tariffs.length > 0 && (
                <div>
                  <label className={labelCls}>Способ доставки</label>
                  <div className="flex flex-col gap-2">
                    {tariffs.map(t => (
                      <button key={t.code} onClick={() => handleSelectTariff(t)}
                        className={`w-full text-left px-4 py-4 border transition-all ${
                          selectedTariff?.code === t.code
                            ? "border-graphite bg-warm-white"
                            : "border-sand hover:border-graphite-light"
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                              selectedTariff?.code === t.code ? "border-graphite bg-graphite" : "border-sand"
                            }`} />
                            <div>
                              <p className="font-body text-[14px] font-medium text-graphite">{t.name}</p>
                              <p className="font-body text-[12px] text-graphite-light mt-0.5">
                                {t.type === "pvz" ? "До пункта выдачи" : "Курьер до двери"} · {t.days} дн.
                              </p>
                            </div>
                          </div>
                          <span className="font-display text-[18px] text-graphite">{fmt(t.price)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PVZ list */}
              {selectedTariff?.type === "pvz" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className={labelCls + " mb-0"}>Пункт выдачи</label>
                    {pvzTotal > 0 && !pvzLoading && (
                      <span className="font-body text-[11px] text-graphite-light">
                        {pvzTotal} {pvzTotal === 1 ? "пункт" : pvzTotal < 5 ? "пункта" : "пунктов"}
                      </span>
                    )}
                  </div>

                  {/* Search inside PVZ */}
                  <div className="relative">
                    <input
                      value={pvzQuery}
                      onChange={e => handlePvzSearch(e.target.value)}
                      placeholder="Поиск по адресу…"
                      className="w-full font-body text-[14px] text-graphite bg-warm-white border border-sand px-4 py-2.5 pr-10 outline-none focus:border-graphite transition-colors placeholder:text-beige"
                    />
                    {pvzQuery ? (
                      <button onClick={() => handlePvzSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-beige hover:text-graphite transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    ) : (
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-beige pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                    )}
                  </div>

                  {/* Selected PVZ card */}
                  {selectedPvz && (
                    <div className="p-4 border border-graphite bg-warm-white">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-body text-[12px] tracking-[0.12em] uppercase text-accent mb-1">Выбран пункт выдачи</p>
                          <p className="font-body text-[14px] font-medium text-graphite leading-snug">{selectedPvz.address}</p>
                          {selectedPvz.workTime && (
                            <p className="font-body text-[12px] text-graphite-light mt-1">{selectedPvz.workTime}</p>
                          )}
                          {selectedPvz.phone && (
                            <p className="font-body text-[12px] text-graphite-light">{selectedPvz.phone}</p>
                          )}
                        </div>
                        <button onClick={() => setSelectedPvz(null)}
                          className="text-beige hover:text-graphite transition-colors flex-shrink-0 mt-0.5" aria-label="Изменить">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {pvzLoading ? (
                    <div className="flex items-center gap-3 py-4">
                      <div className="w-4 h-4 border-2 border-sand border-t-accent rounded-full animate-spin" />
                      <span className="font-body text-sm text-graphite-light">Загружаем пункты выдачи…</span>
                    </div>
                  ) : pvzList.length === 0 ? (
                    <p className="font-body text-sm text-graphite-light py-2">
                      {pvzQuery ? "Ничего не найдено — попробуйте другой запрос" : "ПВЗ в этом городе не найдены"}
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2">
                        {pvzList.map(pvz => (
                          <button key={pvz.code} onClick={() => setSelectedPvz(pvz)}
                            className={`w-full text-left px-4 py-3 border transition-all ${
                              selectedPvz?.code === pvz.code
                                ? "border-graphite bg-warm-white"
                                : "border-sand hover:border-graphite-light"
                            }`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                                selectedPvz?.code === pvz.code ? "border-graphite bg-graphite" : "border-sand"
                              }`} />
                              <div className="min-w-0">
                                <p className="font-body text-[13px] font-medium text-graphite leading-snug">{pvz.address}</p>
                                {pvz.workTime && (
                                  <p className="font-body text-[11px] text-graphite-light mt-0.5">{pvz.workTime}</p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Load more */}
                      {pvzList.length < pvzTotal && (
                        <button
                          onClick={() => fetchPvz(selectedCity!.code, pvzQuery, pvzPage + 1, true)}
                          disabled={pvzLoadingMore}
                          className="w-full py-3 border border-sand font-body text-[13px] text-graphite-light hover:border-graphite hover:text-graphite transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                          {pvzLoadingMore ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-sand border-t-accent rounded-full animate-spin" />
                              Загружаем…
                            </>
                          ) : (
                            `Показать ещё (${pvzTotal - pvzList.length})`
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Courier address */}
              {selectedTariff?.type === "courier" && (
                <div>
                  <label className={labelCls}>Адрес доставки *</label>
                  <input
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="Улица, дом, квартира"
                    className={fieldCls()}
                  />
                </div>
              )}

              {apiError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 font-body text-sm">{apiError}</div>
              )}
            </div>
          )}

          {/* FORM */}
          {(step === "form" || step === "paying") && (
            <div className="p-8">
              {/* Order + delivery summary */}
              <div className="bg-warm-white border border-sand p-5 mb-8">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2 first:pt-0 border-b border-sand/60 last:border-0 last:pb-0">
                    <span className="font-body text-[14px] text-graphite-light">{item.name} × {item.quantity}</span>
                    <span className="font-body text-[14px] text-graphite">{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
                {selectedTariff && (
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-sand">
                    <span className="font-body text-[14px] text-graphite-light">
                      СДЭК · {selectedTariff.name}
                      {selectedPvz && <span className="block text-[11px] mt-0.5 text-beige truncate max-w-[220px]">{selectedPvz.address}</span>}
                    </span>
                    <span className="font-body text-[14px] text-graphite">{fmt(selectedTariff.price)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-5">
                <Field label="Ваше имя *" error={errors.name}>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Как к вам обращаться" className={fieldCls(errors.name)} />
                </Field>
                <Field label="Телефон *" error={errors.phone}>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+7 (___) ___-__-__" type="tel" className={fieldCls(errors.phone)} />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="для чека на почту" type="email" className={fieldCls(errors.email)} />
                </Field>
                <Field label="Комментарий">
                  <textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Пожелания к заказу…" rows={3}
                    className={fieldCls() + " resize-none"} />
                </Field>
              </div>

              {apiError && (
                <div className="mt-5 p-4 bg-red-50 border border-red-200 text-red-700 font-body text-sm">{apiError}</div>
              )}
            </div>
          )}

          {step === "paying" && (
            <div className="px-8 pb-8 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-sand border-t-accent rounded-full animate-spin" />
              <p className="font-body text-sm text-graphite-light">Создаём платёж…</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-8 py-6 border-t border-sand bg-cream">
          {step === "cart" && (
            <>
              <div className="flex justify-between items-center mb-5">
                <span className="font-body text-[15px] text-graphite-light">Итого</span>
                <span className="font-display text-[28px] font-normal text-graphite">{fmt(total)}</span>
              </div>
              <button disabled={items.length === 0} onClick={() => setStep("delivery")}
                className="w-full btn-main btn-solid text-center disabled:opacity-40 disabled:cursor-not-allowed">
                Выбрать доставку →
              </button>
            </>
          )}

          {step === "delivery" && (
            <div className="flex flex-col gap-3">
              {selectedTariff && (
                <div className="flex justify-between items-center mb-1">
                  <span className="font-body text-[15px] text-graphite-light">Товары + доставка</span>
                  <span className="font-display text-[24px] font-normal text-graphite">{fmt(deliveryTotal)}</span>
                </div>
              )}
              <button disabled={!canProceedDelivery} onClick={() => setStep("form")}
                className="w-full btn-main btn-solid text-center disabled:opacity-40 disabled:cursor-not-allowed">
                Оформить заказ →
              </button>
              <button onClick={() => setStep("cart")}
                className="w-full font-body text-[12px] tracking-[0.15em] uppercase text-graphite-light hover:text-graphite transition-colors py-2">
                ← Назад
              </button>
            </div>
          )}

          {step === "form" && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-body text-[15px] text-graphite-light">К оплате</span>
                <span className="font-display text-[28px] font-normal text-graphite">{fmt(deliveryTotal)}</span>
              </div>
              <button onClick={handlePay} disabled={loading}
                className="w-full btn-main btn-solid text-center disabled:opacity-50">
                {loading ? "Подождите…" : "Оплатить через Т-Банк →"}
              </button>
              <button onClick={() => setStep("delivery")}
                className="w-full font-body text-[12px] tracking-[0.15em] uppercase text-graphite-light hover:text-graphite transition-colors py-2">
                ← Назад
              </button>
            </div>
          )}

          {step === "paying" && (
            <p className="text-center font-body text-sm text-graphite-light">Переходим на страницу оплаты…</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── micro components ── */
const labelCls = "block font-body text-[12px] font-medium tracking-[0.15em] uppercase text-graphite-light mb-2";

function fieldCls(error?: string) {
  return `w-full font-body text-[15px] font-normal text-graphite bg-warm-white border ${
    error ? "border-red-300" : "border-sand"
  } px-4 py-3 outline-none focus:border-graphite transition-colors placeholder:text-beige`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error && <p className="mt-1 font-body text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

function declItems(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "изделие";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "изделия";
  return "изделий";
}
