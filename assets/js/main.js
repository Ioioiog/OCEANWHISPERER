/* Ocean Whisperer — site behaviour */
(function(){
'use strict';
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine = matchMedia('(pointer:fine)').matches;
var narrowMQ = matchMedia('(max-width:960px)');
var phoneMQ = matchMedia('(max-width:640px)');
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t){ return a + (b - a) * t; }
function smooth(e0, e1, x){ var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
function ease(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

/* Shared geometry: Curaçao and the four routes, in map units */
var ISLAND = 'M40 70 Q95 66 150 95 Q220 118 300 150 Q380 180 450 215 Q520 248 580 290 Q612 312 608 330 Q590 345 540 335 Q480 318 430 300 Q392 288 355 276 Q318 264 270 240 Q220 216 170 190 Q120 162 80 130 Q48 102 40 70 Z';
var ROUTES = [
  'M322 178 C340 230 330 285 355 300 S400 300 385 270 S340 220 322 178',
  'M322 178 C300 270 220 240 160 215 C110 190 60 140 45 95 C90 60 180 90 240 110 C280 130 305 160 322 178',
  'M322 178 C380 170 520 220 615 305 C600 350 500 350 430 320 C380 305 330 300 300 280 C240 250 150 230 90 170 C60 140 40 100 60 75 C120 70 250 110 322 178',
  'M322 178 C320 260 300 320 240 330 C170 340 120 280 110 230 C105 200 200 170 322 178'
];
var NAMES = ['Willemstad Prelude', 'Coastal Sonata', 'The Whisperer’s Hour', 'Sunset Ceremony'];
var PHOTOS = [
  'https://theoceanwhisperer.com/wp-content/uploads/2026/04/0282EE6F-A676-4ADA-AB41-5C977F20E14B-1024x683.jpeg',
  'https://theoceanwhisperer.com/wp-content/uploads/2026/04/ec15587a-b2d3-43ab-bcdd-765e626b64ec-1024x683.jpg',
  'https://theoceanwhisperer.com/wp-content/uploads/2026/04/0-2-1024x683.jpg',
  'https://theoceanwhisperer.com/wp-content/uploads/2026/04/f98a7df9-f0f5-4bc0-bb3b-b1a110692e7d-768x1024.jpg'
];

/* The logo as an image, for the downloadable invitation and the favicon */
var WINGS = new Image();
(function(){
  var v = getComputedStyle(document.documentElement).getPropertyValue('--wings'), m = v.match(/url\(["']?(.*?)["']?\)/);
  if (m) WINGS.src = m[1];
  WINGS.onload = function(){
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'); g.fillStyle = '#0C1826'; g.fillRect(0, 0, 64, 64);
    g.drawImage(tint(WINGS, '#E2BD62'), 6, 32 - 52 * 152 / 900 / 2, 52, 52 * 152 / 900);
    var l = document.createElement('link'); l.rel = 'icon'; l.href = c.toDataURL('image/png'); document.head.appendChild(l);
  };
})();
function tint(img, color){
  var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  var g = c.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}

/* Central scroll loop */
var scrollSubs = [], ticking = false;
function onScroll(){ ticking = false; for (var i = 0; i < scrollSubs.length; i++) scrollSubs[i](); }
addEventListener('scroll', function(){ if (!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, {passive: true});
addEventListener('resize', function(){ requestAnimationFrame(onScroll); });

/* ================= 1. Live light over Curaçao ================= */
var PALETTES = {
  night:  {at: 'at night', name: 'night',       haze: '#0E1A2B', sky: '#050B14', land: '#0B1726', line: '#56748F', sea: '#070F1B', seaLine: '#2E4A66', route: '#D9BF8C', stars: 1},
  dawn:   {at: 'at dawn', name: 'dawn',        haze: '#5A4B62', sky: '#121A2C', land: '#1D2638', line: '#C9BCCB', sea: '#151D30', seaLine: '#6E6683', route: '#F0C9A0', stars: .25},
  day:    {at: 'in daylight', name: 'daylight',    haze: '#24566E', sky: '#081E30', land: '#123F57', line: '#BCDCE6', sea: '#0A2F45', seaLine: '#3F7F96', route: '#F3DCA6', stars: 0},
  golden: {at: 'at golden hour', name: 'golden hour', haze: '#94684A', sky: '#16223A', land: '#26334A', line: '#F0CFA2', sea: '#1A2740', seaLine: '#8E6C57', route: '#F7CD85', stars: 0},
  dusk:   {at: 'at dusk', name: 'dusk',        haze: '#3E3350', sky: '#0B1424', land: '#141F33', line: '#A3A7C9', sea: '#0E1829', seaLine: '#48486C', route: '#D9BF8C', stars: .6}
};
function sunHour(rising){
  var rad = Math.PI / 180, lat = 12.11, lng = -68.93, d = new Date(), y = d.getUTCFullYear();
  var N = Math.floor((Date.UTC(y, d.getUTCMonth(), d.getUTCDate()) - Date.UTC(y, 0, 0)) / 864e5);
  var lh = lng / 15, t = N + ((rising ? 6 : 18) - lh) / 24, M = 0.9856 * t - 3.289;
  var L = M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634; L = ((L % 360) + 360) % 360;
  var RA = Math.atan(0.91764 * Math.tan(L * rad)) / rad; RA = ((RA % 360) + 360) % 360;
  RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
  var sd = 0.39782 * Math.sin(L * rad), cd = Math.cos(Math.asin(sd));
  var cH = (Math.cos(90.833 * rad) - sd * Math.sin(lat * rad)) / (cd * Math.cos(lat * rad));
  var H = Math.acos(clamp(cH, -1, 1)) / rad; H = (rising ? 360 - H : H) / 15;
  var T = H + RA - 0.06571 * t - 6.622;
  return ((((T - lh) - 4) % 24) + 24) % 24; /* Curaçao is UTC-4 all year */
}
function fmt(h){ var m = Math.round(((h % 24) + 24) % 24 * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
var SUNRISE = sunHour(true), SUNSET = sunHour(false);
var forced = (new URLSearchParams(location.search).get('light') || '').toLowerCase();
var PAL = PALETTES.night;
function localHour(){ var d = new Date(); return (((d.getUTCHours() + d.getUTCMinutes() / 60) - 4) % 24 + 24) % 24; }
function phaseFor(h){
  if (h < SUNRISE - 0.6 || h > SUNSET + 0.6) return 'night';
  if (h < SUNRISE + 0.7) return 'dawn';
  if (h < SUNSET - 1.2) return 'day';
  if (h < SUNSET) return 'golden';
  return 'dusk';
}
var lightSubs = [];
function applyLight(){
  var h = localHour(), key = PALETTES[forced] ? forced : phaseFor(h);
  PAL = PALETTES[key];
  var root = document.documentElement.style;
  root.setProperty('--haze', PAL.haze); root.setProperty('--sky', PAL.sky); root.setProperty('--route', PAL.route);
  $('#heroTime').innerHTML = PALETTES[forced] ? 'Previewing the island ' + PAL.at + '.' : 'In Willemstad it is <b>' + fmt(h) + '</b>, ' + PAL.name + '.';
  lightSubs.forEach(function(f){ f(PAL); });
}
applyLight();
setInterval(applyLight, 60000);
$$('.sunset').forEach(function(el){ el.textContent = fmt(SUNSET); });

/* ================= 3. Intro veil ================= */
function ready(){
  if (document.body.classList.contains('ready')) return;
  document.body.classList.add('ready');
  dispatchEvent(new Event('ow:ready'));
}


/* ================= Header, menu, smooth scroll ================= */
var nav = $('#nav'), hero = $('#top');
scrollSubs.push(function(){ nav.classList.toggle('solid', scrollY > hero.offsetHeight - 90); });

var lenis = null;
if (window.Lenis && !reduce && fine){
  try {
    lenis = new window.Lenis({lerp: 0.085, smoothWheel: true});
    (function raf(t){ lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    document.documentElement.style.scrollBehavior = 'auto';
  } catch (e) { lenis = null; }
}
var menu = $('#menu'), menuBtn = $('#menuBtn');
function setMenu(open){
  menu.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (lenis){ open ? lenis.stop() : lenis.start(); }
  (open ? $('#menuClose') : menuBtn).focus({preventScroll: true});
}
menuBtn.addEventListener('click', function(){ setMenu(true); });
$('#menuClose').addEventListener('click', function(){ setMenu(false); });
$$('a[href^="#"]', menu).forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
addEventListener('keydown', function(e){ if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
document.addEventListener('click', function(e){
  var a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a || !lenis) return;
  var id = a.getAttribute('href'), t = id.length > 1 ? document.querySelector(id) : null;
  if (!t) return;
  e.preventDefault();
  lenis.scrollTo(t, {offset: id === '#top' ? 0 : -70, duration: 1.6});
});

/* ================= 9b. Magnetic buttons ================= */
if (fine && !reduce){
  $$('[data-magnetic]').forEach(function(el){
    el.addEventListener('pointermove', function(e){
      var r = el.getBoundingClientRect();
      el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px)';
    });
    el.addEventListener('pointerleave', function(){ el.style.transform = ''; });
  });
}

/* ================= Path sampling helpers ================= */
function samplePath(d, perSeg){
  var t = d.replace(/([MQCSZ])/g, ' $1 ').trim().split(/[\s,]+/), i = 0, pts = [], cx = 0, cy = 0, lc = null, cmd;
  function n(){ return parseFloat(t[i++]); }
  while (i < t.length){
    cmd = t[i++];
    if (cmd === 'M'){ cx = n(); cy = n(); pts.push([cx, cy]); }
    else if (cmd === 'Q'){ var qx = n(), qy = n(), x = n(), y = n();
      for (var k = 1; k <= perSeg; k++){ var u = k / perSeg, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u; pts.push([a * cx + b * qx + c * x, a * cy + b * qy + c * y]); }
      cx = x; cy = y; }
    else if (cmd === 'C' || cmd === 'S'){
      var x1, y1; if (cmd === 'C'){ x1 = n(); y1 = n(); } else { x1 = lc ? 2 * cx - lc[0] : cx; y1 = lc ? 2 * cy - lc[1] : cy; }
      var x2 = n(), y2 = n(), x3 = n(), y3 = n();
      for (var j = 1; j <= perSeg; j++){ var v = j / perSeg, m = 1 - v; pts.push([m*m*m*cx + 3*m*m*v*x1 + 3*m*v*v*x2 + v*v*v*x3, m*m*m*cy + 3*m*m*v*y1 + 3*m*v*v*y2 + v*v*v*y3]); }
      lc = [x2, y2]; cx = x3; cy = y3; }
    else if (cmd === 'Z'){ /* closed */ }
  }
  return pts;
}

/* ================= 1. 3D hero ================= */
var heroStage = $('#heroStage'), heroSvg = $('#heroSvg');
function frameSvg(){
  heroSvg.setAttribute('viewBox', phoneMQ.matches ? '320 110 960 540' : '0 0 1600 1000');
  heroSvg.setAttribute('preserveAspectRatio', phoneMQ.matches ? 'xMidYMid meet' : 'xMidYMid slice');
}
frameSvg();
(phoneMQ.addEventListener ? phoneMQ.addEventListener('change', frameSvg) : phoneMQ.addListener(frameSvg));

(function initGL(){
  if (reduce || !window.THREE) return;
  var THREE = window.THREE, canvas = $('#heroGL'), renderer;
  try { renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance'}); }
  catch (e) { return; }
  if (!renderer.getContext()) return;
  var low = (navigator.hardwareConcurrency || 4) <= 4 && /Mobi|Android/i.test(navigator.userAgent);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  var K = 0.06, CX = 326, CY = 205;
  var poly = samplePath(ISLAND, 10).map(function(p){ return [(p[0] - CX) * K, (p[1] - CY) * K]; });
  var minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  poly.forEach(function(p){ minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minZ = Math.min(minZ, p[1]); maxZ = Math.max(maxZ, p[1]); });
  function inside(x, z){
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++){
      var xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
      if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) c = !c;
    }
    return c;
  }
  function edgeDist(x, z){
    var best = 1e9;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++){
      var ax = poly[j][0], az = poly[j][1], bx = poly[i][0], bz = poly[i][1];
      var dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz, t = l ? clamp(((x - ax) * dx + (z - az) * dz) / l, 0, 1) : 0;
      var px = ax + t * dx - x, pz = az + t * dz - z, d = px * px + pz * pz;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }
  function noise(x, z){ return 0.5 + 0.22 * Math.sin(x * 0.9 + z * 0.5) + 0.18 * Math.sin(x * 0.43 - z * 1.3 + 1.7) + 0.1 * Math.sin(x * 2.1 + z * 1.7 + 0.3); }
  function height(x, z){
    if (x < minX - 5.5 || x > maxX + 5.5 || z < minZ - 5.5 || z > maxZ + 5.5) return -0.62;
    var d = edgeDist(x, z);
    if (inside(x, z)) return smooth(0, 2.4, d) * (0.35 + 0.65 * noise(x, z)) * (0.7 + 1.5 * smooth(6, -14, x)) * 0.95;
    return -Math.min(d, 5) / 5 * 0.6 - 0.02;
  }

  var geo = new THREE.PlaneGeometry(120, 80, low ? 170 : 300, low ? 114 : 200);
  geo.rotateX(-Math.PI / 2);
  var pos = geo.attributes.position;
  var GX = low ? 150 : 210, GZ = low ? 64 : 90, gx0 = minX - 6, gz0 = minZ - 6, gdx = (maxX - minX + 12) / GX, gdz = (maxZ - minZ + 12) / GZ, grid = new Float32Array((GX + 1) * (GZ + 1));
  for (var gz = 0; gz <= GZ; gz++) for (var gxx = 0; gxx <= GX; gxx++) grid[gz * (GX + 1) + gxx] = height(gx0 + gxx * gdx, gz0 + gz * gdz);
  function gridH(x, z){
    var fx = (x - gx0) / gdx, fz = (z - gz0) / gdz;
    if (fx < 0 || fz < 0 || fx >= GX || fz >= GZ) return -0.62;
    var ix = Math.floor(fx), iz = Math.floor(fz), tx = fx - ix, tz = fz - iz, r = GX + 1;
    var a = grid[iz * r + ix], b = grid[iz * r + ix + 1], c = grid[(iz + 1) * r + ix], d = grid[(iz + 1) * r + ix + 1];
    return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
  }
  for (var i = 0; i < pos.count; i++) pos.setY(i, gridH(pos.getX(i), pos.getZ(i)));
  var uni = {
    uLand: {value: new THREE.Color()}, uLine: {value: new THREE.Color()}, uSea: {value: new THREE.Color()},
    uSeaLine: {value: new THREE.Color()}, uFog: {value: new THREE.Color()},
    uNear: {value: 28}, uFar: {value: 80}, uTime: {value: 0}
  };
  var mat = new THREE.ShaderMaterial({
    extensions: {derivatives: true}, uniforms: uni,
    vertexShader: 'varying float vH; varying vec3 vW; varying float vD;\n' +
      'void main(){ vH = position.y; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uLand, uLine, uSea, uSeaLine, uFog; uniform float uNear, uFar, uTime;\n' +
      'varying float vH; varying vec3 vW; varying float vD;\n' +
      'float band(float v, float w){ float f = abs(fract(v - 0.5) - 0.5); return 1.0 - smoothstep(0.0, fwidth(v) * w, f); }\n' +
      'void main(){ vec3 col;\n' +
      ' if (vH > 0.0){ col = mix(uLand, uLine, band(vH * 7.0, 1.2) * 0.5); col = mix(col, uLine, (1.0 - smoothstep(0.0, 0.05, vH)) * 0.9); }\n' +
      ' else { float depth = -vH; float rings = band(depth * 9.0, 1.1) * (1.0 - smoothstep(0.1, 0.6, depth));\n' +
      '   col = mix(uSea, uSeaLine, rings * 0.45);\n' +
      '   col = mix(col, uSeaLine, band(vW.z * 0.9 + sin(vW.x * 0.25 + uTime * 0.3) * 0.8, 1.0) * 0.06); }\n' +
      ' col = mix(col, uFog, smoothstep(uNear, uFar, vD));\n' +
      ' gl_FragColor = vec4(col, 1.0); }'
  });
  scene.add(new THREE.Mesh(geo, mat));

  /* Sunset Ceremony route, floating above the terrain */
  var rp = samplePath(ROUTES[3], 40), rpts = [];
  rp.forEach(function(p, k){
    var x = (p[0] - CX) * K, z = (p[1] - CY) * K, u = k / (rp.length - 1);
    rpts.push(new THREE.Vector3(x, Math.max(gridH(x, z), 0) + 0.9 + 0.35 * Math.sin(Math.PI * u), z));
  });
  rpts.pop();
  var curve = new THREE.CatmullRomCurve3(rpts, true, 'centripetal');
  var tube = new THREE.TubeGeometry(curve, 420, 0.045, 6, true);
  var tubeMat = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.95});
  scene.add(new THREE.Mesh(tube, tubeMat));
  var tubeCount = tube.index.count; tube.setDrawRange(0, 0);

  function glowTex(inner, outer){
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    var t = new THREE.CanvasTexture(c); return t;
  }
  var heliGlow = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex('rgba(255,240,210,1)', 'rgba(217,191,140,.45)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  heliGlow.scale.set(1.1, 1.1, 1); heliGlow.visible = false; scene.add(heliGlow);
  var hato = new THREE.Vector3((322 - CX) * K, 0, (178 - CY) * K); hato.y = Math.max(gridH(hato.x, hato.z), 0) + 0.05;
  var ring = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,.25)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  ring.position.copy(hato); ring.scale.set(.5, .5, 1); scene.add(ring);

  var sg = new THREE.BufferGeometry(), sp = [];
  for (var s = 0; s < 500; s++){
    var th = Math.random() * Math.PI * 2, ph = Math.random() * 0.45, r = 140;
    sp.push(Math.cos(th) * Math.cos(ph) * r, Math.sin(ph) * r + 10, Math.sin(th) * Math.cos(ph) * r - 40);
  }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  var starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.5, transparent: true, opacity: 0, depthWrite: false});
  scene.add(new THREE.Points(sg, starMat));

  function paint(p){
    uni.uLand.value.set(p.land); uni.uLine.value.set(p.line); uni.uSea.value.set(p.sea);
    uni.uSeaLine.value.set(p.seaLine); uni.uFog.value.set(p.haze);
    tubeMat.color.set(p.route); starMat.opacity = p.stars * 0.85;
  }
  paint(PAL); lightSubs.push(paint);

  /* Camera: take off from Hato, then settle over the island */
  var aspect = 1, finalPos = new THREE.Vector3(), finalTgt = new THREE.Vector3();
  var startPos = hato.clone().add(new THREE.Vector3(1.6, 0.55, 2.6)), startTgt = hato.clone().add(new THREE.Vector3(-0.8, 0.15, -1.4));
  function layout(){
    var w = heroStage.clientWidth, h = heroStage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = aspect = w / h; camera.updateProjectionMatrix();
    var hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect);
    var dist = (phoneMQ.matches ? 17.5 : 23) / Math.tan(hfov / 2), elev = THREE.MathUtils.degToRad(phoneMQ.matches ? 46 : 40);
    finalTgt.set(0, -0.6, phoneMQ.matches ? 0.6 : 6.8);
    finalPos.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist).add(finalTgt);
  }
  layout(); addEventListener('resize', layout);

  var t0 = null, pointer = {x: 0, y: 0}, look = {x: 0, y: 0}, visible = true;
  if (fine) addEventListener('pointermove', function(e){ pointer.x = e.clientX / innerWidth - 0.5; pointer.y = e.clientY / innerHeight - 0.5; });
  addEventListener('deviceorientation', function(e){ if (e.gamma == null) return; pointer.x = clamp(e.gamma / 45, -0.5, 0.5); pointer.y = clamp((e.beta - 45) / 60, -0.5, 0.5); });
  addEventListener('ow:ready', function(){ t0 = performance.now(); });
  if (document.body.classList.contains('ready')) t0 = performance.now();
  new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if (visible) requestAnimationFrame(frame); }).observe(hero);

  var tmpPos = new THREE.Vector3(), tmpTgt = new THREE.Vector3(), off = new THREE.Vector3();
  /* Adapt to slower devices: lower resolution first, then fall back to the drawn chart */
  var perf = {n: 0, sum: 0, last: 0, stage: 0, dead: false};
  function watch(now){
    if (perf.last){ perf.sum += now - perf.last; perf.n++; }
    perf.last = now;
    if (perf.n === 60){
      var avg = perf.sum / perf.n; perf.n = 0; perf.sum = 0;
      if (avg > 40 && perf.stage === 0){ renderer.setPixelRatio(1); layout(); perf.stage = 1; }
      else if (avg > 50 && perf.stage === 1){ perf.dead = true; hero.classList.remove('gl'); }
    }
  }
  function frame(now){
    if (!visible || document.hidden || perf.dead){ perf.last = 0; return; }
    watch(now);
    var el = t0 === null ? 0 : (now - t0) / 1000;
    var k = ease(clamp(el / 4.8, 0, 1));
    tmpPos.lerpVectors(startPos, finalPos, k); tmpTgt.lerpVectors(startTgt, finalTgt, k);
    look.x += (pointer.x - look.x) * 0.04; look.y += (pointer.y - look.y) * 0.04;
    var climb = clamp(scrollY / Math.max(hero.offsetHeight, 1), 0, 1);
    var yaw = (Math.sin(el * 0.07) * 0.05 + look.x * 0.16) * k, pitch = look.y * 0.06 * k;
    off.copy(tmpPos).sub(tmpTgt).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    off.y *= 1 + pitch + climb * 0.5; off.multiplyScalar(1 + climb * 0.25);
    camera.position.copy(tmpTgt).add(off); camera.lookAt(tmpTgt);
    canvas.style.opacity = phoneMQ.matches ? 1 : (1 - climb * 0.6).toFixed(3);
    tube.setDrawRange(0, Math.floor(tubeCount * smooth(1.0, 4.4, el) / 6) * 6);
    if (el > 4.4){
      heliGlow.visible = true;
      heliGlow.position.copy(curve.getPointAt(((el - 4.4) / 18) % 1));
    }
    var pulse = ((el % 3.6) / 3.6);
    ring.scale.setScalar(0.35 + pulse * 1.6); ring.material.opacity = 0.9 * (1 - pulse);
    uni.uTime.value = el;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) requestAnimationFrame(frame); });
  hero.classList.add('gl');
})();

/* Intro runs after the heavy 3D setup so its timing is never squeezed */
(function(){
  var veil = $('#veil'), seen = false;
  try { seen = sessionStorage.getItem('ow-intro') === '1'; } catch (e) {}
  if (reduce || seen){ veil.remove(); setTimeout(ready, 60); return; }
  try { sessionStorage.setItem('ow-intro', '1'); } catch (e) {}
  requestAnimationFrame(function(){ veil.classList.add('show'); });
  setTimeout(function(){ veil.classList.add('lift'); }, 1100);
  setTimeout(function(){ veil.classList.add('gone'); ready(); }, 1900);
  setTimeout(function(){ veil.remove(); }, 3300);
})();

/* ================= 4. Journeys: one continuous flight ================= */
(function(){
  var svg = $('#flightMap'), panel = $('.flight'), fRoute = $('#fRoute'), heli = $('#fHeli'), wins = $('#fWins');
  var steps = $$('.j-step'), NS = 'http://www.w3.org/2000/svg';
  var ring = function(sc, op, fill){ return '<path d="' + ISLAND + '" transform="translate(330 210) scale(' + sc + ') translate(-330 -210)" fill="' + (fill || 'none') + '" stroke="#8FA6BC" stroke-opacity="' + op + '" stroke-width="1" vector-effect="non-scaling-stroke"/>'; };
  $('#fIsland').innerHTML = ring(1.32, .1) + ring(1.18, .18) + ring(1.07, .28) + ring(1, .75, '#12253C') + ring(.72, .25) + ring(.44, .16);
  $('#fFaint').innerHTML = ROUTES.map(function(d){ return '<path class="f-faint" d="' + d + '"/>'; }).join('');

  var lens = [], winEls = [];
  ROUTES.forEach(function(d, i){
    fRoute.setAttribute('d', d); var L = fRoute.getTotalLength(); lens.push(L);
    var pt = fRoute.getPointAtLength(L * 0.55), w = 132, h = 88;
    var wx = clamp(pt.x + 18, 30, 470), wy = pt.y - h - 26; if (wy < -10) wy = pt.y + 26;
    var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'win');
    var cr = $('#wc' + i + ' rect'); cr.setAttribute('x', wx); cr.setAttribute('y', wy); cr.setAttribute('width', w); cr.setAttribute('height', h);
    var ly = wy > pt.y ? wy : wy + h;
    g.innerHTML = '<line x1="' + pt.x + '" y1="' + pt.y + '" x2="' + (wx + 10) + '" y2="' + ly + '"/>' +
      '<image href="' + PHOTOS[i] + '" x="' + wx + '" y="' + wy + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#wc' + i + ')"/>' +
      '<rect class="frame" x="' + wx + '" y="' + wy + '" width="' + w + '" height="' + h + '" rx="3"/>';
    wins.appendChild(g); winEls.push(g);
  });

  var cur = -1, len = 0, cam = {x: 326, y: 205, w: 600}, tgt = {x: 326, y: 205, w: 600}, moving = false;
  function update(){
    var top = narrowMQ.matches ? panel.getBoundingClientRect().bottom : 0;
    var line = narrowMQ.matches ? top + (innerHeight - top) * 0.35 : innerHeight * 0.5;
    var idx = 0, p = 0;
    for (var i = 0; i < steps.length; i++){
      var r = steps[i].getBoundingClientRect();
      if (line >= r.top){ idx = i; p = clamp((line - r.top) / r.height, 0, 1); }
    }
    if (idx !== cur){
      cur = idx; fRoute.setAttribute('d', ROUTES[idx]); len = lens[idx];
      fRoute.style.strokeDasharray = len + ' ' + len;
      $('#jName').textContent = NAMES[idx];
      steps.forEach(function(s, k){ s.classList.toggle('active', k === idx); });
    }
    fRoute.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
    var pt = fRoute.getPointAtLength(len * p);
    heli.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
    winEls.forEach(function(g, k){ g.style.opacity = k === idx ? (smooth(0.2, 0.34, p) * (1 - smooth(0.86, 0.97, p))).toFixed(2) : 0; });
    var z = smooth(0.02, 0.16, p) * (1 - smooth(0.86, 0.99, p));
    var zw = narrowMQ.matches ? 340 : 300;
    tgt.w = lerp(600, zw, z); tgt.x = lerp(326, pt.x, z); tgt.y = lerp(205, pt.y, z);
    if (!moving){ moving = true; requestAnimationFrame(glide); }
  }
  function glide(){
    var k = reduce ? 1 : 0.1;
    cam.x += (tgt.x - cam.x) * k; cam.y += (tgt.y - cam.y) * k; cam.w += (tgt.w - cam.w) * k;
    var ar = panel.clientHeight / Math.max(panel.clientWidth, 1), h = cam.w * ar;
    svg.setAttribute('viewBox', (cam.x - cam.w / 2).toFixed(1) + ' ' + (cam.y - h / 2).toFixed(1) + ' ' + cam.w.toFixed(1) + ' ' + h.toFixed(1));
    if (Math.abs(tgt.x - cam.x) + Math.abs(tgt.y - cam.y) + Math.abs(tgt.w - cam.w) > 0.1) requestAnimationFrame(glide);
    else moving = false;
  }
  scrollSubs.push(update); update();
})();

