import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type Product = {
  id: number;
  name: string;
  desc: string;
  price: string;
  priceNum: number;
  img: string;
  tag: string;
  stock?: number;
  variants?: { label: string; img: string }[];
};

interface Props {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (p: Product & { img: string; name: string }) => void;
  addedId: number | null;
  selectedVariant: number;
  onVariantChange: (vi: number) => void;
}

export default function QuickViewDrawer({ product, onClose, onAddToCart, addedId, selectedVariant, onVariantChange }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Open animation
  useEffect(() => {
    if (product) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
        gsap.fromTo(drawerRef.current,
          { x: "100%" },
          { x: "0%", duration: 0.45, ease: "power3.out" }
        );
      });
    }
  }, [product?.id]);

  const handleClose = () => {
    gsap.to(drawerRef.current, { x: "100%", duration: 0.35, ease: "power3.in" });
    gsap.to(backdropRef.current, {
      opacity: 0, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        setIsVisible(false);
        document.body.style.overflow = "";
        onClose();
      }
    });
  };

  if (!isVisible && !product) return null;

  const activeImg = product?.variants ? product.variants[selectedVariant]?.img ?? product.img : product?.img ?? "";
  const activeName = product?.variants ? `${product.name} — ${product.variants[selectedVariant]?.label}` : product?.name ?? "";
  const stock = product?.stock;
  const isLow = stock !== undefined && stock <= 3;

  const stockLabel = () => {
    if (stock === undefined) return null;
    if (stock === 1) return "Последняя";
    if (stock <= 3) return `Осталось ${stock} шт.`;
    return `В наличии ${stock} шт.`;
  };

  return (
    <div className="fixed inset-0 z-[9990] flex justify-end" style={{ pointerEvents: isVisible ? "auto" : "none" }}>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-graphite/50 backdrop-blur-sm"
        onClick={handleClose}
        style={{ opacity: 0 }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="relative w-full max-w-[480px] h-full bg-warm-white flex flex-col overflow-hidden"
        style={{ transform: "translateX(100%)" }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 z-10 w-9 h-9 flex items-center justify-center rounded-full border border-sand hover:border-graphite transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-graphite-light group-hover:text-graphite transition-colors" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative w-full overflow-hidden bg-sand flex-shrink-0" style={{ height: "55%" }}>
          <img
            key={activeImg}
            src={activeImg}
            alt={activeName}
            className="w-full h-full object-cover"
            style={{ animation: "drawerImgFadeIn 0.4s ease" }}
          />
          {/* Tag */}
          <span className="absolute top-5 left-5 font-body text-[10px] tracking-[0.2em] uppercase text-graphite-light bg-warm-white/90 backdrop-blur-sm px-3 py-1.5">
            {product?.tag}
          </span>
          {/* Stock badge */}
          {stock !== undefined && (
            <span className={`absolute bottom-5 left-5 font-body text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 ${
              isLow
                ? "bg-accent text-warm-white"
                : "bg-graphite/80 text-warm-white backdrop-blur-sm"
            }`}>
              {stockLabel()}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-5">
          {/* Name + price */}
          <div>
            <h2 className="font-display text-[28px] font-normal text-graphite leading-tight tracking-[0.01em] mb-2">
              {product?.name}
            </h2>
            <span className="font-display text-[24px] font-normal text-graphite">
              {product?.price}
            </span>
          </div>

          {/* Variants */}
          {product?.variants && (
            <div>
              <p className="font-body text-[11px] tracking-[0.15em] uppercase text-graphite-light mb-2.5">Вариант</p>
              <div className="flex gap-2 flex-wrap">
                {product.variants.map((v, vi) => (
                  <button
                    key={vi}
                    onClick={() => onVariantChange(vi)}
                    className={`font-body text-[11px] font-medium tracking-[0.12em] uppercase px-3.5 py-2 border transition-all duration-200 rounded-sm ${
                      selectedVariant === vi
                        ? "bg-graphite text-warm-white border-graphite"
                        : "bg-transparent text-graphite-light border-sand hover:border-graphite hover:text-graphite"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="font-body text-[15px] font-normal leading-relaxed text-graphite-light">
              {product?.desc}
            </p>
          </div>

          {/* Details */}
          <div className="border-t border-sand pt-5 space-y-3">
            {[
              { label: "Материал", val: "Керамика, ручная работа" },
              { label: "Уход", val: "Можно мыть в посудомойке" },
              { label: "Доставка", val: "СДЭК по всей России" },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between items-baseline gap-4">
                <span className="font-body text-[12px] tracking-[0.1em] uppercase text-graphite-light">{label}</span>
                <span className="font-body text-[13px] text-graphite text-right">{val}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-auto pt-4 flex flex-col gap-3">
            <button
              onClick={() => product && onAddToCart({ ...product, img: activeImg, name: activeName })}
              className={`w-full font-body text-[12px] tracking-[0.2em] uppercase py-4 transition-all duration-300 ${
                addedId === product?.id
                  ? "bg-accent text-warm-white"
                  : "bg-graphite text-warm-white hover:bg-graphite-light"
              }`}
            >
              {addedId === product?.id ? "✓ Добавлено в корзину" : "В корзину"}
            </button>
            <a
              href={`https://wa.me/79999999999?text=Хочу заказать: ${encodeURIComponent(activeName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full font-body text-[12px] tracking-[0.2em] uppercase py-4 border border-graphite text-graphite text-center hover:bg-graphite hover:text-warm-white transition-all duration-300"
            >
              Написать в WhatsApp
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes drawerImgFadeIn {
          from { opacity: 0; transform: scale(1.03); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
