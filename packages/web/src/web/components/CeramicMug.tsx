import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function CeramicMug() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Check WebGL availability silently
    try {
      const testCanvas = document.createElement("canvas");
      const testGl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!testGl) return;
    } catch (e) { return; }

    let renderer: THREE.WebGLRenderer;
    let animId = 0;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      return;
    }

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 0.6, 4.5);
    camera.lookAt(0, 0.5, 0);

    /* ── LIGHTS ── */
    const key = new THREE.DirectionalLight(0xfff8f0, 3.5);
    key.position.set(-2, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xdde8ff, 0.9);
    fill.position.set(5, 2, -1);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffe8d0, 1.6);
    rim.position.set(0, -1, -5);
    scene.add(rim);

    scene.add(new THREE.AmbientLight(0xfaf0e8, 0.55));

    /* ── MATERIALS ── */
    // Dark graphite clay exterior
    const extMat = new THREE.MeshStandardMaterial({
      color: 0x3e3228,
      roughness: 0.52,
      metalness: 0.04,
    });

    // Warm beige interior glaze
    const intMat = new THREE.MeshStandardMaterial({
      color: 0xd8c4a8,
      roughness: 0.2,
      metalness: 0.05,
    });

    // Base
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x2a2018,
      roughness: 0.75,
      metalness: 0.0,
    });

    /* ── MUG BODY via Lathe ── */
    const group = new THREE.Group();
    scene.add(group);

    // Exterior profile — tall cup / стакан shape
    const extPts: THREE.Vector2[] = [
      [0.00, 0.00],
      [0.36, 0.00],
      [0.38, 0.04],
      [0.40, 0.20],
      [0.42, 0.60],
      [0.43, 1.00],
      [0.44, 1.40],
      [0.45, 1.80],
      [0.46, 2.10],
      [0.48, 2.30],
      [0.50, 2.40],  // rim
      [0.50, 2.44],
    ].map(([x, y]) => new THREE.Vector2(x, y));

    const extGeo = new THREE.LatheGeometry(extPts, 80);
    const extMesh = new THREE.Mesh(extGeo, extMat);
    extMesh.castShadow = true;
    extMesh.receiveShadow = true;
    group.add(extMesh);

    // Interior profile — slightly smaller, flipped
    const intPts: THREE.Vector2[] = [
      [0.00, 0.08],
      [0.30, 0.08],
      [0.32, 0.14],
      [0.34, 0.50],
      [0.36, 0.90],
      [0.37, 1.30],
      [0.38, 1.70],
      [0.39, 2.05],
      [0.40, 2.26],
      [0.41, 2.38],
      [0.42, 2.44],
    ].map(([x, y]) => new THREE.Vector2(x, y));

    const intGeo = new THREE.LatheGeometry(intPts, 80);
    intGeo.scale(-1, 1, 1);
    const intMesh = new THREE.Mesh(intGeo, intMat);
    group.add(intMesh);

    // Bottom disc
    const botGeo = new THREE.CylinderGeometry(0.36, 0.34, 0.012, 64);
    const botMesh = new THREE.Mesh(botGeo, baseMat);
    botMesh.position.y = 0.006;
    group.add(botMesh);

    // Foot ring torus
    const footGeo = new THREE.TorusGeometry(0.28, 0.022, 10, 64);
    footGeo.rotateX(Math.PI / 2);
    const footMesh = new THREE.Mesh(footGeo, baseMat);
    footMesh.position.y = 0.022;
    group.add(footMesh);

    /* ── HANDLE ── */
    // Tube along a bezier curve
    const handleCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.50, 2.10, 0),
      new THREE.Vector3(1.10, 2.10, 0),
      new THREE.Vector3(1.10, 0.80, 0),
      new THREE.Vector3(0.50, 0.80, 0),
    );
    const handleGeo = new THREE.TubeGeometry(handleCurve, 40, 0.062, 12, false);
    const handleMesh = new THREE.Mesh(handleGeo, extMat);
    handleMesh.castShadow = true;
    group.add(handleMesh);

    /* ── ENGRAVED TEXT RING (decorative groove) ── */
    const grooveGeo = new THREE.TorusGeometry(0.502, 0.008, 8, 80);
    const grooveMat = new THREE.MeshStandardMaterial({ color: 0x1e1610, roughness: 0.9, metalness: 0 });
    const groove1 = new THREE.Mesh(grooveGeo, grooveMat);
    groove1.rotation.x = Math.PI / 2;
    groove1.position.y = 1.2;
    group.add(groove1);
    const groove2 = groove1.clone();
    groove2.position.y = 0.5;
    group.add(groove2);

    /* ── SHADOW PLANE ── */
    const shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 60),
      new THREE.MeshStandardMaterial({ color: 0x1a1208, transparent: true, opacity: 0.08, roughness: 1 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.01;
    shadowPlane.receiveShadow = true;
    group.add(shadowPlane);

    /* ── PARTICLES ── */
    const pCount = 90;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 1.6 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;
      pPos[i * 3]     = r * Math.cos(theta) * Math.cos(phi);
      pPos[i * 3 + 1] = r * Math.sin(phi) + 1.2;
      pPos[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMesh = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0xb89060, size: 0.016, transparent: true, opacity: 0.45, sizeAttenuation: true,
    }));
    scene.add(pMesh);

    /* ── POSE ── */
    group.rotation.x = 0.12;
    group.rotation.y = -0.6;
    group.position.y = -1.22;

    /* ── MOUSE ── */
    let tx = 0.12, ty = -0.6;
    const onMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      ty = -0.6 + mx * 0.7;
      tx = 0.12 - my * 0.3;
    };
    mount.addEventListener("mousemove", onMove);

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    /* ── LOOP ── */
    let clock = 0;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      clock += 0.007;

      group.rotation.y += (ty - group.rotation.y) * 0.05;
      group.rotation.x += (tx - group.rotation.x) * 0.05;
      ty += 0.0015; // slow auto-spin

      group.position.y = -1.22 + Math.sin(clock * 0.65) * 0.03;
      pMesh.rotation.y += 0.0007;

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      mount.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />;
}
