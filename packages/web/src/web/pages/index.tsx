import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCart } from "../lib/cart";
import CartModal from "../components/CartModal";
import QuickViewDrawer from "../components/QuickViewDrawer";

gsap.registerPlugin(ScrollTrigger);

/* ── Floating particle — upgraded ── */
const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function HeroParticle({ x, y, size, delay, dur, shape }: { x: number; y: number; size: number; delay: number; dur: number; shape?: "circle" | "line" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion || isMobile) return; // skip on mobile/reduced-motion
    const el = ref.current; if (!el) return;
    const isLine = shape === "line";
    const spawnX = () => x + (Math.random() - 0.5) * 160;
    const spawnY = () => y + (Math.random() - 0.5) * 100;
    const runLoop = () => {
      const sx = spawnX(), sy = spawnY();
      gsap.set(el, { x: sx, y: sy, opacity: 0, scale: 0, rotate: Math.random() * 180 });
      gsap.timeline({ delay: Math.random() * 3 })
        .to(el, { opacity: isLine ? 0.22 : 0.28, scale: 1, rotate: `+=${(Math.random()-0.5)*60}`, duration: 1.4, ease: "power2.out" })
        .to(el, {
          y: `-=${50 + Math.random() * 80}`,
          x: `+=${(Math.random() - 0.5) * 80}`,
          opacity: 0, rotate: `+=${(Math.random()-0.5)*40}`,
          duration: dur, ease: "power1.inOut",
          onComplete: runLoop,
        });
    };
    const t = setTimeout(runLoop, delay * 1000);
    return () => clearTimeout(t);
  }, []);
  if (isMobile) return null; // don't render on mobile at all
  if (shape === "line") {
    return (
      <div ref={ref} className="hero-particle absolute" style={{
        width: size * 12, height: 1, willChange: "transform, opacity",
        background: `linear-gradient(to right, transparent, rgba(253,250,246,0.45), transparent)`,
      }} />
    );
  }
  return (
    <div ref={ref} className="hero-particle absolute" style={{
      width: size, height: size, willChange: "transform, opacity",
      background: `radial-gradient(circle, rgba(253,250,246,0.55) 0%, rgba(253,250,246,0) 70%)`,
      borderRadius: "50%",
    }} />
  );
}