/* ================= 10. Passing through cloud between sections ================= */
(function(){
  if (reduce) return;
  var mist = $('#mist'), marks = [];
  var after = ['#top', '#journeys', '#arrival', '#charter', '.founders'];
  function measure(){ marks = after.map(function(s){ var el = $(s); return el.getBoundingClientRect().bottom + scrollY; }); }
  measure(); addEventListener('resize', measure); addEventListener('load', measure); setTimeout(measure, 1500);
  scrollSubs.push(function(){
    var c = scrollY + innerHeight * 0.5, best = 1e9, bm = 0;
    marks.forEach(function(m){ var d = Math.abs(m - c); if (d < best){ best = d; bm = m; } });
    var o = Math.max(0, 1 - best / (innerHeight * 0.28)); o = o * o * (phoneMQ.matches ? 0.38 : 0.5);
    mist.style.opacity = o.toFixed(3);
    mist.style.transform = 'translate3d(0,' + ((bm - c) * 0.25).toFixed(1) + 'px,0) scale(' + (1 + o * 0.2).toFixed(3) + ')';
  });
})();

/* ================= 6. Sound: ambient layer + cabin comparison ================= */
var AH = {ctx: null, get: function(){
  if (!this.ctx){ var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; this.ctx = new AC(); }
  if (this.ctx.state === 'suspended') this.ctx.resume();
  return this.ctx;
}};
function noiseSrc(c, brown){
  var len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0), last = 0;
  for (var i = 0; i < len; i++){ var w = Math.random() * 2 - 1; if (brown){ last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w * 0.5; }
  var s = c.createBufferSource(); s.buffer = buf; s.loop = true; return s;
}
function lfo(c, freq, depth, target){ var o = c.createOscillator(), g = c.createGain(); o.frequency.value = freq; g.gain.value = depth; o.connect(g); g.connect(target); o.start(); }
function panner(c, rate, depth){
  if (!c.createStereoPanner) return c.createGain();
  var p = c.createStereoPanner(); lfo(c, rate, depth, p.pan); return p;
}
var amb = {on: false, master: null, layers: null, duck: 1, scene: 'hero'};
var MIX = {
  hero: {wind: .5, rotor: .4, sea: .12}, statement: {wind: .35, rotor: .12, sea: .25}, journeys: {wind: .45, rotor: .3, sea: .2},
  arrival: {wind: .2, rotor: .05, sea: .6}, aircraft: {wind: .2, rotor: .5, sea: .05}, charter: {wind: .3, rotor: .05, sea: .3},
  journal: {wind: .3, rotor: 0, sea: .45}, founders: {wind: .15, rotor: 0, sea: .35}, invite: {wind: .1, rotor: 0, sea: .35}
};
function buildAmbient(c){
  amb.master = c.createGain(); amb.master.gain.value = 0; amb.master.connect(c.destination);
  amb.layers = {};
  /* sea: slow swells */
  var sea = c.createGain(), s1 = noiseSrc(c, true), lp = c.createBiquadFilter(), sw = c.createGain();
  lp.type = 'lowpass'; lp.frequency.value = 650; sw.gain.value = 0.6; lfo(c, 0.09, 0.4, sw.gain);
  s1.connect(lp); lp.connect(sw); sw.connect(sea); sea.connect(amb.master); s1.start();
  /* wind: drifting across the stereo field */
  var wind = c.createGain(), s2 = noiseSrc(c, false), bp = c.createBiquadFilter(), wg = c.createGain(), wp = panner(c, 0.05, 0.6);
  bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.6; wg.gain.value = 0.35; lfo(c, 0.13, 0.25, wg.gain);
  s2.connect(bp); bp.connect(wg); wg.connect(wp); wp.connect(wind); wind.connect(amb.master); s2.start();
  /* a distant, soft rotor */
  var rotor = c.createGain(), s3 = noiseSrc(c, true), rl = c.createBiquadFilter(), rg = c.createGain();
  rl.type = 'lowpass'; rl.frequency.value = 260; rg.gain.value = 0.5; lfo(c, 6.4, 0.3, rg.gain);
  s3.connect(rl); rl.connect(rg); rg.connect(rotor); rotor.connect(amb.master); s3.start();
  amb.layers = {sea: sea, wind: wind, rotor: rotor};
  Object.keys(amb.layers).forEach(function(k){ amb.layers[k].gain.value = 0; });
}
function ambMix(){
  if (!amb.layers) return;
  var c = AH.ctx, m = MIX[amb.scene] || MIX.hero, now = c.currentTime;
  Object.keys(amb.layers).forEach(function(k){ amb.layers[k].gain.setTargetAtTime(m[k] || 0, now, 1.2); });
  amb.master.gain.setTargetAtTime(amb.on ? 0.55 * amb.duck : 0, now, 0.8);
}
var listenState = {playing: false};
function maybeSuspend(){
  setTimeout(function(){ if (!amb.on && !listenState.playing && AH.ctx) AH.ctx.suspend(); }, 1400);
}
(function(){
  var btn = $('#soundBtn'), label = $('#soundLabel');
  hero.setAttribute('data-sound', 'hero');
  /* Sound is on by default. Browsers only allow audio after the visitor's first
     click, tap or key press, so it starts then; the choice is remembered. */
  var pref = null; try { pref = localStorage.getItem('ow-sound'); } catch (e) {}
  amb.on = pref !== 'off';
  var started = false;
  function paint(){
    btn.setAttribute('aria-pressed', amb.on);
    btn.classList.toggle('live', started && amb.on);
    label.textContent = amb.on ? 'Sound on' : 'Sound off';
    btn.title = amb.on ? 'Sound on' : 'Sound off';
  }
  function start(){
    if (started) return true;
    var c = AH.get(); if (!c){ label.textContent = 'Sound unavailable'; return false; }
    if (!amb.layers) buildAmbient(c);
    started = true; ambMix(); paint(); btn.classList.remove('hint');
    return true;
  }
  function firstGesture(e){
    if (e.target.closest && e.target.closest('#soundBtn')) return;
    ['pointerdown', 'keydown', 'touchend'].forEach(function(t){ removeEventListener(t, firstGesture, true); });
    if (amb.on) start();
  }
  ['pointerdown', 'keydown', 'touchend'].forEach(function(t){ addEventListener(t, firstGesture, true); });
  btn.addEventListener('click', function(){
    if (amb.on && !started){ start(); return; }
    amb.on = !amb.on;
    try { localStorage.setItem('ow-sound', amb.on ? 'on' : 'off'); } catch (e) {}
    if (amb.on) start();
    if (started) ambMix();
    if (!amb.on) maybeSuspend();
    paint(); btn.classList.remove('hint');
  });
  paint();
  /* While sound waits for the first interaction, the button pulses gently */
  function nudge(){ setTimeout(function(){ if (amb.on && !started && !reduce) btn.classList.add('hint'); }, 2600); }
  if (document.body.classList.contains('ready')) nudge(); else addEventListener('ow:ready', nudge);
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ amb.scene = e.target.getAttribute('data-sound'); ambMix(); } }); }, {rootMargin: '-50% 0px -50% 0px'});
    $$('[data-sound]').forEach(function(s){ io.observe(s); });
  }
})();

