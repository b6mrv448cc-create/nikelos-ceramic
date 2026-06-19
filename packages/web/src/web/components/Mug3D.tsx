import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Mug3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    /* ── Scene / Camera ── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 100);
    camera.position.set(0, 0.6, 4.5);
    camera.lookAt(0, 0, 0);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0xfff8f0, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 3.0);
    key.position.set(4, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd8eaff, 1.0);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    /* ── Group ── */
    const group = new THREE.Group();
    scene.add(group);

    /* ── Load photo texture ── */
    const loader = new THREE.TextureLoader();
    const tex = loader.load("/mug3d-front.png");
    tex.colorSpace = THREE.SRGBColorSpace;

    /* ── Bowl shape via lathe ──
       Профиль пиалы: снизу узко, расширяется кверху
    */
    const points: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      // x = radius (0 внизу, расширяется), y = height (-0.5 to 0.5)
      const y = t * 1.1 - 0.55;
      // форма пиалы: параболический профиль
      const x = 0.08 + 0.82 * Math.pow(t, 0.55);
      points.push(new THREE.Vector2(x, y));
    }

    const bowlGeo = new THREE.LatheGeometry(points, 80);

    /* Назначаем UV так чтобы фото оборачивалось по окружности */
    const posAttr = bowlGeo.getAttribute("position") as THREE.BufferAttribute;
    const uvAttr = bowlGeo.getAttribute("uv") as THREE.BufferAttribute;
    const count = posAttr.count;
    for (let i = 0; i < count; i++) {
      const u = uvAttr.getX(i);
      const v = uvAttr.getY(i);
      uvAttr.setXY(i, u, v);
    }

    const bowlMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.45,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.castShadow = true;
    group.add(bowl);

    /* ── Bottom cap ── */
    const botGeo = new THREE.CircleGeometry(0.08, 40);
    const botMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
    const bot = new THREE.Mesh(botGeo, botMat);
    bot.rotation.x = Math.PI / 2;
    bot.position.y = -0.55;
    group.add(bot);

    /* ── Shadow ── */
    const shadowGeo = new THREE.PlaneGeometry(5, 5);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.58;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    /* ── Initial rotation ── */
    group.rotation.x = 0.25;
    group.rotation.y = Math.PI * 0.1;

    /* ── Drag state ── */
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotY = group.rotation.y;
    let targetRotX = group.rotation.x;

    const startDrag = (x: number, y: number) => {
      isDragging = true;
      prevX = x; prevY = y;
      velX = 0; velY = 0;
    };
    const moveDrag = (x: number, y: number) => {
      if (!isDragging) return;
      velX = (x - prevX) * 0.013;
      velY = (y - prevY) * 0.007;
      targetRotY += velX;
      targetRotX = Math.max(-0.5, Math.min(0.7, targetRotX + velY));
      prevX = x; prevY = y;
    };
    const endDrag = () => { isDragging = false; };

    const onMouseDown = (e: MouseEvent) => startDrag(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onMouseUp = () => endDrag();
    const onTouchStart = (e: TouchEvent) => startDrag(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchEnd = () => endDrag();

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    /* ── Render loop ── */
    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!isDragging) {
        velX *= 0.90;
        velY *= 0.90;
        targetRotY += velX;
        targetRotX = Math.max(-0.5, Math.min(0.7, targetRotX + velY));
      }
      group.rotation.y += (targetRotY - group.rotation.y) * 0.12;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.12;
      renderer.render(scene, camera);
    };
    animate();

    /* ── Resize ── */
    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
      />
      <p className="absolute bottom-4 left-0 right-0 text-center font-body text-[10px] tracking-[0.2em] uppercase text-graphite-light/50 select-none pointer-events-none">
        Потяните чтобы покрутить
      </p>
    </div>
  );
}
