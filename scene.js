/* ==========================================================================
   HERO SCENE — a procedural villa that is drawn, then built, then taken apart.

   Timeline
     intro   (time)   blueprint edges draw in bottom-up, then solids settle
     scroll  0 → 1    camera orbits, the sun sweeps across the day,
                      and from ~0.55 the floors lift into an exploded axonometric

   Public API
     const hero = createHeroScene(canvas, { reducedMotion })
     hero.setProgress(p)    0..1 scroll progress through the pinned hero
     hero.setPointer(x, y)  -1..1 normalised pointer
     hero.setActive(bool)   pause rendering when the hero is off-screen
     hero.labels()          [{ key, x, y, visible }] screen positions for HTML labels
   ========================================================================== */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const GOLD = 0xc8a45a;
const BG = 0x0b0b0c;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;

export function createHeroScene(canvas, { reducedMotion = false } = {}) {
  const isSmall = window.innerWidth < 760;

  /* ---------- renderer ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
  renderer.setClearColor(BG, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 48, 120);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  const target = new THREE.Vector3(0, 5.2, 0);

  /* ---------- light ---------- */
  const hemi = new THREE.HemisphereLight(0xdfe6ff, 0x1a1510, 0.55);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe2b8, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
  const sc = sun.shadow.camera;
  sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 120;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  sun.target.position.set(0, 3, 0);

  const rim = new THREE.PointLight(GOLD, 40, 40, 1.6);
  rim.position.set(-12, 9, -10);
  scene.add(rim);

  /* ---------- ground ---------- */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.ShadowMaterial({ opacity: 0.42 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(160, 80, GOLD, 0xffffff);
  grid.material.transparent = true;
  grid.material.opacity = 0.07;
  grid.material.depthWrite = false;
  grid.position.y = 0.002;
  scene.add(grid);

  // A faint site boundary, drawn like a plot line on a survey.
  const plot = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-14, 0.01, -10), new THREE.Vector3(14, 0.01, -10),
      new THREE.Vector3(14, 0.01, 12), new THREE.Vector3(-14, 0.01, 12)
    ]),
    new THREE.LineDashedMaterial({ color: GOLD, dashSize: 0.6, gapSize: 0.4, transparent: true, opacity: 0.5 })
  );
  plot.computeLineDistances();
  scene.add(plot);

  /* ---------- materials (cloned per element so each can fade on its own) ---------- */
  const M = {
    plaster: new THREE.MeshStandardMaterial({ color: 0xeeeae2, roughness: 0.82, metalness: 0 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.6, metalness: 0.05 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x7a4f2c, roughness: 0.55, metalness: 0 }),
    gold: new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.28, metalness: 1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.45, metalness: 0.4 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x9fb7c4, roughness: 0.05, metalness: 0, transmission: 0, transparent: true,
      opacity: 0.32, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.08
    }),
    warm: new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb45c, emissiveIntensity: 0.0, roughness: 0.9 })
  };
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xe9dcc0, transparent: true, opacity: 0 });

  /* ---------- building ---------- */
  const building = new THREE.Group();
  scene.add(building);

  const levels = [];      // { group, baseY, anchor }
  const elements = [];    // { mesh, edges, delay, matOpacity, fromY }

  function level(name, baseY) {
    const group = new THREE.Group();
    group.position.y = baseY;
    building.add(group);
    const L = { name, group, baseY, anchor: new THREE.Vector3() };
    levels.push(L);
    return L;
  }

  function box(L, kind, w, h, d, x, y, z, opts = {}) {
    const mat = M[kind].clone();
    const targetOpacity = kind === 'glass' ? M.glass.opacity : 1;
    mat.transparent = true;
    mat.opacity = 0;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = kind !== 'glass';
    mesh.receiveShadow = true;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat.clone());
    edges.position.copy(mesh.position);
    if (opts.noEdges) edges.visible = false;
    L.group.add(mesh, edges);
    const worldY = L.baseY + y;
    elements.push({
      mesh, edges, kind,
      home: mesh.position.clone(),
      // build order: bottom first, then left to right so it reads like a hand drawing
      delay: worldY * 0.085 + (x + 10) * 0.012 + Math.random() * 0.08,
      targetOpacity
    });
    return mesh;
  }

  // Louvres / pergola slats
  function slats(L, kind, count, span, w, h, d, x0, y, z, axis = 'x') {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      if (axis === 'x') box(L, kind, w, h, d, x0 + t * span, y, z, { noEdges: true });
      else box(L, kind, w, h, d, x0, y, z + t * span, { noEdges: true });
    }
  }

  // PLINTH
  const P = level('Plinth', 0);
  box(P, 'stone', 22, 0.55, 15, 0, 0, 0.5);
  box(P, 'stone', 6, 0.18, 3, 2.5, 0, 9);                // entry step
  box(P, 'dark', 7, 0.04, 13, -14.5 + 3.5 + 1, 0.55, 0.5, { noEdges: true }); // reflecting pool
  P.anchor.set(11, 0.3, 8);

  // GROUND FLOOR
  const G = level('Ground floor', 0.55);
  box(G, 'plaster', 8.5, 3.6, 8, -4.6, 0, -0.5);           // solid living block
  box(G, 'glass', 6.6, 3.4, 6.4, 3.4, 0, 0.4);             // glazed lounge
  box(G, 'dark', 0.12, 3.4, 6.4, 0.08, 0, 0.4);            // mullion
  box(G, 'dark', 0.12, 3.4, 6.4, 6.72, 0, 0.4);
  box(G, 'wood', 0.5, 3.6, 0.5, 8.2, 0, 6.2);              // carport columns
  box(G, 'wood', 0.5, 3.6, 0.5, 8.2, 0, 2.6);
  box(G, 'warm', 3.2, 2.6, 0.08, 3.4, 0.2, -2.8, { noEdges: true }); // warm interior wall
  box(G, 'stone', 3.0, 3.6, 0.6, -6.8, 0, 3.8);            // feature stone fin
  G.anchor.set(-9, 2, 4);

  // FIRST FLOOR (cantilevers toward the street)
  const F1 = level('First floor', 4.15);
  box(F1, 'plaster', 18.5, 0.42, 11.5, 0.8, 0, 1.2);       // slab
  box(F1, 'gold', 18.5, 0.08, 0.06, 0.8, 0.17, 6.98, { noEdges: true }); // gold fascia line
  box(F1, 'plaster', 7.5, 3.3, 7.5, 3.2, 0.42, -0.4);      // bedroom block
  box(F1, 'glass', 6.6, 3.0, 5.4, -4.6, 0.42, 0.2);        // study glass box
  box(F1, 'glass', 17.5, 1.05, 0.06, 0.8, 0.42, 6.85, { noEdges: true }); // glass balustrade
  slats(F1, 'wood', 14, 6.2, 0.14, 3.3, 0.32, 3.2, 0.42, 3.6, 'x'); // timber screen
  box(F1, 'warm', 4.2, 2.4, 0.08, -4.6, 0.6, -2.4, { noEdges: true });
  F1.anchor.set(10, 6, 6);

  // ROOF TERRACE
  const R = level('Roof terrace', 7.87);
  box(R, 'plaster', 15, 0.4, 9.5, 0.2, 0, 0);              // roof slab
  box(R, 'gold', 15, 0.07, 0.06, 0.2, 0.16, 4.78, { noEdges: true });
  box(R, 'plaster', 6.2, 2.9, 6, -3.8, 0.4, -1.2);         // penthouse
  box(R, 'glass', 0.06, 2.6, 4.6, -0.68, 0.4, -1.2, { noEdges: true });
  box(R, 'wood', 0.3, 2.7, 0.3, 6.8, 0.4, 3.8);            // pergola posts
  box(R, 'wood', 0.3, 2.7, 0.3, 6.8, 0.4, -2.4);
  box(R, 'wood', 0.3, 2.7, 0.3, 1.6, 0.4, 3.8);
  slats(R, 'wood', 12, 5.6, 0.18, 0.18, 7.0, 4.2, 3.05, 0.7, 'x'); // pergola slats
  R.anchor.set(-10, 9.5, -1);

  // CROWN
  const C = level('Roof', 11.17);
  box(C, 'dark', 7.4, 0.3, 7.2, -3.8, 0, -1.2);
  box(C, 'gold', 7.4, 0.06, 0.05, -3.8, 0.12, 2.42, { noEdges: true });
  C.anchor.set(-3.8, 11.6, -1.2);

  /* ---------- atmosphere ---------- */
  const dustCount = isSmall ? 260 : 600;
  const dustGeo = new THREE.BufferGeometry();
  const dp = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dp[i * 3] = (Math.random() - 0.5) * 60;
    dp[i * 3 + 1] = Math.random() * 22;
    dp[i * 3 + 2] = (Math.random() - 0.5) * 60;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0xf3dca8, size: 0.06, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true
  }));
  scene.add(dust);

  /* ---------- state ---------- */
  let progress = 0, smoothProgress = 0;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let active = true;
  let raf = 0;
  const clock = new THREE.Clock();
  let introT = reducedMotion ? 99 : 0;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull back on portrait screens so the whole building stays in frame.
    camera.fov = w / h < 0.8 ? 50 : w / h < 1.2 ? 40 : 32;
    // Frame the building beside the headline (wide) or above it (portrait).
    const wide = w / h >= 1.2;
    camera.setViewOffset(w, h, wide ? -w * 0.24 : 0, wide ? 0 : h * 0.16, w, h);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const tmp = new THREE.Vector3();
  const sunColA = new THREE.Color(0xffc98a);   // morning
  const sunColB = new THREE.Color(0xfff1dc);   // noon
  const sunColC = new THREE.Color(0xff9c55);   // dusk

  function update(dt) {
    introT += dt;
    smoothProgress = lerp(smoothProgress, progress, reducedMotion ? 1 : 1 - Math.pow(0.0015, dt));
    pointer.sx = lerp(pointer.sx, pointer.x, 1 - Math.pow(0.01, dt));
    pointer.sy = lerp(pointer.sy, pointer.y, 1 - Math.pow(0.01, dt));
    const p = smoothProgress;

    /* intro: 0–1.6s lines draw, 1.4–3.4s solids settle */
    const lineDraw = introT / 1.6;
    const solid = (introT - 1.2) / 2.0;
    for (const e of elements) {
      const lt = clamp((lineDraw - e.delay * 0.9) * 2.2);
      const st = easeOut(clamp((solid - e.delay * 0.7) * 1.8));
      // edges stay as a faint construction line once solid, brighten again when exploded
      const explodeGlow = clamp((p - 0.55) / 0.3);
      e.edges.material.opacity = smooth(lt) * lerp(0.9, 0.16, st) + explodeGlow * 0.35;
      e.mesh.material.opacity = st * e.targetOpacity;
      e.mesh.visible = st > 0.001;
      // Opaque once settled, so depth sorting is exact; flip only on change.
      const wantTransparent = e.kind === 'glass' || st < 0.999;
      if (e.mesh.material.transparent !== wantTransparent) {
        e.mesh.material.transparent = wantTransparent;
        e.mesh.material.needsUpdate = true;
      }
      const drop = (1 - st) * 1.4;
      e.mesh.position.y = e.home.y + drop;
      e.mesh.castShadow = st > 0.6 && e.kind !== 'glass';
    }

    /* explode floors apart */
    const ex = smooth(clamp((p - 0.55) / 0.35));
    levels.forEach((L, i) => {
      L.group.position.y = L.baseY + ex * i * 2.6;
      L.group.position.x = ex * (i % 2 ? 0.6 : -0.6);
    });

    /* camera: orbit around the building with scroll, small pointer parallax */
    const theta = lerp(0.62, 0.62 + 1.55, smooth(clamp(p / 0.9))) + pointer.sx * 0.1 + Math.sin(introT * 0.15) * 0.02;
    const phi = lerp(0.22, 0.48, smooth(clamp((p - 0.4) / 0.5))) - pointer.sy * 0.05;
    const radius = lerp(isSmall ? 50 : 46, isSmall ? 72 : 64, ex) + (1 - smooth(clamp(introT / 3.5))) * 8 * (reducedMotion ? 0 : 1);
    target.y = lerp(5.2, 10.5, ex);
    camera.position.set(
      target.x + radius * Math.cos(phi) * Math.sin(theta),
      target.y + radius * Math.sin(phi),
      target.z + radius * Math.cos(phi) * Math.cos(theta)
    );
    camera.lookAt(target);

    /* sun sweeps from morning to dusk across the scroll */
    const day = clamp(p / 0.85);
    const az = lerp(-1.2, 2.3, day);
    const el = Math.sin(lerp(0.35, Math.PI - 0.5, day)) * 0.9 + 0.15;
    sun.position.set(Math.cos(az) * 40, el * 34 + 4, Math.sin(az) * 40);
    const sc1 = day < 0.5 ? sunColA.clone().lerp(sunColB, day * 2) : sunColB.clone().lerp(sunColC, (day - 0.5) * 2);
    sun.color.copy(sc1);
    sun.intensity = lerp(2.0, 2.8, Math.sin(day * Math.PI));

    // interiors glow as the sun goes down
    const dusk = clamp((day - 0.55) / 0.4);
    for (const e of elements) if (e.kind === 'warm') e.mesh.material.emissiveIntensity = 0.15 + dusk * 1.6;
    rim.intensity = 25 + dusk * 60;

    dust.rotation.y += dt * 0.01;
    dust.position.y = Math.sin(introT * 0.2) * 0.3;
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!active) return;
    update(dt);
    renderer.render(scene, camera);
  }
  loop();

  return {
    setProgress(v) { progress = clamp(v); },
    setPointer(x, y) { pointer.x = x; pointer.y = y; },
    setActive(v) { active = v; if (v) clock.getDelta(); },
    skipIntro() { introT = Math.max(introT, 99); },
    labels() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const ex = smooth(clamp((smoothProgress - 0.6) / 0.3));
      return levels.map((L) => {
        tmp.copy(L.anchor);
        tmp.y += L.group.position.y - L.baseY;
        tmp.x += L.group.position.x;
        tmp.project(camera);
        return { key: L.name, x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h, visible: ex };
      });
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
    }
  };
}
