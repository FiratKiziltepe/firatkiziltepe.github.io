/* Bağlam — three.js ile kurulan 3B objeler.
   Her obje temel geometrilerden oluşur; ikonlar bir kez çizilip görsele dönüştürülür. */
window.Models = (() => {
  const T = window.THREE;
  const yok = { ok: false, icon: () => '', mount: () => null };
  if (!T) return yok;
  if (T.ColorManagement && 'legacyMode' in T.ColorManagement) T.ColorManagement.legacyMode = false;

  const C = { beyaz: 0xF6F3EE, teal: 0x17A594, turuncu: 0xF58A4B, sari: 0xF6C445, pembe: 0xF07BA0, indigo: 0x5B6BE8,
    koyu: 0x27323A, gri: 0xAEB8BD, yesil: 0x4DB36B, yesil2: 0x6CC784, yesil3: 0x3A9657, kahve: 0x9A6A4B, hamur: 0xE2A765, mavi: 0xCFEFF5 };
  const mat = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0, ...o });
  const add = (g, geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => {
    const x = new T.Mesh(geo, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); g.add(x); return x;
  };
  const sph = r => new T.SphereGeometry(r, 44, 30);
  const cyl = (rt, rb, h, seg = 44) => new T.CylinderGeometry(rt, rb, h, seg);
  const tor = (R, r, arc = Math.PI * 2) => new T.TorusGeometry(R, r, 24, 72, arc);
  function rbox(w, h, d, r) {
    const bev = Math.min(r, d / 2 - 0.001, 0.09);
    const W = w - 2 * bev, H = h - 2 * bev, rr = Math.max(Math.min(r - bev, W / 2, H / 2), 0.001);
    const s = new T.Shape();
    s.moveTo(-W / 2 + rr, -H / 2); s.lineTo(W / 2 - rr, -H / 2); s.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + rr);
    s.lineTo(W / 2, H / 2 - rr); s.quadraticCurveTo(W / 2, H / 2, W / 2 - rr, H / 2);
    s.lineTo(-W / 2 + rr, H / 2); s.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - rr);
    s.lineTo(-W / 2, -H / 2 + rr); s.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + rr, -H / 2);
    const g = new T.ExtrudeGeometry(s, { depth: d - 2 * bev, bevelEnabled: true, bevelSize: bev, bevelThickness: bev, bevelSegments: 5, curveSegments: 10 });
    g.center(); return g;
  }
  let tohum = 7; const rnd = () => (tohum = (tohum * 16807) % 2147483647) / 2147483647;
  const R90 = Math.PI / 2;

  const kur = {
    top(g) {
      add(g, sph(1), mat(C.beyaz));
      const ico = new T.IcosahedronGeometry(1, 0), p = ico.attributes.position, gor = new Set();
      for (let i = 0; i < p.count; i++) {
        const v = [p.getX(i), p.getY(i), p.getZ(i)], k = v.map(n => n.toFixed(2)).join();
        if (gor.has(k)) continue; gor.add(k);
        add(g, sph(0.4), mat(C.koyu), v.map(n => n * 0.635));
      }
    },
    kulaklik(g) {
      add(g, tor(0.92, 0.085, Math.PI), mat(C.koyu));
      for (const s of [-1, 1]) {
        add(g, cyl(0.07, 0.07, 0.34), mat(C.koyu), [s * 0.92, -0.12, 0]);
        add(g, cyl(0.4, 0.4, 0.26), mat(C.turuncu), [s * 1.0, -0.3, 0], [0, 0, R90]);
        add(g, tor(0.31, 0.1), mat(C.koyu), [s * 0.84, -0.3, 0], [0, R90, 0]);
        add(g, cyl(0.2, 0.2, 0.28), mat(C.sari), [s * 1.02, -0.3, 0], [0, 0, R90]);
      }
    },
    gamepad(g) {
      const govde = mat(C.indigo);
      add(g, rbox(2.1, 0.95, 0.5, 0.44), govde);
      for (const s of [-1, 1]) add(g, sph(0.44), govde, [s * 0.74, -0.42, 0], [0, 0, s * 0.25], [0.95, 1.3, 0.62]);
      add(g, cyl(0.19, 0.19, 0.08), mat(C.koyu), [-0.62, 0.12, 0.26], [R90, 0, 0]);
      add(g, sph(0.15), mat(C.beyaz), [-0.62, 0.12, 0.36], [0, 0, 0], [1, 1, 0.6]);
      add(g, cyl(0.19, 0.19, 0.08), mat(C.koyu), [0.3, -0.16, 0.26], [R90, 0, 0]);
      add(g, sph(0.15), mat(C.beyaz), [0.3, -0.16, 0.36], [0, 0, 0], [1, 1, 0.6]);
      add(g, rbox(0.36, 0.12, 0.1, 0.04), mat(C.beyaz), [-0.3, -0.16, 0.27]);
      add(g, rbox(0.12, 0.36, 0.1, 0.04), mat(C.beyaz), [-0.3, -0.16, 0.27]);
      [[0.62, 0.27, C.sari], [0.62, -0.03, C.teal], [0.47, 0.12, C.pembe], [0.77, 0.12, C.turuncu]].forEach(([x, y, c]) =>
        add(g, sph(0.085), mat(c), [x, y, 0.27], [0, 0, 0], [1, 1, 0.7]));
    },
    klaket(g) {
      add(g, rbox(1.8, 1.15, 0.18, 0.1), mat(C.koyu), [0, -0.3, 0]);
      for (const y of [-0.12, -0.36, -0.6]) add(g, rbox(y < -0.5 ? 0.8 : 1.4, 0.07, 0.03, 0.03), mat(C.gri), [y < -0.5 ? -0.3 : 0, y, 0.1]);
      const cubuk = (acik) => {
        const k = new T.Group();
        add(k, rbox(1.8, 0.26, 0.2, 0.06), mat(C.koyu), [0.9, 0, 0]);
        for (let i = 0; i < 4; i++) add(k, rbox(0.2, 0.265, 0.205, 0.02), mat(C.beyaz), [0.28 + i * 0.42, 0, 0], [0, 0, 0]);
        k.position.set(-0.9, acik ? 0.72 : 0.42, 0); k.rotation.z = acik ? 0.3 : 0; g.add(k);
      };
      cubuk(false); cubuk(true);
      add(g, cyl(0.11, 0.11, 0.24), mat(C.pembe), [-0.86, 0.57, 0], [R90, 0, 0]);
    },
    robot(g) {
      add(g, rbox(1.55, 1.2, 1.1, 0.32), mat(C.beyaz));
      add(g, rbox(1.15, 0.72, 0.12, 0.24), mat(C.koyu), [0, 0.02, 0.52]);
      for (const s of [-1, 1]) {
        add(g, sph(0.13), mat(C.teal, { emissive: C.teal, emissiveIntensity: 0.6 }), [s * 0.27, 0.08, 0.58]);
        add(g, cyl(0.17, 0.17, 0.16), mat(C.turuncu), [s * 0.84, 0, 0], [0, 0, R90]);
      }
      add(g, rbox(0.3, 0.06, 0.04, 0.03), mat(C.teal, { emissive: C.teal, emissiveIntensity: 0.6 }), [0, -0.16, 0.59]);
      add(g, cyl(0.035, 0.035, 0.34), mat(C.gri), [0, 0.76, 0]);
      add(g, sph(0.12), mat(C.turuncu), [0, 0.98, 0]);
      add(g, cyl(0.26, 0.34, 0.22), mat(C.gri), [0, -0.7, 0]);
    },
    bavul(g) {
      add(g, rbox(1.35, 1.7, 0.62, 0.22), mat(C.turuncu));
      for (const y of [-0.38, 0.38]) add(g, rbox(1.37, 0.13, 0.64, 0.05), mat(0xD9652B), [0, y, 0]);
      add(g, tor(0.3, 0.06, Math.PI), mat(C.koyu), [0, 0.84, 0]);
      for (const s of [-1, 1]) add(g, sph(0.11), mat(C.koyu), [s * 0.45, -0.9, 0]);
      add(g, rbox(0.34, 0.24, 0.05, 0.05), mat(C.beyaz), [0.32, 0.02, 0.32]);
      add(g, cyl(0.07, 0.07, 0.05), mat(C.sari), [-0.36, 0.02, 0.32], [R90, 0, 0]);
    },
    donut(g) {
      add(g, tor(0.62, 0.34), mat(C.hamur));
      add(g, tor(0.62, 0.3), mat(C.pembe, { roughness: 0.35 }), [0, 0, 0.1]);
      const renk = [C.beyaz, C.sari, C.teal, C.indigo];
      tohum = 11;
      for (let i = 0; i < 30; i++) {
        const th = rnd() * Math.PI * 2, ph = (rnd() - 0.5) * 1.7, r = 0.31, rad = 0.62 + r * Math.sin(ph);
        add(g, cyl(0.026, 0.026, 0.13, 10), mat(renk[i % 4]), [rad * Math.cos(th), rad * Math.sin(th), 0.1 + r * Math.cos(ph)], [rnd() * 3, rnd() * 3, rnd() * 3]);
      }
    },
    agac(g) {
      add(g, cyl(0.12, 0.17, 0.8), mat(C.kahve), [0, -0.78, 0]);
      add(g, sph(0.66), mat(C.yesil), [0, 0.02, 0]);
      add(g, sph(0.46), mat(C.yesil3), [-0.46, -0.22, 0.12]);
      add(g, sph(0.44), mat(C.yesil2), [0.46, -0.16, -0.04]);
      add(g, sph(0.42), mat(C.yesil2), [0.06, 0.56, 0.02]);
      add(g, cyl(0.62, 0.66, 0.1), mat(C.yesil3), [0, -1.2, 0]);
    },
    buyutec(g) {
      add(g, tor(0.64, 0.1), mat(C.beyaz), [0.18, 0.22, 0]);
      add(g, cyl(0.62, 0.62, 0.05), mat(C.mavi, { transparent: true, opacity: 0.6, roughness: 0.15 }), [0.18, 0.22, 0], [R90, 0, 0]);
      add(g, cyl(0.12, 0.12, 0.9), mat(C.turuncu), [-0.66, -0.62, 0], [0, 0, -Math.PI / 4]);
      add(g, cyl(0.09, 0.09, 0.16), mat(C.koyu), [-0.3, -0.26, 0], [0, 0, -Math.PI / 4]);
    },
    ampul(g) {
      const cam = mat(C.sari, { emissive: C.sari, emissiveIntensity: 0.3, roughness: 0.35 });
      add(g, sph(0.62), cam, [0, 0.25, 0]);
      add(g, cyl(0.36, 0.26, 0.34), cam, [0, -0.36, 0]);
      add(g, cyl(0.26, 0.23, 0.32), mat(C.gri), [0, -0.68, 0]);
      for (const y of [-0.6, -0.74]) add(g, tor(0.255, 0.035), mat(C.koyu), [0, y, 0], [R90, 0, 0]);
      add(g, sph(0.12), mat(C.koyu), [0, -0.87, 0]);
      for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) add(g, cyl(0.04, 0.04, 0.22, 12), mat(C.beyaz), [Math.sin(a) * 1.0, 0.25 + Math.cos(a) * 1.0, 0], [0, 0, -a]);
    },
    bloklar(g) {
      add(g, rbox(0.85, 0.85, 0.85, 0.1), mat(C.pembe), [-0.5, -0.4, 0]);
      add(g, new T.ConeGeometry(0.46, 0.8, 44), mat(C.teal), [-0.5, 0.43, 0]);
      add(g, cyl(0.42, 0.42, 0.85), mat(C.sari), [0.5, -0.4, 0.05]);
      add(g, sph(0.32), mat(C.beyaz), [0.5, 0.34, 0.05]);
    },
    piyonlar(g) {
      for (let i = -2; i <= 2; i++) {
        const orta = i === 0, m = mat(orta ? C.sari : C.beyaz), k = new T.Group();
        add(k, cyl(0.27, 0.27, 0.07), m, [0, -0.3, 0]);
        add(k, cyl(0.08, 0.25, 0.56), m, [0, 0, 0]);
        add(k, sph(0.18), m, [0, 0.4, 0]);
        k.position.set(i * 0.56, orta ? 0.08 : 0, -Math.abs(i) * 0.28); k.scale.setScalar(orta ? 1.3 : 1); g.add(k);
      }
    },
    pano(g) {
      add(g, rbox(1.3, 1.7, 0.12, 0.12), mat(C.indigo));
      add(g, rbox(1.06, 1.36, 0.04, 0.05), mat(C.beyaz), [0, -0.08, 0.07]);
      add(g, rbox(0.52, 0.24, 0.12, 0.07), mat(C.gri), [0, 0.8, 0.08]);
      [0.3, 0, -0.3].forEach((y, i) => {
        add(g, sph(0.075), mat(i < 2 ? C.teal : C.gri), [-0.36, y, 0.1], [0, 0, 0], [1, 1, 0.5]);
        add(g, rbox(i === 1 ? 0.44 : 0.6, 0.075, 0.03, 0.03), mat(C.gri), [i === 1 ? 0.0 : 0.08, y, 0.1]);
      });
    },
    grafik(g) {
      add(g, rbox(2.0, 0.12, 0.74, 0.05), mat(C.beyaz), [0, -0.78, 0]);
      [[0.5, C.sari], [0.9, C.turuncu], [1.25, C.pembe], [1.65, C.beyaz]].forEach(([h, c], i) =>
        add(g, rbox(0.36, h, 0.36, 0.07), mat(c), [-0.69 + i * 0.46, -0.72 + h / 2, 0]));
    },
    canta(g) {
      add(g, rbox(1.42, 1.32, 0.56, 0.18), mat(C.pembe), [0, -0.18, 0]);
      add(g, rbox(1.44, 0.24, 0.58, 0.06), mat(C.beyaz), [0, -0.58, 0]);
      add(g, tor(0.36, 0.065, Math.PI), mat(C.koyu), [0, 0.48, 0.14]);
      add(g, tor(0.36, 0.065, Math.PI), mat(C.koyu), [0, 0.48, -0.14]);
      for (const s of [-1, 1]) {
        add(g, sph(0.09), mat(C.sari), [s * 0.36, 0.38, 0.29]);
      }
      add(g, cyl(0.16, 0.16, 0.08), mat(C.sari), [0.35, 0.08, 0.3], [R90, 0, 0]);
    },
    palet(g) {
      add(g, cyl(1.05, 1.05, 0.18), mat(C.hamur), [0, -0.05, 0], [R90, 0, 0]);
      add(g, sph(0.22), mat(C.koyu), [-0.46, -0.35, 0.06], [0, 0, 0], [1, 1, 0.5]);
      [[-0.42, 0.38, C.pembe], [0.1, 0.56, C.sari], [0.54, 0.28, C.teal], [0.52, -0.26, C.indigo], [0.06, -0.54, C.turuncu]].forEach(([x, y, c]) =>
        add(g, sph(0.18), mat(c), [x, y, 0.11], [0, 0, 0], [1, 1, 0.55]));
      const f = new T.Group();
      add(f, cyl(0.055, 0.075, 1.45), mat(C.koyu), [0, 0, 0]);
      add(f, cyl(0.08, 0.075, 0.22), mat(C.gri), [0, 0.78, 0]);
      add(f, new T.ConeGeometry(0.11, 0.34, 28), mat(C.turuncu), [0, 1.04, 0]);
      f.position.set(0.18, 0.05, 0.24); f.rotation.set(0.15, 0.1, -0.65); g.add(f);
    },
    evrak(g) {
      add(g, rbox(1.75, 1.22, 0.52, 0.16), mat(C.koyu), [0, -0.14, 0]);
      add(g, rbox(1.77, 0.48, 0.55, 0.12), mat(C.indigo), [0, 0.16, 0]);
      add(g, tor(0.32, 0.065, Math.PI), mat(C.koyu), [0, 0.48, 0]);
      for (const s of [-1, 1]) {
        add(g, rbox(0.18, 0.24, 0.08, 0.04), mat(C.sari), [s * 0.46, -0.05, 0.27]);
      }
      add(g, cyl(0.14, 0.14, 0.06), mat(C.teal), [0, 0.16, 0.28], [R90, 0, 0]);
    },
    mikrofon(g) {
      add(g, cyl(0.46, 0.52, 0.14), mat(C.koyu), [0, -0.92, 0]);
      add(g, cyl(0.065, 0.065, 0.48), mat(C.gri), [0, -0.62, 0]);
      add(g, tor(0.46, 0.055, Math.PI), mat(C.koyu), [0, 0.02, 0], [0, 0, Math.PI]);
      for (const s of [-1, 1]) add(g, sph(0.09), mat(C.turuncu), [s * 0.46, 0.02, 0]);
      add(g, cyl(0.28, 0.28, 0.68), mat(C.teal), [0, 0.16, 0]);
      add(g, sph(0.28), mat(C.gri), [0, 0.5, 0]);
      add(g, sph(0.28), mat(C.teal), [0, -0.18, 0]);
      add(g, tor(0.285, 0.03), mat(C.sari), [0, 0.32, 0], [R90, 0, 0]);
    },
    gezegen(g) {
      add(g, sph(0.72), mat(C.indigo));
      add(g, sph(0.73), mat(C.teal), [0.06, 0.12, 0.04], [0, 0, 0], [0.95, 0.65, 0.95]);
      const h = new T.Group();
      add(h, tor(1.18, 0.11), mat(C.sari), [0, 0, 0], [R90, 0, 0]);
      add(h, tor(0.98, 0.045), mat(C.turuncu), [0, 0, 0], [R90, 0, 0]);
      h.rotation.set(0.42, 0.15, -0.32); g.add(h);
      add(g, sph(0.16), mat(C.pembe), [0.95, 0.62, -0.2]);
    },
  };
  const poz = { donut: [-0.85, 0.35], kulaklik: [0.1, -0.45], gamepad: [0.2, -0.3], klaket: [0.1, -0.4], pano: [0.08, -0.45], buyutec: [0.1, -0.2],
    top: [0.3, -0.5], grafik: [0.22, -0.55], bavul: [0.12, -0.5], piyonlar: [0.3, -0.25], bloklar: [0.22, -0.5],
    canta: [0.16, -0.42], palet: [0.14, -0.32], evrak: [0.18, -0.45], mikrofon: [0.14, -0.38], gezegen: [0.18, -0.35] };

  function olustur(ad) {
    const ic = new T.Group(); (kur[ad] || kur.top)(ic);
    const kutu = new T.Box3().setFromObject(ic), boy = kutu.getSize(new T.Vector3()), mrk = kutu.getCenter(new T.Vector3());
    ic.position.sub(mrk);
    const dis = new T.Group(); dis.add(ic);
    dis.scale.setScalar(2.35 / Math.max(boy.x, boy.y, boy.z));
    const [rx, ry] = poz[ad] || [0.2, -0.5]; dis.rotation.set(rx, ry, 0); dis.userData.poz = [rx, ry];
    return dis;
  }
  function sahne() {
    const s = new T.Scene();
    s.add(new T.HemisphereLight(0xffffff, 0xC9D3DA, 0.95));
    const d = new T.DirectionalLight(0xffffff, 0.95); d.position.set(3, 5, 4); s.add(d);
    const f = new T.DirectionalLight(0xffffff, 0.3); f.position.set(-4, 1, 3); s.add(f);
    const k = new T.PerspectiveCamera(26, 1, 0.1, 50); k.position.set(0, 0.25, 7.6); k.lookAt(0, 0, 0);
    return { s, k };
  }
  const cizici = (canvas, boyut) => {
    const r = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(boyut, boyut, false); r.outputEncoding = T.sRGBEncoding; return r;
  };

  let ikonR = null, ikonS = null; const onbellek = {};
  function icon(ad, donus = 0) {
    const anahtar = ad + ':' + donus;
    if (anahtar in onbellek) return onbellek[anahtar];
    try {
      if (!ikonR) { ikonR = cizici(document.createElement('canvas'), 360); ikonS = sahne(); }
      const o = olustur(ad); o.rotation.y += donus;
      ikonS.s.add(o); ikonR.render(ikonS.s, ikonS.k); ikonS.s.remove(o);
      return (onbellek[anahtar] = ikonR.domElement.toDataURL('image/png'));
    } catch (e) { return (onbellek[anahtar] = ''); }
  }

  /* Canlı sahne: açılış sayfasındaki dönen obje */
  function mount(canvas, ilk) {
    let r; try { r = cizici(canvas, 520); } catch (e) { return null; }
    const { s, k } = sahne(); let o = null, hedef = 1, olcek = 1, kare = 0, dur = false;
    const sakin = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const set = ad => { if (o) s.remove(o); o = olustur(ad); o.userData.taban = o.scale.x; s.add(o); olcek = sakin ? 1 : 0.6; if (sakin) ciz(0); };
    function ciz(t) {
      if (!o) return;
      olcek += (hedef - olcek) * 0.14;
      const [rx, ry] = o.userData.poz;
      o.scale.setScalar(o.userData.taban * olcek);
      o.rotation.set(rx + Math.sin(t / 1700) * 0.07, ry + Math.sin(t / 2300) * 0.35, 0);
      o.position.y = Math.sin(t / 1300) * 0.07;
      r.render(s, k);
    }
    const dongu = t => { if (dur) return; ciz(t); kare = requestAnimationFrame(dongu); };
    set(ilk); if (!sakin) kare = requestAnimationFrame(dongu);
    return { set, stop() { dur = true; cancelAnimationFrame(kare); r.dispose(); } };
  }

  return { ok: true, icon, mount };
})();
