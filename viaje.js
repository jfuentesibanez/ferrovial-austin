// Time machine (Tim Urban), adapted from the Evolutio deck
window.VIAJE_PHOTOS = {
  fire: 'img/viaje-fire.jpg',
  wheat: 'img/viaje-wheat.jpg',
  ship: 'img/viaje-ship.jpg',
  city: 'img/viaje-austin.jpg',
  future: 'img/viaje-future.jpg'
};
window.initViaje = function (slideEl) {
  const COL = { bg: 0x0b0e12, acento: 0xffc700, papel: 0xf8f8f6, gris: 0x687587 };
  const PHOTOS = window.VIAJE_PHOTOS;

  const ERAS = [
    { id: 'm100000', x: -760, year: -100000, label: '100,000 BC', photo: 'fire' },
    { id: 'm12000',  x: -410, year: -12000,  label: '12,000 BC',  photo: 'wheat' },
    { id: 'y1750',   x: -155, year: 1750,    label: '1750',       photo: 'ship' },
    { id: 'y2026',   x: 0,    year: 2026,    label: '2026',       photo: 'city' },
    { id: 'y2045',   x: 75,   year: 2045,    label: '2045',       photo: 'future' }
  ];
  const byId = {}; ERAS.forEach(e => byId[e.id] = e);
  const SEQUENCE = ['y2026', 'y1750', 'm12000', 'm100000', 'y2026', 'y2045'];

  function fmtYear(y) {
    const v = Math.round(y);
    if (v <= 0) return Math.abs(v).toLocaleString('en-US') + ' BC';
    return v < 10000 ? String(v) : v.toLocaleString('en-US');
  }

  // ---- DOM ----
  const canvas = slideEl.querySelector('canvas');
  const yearValue = slideEl.querySelector('.vj-year');
  const yearHud = slideEl.querySelector('.vj-hud');
  const minimap = slideEl.querySelector('.vj-minimap');
  const cursorDot = slideEl.querySelector('.vj-cursor');
  const flashEl = slideEl.querySelector('.vj-flash');

  const X0 = ERAS[0].x, X1 = ERAS[ERAS.length-1].x;
  function mapPos(year) { const e = ERAS.find(k => k.year === year); return ((e ? e.x : X1) - X0) / (X1 - X0); }
  ERAS.forEach(era => {
    const p = mapPos(era.year) * 100;
    const tick = document.createElement('div');
    tick.className = 'vj-tick'; tick.style.left = p + '%'; tick.id = 'vjtick-' + era.id;
    minimap.appendChild(tick);
    const lbl = document.createElement('div');
    lbl.className = 'vj-lbl'; lbl.style.left = p + '%'; lbl.textContent = era.label; lbl.id = 'vjlbl-' + era.id;
    minimap.appendChild(lbl);
  });

  // ---- three ----
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  const scene = new THREE.Scene();
  // A quiet atmospheric backdrop; the stars themselves remain in world space.
  const sky = document.createElement('canvas'); sky.width = 1024; sky.height = 1024;
  const skyCtx = sky.getContext('2d');
  skyCtx.fillStyle = '#0b0e12'; skyCtx.fillRect(0, 0, 1024, 1024);
  const haze = skyCtx.createRadialGradient(700, 260, 0, 700, 260, 720);
  haze.addColorStop(0, 'rgba(42,61,82,.20)'); haze.addColorStop(1, 'rgba(42,61,82,0)');
  skyCtx.fillStyle = haze; skyCtx.fillRect(0, 0, 1024, 1024);
  scene.background = new THREE.CanvasTexture(sky);
  scene.fog = new THREE.Fog(COL.bg, 70, 430);
  const BASE_FOV = 56;
  const camera = new THREE.PerspectiveCamera(BASE_FOV, window.innerWidth / window.innerHeight, 0.1, 2000);

  { const grid = new THREE.GridHelper(2400, 220, COL.acento, COL.gris);
    grid.material.transparent = true; grid.material.opacity = 0.055; scene.add(grid); }

  // Round, feathered stars with restrained scintillation and natural parallax.
  // Seeded positions keep the composition stable every time the slide opens.
  let seed = 20261118;
  function random() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }
  const starUniforms = { time: { value: 0 }, pixelRatio: { value: renderer.getPixelRatio() } };
  {
    const n = 1650, pos = new Float32Array(n * 3), colors = new Float32Array(n * 3);
    const sizes = new Float32Array(n), phases = new Float32Array(n), brightness = new Float32Array(n);
    const palette = [new THREE.Color(0xc0d1e3), new THREE.Color(0xf4f1e8), new THREE.Color(0xd6bc7e)];
    for (let i = 0; i < n; i++) {
      pos[i*3] = -1130 + random() * 1500;
      pos[i*3+1] = 7 + random() * 170;
      pos[i*3+2] = -260 + random() * 310;
      const c = palette[random() < .10 ? 2 : (random() < .55 ? 0 : 1)];
      colors.set([c.r, c.g, c.b], i * 3);
      sizes[i] = .9 + Math.pow(random(), 3) * 3.2;
      phases[i] = random() * Math.PI * 2;
      brightness[i] = .32 + random() * .55;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('starColor', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('starSize', new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    g.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: starUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        uniform float time; uniform float pixelRatio;
        attribute vec3 starColor; attribute float starSize; attribute float phase; attribute float brightness;
        varying vec3 tint; varying float alpha;
        void main() {
          vec4 p = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * p;
          gl_PointSize = clamp(starSize * pixelRatio * 140.0 / max(18.0, -p.z), 1.8 * pixelRatio, 6.0 * pixelRatio);
          tint = starColor;
          alpha = brightness * (.88 + .12 * sin(time * .65 + phase));
        }`,
      fragmentShader: `
        varying vec3 tint; varying float alpha;
        void main() {
          float r = length(gl_PointCoord - vec2(.5)) * 2.0;
          if (r > 1.0) discard;
          float light = exp(-5.0 * r * r) + .16 * exp(-2.0 * r * r);
          gl_FragColor = vec4(tint, alpha * light * (1.0 - smoothstep(.65, 1.0, r)));
        }`
    });
    scene.add(new THREE.Points(g, material));
  }
  { const len = ERAS[ERAS.length-1].x - ERAS[0].x + 70; const cx = (ERAS[0].x + ERAS[ERAS.length-1].x) / 2;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 12), new THREE.MeshBasicMaterial({ color: 0xd4b86f, transparent: true, opacity: 0.75 }));
    beam.rotation.z = Math.PI / 2; beam.position.set(cx, 0.5, 0); scene.add(beam);
    for (let x = ERAS[0].x; x <= ERAS[ERAS.length-1].x; x += 25) {
      const tk = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.55, 0.045), new THREE.MeshBasicMaterial({ color: COL.papel, transparent: true, opacity: 0.22 }));
      tk.position.set(x, 0.6, 0); scene.add(tk); } }

  function shadowTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128,128,10,128,128,120);
    g.addColorStop(0, 'rgba(211,178,103,0.10)'); g.addColorStop(1, 'rgba(211,178,103,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,256,256); return new THREE.CanvasTexture(c);
  }
  const shTex = shadowTexture();
  const loader = new THREE.TextureLoader();
  const markers = [];

  scene.add(new THREE.HemisphereLight(0xd8e5f3, 0x16171b, .75));
  const keyLight = new THREE.DirectionalLight(0xffecd4, .95);
  keyLight.position.set(-30, 40, 60); scene.add(keyLight);
  const edgeLight = new THREE.DirectionalLight(0xaac8ec, .55);
  edgeLight.position.set(35, -10, 30); scene.add(edgeLight);

  // One shared dial texture, with etched rings and a dark sunburst finish.
  const dialCanvas = document.createElement('canvas'); dialCanvas.width = 512; dialCanvas.height = 512;
  const dialCtx = dialCanvas.getContext('2d');
  const dialShade = dialCtx.createRadialGradient(190, 145, 0, 256, 256, 260);
  dialShade.addColorStop(0, '#2d3740'); dialShade.addColorStop(.55, '#17212a'); dialShade.addColorStop(1, '#0a1118');
  dialCtx.fillStyle = dialShade; dialCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 180; i++) {
    const a = i * Math.PI / 90;
    dialCtx.beginPath(); dialCtx.moveTo(256 + Math.cos(a) * 24, 256 + Math.sin(a) * 24);
    dialCtx.lineTo(256 + Math.cos(a) * 244, 256 + Math.sin(a) * 244);
    dialCtx.strokeStyle = i % 2 ? 'rgba(220,231,243,.025)' : 'rgba(0,0,0,.08)'; dialCtx.lineWidth = 1; dialCtx.stroke();
  }
  [184, 232, 242].forEach((r, i) => {
    dialCtx.beginPath(); dialCtx.arc(256, 256, r, 0, Math.PI * 2);
    dialCtx.strokeStyle = i === 0 ? 'rgba(207,190,151,.12)' : 'rgba(207,190,151,.3)'; dialCtx.lineWidth = 1; dialCtx.stroke();
  });
  const dialTexture = new THREE.CanvasTexture(dialCanvas);
  const gold = new THREE.MeshPhongMaterial({ color: 0xc8af76, specular: 0xf8efd8, shininess: 95 });
  const steel = new THREE.MeshPhongMaterial({ color: 0x626c77, specular: 0xe9f1fa, shininess: 100 });
  const ivory = new THREE.MeshBasicMaterial({ color: 0xe6e9e9 });
  const secondsMaterial = new THREE.MeshBasicMaterial({ color: 0xe1bd68 });
  function hand(length, width, material, z, tail) {
    const shape = new THREE.Shape();
    shape.moveTo(-width * .5, -tail); shape.lineTo(-width * .5, length * .70);
    shape.lineTo(0, length); shape.lineTo(width * .5, length * .70);
    shape.lineTo(width * .5, -tail); shape.closePath();
    const pivot = new THREE.Group(); pivot.position.z = z;
    pivot.add(new THREE.Mesh(new THREE.ShapeGeometry(shape), material));
    return pivot;
  }

  ERAS.forEach((era, eraIndex) => {
    const group = new THREE.Group(); group.position.x = era.x;
    const clock = new THREE.Group(); clock.position.set(0, 2.05, .1); clock.scale.setScalar(1.25);
    const casing = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, .16, 96), steel);
    casing.rotation.x = Math.PI / 2; casing.position.z = -.035; clock.add(casing);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.075, 96), new THREE.MeshBasicMaterial({ map: dialTexture }));
    face.position.z = .06; clock.add(face);
    [[1.115, .035, steel], [1.075, .018, gold]].forEach(([radius, tube, material]) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 96), material);
      rim.position.z = .075; clock.add(rim);
    });
    for (let i = 0; i < 60; i++) {
      const major = i % 5 === 0, cardinal = i % 15 === 0;
      const tick = new THREE.Mesh(new THREE.PlaneGeometry(major ? .035 : .013, cardinal ? .18 : (major ? .14 : .055)), major ? ivory : gold);
      const a = i * Math.PI / 30, r = major ? .89 : .96;
      tick.position.set(Math.sin(a) * r, Math.cos(a) * r, .09); tick.rotation.z = -a; clock.add(tick);
    }
    const minuteHand = hand(.79, .045, ivory, .12, .10);
    const hourHand = hand(.53, .065, ivory, .14, .08);
    const secondHand = hand(.88, .015, secondsMaterial, .16, .22);
    minuteHand.rotation.z = -Math.PI / 3 - eraIndex * .22;
    hourHand.rotation.z = Math.PI / 3 - eraIndex * .12;
    secondHand.rotation.z = -Math.PI * .82;
    clock.add(minuteHand, hourHand, secondHand);
    const pin = new THREE.Mesh(new THREE.CircleGeometry(.052, 32), gold); pin.position.z = .18; clock.add(pin);
    group.add(clock); markers.push({ minute: minuteHand, hour: hourHand, second: secondHand });

    const tex = loader.load(PHOTOS[era.photo]); tex.anisotropy = 8;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(32, 18), new THREE.MeshBasicMaterial({ map: tex })); panel.position.set(0, 13.5, 0); group.add(panel);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(0, 0.02, 1.5); group.add(sh);
    scene.add(group);
  });

  // ---- choreography ----
  let seqIndex = 0;
  const CAM_Y = 13.5, CAM_Z = 40;
  function stationCam(id) { const x = byId[id].x; return { pos: new THREE.Vector3(x, CAM_Y, CAM_Z), look: new THREE.Vector3(x, CAM_Y, 0) }; }
  let camPos = stationCam('y2026').pos.clone(), camLook = stationCam('y2026').look.clone();
  let currentYear = 2026, currentId = 'y2026', view = 'overview', zoomAnim = null, pendingTravel = null, flight = null;
  let active = false, finished = false;
  camera.position.copy(camPos); camera.lookAt(camLook);

  function setCurrentLabel(id) { slideEl.querySelectorAll('.vj-lbl').forEach(l => l.classList.remove('current')); const el = slideEl.querySelector('#vjlbl-' + id); if (el) el.classList.add('current'); }
  function revealStation(id) { const tk = slideEl.querySelector('#vjtick-' + id), lb = slideEl.querySelector('#vjlbl-' + id); if (tk) tk.classList.add('visited'); if (lb) lb.classList.add('visited'); }
  setCurrentLabel('y2026'); revealStation('y2026');

  const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;

  function flyTo(id) {
    const target = stationCam(id), era = byId[id], dist = Math.abs(target.pos.x - camPos.x);
    if (dist < 0.5) return;
    flight = { toId: id, from: camPos.clone(), to: target.pos.clone(), lookFrom: camLook.clone(), lookTo: target.look.clone(),
      yearFrom: currentYear, yearTo: era.year, t0: performance.now(), dur: Math.min(5200, Math.max(2200, 1500 + dist * 4.6)), arc: Math.min(58, dist * 0.09) };
    yearHud.classList.add('traveling'); yearValue.classList.add('traveling');
  }
  function arrive() {
    const era = byId[flight.toId];
    currentYear = era.year; currentId = flight.toId; camPos.copy(flight.to); camLook.copy(flight.lookTo);
    camera.fov = BASE_FOV; camera.updateProjectionMatrix();
    yearValue.textContent = era.label;
    yearHud.classList.remove('traveling'); yearValue.classList.remove('traveling');
    yearValue.classList.remove('pop'); void yearValue.offsetWidth; yearValue.classList.add('pop');
    flashEl.classList.remove('active'); void flashEl.offsetWidth; flashEl.classList.add('active');
    setCurrentLabel(flight.toId); revealStation(flight.toId);
    flight = null;
  }
  function zoomTarget() {
    const x = byId[currentId].x, fovRad = (BASE_FOV * Math.PI) / 180;
    const dV = 9 / Math.tan(fovRad / 2), dH = 16 / (Math.tan(fovRad / 2) * camera.aspect), d = Math.min(dV, dH) * 0.96;
    return { pos: new THREE.Vector3(x, 13.5, d), look: new THREE.Vector3(x, 13.5, 0) };
  }
  function startZoom(mode) {
    const tgt = mode === 'in' ? zoomTarget() : stationCam(currentId);
    zoomAnim = { from: camPos.clone(), to: tgt.pos.clone(), lookFrom: camLook.clone(), lookTo: tgt.look.clone(), t0: performance.now(), dur: mode === 'in' ? 1300 : 1000, mode };
    slideEl.classList.toggle('zoomed', mode === 'in');
  }

  // returns true if the machine consumes the keypress; false if the deck should move
  function handle(dir) {
    if (flight || zoomAnim) return true;
    if (dir > 0) {
      if (view === 'overview') {
        if (finished) return false;
        startZoom('in'); view = 'zoom';
      } else {
        pendingTravel = (seqIndex + 1 < SEQUENCE.length) ? seqIndex + 1 : null;
        if (pendingTravel === null) finished = true;
        startZoom('out'); view = 'overview';
      }
      return true;
    } else {
      if (view === 'zoom') { pendingTravel = null; startZoom('out'); view = 'overview'; return true; }
      if (seqIndex - 1 < 0) return false;
      seqIndex -= 1; finished = false; flyTo(SEQUENCE[seqIndex]); return true;
    }
  }

  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); starUniforms.pixelRatio.value = renderer.getPixelRatio(); });

  function cursorFromCamX(x) {
    const pts = ERAS.map(e => ({ x: e.x, p: mapPos(e.year) }));
    if (x <= pts[0].x) return pts[0].p; if (x >= pts[pts.length-1].x) return pts[pts.length-1].p;
    for (let i = 0; i < pts.length - 1; i++) if (x >= pts[i].x && x <= pts[i+1].x) { const k = (x - pts[i].x) / (pts[i+1].x - pts[i].x); return pts[i].p + k * (pts[i+1].p - pts[i].p); }
    return 1;
  }

  let lastNow = 0, frameId = null;
  function animate(now) {
    if (!active) { lastNow = 0; return; }
    frameId = requestAnimationFrame(animate);
    const t = now * 0.001, dt = lastNow ? (now - lastNow) / 1000 : 0; lastNow = now;
    starUniforms.time.value = t;
    let spinRate = 0.045;
    if (flight) { const kk = Math.min(1, (now - flight.t0) / flight.dur); const bump = Math.sin(kk * Math.PI); const dir = Math.sign(flight.yearTo - flight.yearFrom) || 1; spinRate = dir * (2 + 30 * bump); }
    markers.forEach(ck => { ck.minute.rotation.z -= dt * spinRate; ck.hour.rotation.z -= dt * spinRate / 12; ck.second.rotation.z -= dt * (flight ? spinRate * 1.6 : Math.PI / 30); });
    if (zoomAnim) {
      const k = (now - zoomAnim.t0) / zoomAnim.dur;
      if (k >= 1) { camPos.copy(zoomAnim.to); camLook.copy(zoomAnim.lookTo); const wasOut = zoomAnim.mode === 'out'; zoomAnim = null;
        if (wasOut && pendingTravel !== null) { seqIndex = pendingTravel; pendingTravel = null; flyTo(SEQUENCE[seqIndex]); } }
      else { const e = ease(k); camPos.lerpVectors(zoomAnim.from, zoomAnim.to, e); camLook.lerpVectors(zoomAnim.lookFrom, zoomAnim.lookTo, e); }
    }
    if (flight) {
      const k = (now - flight.t0) / flight.dur;
      if (k >= 1) arrive();
      else { const e = ease(k); camPos.lerpVectors(flight.from, flight.to, e); camLook.lerpVectors(flight.lookFrom, flight.lookTo, e);
        const bump = Math.sin(k * Math.PI); camPos.y = CAM_Y + flight.arc * bump; camPos.z = CAM_Z + flight.arc * 0.55 * bump;
        camera.fov = BASE_FOV + 14 * bump; camera.updateProjectionMatrix();
        yearValue.textContent = fmtYear(flight.yearFrom + (flight.yearTo - flight.yearFrom) * e); }
    }
    const calm = flight || zoomAnim || view === 'zoom';
    camera.position.set(camPos.x + (calm ? 0 : Math.sin(t * 0.45) * 0.45), camPos.y + (calm ? 0 : Math.sin(t * 0.7) * 0.3), camPos.z);
    camera.lookAt(camLook);
    cursorDot.style.left = (cursorFromCamX(camPos.x) * 100) + '%';
    renderer.render(scene, camera);
  }

  return {
    enter() { if (active) return; active = true; camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); frameId = requestAnimationFrame(animate); },
    leave() { active = false; cancelAnimationFrame(frameId); frameId = null; lastNow = 0; },
    handle
  };
};
