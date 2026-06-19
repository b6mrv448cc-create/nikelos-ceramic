import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  scrollProgress: number; // 0..1 — driven by parent
}

export default function CeramicViewer({ scrollProgress }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    group: THREE.Group;
    animId: number;
    particles: THREE.Points;
  } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Check WebGL availability silently
    try {
      const testCanvas = document.createElement("canvas");
      const testGl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!testGl) return;
    } catch (e) { return; }

    /* ── RENDERER ── */
    const W = mount.clientWidth;
    const H = mount.clientHeight;
    let renderer!: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    /* ── SCENE ── */
    const scene = new THREE.Scene();

    /* ── CAMERA ── */
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0, 0.3, 4.2);

    /* ── LIGHTS ── */
    // Warm key light (from upper left)
    const keyLight = new THREE.DirectionalLight(0xfff5e8, 3.2);
    keyLight.position.set(-3, 5, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    scene.add(keyLight);

    // Cool fill (from right)
    const fillLight = new THREE.DirectionalLight(0xe8f0f8, 0.8);
    fillLight.position.set(4, 2, -2);
    scene.add(fillLight);

    // Warm rim (back)
    const rimLight = new THREE.DirectionalLight(0xffe0b0, 1.4);
    rimLight.position.set(0, -2, -4);
    scene.add(rimLight);

    // Ambient
    const ambient = new THREE.AmbientLight(0xfaf4ee, 0.5);
    scene.add(ambient);

    /* ── MATERIALS ── */
    // Main ceramic — warm sandy glaze
    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xd4b896,
      roughness: 0.45,
      metalness: 0.04,
      envMapIntensity: 1.0,
    });

    // Inner glaze — dark glossy
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x4a3828,
      roughness: 0.18,
      metalness: 0.06,
      envMapIntensity: 1.2,
    });

    // Base mat
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xb89878,
      roughness: 0.7,
      metalness: 0.0,
    });

    /* ── GROUP ── */
    const group = new THREE.Group();
    scene.add(group);

    /* ── BUILD BOWL (pial) ── */
    // Profile curve for lathe — bowl shape
    const bowlPoints: THREE.Vector2[] = [];
    // bottom center → outward curve → rim
    const profile = [
      [0.0,  0.00],
      [0.1,  0.01],
      [0.5,  0.04],
      [0.85, 0.15],
      [1.05, 0.38],
      [1.18, 0.62],
      [1.24, 0.88],
      [1.26, 1.10],
      [1.22, 1.28],
      [1.16, 1.42],
      [1.10, 1.52],
    ];
    profile.forEach(([x, y]) => bowlPoints.push(new THREE.Vector2(x * 0.72, y * 0.72)));

    const bowlGeo = new THREE.LatheGeometry(bowlPoints, 80);
    const bowl = new THREE.Mesh(bowlGeo, ceramicMat);
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    group.add(bowl);

    // Inner surface (slightly smaller, flipped)
    const innerPoints: THREE.Vector2[] = [];
    const innerProfile = [
      [0.0,  0.05],
      [0.08, 0.06],
      [0.45, 0.09],
      [0.78, 0.20],
      [0.98, 0.42],
      [1.10, 0.66],
      [1.14, 0.90],
      [1.16, 1.10],
      [1.12, 1.28],
      [1.06, 1.42],
      [1.00, 1.50],
    ];
    innerProfile.forEach(([x, y]) => innerPoints.push(new THREE.Vector2(x * 0.72, y * 0.72)));
    const innerGeo = new THREE.LatheGeometry(innerPoints, 80);
    // Flip normals inward
    innerGeo.scale(-1, 1, 1);
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.castShadow = false;
    group.add(inner);

    // Foot ring
    const footGeo = new THREE.TorusGeometry(0.16, 0.024, 10, 60);
    const foot = new THREE.Mesh(footGeo, baseMat);
    foot.position.y = 0.024;
    foot.rotation.x = Math.PI / 2;
    group.add(foot);

    // Slight base disc
    const discGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.012, 60);
    const disc = new THREE.Mesh(discGeo, baseMat);
    disc.position.y = 0.006;
    group.add(disc);

    // Shadow plane
    const shadowGeo = new THREE.CircleGeometry(1.8, 60);
    const shadowMat = new THREE.MeshStandardMaterial({
      color: 0x2a2018, transparent: true, opacity: 0.10,
      roughness: 1, metalness: 0,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.01;
    shadowPlane.receiveShadow = true;
    group.add(shadowPlane);

    /* ── FLOATING PARTICLES ── */
    const pCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 1.4 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      pPos[i * 3]     = r * Math.cos(theta) * Math.cos(phi);
      pPos[i * 3 + 1] = r * Math.sin(phi) + 0.6;
      pPos[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xc8a882,
      size: 0.018,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* ── INITIAL POSE ── */
    group.rotation.x = 0.18;
    group.position.y = -0.22;

    /* ── MOUSE TILT ── */
    let mouseX = 0, mouseY = 0;
    let targetRotX = 0.18, targetRotY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = mouseX * 0.55;
      targetRotX = 0.18 - mouseY * 0.28;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const rect = mount.getBoundingClientRect();
      mouseX = ((e.touches[0].clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.touches[0].clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = mouseX * 0.55;
      targetRotX = 0.18 - mouseY * 0.28;
    };
    mount.addEventListener("mousemove", onMouseMove);
    mount.addEventListener("touchmove", onTouchMove, { passive: true });

    /* ── RESIZE ── */
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    /* ── RENDER LOOP ── */
    let t = 0;
    const animate = () => {
      const id = requestAnimationFrame(animate);
      sceneRef.current!.animId = id;
      t += 0.008;

      // Smooth mouse follow
      group.rotation.y += (targetRotY - group.rotation.y) * 0.06;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.06;

      // Gentle idle bob
      group.position.y = -0.22 + Math.sin(t * 0.7) * 0.028;

      // Slow auto-rotate when mouse idle
      targetRotY += 0.0018;

      // Particles drift
      particles.rotation.y += 0.0006;
      particles.rotation.x += 0.0002;

      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = { renderer, scene, camera, group, animId: 0, particles };

    return () => {
      cancelAnimationFrame(sceneRef.current?.animId ?? 0);
      mount.removeEventListener("mousemove", onMouseMove);
      mount.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  /* Scroll-driven lift + tilt */
  useEffect(() => {
    if (!sceneRef.current) return;
    const { group } = sceneRef.current;
    // lift bowl upward as user scrolls through section
    group.position.y = -0.22 + scrollProgress * 0.35;
    // extra y-rotation driven by scroll
    // (smooth handled in loop via lerp, just offset target)
  }, [scrollProgress]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", cursor: "grab" }}
    />
  );
}
