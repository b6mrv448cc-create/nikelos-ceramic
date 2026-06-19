import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export interface ProductVariant {
  label: string;
  img: string;
}

export interface Product {
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
  variants?: ProductVariant[];
  hidden?: boolean;
}

const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "products.json");

const INITIAL_PRODUCTS: Product[] = [
  { id: 0,  name: "🧪 Тест-оплата (1 ₽)",              desc: "Тестовый товар для проверки оплаты. Можно удалить после проверки.",                              price: "1 ₽",         priceNum: 1,    img: "/item-pause.jpg",         tag: "Тест",       weight: 450, boxL: 20, boxW: 15, boxH: 15 },
  { id: 1,  name: "Стакан «PAUSE»",                     desc: "Тёмная глина, матовая поверхность, живая серебристая глазурь по краю.",                          price: "от 1 900 ₽",  priceNum: 1900, img: "/item-pause.jpg",         tag: "Стакан",     weight: 450, boxL: 20, boxW: 15, boxH: 15, variants: [{ label: "Вид 1", img: "/item-pause.jpg" }, { label: "Вид 2", img: "/item-pause-2.jpg" }] },
  { id: 2,  name: "Стакан «LOVE»",                      desc: "Та же форма, другое слово. Графитовая глина и тёплая глазурь.",                                   price: "от 1 900 ₽",  priceNum: 1900, img: "/item-love.jpg",          tag: "Стакан",     weight: 450, boxL: 20, boxW: 15, boxH: 15 },
  { id: 3,  name: "Стакан «МЕЧТАЙ»",                    desc: "Авторская надпись вдавлена в глину вручную. Каждая буква — след пальца мастера.",                 price: "от 1 900 ₽",  priceNum: 1900, img: "/item-mechta.jpg",        tag: "Стакан",     weight: 450, boxL: 20, boxW: 15, boxH: 15 },
  { id: 4,  name: "Стакан с рельефом",                  desc: "Вертикальные линии, бронзово-серая глазурь. Лаконично и тепло.",                                 price: "от 1 500 ₽",  priceNum: 1500, img: "/item-stakan-ribbed.jpg", tag: "Стакан",     weight: 450, boxL: 20, boxW: 15, boxH: 15, stock: 6 },
  { id: 25, name: "Стакан «Шахматы»",                   desc: "Молочный фарфор, синий шахматный орнамент. Та же клетка — в формате стакана.",                    price: "1 900 ₽",     priceNum: 1900, img: "/item-stakan-chess.jpg",  tag: "Стакан",     weight: 450, boxL: 20, boxW: 15, boxH: 15, stock: 1 },
  { id: 8,  name: "Кружка с цветочками — голубая",      desc: "Авторская роспись голубыми цветами вручную. Фигурная ручка в виде цветка.",                       price: "2 400 ₽",     priceNum: 2400, img: "/item-mug-blue-1.jpg",    tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11 },
  { id: 11, name: "Кружка с цветочками — красная",      desc: "Авторская роспись красными цветами вручную. Фигурная ручка в виде цветка.",                       price: "2 400 ₽",     priceNum: 2400, img: "/item-mug-red-2.jpg",     tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11 },
  { id: 20, name: "Кружка «Лицо»",                      desc: "Тёмная глина, матовая глазурь. Рельефное лицо вылеплено вручную.",                                 price: "2 500 ₽",     priceNum: 2500, img: "/item-face-mug-1.jpg",     tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, variants: [{ label: "1", img: "/item-face-mug-1.jpg" }, { label: "2", img: "/item-face-mug-2.jpg" }] },
  { id: 19, name: "Кружка «Шахматы»",                   desc: "Молочный фарфор, синий шахматный орнамент. Та же идея — в формате кружки.",                        price: "2 500 ₽",     priceNum: 2500, img: "/item-checker-mug.jpg",    tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 3 },
  { id: 24, name: "Кружка «Минимализм»",                desc: "Тёмная глина, матовая серо-белая глазурь. Лаконичная форма без лишнего — только суть.",            price: "2 300 ₽",     priceNum: 2300, img: "/item-mug-minimal.jpg",    tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  { id: 26, name: "Кружка «Дерево»",                    desc: "Тёмная глина с текстурой дерева, круглая ручка. Тёплая и приятная в руках.",                      price: "2 300 ₽",     priceNum: 2300, img: "/item-mug-wood.jpg",       tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  { id: 27, name: "Кружка «Волны»",                     desc: "Светлая глина, синий волнистый орнамент. Лёгкая и изящная форма.",                                 price: "2 900 ₽",     priceNum: 2900, img: "/item-mug-waves.jpg",      tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  { id: 28, name: "Кружка «Пудель»",                    desc: "Авторская роспись — пудель синим контуром. Характер в каждой линии.",                             price: "2 900 ₽",     priceNum: 2900, img: "/item-mug-poodle.jpg",     tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  { id: 34, name: "Кружка тёмная серебристая",          desc: "Тёмная глина, серебристая живая глазурь. Круглая ручка, приятно держать.",                        price: "2 300 ₽",     priceNum: 2300, img: "/item-mug-silver.jpg",     tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  { id: 37, name: "Кружка «Завитки»",                   desc: "Светлая глина, разноцветная роспись завитками. Яркая и живая.",                                   price: "2 500 ₽",     priceNum: 2500, img: "/item-mug-colorful.jpg",   tag: "Кружка",     weight: 450, boxL: 15, boxW: 11, boxH: 11, stock: 1 },
  { id: 5,  name: "Пиалы с живой глазурью",             desc: "Каждая пиала — своего цвета. Розовая, бронзовая, тёмная, серая.",                                 price: "от 1 200 ₽",  priceNum: 1200, img: "/item-pialy-glaze.jpg",   tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15, stock: 12 },
  { id: 6,  name: "Пиалы «Дерево»",                     desc: "Текстура прожилок дерева в глазури. Тёплые оттенки охры и терракоты.",                            price: "от 1 200 ₽",  priceNum: 1200, img: "/item-pialy-wood.jpg",    tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15, stock: 4 },
  { id: 7,  name: "Пиалы «Шахматы»",                    desc: "Молочный фарфор снаружи, синий шахматный орнамент внутри.",                                       price: "от 2 400 ₽",  priceNum: 2400, img: "/item-checker-side.jpg",  tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15 },
  { id: 9,  name: "Пиала ручной работы",                desc: "Лаконичная форма, глубокая тёмная глазурь с белыми разводами. Минимализм в чистом виде.",         price: "1 500 ₽",     priceNum: 1500, img: "/item-piala-big.jpg",     tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15 },
  { id: 12, name: "Пиала синяя бирюзовая",              desc: "Насыщенная синяя глазурь с бирюзовыми переходами. Удобная форма для чая и закусок.",               price: "900 ₽",       priceNum: 900,  img: "/item-piala-blue.jpg",    tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15 },
  { id: 13, name: "Пиала для чайных церемоний",         desc: "Небольшая пиала для чайных церемоний. Тёмная матовая глазурь, удобно лежит в руках.",              price: "1 500 ₽",     priceNum: 1500, img: "/item-piala-tea-1.jpg",   tag: "Пиала",      weight: 400, boxL: 20, boxW: 15, boxH: 15 },
  { id: 29, name: "Пиала тёмная авторская",             desc: "Тёмная глина, молочная глазурь снизу. Небольшая, удобно лежит в ладони.",                         price: "900 ₽",       priceNum: 900,  img: "/item-piala-dark-1.jpg",  tag: "Пиала",      weight: 300, boxL: 15, boxW: 15, boxH: 8, stock: 1, variants: [{ label: "Вид 1", img: "/item-piala-dark-1.jpg" }, { label: "Вид 2", img: "/item-piala-dark-2.jpg" }, { label: "Вид 3", img: "/item-piala-dark-3.jpg" }] },
  { id: 30, name: "Пиала гранёная",                     desc: "Тёмная глина, серебристая живая глазурь сверху. Грани подчёркивают форму.",                       price: "1 500 ₽",     priceNum: 1500, img: "/item-piala-faceted.jpg", tag: "Пиала",      weight: 350, boxL: 15, boxW: 15, boxH: 8, stock: 1 },
  { id: 35, name: "Пиала с подтёками",                  desc: "Тёмная глина, молочная глазурь с живыми подтёками. Каждая — уникальна.",                          price: "900 ₽",       priceNum: 900,  img: "/item-piala-drip.jpg",    tag: "Пиала",      weight: 300, boxL: 15, boxW: 15, boxH: 8, stock: 1 },
  { id: 36, name: "Пиала розовая",                      desc: "Живая розово-бордовая глазурь с переходами. Тёплый и насыщенный цвет.",                           price: "1 200 ₽",     priceNum: 1200, img: "/item-piala-rose-1.jpg",  tag: "Пиала",      weight: 300, boxL: 15, boxW: 15, boxH: 8, stock: 1, variants: [{ label: "Вид 1", img: "/item-piala-rose-1.jpg" }, { label: "Вид 2", img: "/item-piala-rose-2.jpg" }] },
  { id: 14, name: "Тарелка «Любовь спасёт мир»",        desc: "Тёмная глазурь и надпись по краю вдавлена вручную. Авторское высказывание в глине.",               price: "2 500 ₽",     priceNum: 2500, img: "/item-plate-love.jpg",    tag: "Тарелка",    weight: 650, boxL: 20, boxW: 20, boxH: 10, stock: 1 },
  { id: 15, name: "Тарелка с синей сеткой",             desc: "Геометричный орнамент синей сеткой по белому фону. Чёткий ритм и живая линия.",                    price: "2 500 ₽",     priceNum: 2500, img: "/item-plate-grid.jpg",    tag: "Тарелка",    weight: 650, boxL: 20, boxW: 20, boxH: 10, stock: 1 },
  { id: 21, name: "Тарелка с синей каёмкой",            desc: "Фарфор, глубокая форма с волнистым краем. Синяя полоса по ободу — строго и изящно.",               price: "2 900 ₽",     priceNum: 2900, img: "/item-plate-edge-1.jpg",   tag: "Тарелка",    weight: 550, boxL: 20, boxW: 20, boxH: 4, stock: 1, variants: [{ label: "Вид 1", img: "/item-plate-edge-1.jpg" }, { label: "Вид 2", img: "/item-plate-edge-2.jpg" }] },
  { id: 22, name: "Тарелка «Клетка»",                   desc: "Фарфор, синий шахматный орнамент по всей поверхности. Та же клетка — в формате тарелки.",          price: "2 900 ₽",     priceNum: 2900, img: "/item-plate-grid-2.jpg",  tag: "Тарелка",    weight: 550, boxL: 20, boxW: 20, boxH: 4, stock: 1 },
  { id: 23, name: "Тарелка с рюшевым краем",            desc: "Фарфор, фестончатый волнистый бортик. Синяя каёмка подчёркивает сложную форму края.",              price: "3 500 ₽",     priceNum: 3500, img: "/item-plate-ruffle-1.jpg", tag: "Тарелка",    weight: 550, boxL: 20, boxW: 20, boxH: 4, stock: 1, variants: [{ label: "Вид 1", img: "/item-plate-ruffle-1.jpg" }, { label: "Вид 2", img: "/item-plate-ruffle-2.jpg" }] },

  { id: 10, name: "Подсвечник в форме цветка",          desc: "Лепной подсвечник с ажурными лепестками и росписью. Создаёт мягкий уютный свет.",                  price: "750 ₽",       priceNum: 750,  img: "/item-candle-2.jpg",      tag: "Декор",      weight: 350, boxL: 20, boxW: 15, boxH: 15, stock: 4 },
  { id: 16, name: "Подсвечник-волна",                   desc: "Синяя волнистая форма с держателем для свечи. Дерзко и лаконично.",                                price: "1 500 ₽",     priceNum: 1500, img: "/item-candle-wave-1.jpg",  tag: "Декор",      weight: 350, boxL: 20, boxW: 15, boxH: 15, stock: 1 },
  { id: 17, name: "Подставка для благовоний",           desc: "Волнообразная подставка ручной работы. Подходит для палочек и конусов.",                           price: "1 200 ₽",     priceNum: 1200, img: "/item-incense-wave.jpg",   tag: "Декор",      weight: 350, boxL: 20, boxW: 15, boxH: 15, stock: 3 },
  { id: 18, name: "Брошь с розой",                      desc: "Лепная брошь с рельефной розой. Доступна в двух цветах: белая и бронзовая.",                       price: "1 350 ₽",     priceNum: 1350, img: "/item-brooch-white.jpg",   tag: "Украшения",  weight: 50,  boxL: 15, boxW: 10, boxH: 5, variants: [{ label: "Белая", img: "/item-brooch-white.jpg" }, { label: "Бронзовая", img: "/item-brooch-bronze.jpg" }] },
  { id: 31, name: "Брошь «Сердце — Любовь»",            desc: "Лепная брошь-сердце с надписью. В подарочной коробочке.",                                         price: "1 500 ₽",     priceNum: 1500, img: "/item-brooch-heart-love.jpg", tag: "Украшения", weight: 50, boxL: 10, boxW: 10, boxH: 4, stock: 1 },
  { id: 32, name: "Брошь «Сердце — Хаханьки»",          desc: "Лепная брошь-сердце с надписью. В подарочной коробочке.",                                         price: "1 500 ₽",     priceNum: 1500, img: "/item-brooch-heart-fun.jpg",  tag: "Украшения", weight: 50, boxL: 10, boxW: 10, boxH: 4, stock: 1 },
];

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function loadProducts(): Product[] {
  ensureDir();
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, JSON.stringify(INITIAL_PRODUCTS, null, 2), "utf-8");
    return INITIAL_PRODUCTS;
  }
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as Product[];
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: Product[]): void {
  ensureDir();
  writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), "utf-8");
}

export function nextId(products: Product[]): number {
  return products.length === 0 ? 1 : Math.max(...products.map(p => p.id)) + 1;
}