(function(){
  var barsEl = $('#bars'), N = 48, bars = [];
  for (var i = 0; i < N; i++){ var b = document.createElement('span'); barsEl.appendChild(b); bars.push(b); }
  var btnL = $('#mLoud'), btnQ = $('#mQuiet'), play = $('#lPlay'), icon = $('#lIcon'), level = $('#lLevel');
  var quiet = true, loudBus = null, quietBus = null, analyser, data, raf = null;
  function chain(c, o){
    var bus = c.createGain(); bus.gain.value = 0;
    var src = noiseSrc(c, true), lp = c.createBiquadFilter(), amp = c.createGain();
    lp.type = 'lowpass'; lp.frequency.value = o.cutoff; amp.gain.value = o.base; lfo(c, o.rotor, o.slap, amp.gain);
    src.connect(lp); lp.connect(amp); amp.connect(bus); src.start();
    if (o.tail){
      var t = c.createOscillator(), tf = c.createBiquadFilter(), tg = c.createGain(), tp = panner(c, 0.25, 0.7);
      t.type = 'sawtooth'; t.frequency.value = o.tail; tf.type = 'bandpass'; tf.frequency.value = o.tail * 4; tf.Q.value = 2; tg.gain.value = 0.05;
      t.connect(tf); tf.connect(tg); tg.connect(tp); tp.connect(bus); t.start();
      var w = c.createOscillator(), wg = c.createGain(); w.frequency.value = 1150; wg.gain.value = 0.012; w.connect(wg); wg.connect(bus); w.start();
    }
    return bus;
  }
  function build(c){
    var master = c.createGain(); master.gain.value = 0.9;
    analyser = c.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.75;
    data = new Uint8Array(analyser.frequencyBinCount);
    loudBus = chain(c, {cutoff: 1100, base: 0.55, rotor: 7.2, slap: 0.45, tail: 104});
    quietBus = chain(c, {cutoff: 420, base: 0.16, rotor: 6.4, slap: 0.05, tail: 0});
    loudBus.connect(master); quietBus.connect(master); master.connect(analyser); analyser.connect(c.destination);
  }
  function mix(){
    if (!loudBus) return;
    var now = AH.ctx.currentTime, on = listenState.playing;
    loudBus.gain.setTargetAtTime(on && !quiet ? 1 : 0, now, 0.25);
    quietBus.gain.setTargetAtTime(on && quiet ? 1 : 0, now, 0.25);
    amb.duck = on ? 0.15 : 1; ambMix();
  }
  function draw(){
    analyser.getByteFrequencyData(data);
    for (var i = 0; i < N; i++){
      var v = data[1 + Math.floor(Math.abs(i - (N - 1) / 2) * 0.7)] / 255;
      bars[i].style.height = Math.max(2, Math.round(v * 70)) + 'px';
    }
    raf = requestAnimationFrame(draw);
  }
  function rest(){ cancelAnimationFrame(raf); bars.forEach(function(b){ b.style.height = '2px'; }); }
  function setMode(q){
    quiet = q; btnQ.setAttribute('aria-pressed', q); btnL.setAttribute('aria-pressed', !q);
    level.textContent = q ? 'In the cabin, a normal speaking voice.' : 'In a conventional cabin, voices are raised.';
    mix();
  }
  btnL.addEventListener('click', function(){ setMode(false); });
  btnQ.addEventListener('click', function(){ setMode(true); });
  play.addEventListener('click', function(){
    var c = AH.get(); if (!c){ level.textContent = 'Sound is not supported in this browser.'; return; }
    if (!loudBus) build(c);
    listenState.playing = !listenState.playing;
    var on = listenState.playing;
    play.setAttribute('aria-pressed', on); play.setAttribute('aria-label', on ? 'Pause sound' : 'Play sound');
    icon.setAttribute('d', on ? 'M3 1 H6 V17 H3 Z M10 1 H13 V17 H10 Z' : 'M2 1 L15 9 L2 17 Z');
    mix();
    if (on){ cancelAnimationFrame(raf); draw(); } else { setTimeout(function(){ if (!listenState.playing) rest(); }, 700); maybeSuspend(); }
  });
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ if (!es[0].isIntersecting && listenState.playing) play.click(); }).observe($('#aircraft'));
  }
  setMode(true);
})();

