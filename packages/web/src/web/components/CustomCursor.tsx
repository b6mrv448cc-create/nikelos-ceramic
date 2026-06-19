import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Hide native cursor globally
    document.documentElement.style.cursor = "none";

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    // Set initial position
    gsap.set([dot, ring], { x: mouseX, y: mouseY, xPercent: -50, yPercent: -50 });

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Dot follows instantly
      gsap.to(dot, { x: mouseX, y: mouseY, duration: 0.08, ease: "power2.out" });
    };

    // Ring follows with lag (rAF loop for smooth lerp)
    let rafId: number;
    const loop = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      gsap.set(ring, { x: ringX, y: ringY });
      rafId = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("mousemove", onMove, { passive: true });

    // ── Magnetic / scale reactions ──
    const interactiveSelectors = [
      "a", "button", ".product-card", "input", "textarea", "select", "label[for]",
    ].join(", ");

    const onEnter = () => {
      gsap.to(ring, { scale: 2.8, opacity: 0.5, duration: 0.3, ease: "power2.out" });
      gsap.to(dot, { scale: 1.5, duration: 0.3, ease: "power2.out" });
    };
    const onLeave = () => {
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(dot, { scale: 1, duration: 0.3, ease: "power2.out" });
    };

    // Use event delegation on document
    const handleEnter = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.(interactiveSelectors)) onEnter();
    };
    const handleLeave = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.(interactiveSelectors)) onLeave();
    };

    document.addEventListener("mouseover", handleEnter, { passive: true });
    document.addEventListener("mouseout", handleLeave, { passive: true });

    // Click pulse
    const onClick = () => {
      gsap.timeline()
        .to(ring, { scale: 0.6, opacity: 0.8, duration: 0.1, ease: "power2.in" })
        .to(ring, { scale: 1, opacity: 1, duration: 0.3, ease: "elastic.out(1.2,0.5)" });
    };
    window.addEventListener("click", onClick, { passive: true });

    // Hide when leaving window
    const onLeaveWindow = () => gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
    const onEnterWindow = () => gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
    document.addEventListener("mouseleave", onLeaveWindow);
    document.addEventListener("mouseenter", onEnterWindow);

    return () => {
      document.documentElement.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      document.removeEventListener("mouseover", handleEnter);
      document.removeEventListener("mouseout", handleLeave);
      document.removeEventListener("mouseleave", onLeaveWindow);
      document.removeEventListener("mouseenter", onEnterWindow);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Dot — sharp, instant */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#FDF6EE",
          pointerEvents: "none",
          zIndex: 99999,
          mixBlendMode: "difference",
        }}
      />
      {/* Ring — lagging behind */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1.5px solid rgba(253,246,238,0.75)",
          pointerEvents: "none",
          zIndex: 99998,
          mixBlendMode: "difference",
        }}
      />
    </>
  );
}