/* ─── DATA ───────────────────────────────────────────────── */
const products = [
  { id: 0,  name: "🧪 Тест-оплата (1 ₽)",              desc: "Тестовый товар для проверки оплаты. Можно удалить после проверки.",                              price: "1 ₽",         priceNum: 1,    img: "/item-pause.jpg",         tag: "Тест",       weight: 450, boxL: 20, boxW: 15, boxH: 15 },
  // ── Стаканы
  { id: 1,  name: "Стакан «PAUSE»",                     desc: "Тёмная глина, матовая поверхность, живая серебристая глазурь по краю.",                          price: "от 1 900 ₽",  priceNum: 1900, img: "/item-pause.jpg",         tag: "Стакан",     weight: 450, boxL: 20, boxW: 15, boxH: 15, variants: [{ label: "Вид 1", img: "/item-pause.jpg" }, { label: "Вид 2", img: "/item-pause-2.jpg" }] },
  { id: 2,  name: "Стакан «LOVE»",                      desc: "Та же форма, другое слово. Графитовая глина и тёплая глазурь.",                                   price: "от 1 900 ₽",  priceNum: 1900, img: "/item-love.jpg",          tag: "Стакан",     weight: 450, boxL: 20, boxW: 15, boxH: 15 },
  { id: 3,  name: "Стакан «МЕЧТАЙ»",                    desc: "Авторская надпись вдавлена в глину вручную. Каждая буква — след пальца мастера.",                 price: "от 1 900 ₽",  priceNum: 1900, img: "/item-mechta.jpg",        tag: "Стакан",     weight: 450, boxL: 20, boxW: 15, boxH: 15 },
  { id: 4,  name: "Стакан с рельефом",                  desc: "Вертикальные линии, бронзово-серая глазурь. Лаконично и тепло.",                                 price: "от 1 500 ₽",  priceNum: 1500, img: "/item-stakan-ribbed.jpg", tag: "Стакан",     weight: 450, boxL: 20, boxW: 15, boxH: 15, stock: 6 },
  { id: 25, name: "Стакан «Шахматы»",                   desc: "Молочный фарфор, синий шахматный орнамент. Та же клетка — в формате стакана.",                     price: "1 900 ₽",     priceNum: 1900, img: "/item-stakan-chess.jpg",  tag: "Стакан",     weight: 450, boxL: 20, boxW: 15, boxH: 15, stock: 1 },
  // ── Кружки
  { id: 8,  name: "Кружка с цветочками — голубая",      desc: "Авторская роспись голубыми цветами вручную. Фигурная ручка в виде цветка.",                       price: "2 400 ₽",     priceNum: 2400, img: "/item-mug-blue-1.jpg",    tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11 },
  { id: 11, name: "Кружка с цветочками — красная",      desc: "Авторская роспись красными цветами вручную. Фигурная ручка в виде цветка.",                       price: "2 400 ₽",     priceNum: 2400, img: "/item-mug-red-2.jpg",     tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11 },
  { id: 20, name: "Кружка «Лицо»",                      desc: "Тёмная глина, матовая глазурь. Рельефное лицо вылеплено вручную.",                                 price: "2 500 ₽",     priceNum: 2500, img: "/item-face-mug-1.jpg",     tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, variants: [{ label: "1", img: "/item-face-mug-1.jpg" }, { label: "2", img: "/item-face-mug-2.jpg" }] },
  { id: 19, name: "Кружка «Шахматы»",                   desc: "Молочный фарфор, синий шахматный орнамент. Та же идея — в формате кружки.",                        price: "2 500 ₽",     priceNum: 2500, img: "/item-checker-mug.jpg",    tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 3 },
  { id: 24, name: "Кружка «Минимализм»",                desc: "Тёмная глина, матовая серо-белая глазурь. Лаконичная форма без лишнего — только суть.",               price: "2 300 ₽",     priceNum: 2300, img: "/item-mug-minimal.jpg",     tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  { id: 26, name: "Кружка «Дерево»",                   desc: "Тёмная глина с текстурой дерева, круглая ручка. Тёплая и приятная в руках.",                          price: "2 300 ₽",     priceNum: 2300, img: "/item-mug-wood.jpg",         tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  { id: 27, name: "Кружка «Волны»",                    desc: "Светлая глина, синий волнистый орнамент. Лёгкая и изящная форма.",                                     price: "2 900 ₽",     priceNum: 2900, img: "/item-mug-waves.jpg",         tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  { id: 28, name: "Кружка «Пудель»",                   desc: "Авторская роспись — пудель синим контуром. Характер в каждой линии.",                                  price: "2 900 ₽",     priceNum: 2900, img: "/item-mug-poodle.jpg",        tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  { id: 34, name: "Кружка тёмная серебристая",         desc: "Тёмная глина, серебристая живая глазурь. Круглая ручка, приятно держать.",                                price: "2 300 ₽",     priceNum: 2300, img: "/item-mug-silver.jpg",        tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  { id: 37, name: "Кружка «Завитки»",                  desc: "Светлая глина, разноцветная роспись завитками. Яркая и живая.",                                           price: "2 500 ₽",     priceNum: 2500, img: "/item-mug-colorful.jpg",      tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  // ── Пиалы
  { id: 5,  name: "Пиалы с живой глазурью",             desc: "Каждая пиала — своего цвета. Розовая, бронзовая, тёмная, серая.",                                 price: "от 1 200 ₽",  priceNum: 1200, img: "/item-pialy-glaze.jpg",   tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15, stock: 12 },
  { id: 6,  name: "Пиалы «Дерево»",                     desc: "Текстура прожилок дерева в глазури. Тёплые оттенки охры и терракоты.",                            price: "от 1 200 ₽",  priceNum: 1200, img: "/item-pialy-wood.jpg",    tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15, stock: 4 },
  { id: 7,  name: "Пиалы «Шахматы»",                    desc: "Молочный фарфор снаружи, синий шахматный орнамент внутри.",                                       price: "от 2 400 ₽",  priceNum: 2400, img: "/item-checker-side.jpg",  tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15 },
  { id: 9,  name: "Пиала ручной работы",                desc: "Лаконичная форма, глубокая тёмная глазурь с белыми разводами. Минимализм в чистом виде.",         price: "1 500 ₽",     priceNum: 1500, img: "/item-piala-big.jpg",     tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15 },
  { id: 12, name: "Пиала синяя бирюзовая",              desc: "Насыщенная синяя глазурь с бирюзовыми переходами. Удобная форма для чая и закусок.",               price: "900 ₽",       priceNum: 900,  img: "/item-piala-blue.jpg",    tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15 },
  { id: 13, name: "Пиала для чайных церемоний",         desc: "Небольшая пиала для чайных церемоний. Тёмная матовая глазурь, удобно лежит в руках.",              price: "1 500 ₽",     priceNum: 1500, img: "/item-piala-tea-1.jpg",   tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15 },
  { id: 29, name: "Пиала тёмная авторская",            desc: "Тёмная глина, молочная глазурь снизу. Небольшая, удобно лежит в ладони.",                           price: "900 ₽",       priceNum: 900,  img: "/item-piala-dark-1.jpg",  tag: "Пиала",      weight: 300, boxL: 15, boxW: 15, boxH: 8,  stock: 1, variants: [{ label: "Вид 1", img: "/item-piala-dark-1.jpg" }, { label: "Вид 2", img: "/item-piala-dark-2.jpg" }, { label: "Вид 3", img: "/item-piala-dark-3.jpg" }] },
  { id: 30, name: "Пиала гранёная",                    desc: "Тёмная глина, серебристая живая глазурь сверху. Грани подчёркивают форму.",                          price: "1 500 ₽",     priceNum: 1500, img: "/item-piala-faceted.jpg",  tag: "Пиала",      weight: 350, boxL: 15, boxW: 15, boxH: 8,  stock: 1 },
  { id: 35, name: "Пиала с подтёками",                 desc: "Тёмная глина, молочная глазурь с живыми подтёками. Каждая — уникальна.",                                 price: "900 ₽",       priceNum: 900,  img: "/item-piala-drip.jpg",     tag: "Пиала",      weight: 300, boxL: 15, boxW: 15, boxH: 8,  stock: 1 },
  { id: 36, name: "Пиала розовая",                     desc: "Живая розово-бордовая глазурь с переходами. Тёплый и насыщенный цвет.",                                  price: "1 200 ₽",     priceNum: 1200, img: "/item-piala-rose-1.jpg",   tag: "Пиала",      weight: 300, boxL: 15, boxW: 15, boxH: 8,  stock: 1, variants: [{ label: "Вид 1", img: "/item-piala-rose-1.jpg" }, { label: "Вид 2", img: "/item-piala-rose-2.jpg" }] },
  // ── Тарелки
  { id: 14, name: "Тарелка «Любовь спасёт мир»",        desc: "Тёмная глазурь и надпись по краю вдавлена вручную. Авторское высказывание в глине.",               price: "2 500 ₽",     priceNum: 2500, img: "/item-plate-love.jpg",    tag: "Тарелка",    weight: 650, boxL: 20, boxW: 20, boxH: 10, stock: 1 },
  { id: 15, name: "Тарелка с синей сеткой",             desc: "Геометричный орнамент синей сеткой по белому фону. Чёткий ритм и живая линия.",                    price: "2 500 ₽",     priceNum: 2500, img: "/item-plate-grid.jpg",    tag: "Тарелка",    weight: 650, boxL: 20, boxW: 20, boxH: 10, stock: 1 },
  { id: 21, name: "Тарелка с синей каёмкой",             desc: "Фарфор, глубокая форма с волнистым краем. Синяя полоса по ободу — строго и изящно.",               price: "2 900 ₽",     priceNum: 2900, img: "/item-plate-edge-1.jpg",   tag: "Тарелка",    weight: 550, boxL: 20, boxW: 20, boxH: 4,  stock: 1, variants: [{ label: "Вид 1", img: "/item-plate-edge-1.jpg" }, { label: "Вид 2", img: "/item-plate-edge-2.jpg" }] },
  { id: 22, name: "Тарелка «Клетка»",                    desc: "Фарфор, синий шахматный орнамент по всей поверхности. Та же клетка — в формате тарелки.",          price: "2 900 ₽",     priceNum: 2900, img: "/item-plate-grid.jpg",    tag: "Тарелка",    weight: 550, boxL: 20, boxW: 20, boxH: 4,  stock: 1 },
  { id: 23, name: "Тарелка с рюшевым краем",             desc: "Фарфор, фестончатый волнистый бортик. Синяя каёмка подчёркивает сложную форму края.",              price: "3 500 ₽",     priceNum: 3500, img: "/item-plate-ruffle-1.jpg", tag: "Тарелка",    weight: 550, boxL: 20, boxW: 20, boxH: 4,  stock: 1, variants: [{ label: "Вид 1", img: "/item-plate-ruffle-1.jpg" }, { label: "Вид 2", img: "/item-plate-ruffle-2.jpg" }] },
  { id: 33, name: "Тарелка «Клетка» малая",             desc: "Фарфор, синий сетчатый орнамент по всей поверхности. Чёткий ритм и живая линия.",                   price: "2 400 ₽",     priceNum: 2400, img: "/item-plate-grid-2.jpg",   tag: "Тарелка",    weight: 550, boxL: 20, boxW: 20, boxH: 4,  stock: 1 },
  // ── Декор
  { id: 10, name: "Подсвечник в форме цветка",          desc: "Лепной подсвечник с ажурными лепестками и росписью. Создаёт мягкий уютный свет.",                  price: "750 ₽",       priceNum: 750,  img: "/item-candle-2.jpg",      tag: "Декор",      weight: 350, boxL: 20, boxW: 15, boxH: 15, stock: 4 },
  { id: 16, name: "Подсвечник-волна",                   desc: "Синяя волнистая форма с держателем для свечи. Дерзко и лаконично.",                                price: "1 500 ₽",     priceNum: 1500, img: "/item-candle-wave-1.jpg",  tag: "Декор",      weight: 350, boxL: 20, boxW: 15, boxH: 15, stock: 1 },
  { id: 17, name: "Подставка для благовоний",           desc: "Волнообразная подставка ручной работы. Подходит для палочек и конусов.",                           price: "1 200 ₽",     priceNum: 1200, img: "/item-incense-wave.jpg",   tag: "Декор",      weight: 350, boxL: 20, boxW: 15, boxH: 15, stock: 3 },
  // ── Украшения
  { id: 18, name: "Брошь с розой",                      desc: "Лепная брошь с рельефной розой. Доступна в двух цветах: белая и бронзовая.",                       price: "1 350 ₽",     priceNum: 1350, img: "/item-brooch-white.jpg",   tag: "Украшения",  weight: 50,  boxL: 15, boxW: 10, boxH: 5,  variants: [{ label: "Белая", img: "/item-brooch-white.jpg" }, { label: "Бронзовая", img: "/item-brooch-bronze.jpg" }] },
  { id: 31, name: "Брошь «Сердце — Любовь»",           desc: "Лепная брошь-сердце с надписью. В подарочной коробочке.",                                            price: "1 500 ₽",     priceNum: 1500, img: "/item-brooch-heart-love.jpg", tag: "Украшения", weight: 50,  boxL: 10, boxW: 10, boxH: 4,  stock: 1 },
  { id: 32, name: "Брошь «Сердце — Хаханьки»",         desc: "Лепная брошь-сердце с надписью. В подарочной коробочке.",                                            price: "1 500 ₽",     priceNum: 1500, img: "/item-brooch-heart-fun.jpg",  tag: "Украшения", weight: 50,  boxL: 10, boxW: 10, boxH: 4,  stock: 1 },
];

const values = [
  { num: "01", title: "Каждое изделие уникально", text: "Нет двух одинаковых. Форма, цвет, фактура — всё складывается в единственный экземпляр." },
  { num: "02", title: "Сделано вручную", text: "От замеса глины до нанесения глазури — каждый шаг делает один человек, в своей мастерской." },
  { num: "03", title: "Для каждого дня", text: "Керамика создана для использования. Её можно мыть, греть, держать в руках утром с кофе." },
  { num: "04", title: "Лучший подарок", text: "Вещь с характером и историей. Именно такие подарки остаются надолго." },
  { num: "05", title: "Живой характер", text: "Небольшие отличия формы и оттенка — это не брак, а подпись мастера на каждом изделии." },
];

const steps = [
  { num: "1", title: "Выберите изделие", desc: "Посмотрите коллекцию на сайте и выберите то, что откликается." },
  { num: "2", title: "Напишите мне", desc: "В WhatsApp или Telegram — отвечу быстро и с удовольствием." },
  { num: "3", title: "Договоримся", desc: "Уточним наличие, способ оплаты и доставку. Всё просто." },
];

const WA = "https://wa.me/79534075007";

/* ─── HELPERS ────────────────────────────────────────────── */
function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-body text-[13px] font-medium tracking-[0.2em] uppercase text-graphite-light ${className}`}>
      {children}
    </p>
  );
}

/** Split text into per-word spans for stagger animation */
function SplitWords({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="split-word inline-block overflow-hidden" style={{ marginRight: "0.28em" }}>
          <span className="split-inner inline-block">{w}</span>
        </span>
      ))}
    </span>
  );
}

/* ─── TILT CARD ──────────────────────────────────────────── */
const isMobile = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 14;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -14;
    gsap.to(el, { rotateY: x, rotateX: y, transformPerspective: 800, duration: 0.4, ease: "power2.out" });
  };
  const handleLeave = () => {
    if (isMobile) return;
    const el = ref.current; if (!el) return;
    gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.7, ease: "elastic.out(1,0.5)" });
  };
  return (
    <div ref={ref} className={className} onMouseMove={handleMove} onMouseLeave={handleLeave} style={{ transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}

/* ─── MAGNETIC BUTTON ────────────────────────────────────── */
function MagneticBtn({ children, href, className = "", target }: { children: React.ReactNode; href: string; className?: string; target?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.35;
    const y = (e.clientY - r.top - r.height / 2) * 0.35;
    gsap.to(el, { x, y, duration: 0.4, ease: "power2.out" });
  };
  const handleLeave = () => {
    const el = ref.current; if (!el) return;
    gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.4)" });
  };
  return (
    <a ref={ref} href={href} target={target} rel={target ? "noopener noreferrer" : undefined}
      className={className} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function IndexPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroBg = useRef<HTMLDivElement>(null);
  const heroContent = useRef<HTMLDivElement>(null);
  const aboutText = useRef<HTMLDivElement>(null);
  const aboutImg = useRef<HTMLDivElement>(null);
  const [navSolid, setNavSolid] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedId, setAddedId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "fail" | null>(null);
  const [activeTag, setActiveTag] = useState<string>("Все");
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});
  const [liveProducts, setLiveProducts] = useState(products);
  const [quickView, setQuickView] = useState<typeof products[0] | null>(null);
  const [qvVariant, setQvVariant] = useState(0);
  const gsapAnimated = useRef(false);

  /* ── Re-animate product cards when liveProducts changes ── */
  useEffect(() => {
    if (!gsapAnimated.current) return; // main animation hasn't run yet, skip
    const cards = document.querySelectorAll<HTMLElement>(".product-card");
    cards.forEach((card, i) => {
      ScrollTrigger.create({
        trigger: card,
        start: "top 92%",
        once: true,
        onEnter: () => {
          gsap.fromTo(card,
            { opacity: 0, y: 48, scale: 0.96, filter: "blur(3px)" },
            { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out", delay: (i % 4) * 0.09 }
          );
        },
      });
    });
  }, [liveProducts]);

  /* ── Load products from API (background refresh, no flash) ── */
  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then((d: { ok: boolean; products: typeof products }) => {
        if (!d.ok || !d.products?.length) return;
        setLiveProducts(prev => {
          const prevIds = prev.map(p => p.id).join(",");
          const nextIds = d.products.map((p: typeof products[0]) => p.id).join(",");
          if (prevIds === nextIds) return prev;
          return d.products;
        });
      })
      .catch(() => {/* fallback to static */});
  }, []);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const { add, count } = useCart();

  /* ── Nav solid ── */
  useEffect(() => {
    const h = () => setNavSolid(window.scrollY > 80);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* ── Payment result from URL + СДЭК заказ ── */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const status = p.get("payment");
    if (status === "success") {
      setPaymentStatus("success");
      // Создаём заказ СДЭК если есть сохранённые данные
      const raw = sessionStorage.getItem("cdek_pending");
      if (raw) {
        try {
          const data = JSON.parse(raw);
          sessionStorage.removeItem("cdek_pending");
          fetch("/api/cdek/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
            .then(r => r.json())
            .then(d => console.log("[CDEK] order created:", d))
            .catch(e => console.error("[CDEK] order error:", e));
        } catch { /* ignore */ }
      }
    }
    if (status === "fail") setPaymentStatus("fail");
  }, []);

  /* ── Add to cart ── */
  const handleAddToCart = useCallback((p: typeof products[0]) => {
    add({ id: p.id, name: p.name, price: p.priceNum, priceLabel: p.price, img: p.img, weight: p.weight, boxL: p.boxL, boxW: p.boxW, boxH: p.boxH });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1800);
  }, [add]);

  /* ── Custom cursor ── */
  useEffect(() => {
    if (isMobile) return; // no custom cursor on touch
    const cursor = cursorRef.current;
    const dot = cursorDotRef.current;
    if (!cursor || !dot) return;
    let mx = 0, my = 0, cx = 0, cy = 0;
    let rafId: number;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    document.addEventListener("mousemove", onMove, { passive: true });
    const tick = () => {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      cursor.style.transform = `translate(${cx - 20}px, ${cy - 20}px)`;
      dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    // Scale on hover
    const addHover = () => gsap.to(cursor, { scale: 2.2, opacity: 0.6, duration: 0.3 });
    const removeHover = () => gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3 });
    document.querySelectorAll("a, button, .product-card").forEach(el => {
      el.addEventListener("mouseenter", addHover);
      el.addEventListener("mouseleave", removeHover);
    });
    return () => { document.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafId); };
  }, []);

  /* ── Scroll progress bar ── */
  useEffect(() => {
    const bar = progressRef.current; if (!bar) return;
    const update = () => {
      const p = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      bar.style.transform = `scaleX(${p})`;
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  /* ── GSAP ── */
  useEffect(() => {
    if (gsapAnimated.current) return;
    gsapAnimated.current = true;
    const ctx = gsap.context(() => {

      /* ── Hero entrance — cinematic ── */
      // Сначала скрываем весь контент
      gsap.set([".hero-label", ".hero-word .split-inner", ".hero-sub", ".hero-btns", ".hero-scroll-ind", ".hero-line"], {
        opacity: 0,
      });
      gsap.set(heroContent.current, { opacity: 1 });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" }, delay: 0.1 });

      // Фон: быстрый zoom из темноты
      tl.fromTo(heroBg.current,
        { scale: 1.12, filter: "brightness(0.4)" },
        { scale: 1.06, filter: "brightness(1)", duration: 2.0, ease: "power2.out" },
        0
      );

      // Оверлей: постепенно проявляется
      tl.fromTo(".hero-overlay",
        { opacity: 0 },
        { opacity: 1, duration: 1.4, ease: "power2.inOut" },
        0.2
      );

      // Лейбл сверху — fade + blur
      tl.fromTo(".hero-label",
        { opacity: 0, y: -10, letterSpacing: "0.4em", filter: "blur(6px)" },
        { opacity: 1, y: 0, letterSpacing: "0.25em", filter: "blur(0px)", duration: 1.0 },
        0.5
      );

      // Тонкая горизонтальная линия-разделитель (если есть)
      tl.fromTo(".hero-line",
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.8, ease: "power3.out", transformOrigin: "left" },
        0.7
      );

      // Заголовок: слова вылетают снизу с масштабом
      tl.fromTo(".hero-word .split-inner",
        { y: "115%", opacity: 0, scaleY: 1.1 },
        { y: "0%", opacity: 1, scaleY: 1, duration: 1.2, stagger: 0.13, ease: "power4.out" },
        0.65
      );

      // Подзаголовок: blur reveal
      tl.fromTo(".hero-sub",
        { opacity: 0, y: 18, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power3.out" },
        1.1
      );

      // Кнопки: снизу вверх со stagger
      tl.fromTo(".hero-btn-item",
        { opacity: 0, y: 22, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.14, ease: "back.out(1.3)" },
        1.35
      );

      // Scroll indicator
      tl.fromTo(".hero-scroll-ind",
        { opacity: 0, y: 10 },
        { opacity: 0.55, y: 0, duration: 1.0 },
        1.6
      );

      /* ── Hero bg subtle breathe ── */
      gsap.to(heroBg.current, {
        scale: 1.05, duration: 16, ease: "sine.inOut", yoyo: true, repeat: -1,
      });

      /* ── Hero parallax bg ── */
      gsap.to(heroBg.current, {
        yPercent: 30, ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.5 },
      });

      /* ── Hero content slow fade+lift on scroll ── */
      gsap.to(heroContent.current, {
        yPercent: -12, opacity: 0, ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "40% top", end: "bottom top", scrub: 1 },
      });

      /* ── About ── */
      gsap.fromTo(aboutText.current, { opacity: 0, x: -20 }, {
        opacity: 1, x: 0, duration: 1.3, ease: "power3.out",
        scrollTrigger: { trigger: aboutText.current, start: "top 80%" },
      });
      // About image: clip-path reveal left→right
      gsap.fromTo(aboutImg.current,
        { clipPath: "inset(0 100% 0 0)", opacity: 1 },
        {
          clipPath: "inset(0 0% 0 0)", duration: 1.5, ease: "power4.inOut",
          scrollTrigger: { trigger: aboutImg.current, start: "top 80%" },
        }
      );
      gsap.fromTo(aboutImg.current, { scale: 1.04 }, {
        scale: 1, duration: 1.5, ease: "power3.out",
        scrollTrigger: { trigger: aboutImg.current, start: "top 80%" },
      });
      // About parallax image
      gsap.to(".about-img-inner", {
        yPercent: -10, ease: "none",
        scrollTrigger: { trigger: "#about", start: "top bottom", end: "bottom top", scrub: 1.2 },
      });

      /* ── Section headings — mask reveal + accent line ── */
      gsap.utils.toArray<HTMLElement>(".sec-heading").forEach((heading) => {
        const inners = heading.querySelectorAll(".split-inner");
        const line = heading.parentElement?.querySelector(".sec-underline") as HTMLElement | null;

        const tl = gsap.timeline({
          scrollTrigger: { trigger: heading, start: "top 84%", once: true },
        });

        inners.forEach((el, i) => {
          tl.fromTo(el,
            { y: "108%", opacity: 0, skewX: 3 },
            { y: "0%", opacity: 1, skewX: 0, duration: 1.1, ease: "power4.out" },
            i * 0.08
          );
        });

        if (line) {
          tl.fromTo(line,
            { scaleX: 0, opacity: 0 },
            { scaleX: 1, opacity: 1, duration: 0.7, ease: "power3.out", transformOrigin: "left" },
            0.4
          );
        }
      });

      /* ── Generic fade-up with slight rotation ── */
      gsap.utils.toArray<HTMLElement>(".gsap-fade").forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 36, rotateX: 8 }, {
          opacity: 1, y: 0, rotateX: 0, duration: 0.95, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 86%" },
        });
      });

      /* ── Product cards — появление + hover ── */
      gsap.utils.toArray<HTMLElement>(".product-card").forEach((card, i) => {
        // Появление при скролле
        gsap.fromTo(card,
          { opacity: 0, y: 48, scale: 0.96, filter: "blur(3px)" },
          {
            opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
            duration: 0.9, ease: "power3.out",
            delay: (i % 4) * 0.09,
            scrollTrigger: { trigger: card, start: "top 92%", once: true },
          }
        );

        const img = card.querySelector(".card-img") as HTMLElement | null;
        const overlay = card.querySelector(".card-overlay") as HTMLElement | null;
        const sheen = card.querySelector(".card-sheen") as HTMLElement | null;
        const info = card.querySelector(".card-info") as HTMLElement | null;

        card.addEventListener("mouseenter", () => {
          gsap.to(card,   { y: -8, scale: 1.012, duration: 0.45, ease: "power2.out",
            boxShadow: "0 20px 60px rgba(46,42,38,0.18), 0 4px 12px rgba(46,42,38,0.08)" });
          if (img)     gsap.to(img,     { scale: 1.1, duration: 0.9, ease: "power2.out" });
          if (overlay) gsap.to(overlay, { opacity: 1, duration: 0.4, ease: "power2.out" });
          if (sheen)   gsap.fromTo(sheen,
            { x: "-120%", opacity: 0.6 },
            { x: "120%",  opacity: 0, duration: 0.7, ease: "power2.out" }
          );
          if (info)    gsap.to(info,    { y: -3, duration: 0.4, ease: "power2.out" });
        });

        card.addEventListener("mouseleave", () => {
          gsap.to(card,   { y: 0, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.5)",
            boxShadow: "0 2px 8px rgba(46,42,38,0.04)" });
          if (img)     gsap.to(img,     { scale: 1, duration: 0.7, ease: "power2.out" });
          if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.35, ease: "power2.inOut" });
          if (info)    gsap.to(info,    { y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
        });
      });

      /* ── Products heading counter ── */
      const countEl = document.querySelector(".products-count") as HTMLElement | null;
      if (countEl) {
        ScrollTrigger.create({
          trigger: "#products",
          start: "top 70%",
          onEnter: () => {
            gsap.fromTo({ val: 0 }, { val: liveProducts.length }, {
              duration: 1.4, ease: "power2.out",
              onUpdate: function () { countEl.textContent = String(Math.round((this as any).targets()[0].val)); },
            });
          },
          once: true,
        });
      }

      /* ── Value items ── */
      gsap.utils.toArray<HTMLElement>(".value-item").forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 50, clipPath: "inset(0 0 100% 0)" },
          {
            opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)",
            duration: 0.9, ease: "power3.out", delay: i * 0.08,
            scrollTrigger: { trigger: el, start: "top 87%" },
          }
        );
        // Hover: slight lift
        el.addEventListener("mouseenter", () => {
          gsap.to(el, { y: -4, duration: 0.35, ease: "power2.out" });
        });
        el.addEventListener("mouseleave", () => {
          gsap.to(el, { y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
        });
      });

      /* ── Value numbers count up ── */
      gsap.utils.toArray<HTMLElement>(".value-num").forEach((el) => {
        const target = parseInt(el.getAttribute("data-num") || "0");
        ScrollTrigger.create({
          trigger: el, start: "top 85%", once: true,
          onEnter: () => {
            gsap.fromTo({ n: 0 }, { n: target }, {
              duration: 1.2, ease: "power2.out",
              onUpdate: function () {
                el.textContent = String(Math.round((this as any).targets()[0].n)).padStart(2, "0");
              },
            });
          },
        });
      });

      /* ── Steps ── */
      gsap.utils.toArray<HTMLElement>(".step-item").forEach((el, i) => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
        tl.fromTo(el,
          { opacity: 0, x: -40, y: 30 },
          { opacity: 1, x: 0, y: 0, duration: 1.0, ease: "power3.out", delay: i * 0.15 }
        );
        // Animate dot appearing
        const dot = el.querySelector(".step-dot");
        if (dot) {
          tl.fromTo(dot,
            { opacity: 0, scale: 0 },
            { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(3)" },
            `-=0.3`
          );
          // Pulsing dot
          gsap.to(dot, {
            scale: 1.8, opacity: 0.4, repeat: -1, yoyo: true, duration: 1.2,
            ease: "sine.inOut", delay: (i * 0.15) + 1,
          });
        }
        // Animate horizontal line
        const lineH = el.querySelector(".step-line-h");
        if (lineH) {
          tl.fromTo(lineH, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.out", transformOrigin: "left" }, `-=0.4`);
        }
        // Animate connector
        const connector = el.querySelector(".step-line");
        if (connector) {
          gsap.fromTo(connector, { scaleX: 0 }, {
            scaleX: 1, duration: 0.8, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 80%" },
            delay: 0.5 + i * 0.1,
          });
        }
      });

      /* ── Contacts heading ── */
      /* ── Process section ── */
      gsap.fromTo(".process-video",
        { opacity: 0, x: 40, scale: 0.96 },
        { opacity: 1, x: 0, scale: 1, duration: 1.1, ease: "power3.out",
          scrollTrigger: { trigger: "#process", start: "top 75%" } }
      );
      gsap.fromTo(".process-text .split-inner",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: "#process", start: "top 75%" } }
      );
      gsap.utils.toArray<HTMLElement>(".process-step").forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.7, ease: "power2.out", delay: 0.15 * i,
            scrollTrigger: { trigger: "#process", start: "top 70%" } }
        );
      });

      gsap.fromTo(".contacts-block .sec-heading .split-inner",
        { y: "100%", opacity: 0 },
        {
          y: "0%", opacity: 1, duration: 1.1, ease: "power4.out", stagger: 0.12,
          scrollTrigger: { trigger: ".contacts-block", start: "top 80%" },
        }
      );
      gsap.fromTo(".contacts-block p",
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 1.0, ease: "power3.out",
          scrollTrigger: { trigger: ".contacts-block", start: "top 78%" },
          delay: 0.4,
        }
      );
      /* Contact pills stagger */
      gsap.utils.toArray<HTMLElement>(".contact-pill").forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 20, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.4)", delay: i * 0.1,
            scrollTrigger: { trigger: el, start: "top 88%" },
          }
        );
      });

      /* ── Horizontal marquee on about divider ── */
      gsap.to(".marquee-inner", {
        xPercent: -50, ease: "none", duration: 18, repeat: -1,
      });

      /* ── Footer line wipe ── */
      gsap.fromTo(".footer-line", { scaleX: 0 }, {
        scaleX: 1, duration: 1.4, ease: "power3.out",
        scrollTrigger: { trigger: "footer", start: "top 90%" },
      });

      /* ── Animated horizontal dividers ── */
      gsap.utils.toArray<HTMLElement>(".line-reveal").forEach((el) => {
        gsap.fromTo(el, { scaleX: 0 }, {
          scaleX: 1, duration: 1.0, ease: "power3.out", transformOrigin: "left",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      /* ── Section heading accent char ── */
      gsap.utils.toArray<HTMLElement>(".sec-accent").forEach((el) => {
        gsap.fromTo(el, { opacity: 0, x: -10 }, {
          opacity: 1, x: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      /* ── Staggered nav links on load ── */
      gsap.fromTo(".nav-link",
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.7, ease: "power2.out", delay: 1.8 }
      );

    });

    return () => ctx.revert();
  }, []);

  /* ─── RENDER ─────────────────────────────────────────── */
  return (
    <div className="bg-cream min-h-screen overflow-x-hidden" style={{ cursor: "none" }}>

      {/* ── Custom cursor (desktop only) ── */}
      {!isMobile && <div ref={cursorRef} className="fixed z-[9999] w-10 h-10 rounded-full border border-graphite/40 pointer-events-none mix-blend-difference" style={{ top: 0, left: 0, willChange: "transform" }} />}
      {!isMobile && <div ref={cursorDotRef} className="fixed z-[9999] w-1.5 h-1.5 rounded-full bg-graphite pointer-events-none" style={{ top: 0, left: 0, willChange: "transform" }} />}

      {/* ── Scroll progress bar ── */}
      <div ref={progressRef} className="fixed top-0 left-0 right-0 z-[9998] h-[2px] origin-left" style={{ background: "var(--color-accent)", transform: "scaleX(0)" }} />

      {/* ═══ NAV ═══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-14 py-4 transition-all duration-500 ${navSolid ? "nav-blur bg-graphite/85" : ""}`}>
        <a href="#" className="leading-none">
          <img src="/logo-white.png" alt="Nikolos Ceramic" className="h-10 opacity-95" />
        </a>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex gap-10">
            {[["#about","О бренде"],["#products","Изделия"],["#order","Заказать"],["#contacts","Контакты"]].map(([href, label]) => (
              <a key={href} href={href} className="nav-link font-body text-[13px] font-normal tracking-[0.18em] uppercase text-warm-white/80 hover:text-white transition-colors duration-300 no-underline relative">
                {label}
              </a>
            ))}
          </div>
          {/* Cart button */}
          <button onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 text-warm-white/80 hover:text-white transition-colors duration-300"
            aria-label="Корзина">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-accent text-warm-white font-body text-[10px] font-medium rounded-full flex items-center justify-center leading-none px-1">
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] overflow-hidden flex items-center">
        <div ref={heroBg} className="absolute -inset-[15%] bg-cover bg-center will-change-transform"
          style={{ backgroundImage: "url('/item-stakan-ribbed.jpg')", backgroundPosition: "center 40%" }} />
        <div className="hero-overlay absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(22,16,10,0.86) 0%, rgba(40,34,28,0.52) 55%, rgba(22,16,10,0.32) 100%)" }} />
        <div className="grain" />

        {/* Floating particles */}
        {[
          { x: 100,  y: 180, size: 6,   delay: 0.3, dur: 6.0 },
          { x: 280,  y: 360, size: 3.5, delay: 1.0, dur: 7.0 },
          { x: 520,  y: 200, size: 5,   delay: 0.6, dur: 6.5 },
          { x: 820,  y: 420, size: 4,   delay: 1.8, dur: 5.5 },
          { x: 1080, y: 260, size: 5,   delay: 1.2, dur: 6.8 },
          { x: 180,  y: 520, size: 3,   delay: 2.5, dur: 5.8 },
          { x: 700,  y: 500, size: 4.5, delay: 2.0, dur: 7.2 },
          { x: 420,  y: 450, size: 2.5, delay: 1.5, dur: 6.2 },
          { x: 960,  y: 160, size: 3,   delay: 3.0, dur: 5.5 },
          { x: 340,  y: 140, size: 2,   delay: 0.9, dur: 7.5 },
          { x: 650,  y: 330, size: 3,   delay: 4,   dur: 5.0, shape: "line" as const },
          { x: 200,  y: 280, size: 4,   delay: 2.8, dur: 6.0, shape: "line" as const },
          { x: 900,  y: 380, size: 3,   delay: 1.6, dur: 5.5, shape: "line" as const },
        ].map((p, i) => <HeroParticle key={i} {...p} />)}

        <div ref={heroContent} className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-12">
          {/* Brand logo mark in hero */}
          <div className="hero-label mb-8">
            <img src="/logo-white.png" alt="Nikolos Ceramic" className="h-14 md:h-20 opacity-90" />
          </div>

          <div className="hero-line w-10 mb-8" style={{ height: "1px", background: "rgba(253,250,246,0.35)" }} />

          <h1 className="font-display font-light leading-[1.05] text-warm-white tracking-tight mb-7 max-w-[740px]"
            style={{ fontSize: "clamp(52px, 7.5vw, 96px)" }}>
            <span className="hero-word">
              <SplitWords text="Керамика" />
            </span>
            <br />
            <em className="hero-word italic font-light">
              <SplitWords text="ручной работы" />
            </em>
          </h1>

          <p className="hero-sub font-body text-lg font-normal leading-relaxed text-warm-white/85 max-w-[400px] mb-14 opacity-0">
            Авторская посуда, созданная вручную<br />в маленькой мастерской
          </p>

          <div className="hero-btns flex gap-4 flex-wrap">
            <span className="hero-btn-item inline-block">
              <MagneticBtn href="#products" className="btn-main btn-hero-primary">Смотреть изделия</MagneticBtn>
            </span>
            <span className="hero-btn-item inline-block">
              <MagneticBtn href={WA} target="_blank" className="btn-main btn-outline-light inline-flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                Написать в WhatsApp
              </MagneticBtn>
            </span>
          </div>
        </div>

        <div className="hero-scroll-ind absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 opacity-0">
          <span className="font-body text-[9px] tracking-[0.22em] uppercase text-warm-white/45">Scroll</span>
          <div className="relative w-px h-12 overflow-hidden">
            <div className="scroll-line absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(253,250,246,0.7), rgba(253,250,246,0.1))" }} />
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE DIVIDER ═══ */}
      <div className="overflow-hidden border-y border-sand py-4 bg-warm-white">
        <div className="marquee-inner flex gap-16 whitespace-nowrap" style={{ width: "200%" }}>
          {[...Array(12)].map((_, i) => (
            <span key={i} className="marquee-item font-display text-base font-light tracking-[0.25em] uppercase select-none">
              Ручная работа · Авторская керамика · Nikolos Ceramic ·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ═══ ABOUT ═══ */}
      <section id="about" className="py-28 md:py-36 px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div ref={aboutText}>
            <SectionLabel className="mb-6 gsap-fade">О бренде</SectionLabel>
            <div className="w-10 h-px bg-beige mb-10 line-reveal" />
            <h2 className="font-display font-light leading-[1.2] text-graphite mb-5 tracking-tight sec-heading"
              style={{ fontSize: "clamp(40px, 4.5vw, 58px)" }}>
              <span className="block overflow-hidden"><span className="split-inner inline-block">Вещи с характером</span></span>
              <span className="block overflow-hidden italic"><span className="split-inner inline-block">и живой фактурой</span></span>
            </h2>
            <div className="sec-underline w-12 h-px bg-accent mb-8" />
            <p className="font-body text-[17px] font-normal leading-[1.9] text-graphite-light mb-6 gsap-fade">
              Каждое изделие создаётся вручную: от формы до глазури. Поэтому у каждой чашки, тарелки или пиалы есть свой характер, небольшая асимметрия и живая фактура.
            </p>
            <p className="font-body text-[17px] font-normal leading-[1.9] text-graphite-light gsap-fade">
              Это не фабричная посуда, а предметы, которые хочется держать в руках каждый день.
            </p>
          </div>

          <div ref={aboutImg} className="relative">
            <div className="aspect-[4/5] overflow-hidden bg-sand">
              <img src="/workshop.jpg" alt="Мастерская Nikolos Ceramic" className="about-img-inner w-full h-[115%] object-cover -mt-[7.5%]" />
            </div>
            <div className="about-badge absolute -bottom-5 -left-5 bg-graphite text-warm-white px-6 py-4 font-display text-sm tracking-[0.08em] gsap-fade">
              Мастерская · с 2023
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRODUCTS ═══ */}
      <section id="products" className="bg-warm-white py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-12 md:mb-16 flex justify-between items-end flex-wrap gap-6">
            <div>
              <SectionLabel className="mb-5 gsap-fade">Коллекция</SectionLabel>
              <h2 className="font-display font-light leading-tight text-graphite tracking-tight sec-heading overflow-hidden mb-4"
                style={{ fontSize: "clamp(40px, 4.5vw, 60px)" }}>
                <span className="split-inner inline-block">Изделия —&nbsp;</span>
                <span className="split-inner inline-block text-beige products-count">0</span>
              </h2>
              <div className="sec-underline w-12 h-px bg-accent" />
            </div>
            <p className="font-body text-[15px] font-normal text-graphite-light max-w-[260px] text-right leading-relaxed gsap-fade">
              Каждое изделие в единственном экземпляре или небольшой серии
            </p>
          </div>

          {/* ── Featured ── */}
          <div className="featured-block mb-20 grid grid-cols-1 lg:grid-cols-2 gap-0 bg-warm-white overflow-hidden shadow-[0_4px_40px_rgba(46,42,38,0.08)]">
            {/* Photo */}
            <div className="relative h-[440px] lg:h-[560px] overflow-hidden">
              <img src="/item-checker-detail.jpg" alt="Пиалы Шахматы" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(46,42,38,0.08) 0%, transparent 60%)" }} />
            </div>
            {/* Text */}
            <div className="flex flex-col justify-center p-10 lg:p-16 bg-warm-white">
              <span className="section-label mb-6 block">Хит коллекции</span>
              <div className="w-8 h-px bg-accent mb-6" />
              <h3 className="font-display font-light text-graphite leading-[1.05] mb-5" style={{ fontSize: "clamp(36px, 4vw, 56px)" }}>
                Пиалы<br />«Шахматы»
              </h3>
              <p className="font-body text-[14px] font-normal text-graphite-light leading-[1.8] mb-10 max-w-[320px]">
                Молочный фарфор снаружи, синий шахматный орнамент внутри. Каждая пиала — в единственном экземпляре.
              </p>
              <div className="flex items-center gap-8">
                <div>
                  <span className="font-body text-[11px] tracking-[0.14em] uppercase text-graphite-light block mb-1">Цена</span>
                  <span className="font-display text-[34px] font-normal text-graphite leading-none">от 2 400 ₽</span>
                </div>
                <button
                  onClick={() => {
                    const p = liveProducts.find(x => x.id === 7)!;
                    add({ id: p.id, name: p.name, price: p.priceNum, priceLabel: p.price, img: p.img, weight: p.weight, boxL: p.boxL, boxW: p.boxW, boxH: p.boxH });
                  }}
                  className="btn-main btn-solid"
                >
                  <span>В корзину</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Фильтр по категориям ── */}
          <div className="flex flex-wrap gap-2.5 mb-12">
            {["Все", ...Array.from(new Set(liveProducts.filter(p => p.tag !== "Тест").map(p => p.tag)))].map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`filter-btn ${activeTag === tag ? "active" : ""}`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {liveProducts.filter(p => p.tag !== "Тест" && (activeTag === "Все" || p.tag === activeTag)).map((p, idx) => {
              const varIdx = selectedVariants[p.id] ?? 0;
              const activeImg = p.variants ? p.variants[varIdx].img : p.img;
              const activeName = p.variants ? `${p.name} — ${p.variants[varIdx].label}` : p.name;
              const cartItem = { ...p, img: activeImg, name: activeName };
              return (
              <TiltCard key={p.id} className="product-card cursor-pointer">
                {/* Image */}
                <div className="overflow-hidden aspect-[4/5] bg-sand relative"
                  onClick={() => { setQuickView(p); setQvVariant(varIdx); }}>
                  <img src={activeImg} alt={activeName} className="card-img w-full h-full object-cover" loading={idx < 4 ? "eager" : "lazy"} decoding="async" />
                  <span className="card-tag">{p.tag}</span>
                  {/* Stock badge */}
                  {p.stock !== undefined && (
                    <span className={`absolute top-10 right-3 font-body text-[9px] tracking-[0.15em] uppercase px-2 py-1 ${
                      p.stock === 1 ? "bg-accent text-warm-white" : "bg-graphite/75 text-warm-white backdrop-blur-sm"
                    }`}>
                      {p.stock === 1 ? "Последняя" : `Осталось ${p.stock}`}
                    </span>
                  )}
                  {/* sheen sweep on hover */}
                  <div className="card-sheen absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)", transform: "translateX(-120%)" }} />
                  {/* hover overlay */}
                  <div className="card-overlay absolute inset-0 flex items-end justify-between p-5 opacity-0"
                    style={{ background: "linear-gradient(to top, rgba(46,42,38,0.88) 0%, rgba(46,42,38,0.3) 45%, transparent 100%)" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(cartItem); }}
                      className="font-body text-[11px] tracking-[0.2em] uppercase text-warm-white border-b border-warm-white/40 pb-0.5 hover:border-warm-white transition-all">
                      {addedId === p.id ? "✓ Добавлено" : "В корзину →"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setQuickView(p); setQvVariant(varIdx); }}
                      className="font-body text-[11px] tracking-[0.2em] uppercase text-warm-white/70 hover:text-warm-white transition-all">
                      Смотреть
                    </button>
                  </div>
                </div>
                {/* Info */}
                <div className="card-info p-5 pt-4 pb-5">
                  <h3 className="font-display text-[17px] sm:text-[22px] font-normal text-graphite mb-1.5 leading-tight tracking-[0.01em] line-clamp-2">{p.name}</h3>
                  <p className="hidden sm:block font-body text-[13px] text-graphite-light leading-relaxed mb-3 line-clamp-2">{p.desc}</p>
                  {/* Варианты */}
                  {p.variants && (
                    <div className="flex gap-1.5 mb-3">
                      {p.variants.map((v, vi) => (
                        <button
                          key={vi}
                          onClick={() => setSelectedVariants(prev => ({ ...prev, [p.id]: vi }))}
                          className={`font-body text-[10px] font-medium tracking-[0.12em] uppercase px-2.5 py-1 border transition-all duration-200 rounded-sm ${
                            varIdx === vi
                              ? "bg-graphite text-warm-white border-graphite"
                              : "bg-transparent text-graphite-light border-sand hover:border-graphite hover:text-graphite"
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Price + cart */}
                  <div className="card-price-line">
                    <span className="font-display text-[22px] font-normal text-graphite leading-none">{p.price}</span>
                    <button onClick={() => handleAddToCart(cartItem)}
                      className={`font-body text-[10px] font-medium tracking-[0.16em] uppercase border-b pb-0.5 transition-all duration-300 ${
                        addedId === p.id
                          ? "text-accent border-accent"
                          : "text-graphite-light border-transparent hover:text-accent hover:border-accent"
                      }`}>
                      {addedId === p.id ? "✓ В корзине" : "В корзину"}
                    </button>
                  </div>
                </div>
              </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ PROCESS ═══ */}
      <section id="process" className="bg-graphite py-24 md:py-32 px-6 md:px-12 overflow-hidden">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">

            {/* Text side */}
            <div className="process-text order-2 md:order-1">
              <SectionLabel className="mb-6 !text-sand/60">Мастерство</SectionLabel>
              <h2
                className="font-display font-light text-warm-white tracking-tight sec-heading overflow-hidden mb-6"
                style={{ fontSize: "clamp(36px, 4vw, 56px)" }}
              >
                <span className="split-inner inline-block">Процесс создания</span>
              </h2>
              <div className="sec-underline w-12 h-px bg-accent mb-10" />

              <div className="space-y-8">
                {[
                  { n: "01", title: "Замес глины", desc: "Каждое изделие начинается с подготовки глиняной массы. Тщательный замес убирает воздух и делает материал пластичным." },
                  { n: "02", title: "Лепка на круге", desc: "Форма рождается под руками на гончарном круге. Толщина стенок, изгиб, высота — всё контролируется вручную." },
                  { n: "03", title: "Обжиг и глазурь", desc: "После сушки — первый обжиг. Затем глазурование и финальный обжиг при 1200°C, который раскрывает цвет." },
                ].map((step, i) => (
                  <div key={i} className="process-step flex gap-6 items-start opacity-0">
                    <span className="font-display text-sm text-accent/70 tracking-[0.2em] pt-1 shrink-0">{step.n}</span>
                    <div>
                      <h3 className="font-display text-lg font-normal text-warm-white mb-1">{step.title}</h3>
                      <p className="font-body text-[14px] leading-relaxed text-warm-white/55">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Video side */}
            <div className="process-video order-1 md:order-2 relative">
              <div className="relative mx-auto" style={{ maxWidth: 340 }}>
                {/* Decorative border */}
                <div className="absolute -inset-3 border border-warm-white/8 rounded-sm pointer-events-none" />
                <video
                  src="/process.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full rounded-sm object-cover"
                  style={{ aspectRatio: "9/16", maxHeight: 600 }}
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-24 rounded-b-sm"
                  style={{ background: "linear-gradient(to top, #2C2B29, transparent)" }} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ WHY ═══ */}
      <section className="py-28 md:py-36 px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="mb-16 md:mb-20">
          <SectionLabel className="mb-5 gsap-fade">Ценность</SectionLabel>
          <h2 className="font-display font-light text-graphite tracking-tight sec-heading overflow-hidden mb-4"
            style={{ fontSize: "clamp(40px, 4.5vw, 60px)" }}>
            <span className="split-inner inline-block">Почему ручная работа</span>
          </h2>
          <div className="sec-underline w-12 h-px bg-accent" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {values.map((item, i) => (
            <div key={i} className="value-item py-12 px-10 border-t border-sand"
              style={{ borderRight: i % 2 === 0 ? "1px solid var(--color-sand)" : "none" }}>
              <div className="value-num font-display text-7xl font-light text-sand leading-none mb-4"
                data-num={parseInt(item.num)}>
                {item.num}
              </div>
              <h3 className="font-display text-2xl font-normal text-graphite mb-3 leading-snug">{item.title}</h3>
              <p className="font-body text-[15px] font-normal leading-relaxed text-graphite-light max-w-[300px]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW TO ORDER ═══ */}
      <section id="order" className="bg-warm-white py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-16 md:mb-20">
            <SectionLabel className="mb-5 gsap-fade">Просто</SectionLabel>
            <h2 className="font-display font-light text-graphite tracking-tight sec-heading overflow-hidden mb-4"
              style={{ fontSize: "clamp(40px, 4.5vw, 60px)" }}>
              <span className="split-inner inline-block">Как заказать</span>
            </h2>
            <div className="sec-underline w-12 h-px bg-accent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, i) => (
              <div key={i} className="step-item relative">
                {/* connector line between steps */}
                {i < steps.length - 1 && (
                  <div className="step-line hidden md:block" />
                )}
                <div className="step-num-wrap relative inline-block mb-6">
                  <div className="step-num font-display text-8xl font-light text-sand leading-none">{step.num}</div>
                  <div className="step-num-dot absolute -right-2 -top-2 w-2.5 h-2.5 rounded-full bg-accent opacity-0 step-dot" />
                </div>
                <div className="w-10 h-px bg-beige mb-6 step-line-h" />
                <h3 className="font-display text-[28px] font-normal text-graphite mb-4">{step.title}</h3>
                <p className="font-body text-[15px] font-normal leading-relaxed text-graphite-light">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <MagneticBtn href={WA} target="_blank" className="btn-main btn-solid">
              Написать и выбрать изделие
            </MagneticBtn>
          </div>
        </div>
      </section>

      {/* ═══ CONTACTS ═══ */}
      <section id="contacts" className="bg-cream py-24 md:py-32 px-6 md:px-12">
        <div className="contacts-block max-w-[800px] mx-auto text-center">
          <SectionLabel className="mb-6">Связаться</SectionLabel>
          <h2 className="font-display font-light leading-tight text-graphite mb-6 tracking-tight sec-heading"
            style={{ fontSize: "clamp(44px, 5.5vw, 70px)" }}>
            <span className="block overflow-hidden"><span className="split-inner inline-block">Купить или спросить —</span></span>
            <span className="block overflow-hidden italic"><span className="split-inner inline-block">просто напишите</span></span>
          </h2>
          <p className="font-body text-[17px] font-normal leading-relaxed text-graphite-light max-w-[480px] mx-auto mb-16 gsap-fade">
            Отвечаю быстро. Расскажу об изделии, уточню наличие и помогу выбрать.
          </p>

          <div className="flex justify-center flex-wrap gap-3.5 mb-12">
            {[
              { href: WA, icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>, label: "WhatsApp: +7 953 407-50-07" },
              { href: "https://t.me/nikolos_ceramica", icon: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>, label: "Telegram: @nikolos_ceramica" },
              { href: "https://instagram.com/nikolos_ceramic", icon: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>, label: "Instagram: @nikolos_ceramic" },
            ].map(({ href, icon, label }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="contact-pill gsap-fade">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                {label}
              </a>
            ))}
          </div>

          <MagneticBtn href={WA} target="_blank" className="btn-main btn-solid text-xs tracking-[0.2em]">
            Купить / написать
          </MagneticBtn>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-6 md:px-14 py-12 flex justify-between items-center flex-wrap gap-6 max-md:flex-col max-md:text-center">
        <div className="footer-line absolute left-0 right-0 h-px origin-left" style={{ background: "linear-gradient(to right, var(--color-accent), var(--color-beige), transparent)", transform: "scaleX(0)" }} />
        <div className="flex flex-col gap-2 max-md:items-center">
          <img src="/logo.png" alt="Nikolos Pottery Ceramic" className="w-24 h-auto opacity-90" />
          <span className="font-body text-[11px] font-normal text-beige tracking-[0.22em] uppercase">
            Авторская керамика · Ручная работа
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 max-md:items-center">
          <span className="font-body text-[12px] font-normal text-graphite-light tracking-[0.08em]">
            © 2025 Nikolos Ceramic
          </span>
          <span className="font-body text-[11px] font-normal text-beige tracking-[0.06em]">
            Все изделия сделаны вручную
          </span>
        </div>
      </footer>

      {/* ── Cart Modal ── */}
      {cartOpen && <CartModal onClose={() => setCartOpen(false)} />}
      <QuickViewDrawer
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(item) => handleAddToCart(item)}
        addedId={addedId}
        selectedVariant={qvVariant}
        onVariantChange={setQvVariant}
      />

      {/* ── Payment success/fail banner ── */}
      {paymentStatus && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9995] flex items-center gap-4 px-7 py-4 shadow-xl font-body text-[14px] font-normal tracking-wide ${
          paymentStatus === "success"
            ? "bg-graphite text-warm-white"
            : "bg-red-700 text-white"
        }`}>
          {paymentStatus === "success" ? (
            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            Оплата прошла успешно — мы скоро свяжемся с вами!</>
          ) : (
            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Оплата не прошла. Попробуйте ещё раз или напишите нам.</>
          )}
          <button onClick={() => setPaymentStatus(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* ── "Added to cart" floating toast ── */}
      {addedId !== null && (
        <div className="fixed bottom-6 right-6 z-[9994] bg-graphite text-warm-white px-6 py-3.5 font-body text-[13px] font-normal tracking-wide flex items-center gap-3 shadow-xl pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          Добавлено в корзину
        </div>
      )}
    </div>
  );
}