/* ================= 5. The view through the canopy ================= */
(function(){
  var can = $('#canopy'), pano = $('#pano');
  var pos = 0.5, vel = 0, dragging = false, lastX = 0, auto = !reduce, t0 = performance.now(), on = false, running = false;
  function apply(){ pano.style.transform = 'translate3d(' + (-pos * 50).toFixed(3) + '%,0,0)'; }
  function take(){ auto = false; can.classList.add('used'); }
  can.addEventListener('pointerdown', function(e){ dragging = true; lastX = e.clientX; vel = 0; take(); can.classList.add('dragging'); try { can.setPointerCapture(e.pointerId); } catch (x) {} });
  can.addEventListener('pointermove', function(e){
    if (!dragging) return;
    var dx = e.clientX - lastX; lastX = e.clientX;
    var d = -dx / (can.clientWidth * 1.1); pos = clamp(pos + d, 0, 1); vel = d; apply();
  });
  function end(){ dragging = false; can.classList.remove('dragging'); }
  can.addEventListener('pointerup', end); can.addEventListener('pointercancel', end);
  can.addEventListener('keydown', function(e){
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight'){ e.preventDefault(); take(); vel = 0; pos = clamp(pos + (e.key === 'ArrowLeft' ? -0.08 : 0.08), 0, 1); apply(); }
  });
  function loop(now){
    if (!on){ running = false; return; }
    if (!dragging){
      if (auto) pos = 0.5 + 0.32 * Math.sin((now - t0) / 5200);
      else if (Math.abs(vel) > 0.0001){ pos = clamp(pos + vel, 0, 1); vel *= 0.92; }
      apply();
    }
    requestAnimationFrame(loop);
  }
  new IntersectionObserver(function(es){ on = es[0].isIntersecting; if (on && !running){ running = true; requestAnimationFrame(loop); } }).observe(can);
  apply();
})();

/* Social links: placeholders do nothing until a real URL is added */
$$('[data-social]').forEach(function(a){
  var href = a.getAttribute('href');
  if (!href || href === '#'){ a.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); }); a.setAttribute('aria-disabled', 'true'); }
  else { a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', a.getAttribute('aria-label').replace(' (link coming soon)', '')); }
});

/* ================= Film ================= */
(function(){
  var film = $('#journal'), vid = $('#filmVideo');
  $('#filmPlay').addEventListener('click', function(){
    var src = vid.getAttribute('data-src');
    if (!src){ var m = $('#filmMsg'); m.style.display = 'block'; setTimeout(function(){ m.style.display = 'none'; }, 2600); return; }
    if (!vid.getAttribute('src')) vid.src = src;
    film.classList.add('playing'); vid.play().catch(function(){}); vid.focus();
  });
  vid.addEventListener('ended', function(){ film.classList.remove('playing'); vid.currentTime = 0; });
})();

/* ================= 7 + 8. Seat, envelope and invitation ================= */
(function(){
  var form = $('#inviteForm'), stage = $('#stage'), msg = $('#formMsg');
  var SEATS = {'Front right': 1, 'Front left': 2, 'Rear right': 3, 'Rear left': 4};
  function seatVal(){ var s = $('input[name="seat"]:checked'); return s ? s.value : 'Front left'; }
  function seatLabel(v){ return 'Seat ' + SEATS[v] + ', ' + v.toLowerCase(); }
  $$('input[name="seat"]').forEach(function(r){ r.addEventListener('change', function(){ $('#seatName').textContent = seatLabel(seatVal()); }); });
  var info = {};
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = $('#fName'), email = $('#fEmail'), date = $('#fDate'), agree = $('#fAgree');
    [name, email, date, agree].forEach(function(f){ f.removeAttribute('aria-invalid'); });
    function stop(f, text){ f.setAttribute('aria-invalid', 'true'); msg.textContent = text; f.focus(); }
    if (!name.value.trim()) return stop(name, 'Add your name so we know how to address you.');
    if (!email.value || !email.validity.valid) return stop(email, 'Add a valid email so we can reach you when reservations open.');
    if (!date.value.trim()) return stop(date, 'Add a preferred date or window, even an approximate one.');
    if (!agree.checked) return stop(agree, 'Please confirm you understand this is not yet a reservation.');
    msg.textContent = 'Fields marked * are required. We reply personally, never with a newsletter.';
    info = {date: date.value.trim(), travel: $('#fTravel').value.trim(), note: $('#fNote').value.trim(), name: name.value.trim(), journey: ($('input[name="journey"]:checked') || {}).value || 'Not decided yet', seat: seatVal(), no: '0' + String(10 + Math.floor(Math.random() * 90))};
    $('#cNo').textContent = info.no; $('#cFor').textContent = 'Reserved for ' + info.name;
    $('#cDate').textContent = info.date; $('#cJourney').textContent = info.journey; $('#cSeat').textContent = SEATS[info.seat] + ', ' + info.seat.toLowerCase();
    form.style.display = 'none';
    stage.className = 'stage show';
    var target = stage.getBoundingClientRect().top + scrollY + stage.offsetHeight - innerHeight + 60;
    if (lenis) lenis.scrollTo(target, {duration: 1.2}); else window.scrollTo({top: target, behavior: reduce ? 'auto' : 'smooth'});
    var steps = reduce ? [[0, 's5']] : [[400, 's1'], [1100, 's2'], [2000, 's3'], [3300, 's4'], [4000, 's5']];
    steps.forEach(function(st){ setTimeout(function(){ stage.classList.add(st[1]); if (st[1] === 's5') $('#card').focus({preventScroll: true}); }, st[0]); });
  });
  $('#editCard').addEventListener('click', function(){ stage.className = 'stage'; form.style.display = ''; $('#fName').focus(); });

  function tracked(g, text, x, y, sp, align){
    var w = 0, i; for (i = 0; i < text.length; i++) w += g.measureText(text[i]).width + sp; w -= sp;
    var cx = align === 'center' ? x - w / 2 : x;
    for (i = 0; i < text.length; i++){ g.fillText(text[i], cx, y); cx += g.measureText(text[i]).width + sp; }
  }
  $('#dlCard').addEventListener('click', function(){
    var go = function(){
      var c = document.createElement('canvas'); c.width = 1200; c.height = 1600;
      var g = c.getContext('2d'), serif = '"Cormorant Garamond", Georgia, serif', sans = '"Hanken Grotesk", Arial, sans-serif';
      g.fillStyle = '#F5F4F1'; g.fillRect(0, 0, 1200, 1600);
      g.strokeStyle = '#CFC5B3'; g.lineWidth = 2; g.strokeRect(48, 48, 1104, 1504);
      if (WINGS.complete && WINGS.naturalWidth) g.drawImage(tint(WINGS, '#B8892E'), 120, 104, 260, 260 * 152 / 900);
      g.fillStyle = '#B8892E'; g.textBaseline = 'alphabetic';
      g.font = '400 44px ' + serif; tracked(g, 'OCEAN WHISPERER', 120, 230, 14);
      g.fillStyle = '#0C1826';
      g.fillStyle = '#7A5D31'; g.font = '300 32px ' + sans; g.fillText('Inaugural season, Curaçao', 120, 286);
      g.fillStyle = '#5C636B'; g.font = '300 32px ' + sans; g.fillText('Invitation no.', 120, 760);
      g.fillStyle = '#0C1826'; g.font = '300 300px ' + serif; g.fillText(info.no || '0__', 108, 1020);
      g.font = '400 64px ' + serif; g.fillText('Reserved for ' + (info.name || 'you'), 120, 1120);
      g.fillStyle = '#CFC5B3'; g.fillRect(120, 1250, 960, 2);
      g.fillStyle = '#5C636B'; g.font = '300 32px ' + sans;
      g.fillText('Journey', 120, 1320); g.fillText('Seat', 120, 1375); g.fillText('Preferred date', 120, 1430);
      g.fillStyle = '#0C1826'; g.font = '500 32px ' + sans;
      g.fillText(info.journey || '', 380, 1320); g.fillText(info.seat ? SEATS[info.seat] + ', ' + info.seat.toLowerCase() : '', 380, 1375);
      var dt = info.date || ''; while (dt.length > 3 && g.measureText(dt).width > 700) dt = dt.slice(0, -2); if (dt !== (info.date || '')) dt += '…';
      g.fillText(dt, 380, 1430);
      g.fillStyle = '#5C636B'; g.font = '300 26px ' + sans; g.fillText('Curaçao International Airport, Willemstad', 120, 1500);
      c.toBlob(function(b){
        var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ocean-whisperer-invitation.png';
        document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      });
    };
    if (document.fonts && document.fonts.load){
      Promise.all([document.fonts.load('300 300px "Cormorant Garamond"'), document.fonts.load('300 32px "Hanken Grotesk"')]).then(go, go);
    } else go();
  });
})();

onScroll();
})();
