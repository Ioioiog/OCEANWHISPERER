/* Ocean Whisperer — site behaviour */
(function(){
'use strict';
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var ROOT = document.documentElement.getAttribute('data-root') || '';   /* '' on the home page, '../' inside page folders */
var fine = matchMedia('(pointer:fine)').matches;
var narrowMQ = matchMedia('(max-width:960px)');
var phoneMQ = matchMedia('(max-width:640px)');
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t){ return a + (b - a) * t; }
function smooth(e0, e1, x){ var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
function ease(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

/* Shared geometry: Curaçao and the four routes, in map units */
/* Real coastline of Curaçao and Klein Curaçao (OpenStreetMap data, via geo-maps, 100 m), in map units */
var ISLAND_MAIN = 'M434.2 454.8 L425.6 449.6 L428.7 453.0 L420.7 461.8 L372.7 430.8 L338.7 417.1 L345.3 414.4 L341.7 412.6 L346.5 404.4 L351.6 404.7 L355.8 411.4 L359.2 408.7 L356.1 404.8 L362.9 405.1 L369.3 411.2 L365.3 405.2 L377.3 405.6 L377.3 374.2 L367.1 384.3 L362.8 374.7 L356.9 376.5 L356.2 385.5 L361.6 388.4 L344.5 388.4 L344.5 386.3 L342.8 388.4 L339.1 388.4 L338.5 385.5 L332.9 388.4 L333.3 384.8 L321.8 385.9 L322.2 388.4 L305.8 388.4 L319.5 403.5 L342.4 404.3 L339.8 412.2 L335.7 416.0 L331.4 415.5 L331.4 416.8 L293.8 395.6 L301.9 375.9 L294.2 368.8 L290.1 371.4 L293.1 391.7 L259.4 371.4 L247.8 340.6 L237.4 331.5 L228.0 315.3 L228.6 305.0 L219.1 295.2 L204.1 289.1 L204.1 268.0 L189.1 273.0 L159.5 298.7 L152.3 295.4 L141.8 282.9 L141.4 263.2 L132.5 258.6 L127.6 242.5 L117.1 240.7 L113.3 222.5 L85.1 196.7 L100.0 183.5 L93.1 178.1 L89.8 185.2 L87.9 178.2 L88.5 190.9 L75.7 196.3 L50.0 163.3 L48.5 158.8 L63.4 143.7 L54.7 129.9 L50.6 90.5 L55.0 83.5 L47.6 71.0 L51.7 59.6 L40.4 44.9 L48.7 32.0 L56.9 30.0 L92.5 56.3 L159.7 84.4 L174.3 108.6 L169.7 109.4 L167.4 112.3 L174.9 110.4 L183.5 127.0 L183.8 133.8 L174.4 136.8 L184.5 137.4 L183.7 169.2 L188.7 184.4 L180.0 190.9 L190.7 189.5 L217.6 234.7 L280.1 288.3 L323.2 304.7 L350.0 304.3 L377.6 316.7 L447.6 322.9 L492.7 353.6 L508.6 380.6 L499.3 389.3 L485.6 383.7 L482.6 389.3 L489.5 393.3 L479.7 395.2 L479.8 401.9 L485.7 399.5 L489.8 408.9 L493.2 400.0 L497.0 406.9 L512.8 408.1 L502.1 391.5 L510.5 385.1 L535.8 429.7 L600.0 498.1 L585.8 496.4 L582.5 501.3 L596.9 499.9 L585.4 502.7 L550.4 496.9 L545.5 500.1 L527.8 504.0 L522.2 509.1 L512.3 507.0 L486.4 497.4 L476.1 491.3 L491.0 497.3 L487.4 491.1 L476.9 489.5 L470.4 478.1 L461.4 477.0 L471.9 489.0 L447.6 468.8 L448.5 454.3 L460.4 464.2 L465.9 450.3 L461.4 440.3 L452.4 439.1 L453.5 448.3 L452.0 451.2 L449.7 442.6 L447.9 448.7 L443.9 443.1 L443.4 446.5 L446.2 453.0 L443.8 449.6 L442.6 443.3 L440.7 448.9 L436.5 441.3 L435.0 441.9 L435.0 432.0 L420.6 446.2 L428.4 446.2 L439.1 453.6 L437.6 462.4 L441.7 456.7 L448.3 457.9 L446.0 471.5 L439.1 471.2 Z';
var ISLAND_KLEIN = 'M726.2 576.1 L722.3 586.0 L716.5 557.9 L724.7 559.9 Z';
var ISLAND = ISLAND_MAIN + ' ' + ISLAND_KLEIN;
var MAP = {cx: 345, cy: 290, hato: [306.9, 303.0], willemstad: [341.5, 415.7]};
var ROUTES = [
  'M306.9 303.0 C297.1 303.0 314.8 338.0 319.8 355.2 C324.8 372.5 332.5 391.3 336.9 406.3 C341.3 421.3 336.9 437.7 346.1 445.3 C355.3 452.9 380.0 455.4 392.1 452.0 C404.1 448.7 420.5 441.3 418.3 425.1 C416.1 409.0 397.5 375.6 378.9 355.2 C360.4 334.9 316.8 303.0 306.9 303.0',
  'M306.9 303.0 C314.6 327.6 319.9 381.9 313.2 402.3 C306.6 422.6 288.1 429.6 267.3 425.1 C246.5 420.7 212.5 398.3 188.4 375.4 C164.4 352.6 141.4 320.5 122.8 288.0 C104.1 255.6 93.2 216.4 76.8 180.5 C60.4 144.7 27.5 101.0 24.2 73.0 C21.0 45.0 39.6 12.5 57.1 12.5 C74.6 12.5 104.1 47.2 129.3 73.0 C154.5 98.8 185.2 136.8 208.1 167.1 C231.1 197.3 250.8 231.8 267.3 254.4 C283.7 277.1 299.3 278.3 306.9 303.0',
  'M306.9 303.0 C331.0 320.9 368.0 315.2 398.6 328.4 C429.2 341.6 461.0 362.0 490.6 382.1 C520.1 402.3 549.7 426.9 576.0 449.3 C602.2 471.7 626.3 493.0 648.2 516.5 C670.1 540.0 689.8 581.5 707.3 590.4 C724.8 599.4 754.4 578.1 753.3 570.3 C752.2 562.4 733.6 552.4 700.8 543.4 C667.9 534.4 600.1 526.6 556.3 516.5 C512.5 506.4 474.2 495.2 438.0 482.9 C401.9 470.6 376.7 457.2 339.5 442.6 C302.3 428.0 250.8 419.1 214.7 395.6 C178.6 372.0 149.0 335.1 122.8 301.5 C96.5 267.9 74.6 234.3 57.1 194.0 C39.6 153.6 13.3 89.8 17.7 59.6 C22.0 29.3 57.1 5.8 83.4 12.5 C109.6 19.2 146.8 65.2 175.3 99.9 C203.8 134.6 232.2 187.0 254.1 220.8 C276.1 254.7 282.8 285.0 306.9 303.0',
  'M306.9 303.0 C323.4 311.9 324.2 358.9 326.4 382.1 C328.5 405.4 331.8 423.6 319.8 442.6 C307.8 461.6 280.4 493.0 254.1 496.4 C227.9 499.7 179.7 480.7 162.2 462.8 C144.7 444.8 138.1 411.2 149.0 388.8 C160.0 366.4 201.5 342.7 227.9 328.4 C254.2 314.1 290.5 294.0 306.9 303.0'
];
var NAMES = ['Willemstad Prelude', 'Coastal Sonata', 'The Whisperer’s Hour', 'Sunset Ceremony'];
var PHOTOS = [
  ROOT + 'assets/img/willemstad-waterfront.jpeg',
  ROOT + 'assets/img/coastline-aerial.jpg',
  ROOT + 'assets/img/remote-coastline.jpg',
  ROOT + 'assets/img/golden-sea.jpg'
];

/* The logo as an image, for the downloadable invitation and the favicon */
var WINGS = new Image();
(function(){
  var v = getComputedStyle(document.documentElement).getPropertyValue('--wings'), m = v.match(/url\(["']?(.*?)["']?\)/);
  if (m) WINGS.src = m[1];
  WINGS.onload = function(){
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'); g.fillStyle = '#0B1524'; g.fillRect(0, 0, 64, 64);
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
  golden: {at: 'at golden hour', name: 'golden hour', haze: '#6E4527', sky: '#16223A', land: '#26334A', line: '#F0CFA2', sea: '#1A2740', seaLine: '#8E6C57', route: '#F7CD85', stars: 0},
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
  if ($('#heroTime')) $('#heroTime').innerHTML = PALETTES[forced] ? 'Previewing the island ' + PAL.at + '.' : 'In Willemstad it is <b>' + fmt(h) + '</b>, ' + PAL.name + '.';
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
  lenis.scrollTo(t, {offset: id === '#top' ? 0 : (t.classList.contains('xp-item') ? -150 : -70), duration: 1.6});
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
  var t = d.replace(/([MLQCSZ])/g, ' $1 ').trim().split(/[\s,]+/), i = 0, pts = [], cx = 0, cy = 0, lc = null, cmd;
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
    else if (cmd === 'L'){ cx = n(); cy = n(); pts.push([cx, cy]); }
    else if (cmd === 'Z'){ /* closed */ }
  }
  return pts;
}

/* ================= 1. 3D hero ================= */
var heroStage = $('#heroStage'), heroSvg = $('#heroSvg');
function frameSvg(){
  if (!heroSvg) return;
  heroSvg.setAttribute('viewBox', phoneMQ.matches ? '470 0 660 520' : '0 0 1600 1000');
  heroSvg.setAttribute('preserveAspectRatio', phoneMQ.matches ? 'xMidYMid meet' : 'xMidYMid slice');
}
frameSvg();
(phoneMQ.addEventListener ? phoneMQ.addEventListener('change', frameSvg) : phoneMQ.addListener(frameSvg));

(function initGL(){
  if (reduce || !window.THREE || !$('#heroGL')) return;
  var THREE = window.THREE, canvas = $('#heroGL'), renderer;
  try { renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance'}); }
  catch (e) { return; }
  if (!renderer.getContext()) return;
  var low = (navigator.hardwareConcurrency || 4) <= 4 && /Mobi|Android/i.test(navigator.userAgent);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  var K = 0.06, CX = MAP.cx, CY = MAP.cy;
  var toW = function(p){ return [(p[0] - CX) * K, (p[1] - CY) * K]; };
  var rings = [samplePath(ISLAND_MAIN, 1).map(toW), samplePath(ISLAND_KLEIN, 1).map(toW)];
  var minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  rings.forEach(function(r){ r.forEach(function(p){ minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minZ = Math.min(minZ, p[1]); maxZ = Math.max(maxZ, p[1]); }); });
  function inside(x, z){
    var c = false;
    rings.forEach(function(poly){
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++){
        var xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
        if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) c = !c;
      }
    });
    return c;
  }
  function edgeDist(x, z){
    var best = 1e9;
    rings.forEach(function(poly){
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++){
        var ax = poly[j][0], az = poly[j][1], bx = poly[i][0], bz = poly[i][1];
        var dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz, t = l ? clamp(((x - ax) * dx + (z - az) * dz) / l, 0, 1) : 0;
        var px = ax + t * dx - x, pz = az + t * dz - z, d = px * px + pz * pz;
        if (d < best) best = d;
      }
    });
    return Math.sqrt(best);
  }
  /* Relief: Christoffelberg in the north-west, Tafelberg near Santa Barbara in the east */
  function bump(x, z, bx, bz, r){ var dx = x - bx, dz = z - bz; return Math.exp(-(dx * dx + dz * dz) / r); }
  function noise(x, z){ return 0.5 + 0.22 * Math.sin(x * 0.9 + z * 0.5) + 0.18 * Math.sin(x * 0.43 - z * 1.3 + 1.7) + 0.1 * Math.sin(x * 2.1 + z * 1.7 + 0.3); }
  function height(x, z){
    if (x < minX - 5.5 || x > maxX + 5.5 || z < minZ - 5.5 || z > maxZ + 5.5) return -0.62;
    var d = edgeDist(x, z);
    if (inside(x, z)) return smooth(0, 1.6, d) * (0.3 + 0.55 * noise(x, z)) * (0.55 + 1.9 * bump(x, z, -13.9, -9.8, 42) + 0.7 * bump(x, z, 10.3, 9.5, 5)) * 0.95;
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
    uNear: {value: 42}, uFar: {value: 115}, uTime: {value: 0}
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
  var hato = new THREE.Vector3((MAP.hato[0] - CX) * K, 0, (MAP.hato[1] - CY) * K); hato.y = Math.max(gridH(hato.x, hato.z), 0) + 0.05;
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
    var dist = (phoneMQ.matches ? 19 : 28) / Math.tan(hfov / 2), elev = THREE.MathUtils.degToRad(phoneMQ.matches ? 46 : 40);
    finalTgt.set(phoneMQ.matches ? 1.5 : 1, -0.6, phoneMQ.matches ? 1.5 : 11);
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
  if (!veil){ setTimeout(ready, 60); return; }
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
  if (!$('#flightMap')) return;
  var svg = $('#flightMap'), panel = $('.flight'), fRoute = $('#fRoute'), heli = $('#fHeli'), wins = $('#fWins');
  var steps = $$('.j-step'), NS = 'http://www.w3.org/2000/svg';
  /* soft offset bands around the real coastline, in the same blue as before */
  var halo = function(w, op){ return '<path d="' + ISLAND + '" fill="none" stroke="#8FA6BC" stroke-opacity="' + op + '" stroke-width="' + w + '" stroke-linejoin="round"/>'; };
  $('#fIsland').innerHTML = halo(46, .04) + halo(28, .06) + halo(14, .09) +
    '<path d="' + ISLAND + '" fill="#12253C" stroke="#8FA6BC" stroke-opacity=".75" stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  $('#fFaint').innerHTML = ROUTES.map(function(d){ return '<path class="f-faint" d="' + d + '"/>'; }).join('');

  var lens = [], winEls = [];
  ROUTES.forEach(function(d, i){
    fRoute.setAttribute('d', d); var L = fRoute.getTotalLength(); lens.push(L);
    var pt = fRoute.getPointAtLength(L * 0.55), w = 132, h = 88;
    var wx = clamp(pt.x + 18, 20, 600), wy = pt.y - h - 26; if (wy < 0) wy = pt.y + 26;
    var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'win');
    var cr = $('#wc' + i + ' rect'); cr.setAttribute('x', wx); cr.setAttribute('y', wy); cr.setAttribute('width', w); cr.setAttribute('height', h);
    var ly = wy > pt.y ? wy : wy + h;
    g.innerHTML = '<line x1="' + pt.x + '" y1="' + pt.y + '" x2="' + (wx + 10) + '" y2="' + ly + '"/>' +
      '<image href="' + PHOTOS[i] + '" x="' + wx + '" y="' + wy + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#wc' + i + ')"/>' +
      '<rect class="frame" x="' + wx + '" y="' + wy + '" width="' + w + '" height="' + h + '" rx="3"/>';
    wins.appendChild(g); winEls.push(g);
  });

  var FULL = {x: 380, y: 300, w: 760};
  var cur = -1, len = 0, cam = {x: FULL.x, y: FULL.y, w: FULL.w}, tgt = {x: FULL.x, y: FULL.y, w: FULL.w}, moving = false;
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
    var pa = fRoute.getPointAtLength(Math.max(0, len * p - 4)), pb = fRoute.getPointAtLength(Math.min(len, len * p + 4));
    var ang = Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180 / Math.PI;
    heli.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    winEls.forEach(function(g, k){ g.style.opacity = k === idx ? (smooth(0.2, 0.34, p) * (1 - smooth(0.86, 0.97, p))).toFixed(2) : 0; });
    var z = smooth(0.02, 0.16, p) * (1 - smooth(0.86, 0.99, p));
    var zw = narrowMQ.matches ? 340 : 300;
    tgt.w = lerp(FULL.w, zw, z); tgt.x = lerp(FULL.x, pt.x, z); tgt.y = lerp(FULL.y, pt.y, z);
    if (!moving){ moving = true; requestAnimationFrame(glide); }
  }
  function glide(){
    var k = reduce ? 1 : 0.1;
    cam.x += (tgt.x - cam.x) * k; cam.y += (tgt.y - cam.y) * k; cam.w += (tgt.w - cam.w) * k;
    var ar = panel.clientHeight / Math.max(panel.clientWidth, 1), h = cam.w * ar;
    /* keep the gold line about 2.4 px wide on screen at every zoom level */
    fRoute.style.strokeWidth = (2.4 * cam.w / Math.max(panel.clientWidth, 1)).toFixed(3);
    svg.setAttribute('viewBox', (cam.x - cam.w / 2).toFixed(1) + ' ' + (cam.y - h / 2).toFixed(1) + ' ' + cam.w.toFixed(1) + ' ' + h.toFixed(1));
    if (Math.abs(tgt.x - cam.x) + Math.abs(tgt.y - cam.y) + Math.abs(tgt.w - cam.w) > 0.1) requestAnimationFrame(glide);
    else moving = false;
  }
  /* rotor spins with scroll speed, spools down to idle when the page is still */
  var fRotor = $('#fRotor'), rotA = 0, rotV = 0, rotY = scrollY;
  if (fRotor && !reduce){
    (function rotorLoop(){
      var y = scrollY, dy = Math.abs(y - rotY); rotY = y;
      rotV += Math.min(dy, 60) * .1;
      rotV *= .93;
      if (rotV < .5) rotV = .5;
      rotA = (rotA + rotV) % 360;
      fRotor.setAttribute('transform', 'rotate(' + rotA.toFixed(1) + ')');
      requestAnimationFrame(rotorLoop);
    })();
  }
  scrollSubs.push(update); update();
})();

/* ================= 10. Passing through cloud between sections ================= */
(function(){
  /* the passing cloud belongs to the long home page only */
  if (reduce || !$('#heroStage')) return;
  var mist = $('#mist'), marks = [];
  var after = ['#top', '#journeys', '#arrival', '#charter', '.founders'];
  function measure(){ marks = after.map(function(s){ return $(s); }).filter(Boolean).map(function(el){ return el.getBoundingClientRect().bottom + scrollY; }); }
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
  if (!$('#bars')) return;
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
    level.textContent = q ? 'With your headset, conversation flows easily over the intercom.' : 'Outside the cabin, the turbine and rotors are loud.';
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
    new IntersectionObserver(function(es){ if (!es[0].isIntersecting && listenState.playing) play.click(); }).observe($('#bars').closest('section'));
  }
  setMode(true);
})();

/* ================= 5. The view through the canopy ================= */
(function(){
  if (!$('#canopy')) return;
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

/* ================= Private charter: horizontal strip progress; enquire pre-fills the form ================= */
(function(){
  var strip = $('#cStrip'), prog = $('#cProg');
  if (strip && prog){
    var prev = $('#cPrev'), next = $('#cNext');
    var onStrip = function(){
      var max = strip.scrollWidth - strip.clientWidth;
      var pr = max > 0 ? strip.scrollLeft / max : 1;
      prog.style.width = (25 + pr * 75).toFixed(1) + '%';
      if (prev) prev.disabled = strip.scrollLeft <= 2;
      if (next) next.disabled = strip.scrollLeft >= max - 2;
    };
    var step = function(){ var it = strip.querySelector('.c-item'); return it ? it.offsetWidth + 24 : 320; };
    if (prev) prev.addEventListener('click', function(){ strip.scrollBy({left: -step(), behavior: 'smooth'}); });
    if (next) next.addEventListener('click', function(){ strip.scrollBy({left: step(), behavior: 'smooth'}); });
    strip.addEventListener('wheel', function(e){
      var max = strip.scrollWidth - strip.clientWidth;
      if (max <= 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var canFwd = strip.scrollLeft < max - 2, canBack = strip.scrollLeft > 2;
      if ((e.deltaY > 0 && canFwd) || (e.deltaY < 0 && canBack)){
        e.preventDefault();
        strip.scrollLeft += e.deltaY;
      }
    }, {passive: false});
    var dragX = 0, dragL = 0, dragging = false, moved = 0;
    strip.addEventListener('dragstart', function(e){ e.preventDefault(); });
    strip.addEventListener('pointerdown', function(e){
      if (e.pointerType === 'touch') return;
      dragging = true; moved = 0; dragX = e.clientX; dragL = strip.scrollLeft;
      strip.classList.add('grabbing');
      strip.setPointerCapture(e.pointerId);
    });
    strip.addEventListener('pointermove', function(e){
      if (!dragging) return;
      moved = Math.max(moved, Math.abs(e.clientX - dragX));
      strip.scrollLeft = dragL - (e.clientX - dragX);
    });
    var endDrag = function(){ dragging = false; strip.classList.remove('grabbing'); };
    strip.addEventListener('pointerup', endDrag);
    strip.addEventListener('pointercancel', endDrag);
    strip.addEventListener('click', function(e){ if (moved > 6){ e.preventDefault(); e.stopPropagation(); } }, true);
    strip.addEventListener('scroll', onStrip, {passive: true});
    addEventListener('resize', onStrip);
    onStrip();
  }
  $$('.c-enquire[data-charter]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      var type = a.getAttribute('data-charter'), note = $('#fNote'), prefix = 'Private charter: ' + type + '. ';
      note.value = prefix + note.value.replace(/^Private charter: [^.]*\. ?/, '');
      $('#formMsg').textContent = 'We have noted your interest in ' + type.toLowerCase() + '. Add your details below.';
      var t = $('#invite');
      if (lenis) lenis.scrollTo(t, {offset: -70, duration: 1.6}); else t.scrollIntoView({behavior: reduce ? 'auto' : 'smooth'});
      setTimeout(function(){ $('#fName').focus({preventScroll: true}); }, reduce ? 0 : 1500);
    });
  });
})();

/* ================= Experiences page: route maps that draw themselves, chapter index ================= */
(function(){
  if (!$('.xp-hero')) return;
  var NS = 'http://www.w3.org/2000/svg';
  function mapSvg(svg, routes){
    var halo = function(w, op){ return '<path d="' + ISLAND + '" fill="none" stroke="#8FA6BC" stroke-opacity="' + op + '" stroke-width="' + w + '" stroke-linejoin="round"/>'; };
    svg.innerHTML = halo(46, .04) + halo(28, .06) + halo(14, .09) +
      '<path d="' + ISLAND + '" fill="#12253C" stroke="#8FA6BC" stroke-opacity=".75" stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      routes.map(function(i, k){ return '<path class="xm-route" pathLength="1" style="transition-delay:' + (k * 0.45) + 's" d="' + ROUTES[i] + '"/>'; }).join('') +
      '<circle cx="' + MAP.hato[0] + '" cy="' + MAP.hato[1] + '" r="5" fill="#F5F4F1"/>';
  }
  var heroMap = $('#xpHeroMap');
  if (heroMap){
    mapSvg(heroMap, [0, 1, 2, 3]);
    if (!reduce){
      /* Cycle the routes one at a time: draw ~2.4s, hold, erase along the flight direction, next follows */
      var hRoutes = $$('.xm-route', heroMap), hCur = -1, hShown = hRoutes.map(function(){ return false; });
      hRoutes.forEach(function(p){ p.style.strokeDashoffset = '1'; });
      heroMap.insertAdjacentHTML('beforeend', '<text id="xpHeroName" x="307" y="336" text-anchor="middle" fill="#B9C4CE" font-size="19" letter-spacing="3" font-family="Fraunces, Georgia, serif" opacity=".85"></text>');
      var hTimer = null;
      var heroStep = function(){
        hCur = (hCur + 1) % hRoutes.length;
        hRoutes.forEach(function(p, k){
          p.style.transitionDelay = '0s';
          if (k === hCur){ p.style.strokeDashoffset = '0'; hShown[k] = true; }
          else p.style.strokeDashoffset = hShown[k] ? '-1' : '1';
        });
        var nm = $('#xpHeroName'); if (nm) nm.textContent = NAMES[hCur].toUpperCase();
      };
      setTimeout(heroStep, 1400);
      if ('IntersectionObserver' in window){
        new IntersectionObserver(function(es){
          if (es[0].isIntersecting){ if (!hTimer) hTimer = setInterval(heroStep, 6000); }
          else if (hTimer){ clearInterval(hTimer); hTimer = null; }
        }, {threshold: .2}).observe(heroMap);
      } else hTimer = setInterval(heroStep, 6000);
    }
  }
  $$('.xp-map').forEach(function(svg){ mapSvg(svg, [+svg.getAttribute('data-route')]); });
  /* draw a route when its map comes into view */
  var draw = function(el){ el.classList.add('drawn'); };
  if ('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ draw(e.target); io.unobserve(e.target); } }); }, {threshold: 0.35});
    $$('.xp-map, #xpHeroMap, .xp-profile').forEach(function(m){ io.observe(m); });
  } else $$('.xp-map, #xpHeroMap, .xp-profile').forEach(draw);
})();

/* ================= Transfers page: arcs from Hato to each destination ================= */
(function(){
  if (!$('.tr-hero')) return;
  var ARCS = ["M306.9 303.0 Q381.6 354.6 394.0 444.6", "M306.9 303.0 Q420.5 354.1 459.6 472.4", "M306.9 303.0 Q572.5 345.6 720.5 570.3", "M306.9 303.0 Q234.1 121.2 50.9 52.0"], ENDS = [[394.0, 444.6], [459.6, 472.4], [720.5, 570.3], [50.9, 52.0]];
  function build(svg, faint){
    var halo = function(w, op){ return '<path d="' + ISLAND + '" fill="none" stroke="#8FA6BC" stroke-opacity="' + op + '" stroke-width="' + w + '" stroke-linejoin="round"/>'; };
    svg.innerHTML = halo(46, .04) + halo(28, .06) + halo(14, .09) +
      '<path d="' + ISLAND + '" fill="#12253C" stroke="#8FA6BC" stroke-opacity=".75" stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      ARCS.map(function(d, i){ return '<path class="tr-arc" data-i="' + i + '" pathLength="1" style="transition-delay:' + (faint ? 0 : i * 0.5) + 's" d="' + d + '"/>'; }).join('') +
      ENDS.map(function(p, i){ return '<circle class="tr-end" data-i="' + i + '" cx="' + p[0] + '" cy="' + p[1] + '" r="5"/>'; }).join('') +
      '<circle cx="' + MAP.hato[0] + '" cy="' + MAP.hato[1] + '" r="6" fill="#F5F4F1"/>' +
      '<circle class="tr-dot" r="6" cx="' + MAP.hato[0] + '" cy="' + MAP.hato[1] + '"/>';
  }
  var hero = $('#trHeroMap'), panel = $('#trPanelMap');
  build(hero, false); build(panel, true);
  var drawHero = function(){ hero.classList.add('drawn'); };
  if (reduce) drawHero(); else setTimeout(drawHero, 400);
  /* the panel follows the destination you are reading or pointing at */
  var rows = $$('.tr-row'), pics = $$('.tr-photo img'), cur = -1, dot = $('.tr-dot', panel), anim = null;
  function fly(i){
    var arc = $('.tr-arc[data-i="' + i + '"]', panel), L = arc.getTotalLength(), t0 = performance.now();
    cancelAnimationFrame(anim);
    if (reduce){ var e = arc.getPointAtLength(L); dot.setAttribute('cx', e.x); dot.setAttribute('cy', e.y); return; }
    (function step(now){
      var k = Math.min(1, (now - t0) / 1800); k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      var p = arc.getPointAtLength(L * k); dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
      if (k < 1) anim = requestAnimationFrame(step);
    })(t0);
  }
  function show(i){
    if (i === cur) return; cur = i;
    rows.forEach(function(r, k){ r.classList.toggle('active', k === i); });
    pics.forEach(function(p, k){ p.classList.toggle('on', k === i); });
    $$('.tr-arc', panel).forEach(function(a, k){ a.classList.toggle('on', k === i); });
    $$('.tr-end', panel).forEach(function(a, k){ a.classList.toggle('on', k === i); });
    $('#trName').textContent = rows[i].getAttribute('data-name');
    fly(i);
  }
  rows.forEach(function(r, i){ r.addEventListener('pointerenter', function(){ show(i); }); r.addEventListener('focusin', function(){ show(i); }); });
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) show(+e.target.getAttribute('data-i')); }); }, {rootMargin: '-45% 0px -45% 0px'});
    rows.forEach(function(r){ io.observe(r); });
  }
  show(0);
})();

/* ================= Aircraft page: the illustration explains itself; the cabin, seat by seat ================= */
(function(){
  if (!$('.ac-hero')) return;
  var heli = $('.ac-heli');
  $$('.ac-lines path, .ac-lines circle', heli).forEach(function(el){ el.setAttribute('pathLength', '1'); });
  setTimeout(function(){ heli.classList.add('drawn'); }, reduce ? 0 : 300);
  var dots = $$('.hs'), panels = $$('.hs-panel'), list = $$('.ac-list button');
  function feature(i){
    dots.forEach(function(d, k){ d.classList.toggle('on', k === i); });
    panels.forEach(function(p, k){ p.classList.toggle('on', k === i); });
    list.forEach(function(b, k){ b.setAttribute('aria-pressed', k === i); });
  }
  dots.concat(list).forEach(function(b){
    var i = +b.getAttribute('data-k');
    b.addEventListener('click', function(){ feature(i); });
    if (fine) b.addEventListener('pointerenter', function(){ feature(i); });
  });
  feature(0);
  var seats = $$('.ac-seat'), sp = $$('.seat-panel');
  seats.forEach(function(b, i){
    b.addEventListener('click', function(){
      seats.forEach(function(x, k){ x.classList.toggle('on', k === i); x.setAttribute('aria-pressed', k === i); });
      sp.forEach(function(x, k){ x.classList.toggle('on', k === i); });
    });
  });
})();

/* ================= Chapter index (Experiences, Charters): follows the chapter in view ================= */
(function(){
  var links = $$('.xp-index a'); if (!links.length || !('IntersectionObserver' in window)) return;
  var targets = links.map(function(a){ return $(a.getAttribute('href')); }).filter(Boolean);
  var jo = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ var id = e.target.id; links.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href') === '#' + id); }); } }); }, {rootMargin: '-45% 0px -50% 0px'});
  targets.forEach(function(t){ jo.observe(t); });
})();

/* ================= Charters page: compose a brief; chapters with their own mood ================= */
(function(){
  if (!$('.ch-hero')) return;
  var out = {occ: $('#chOcc'), when: $('#chWhen'), who: $('#chWho')}, send = $('#chSend');
  function val(n){ var r = $('input[name="' + n + '"]:checked'); return r ? r.value : ''; }
  function update(){
    var o = val('ch-occ'), w = val('ch-when'), g = val('ch-guests');
    out.occ.textContent = o; out.when.textContent = w; out.who.textContent = g + (g === '1' ? ' guest' : ' guests');
    var brief = o + ', ' + w.toLowerCase() + ', ' + g + (g === '1' ? ' guest' : ' guests');
    send.setAttribute('href', (ROOT || './') + '?brief=' + encodeURIComponent(brief) + '#invite');
    $('.ch-brief').classList.remove('pulse'); void $('.ch-brief').offsetWidth; $('.ch-brief').classList.add('pulse');
  }
  $$('.ch-composer input').forEach(function(i){ i.addEventListener('change', update); });
  update();
  /* yacht chapter: island and the line from sea to airport */
  var ymap = $('#chYachtMap');
  if (ymap){
    var halo = function(w, op){ return '<path d="' + ISLAND + '" fill="none" stroke="#8FA6BC" stroke-opacity="' + op + '" stroke-width="' + w + '" stroke-linejoin="round"/>'; };
    ymap.innerHTML = halo(46, .04) + halo(28, .06) + halo(14, .09) +
      '<path d="' + ISLAND + '" fill="#12253C" stroke="#8FA6BC" stroke-opacity=".75" stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      '<path class="xm-route" pathLength="1" d="M293.5 570.3 Q359.0 439.6 306.9 303.0"/>' +
      '<circle cx="' + MAP.hato[0] + '" cy="' + MAP.hato[1] + '" r="6" fill="#F5F4F1"/>' +
      '<g transform="translate(293.5 570.3)" class="ch-yacht"><path d="M-14 2 H14 L9 9 H-9 Z M0 -16 V2 M0 -14 L10 0 H0" fill="none" stroke="#E2BD62" stroke-width="1.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></g>' +
      '<text x="' + (MAP.hato[0] + 10) + '" y="' + (MAP.hato[1] - 10) + '" class="f-label" style="font-size:14px">Curaçao International Airport</text>';
  }
  var draws = $$('#chYachtMap, .ch-finder');
  if ('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('drawn'); io.unobserve(e.target); } }); }, {threshold: 0.35});
    draws.forEach(function(d){ io.observe(d); });
  } else draws.forEach(function(d){ d.classList.add('drawn'); });
  /* film chapter: viewfinder with running timecode and aspect toggle */
  var finder = $('.ch-finder'), tc = $('#chTC'), t0 = performance.now(), on = false;
  function tick(now){
    if (!on) return;
    var f = Math.floor((now - t0) / 1000 * 25), ss = Math.floor(f / 25), fr = f % 25;
    tc.textContent = '00:' + String(Math.floor(ss / 60) % 60).padStart(2, '0') + ':' + String(ss % 60).padStart(2, '0') + ':' + String(fr).padStart(2, '0');
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ on = es[0].isIntersecting; if (on && !reduce) requestAnimationFrame(tick); }).observe(finder);
  $$('.ch-aspect button').forEach(function(b){
    b.addEventListener('click', function(){
      $$('.ch-aspect button').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      finder.classList.toggle('scope', b.getAttribute('data-a') === 'scope');
      $('#chFmt').textContent = b.getAttribute('data-a') === 'scope' ? '2.39 : 1' : '16 : 9';
    });
  });
})();

/* Operations pages: the contents list follows the section in view */
(function(){
  var links = $$('.lg-toc a'); if (!links.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) links.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); }); }, {rootMargin: '-40% 0px -55% 0px'});
  links.forEach(function(a){ var t = $(a.getAttribute('href')); if (t) io.observe(t); });
})();

/* ================= Contact page: compose a WhatsApp message ================= */
(function(){
  var cm = $('#ctMap');
  if (cm){
    var halo = function(w, op){ return '<path d="' + ISLAND + '" fill="none" stroke="#8FA6BC" stroke-opacity="' + op + '" stroke-width="' + w + '" stroke-linejoin="round"/>'; };
    cm.innerHTML = halo(46, .04) + halo(28, .06) + halo(14, .09) + '<path d="' + ISLAND + '" fill="#12253C" stroke="#8FA6BC" stroke-opacity=".75" stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      '<circle cx="' + MAP.hato[0] + '" cy="' + MAP.hato[1] + '" r="7" fill="#E2BD62"/><circle class="ct-ping" cx="' + MAP.hato[0] + '" cy="' + MAP.hato[1] + '" r="7" fill="none" stroke="#E2BD62"/>';
  }
  var f = $('#waForm'); if (!f) return;
  function compose(){
    var topic = ($('input[name="wa-topic"]:checked') || {}).value || '', name = $('#waName').value.trim(), msg = $('#waMsg').value.trim();
    var text = 'Hello Ocean Whisperer' + (name ? ', this is ' + name : '') + '.' + (topic ? ' I am writing about ' + topic.toLowerCase() + '.' : '') + (msg ? '\n\n' + msg : '');
    $('#waGo').setAttribute('href', 'https://wa.me/18046470281?text=' + encodeURIComponent(text));
    $('#waPreview').textContent = text;
  }
  $$('input, textarea', f).forEach(function(el){ el.addEventListener('input', compose); el.addEventListener('change', compose); });
  compose();
})();

/* ================= Journal page: gallery with a quiet lightbox ================= */
(function(){
  var items = $$('.jr-grid a'); if (!items.length) return;
  var box = $('#jrBox'), img = $('#jrImg'), count = $('#jrCount'), cur = 0, lastFocus = null;
  function show(i){
    cur = (i + items.length) % items.length;
    img.src = items[cur].getAttribute('href'); img.alt = items[cur].querySelector('img').alt;
    count.textContent = (cur + 1) + ' / ' + items.length;
  }
  function open(i){ lastFocus = document.activeElement; show(i); box.classList.add('open'); box.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; if (lenis) lenis.stop(); $('#jrClose').focus(); }
  function close(){ box.classList.remove('open'); box.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (lenis) lenis.start(); if (lastFocus) lastFocus.focus(); }
  items.forEach(function(a, i){ a.addEventListener('click', function(e){ e.preventDefault(); open(i); }); });
  $('#jrClose').addEventListener('click', close);
  $('#jrPrev').addEventListener('click', function(){ show(cur - 1); });
  $('#jrNext').addEventListener('click', function(){ show(cur + 1); });
  box.addEventListener('click', function(e){ if (e.target === box) close(); });
  addEventListener('keydown', function(e){
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1);
  });
  var sx = null;
  box.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive: true});
  box.addEventListener('touchend', function(e){ if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); sx = null; });
  /* gentle reveal as the photographs scroll into view */
  if ('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {rootMargin: '0px 0px -8% 0px'});
    items.forEach(function(a){ io.observe(a); });
  } else items.forEach(function(a){ a.classList.add('in'); });
})();

/* Social links: placeholders do nothing until a real URL is added */
$$('[data-social]').forEach(function(a){
  var href = a.getAttribute('href');
  if (!href || href === '#'){ a.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); }); a.setAttribute('aria-disabled', 'true'); }
  else { a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', a.getAttribute('aria-label').replace(' (link coming soon)', '')); }
});

/* ================= Film ================= */
(function(){
  if (!$('#filmVideo')) return;
  var film = $('#journal'), vid = $('#filmVideo');
  $('#filmPlay').addEventListener('click', function(){
    var src = vid.getAttribute('data-src');
    if (!src){ var m = $('#filmMsg'); m.style.display = 'block'; setTimeout(function(){ m.style.display = 'none'; }, 2600); return; }
    if (!vid.getAttribute('src')) vid.src = src;
    vid.setAttribute('controls', '');
    film.classList.add('playing'); vid.play().catch(function(){}); vid.focus();
  });
  vid.addEventListener('ended', function(){ film.classList.remove('playing'); vid.currentTime = 0; });
})();

/* ================= 7 + 8. Seat, envelope and invitation ================= */
(function(){
  if (!$('#inviteForm')) return;
  var form = $('#inviteForm'), stage = $('#stage'), msg = $('#formMsg');
  /* Arriving from the Experiences page with a journey already chosen */
  var wantedB = new URLSearchParams(location.search).get('brief');
  if (wantedB){
    var nb = $('#fNote'); nb.value = 'Charter brief: ' + wantedB + '. ' + nb.value.replace(/^Charter brief: [^.]*\. ?/, '');
    msg.textContent = 'We have your charter brief. Add your details below.';
  }
  var wantedS = new URLSearchParams(location.search).get('seat');
  if (wantedS){
    $$('input[name="seat"]').forEach(function(r){ if (r.value === wantedS){ r.checked = true; r.dispatchEvent(new Event('change')); } });
  }
  var wantedT = new URLSearchParams(location.search).get('transfer');
  if (wantedT){
    var nt = $('#fNote'); nt.value = 'Transfer: ' + wantedT + '. ' + nt.value.replace(/^Transfer: [^.]*\. ?/, '');
    msg.textContent = 'We have noted your interest in a transfer to ' + wantedT + '. Add your details below.';
  }
  var wanted = new URLSearchParams(location.search).get('journey'), jSel = $('#fJourney');
  if (wanted && jSel){
    for (var oi = 0; oi < jSel.options.length; oi++) if (jSel.options[oi].value === wanted) jSel.value = wanted;
    msg.textContent = 'We have noted your interest in ' + wanted + '. Add your details below.';
  }
  var SEATS = {'Front, beside the captain': 1, 'Rear right': 2, 'Rear centre': 3, 'Rear left': 4};
  function seatVal(){ var s = $('input[name="seat"]:checked'); return s ? s.value : 'Front, beside the captain'; }
  function seatLabel(v){ return 'Seat ' + SEATS[v] + ', ' + v.toLowerCase(); }
  $$('input[name="seat"]').forEach(function(r){ r.addEventListener('change', function(){ $('#seatName').textContent = seatLabel(seatVal()); }); });
  $('#seatName').textContent = seatLabel(seatVal());
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
    info = {date: date.value.trim(), note: $('#fNote').value.trim(), name: name.value.trim(), journey: jSel ? jSel.value : 'Not decided yet', seat: seatVal(), no: '0' + String(10 + Math.floor(Math.random() * 90))};
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

  /* ?preview=env shows the open envelope with the card pulled out; ?preview=card the final card */
  var pv = new URLSearchParams(location.search).get('preview');
  if (pv === 'env' || pv === 'card'){
    $('#cNo').textContent = '047'; $('#cFor').textContent = 'Reserved for Alexandra R.';
    $('#cDate').textContent = '12–18 March 2027'; $('#cJourney').textContent = 'The Whisperer’s Hour';
    $('#cSeat').textContent = SEATS['Front, beside the captain'] + ', front, beside the captain';
    form.style.display = 'none';
    stage.className = 'stage show' + (pv === 'card' ? ' s1 s2 s3 s4 s5' : ' s1 s2 s3');
    var inv = $('#invite');
    setTimeout(function(){ if (lenis) lenis.scrollTo(inv, {duration: 1}); else inv.scrollIntoView(); }, 300);
  }

  function tracked(g, text, x, y, sp, align){
    var w = 0, i; for (i = 0; i < text.length; i++) w += g.measureText(text[i]).width + sp; w -= sp;
    var cx = align === 'center' ? x - w / 2 : x;
    for (i = 0; i < text.length; i++){ g.fillText(text[i], cx, y); cx += g.measureText(text[i]).width + sp; }
  }
  $('#dlCard').addEventListener('click', function(){
    var go = function(){
      var c = document.createElement('canvas'); c.width = 1200; c.height = 1600;
      var g = c.getContext('2d'), serif = '"Fraunces", Georgia, serif', sans = '"Satoshi", Arial, sans-serif';
      g.fillStyle = '#F5F4F1'; g.fillRect(0, 0, 1200, 1600);
      g.strokeStyle = '#CFC5B3'; g.lineWidth = 2; g.strokeRect(48, 48, 1104, 1504);
      if (WINGS.complete && WINGS.naturalWidth) g.drawImage(tint(WINGS, '#B8892E'), 120, 104, 260, 260 * 152 / 900);
      g.fillStyle = '#B8892E'; g.textBaseline = 'alphabetic';
      g.font = '400 44px ' + serif; tracked(g, 'OCEAN WHISPERER', 120, 230, 14);
      g.fillStyle = '#0B1524';
      g.fillStyle = '#7A5D31'; g.font = '300 32px ' + sans; g.fillText('Inaugural season, Curaçao', 120, 286);
      g.fillStyle = '#5C636B'; g.font = '300 32px ' + sans; g.fillText('Invitation no.', 120, 760);
      g.fillStyle = '#0B1524'; g.font = '300 300px ' + serif; g.fillText(info.no || '0__', 108, 1020);
      g.font = '400 64px ' + serif; g.fillText('Reserved for ' + (info.name || 'you'), 120, 1120);
      g.fillStyle = '#CFC5B3'; g.fillRect(120, 1250, 960, 2);
      g.fillStyle = '#5C636B'; g.font = '300 32px ' + sans;
      g.fillText('Journey', 120, 1320); g.fillText('Seat', 120, 1375); g.fillText('Preferred date', 120, 1430);
      g.fillStyle = '#0B1524'; g.font = '500 32px ' + sans;
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
      Promise.all([document.fonts.load('300 300px "Fraunces"'), document.fonts.load('400 32px "Satoshi"')]).then(go, go);
    } else go();
  });
})();

/* ================= Scroll reveals ================= */
(function(){
  if (reduce || !('IntersectionObserver' in window)) return;
  var sel = [
    '.j-intro', '.j-step', '.arrival-text',
    '.a-grid > div', '.a-img', '.canopy-sec', '.ritual li',
    '.c-item', '.film-foot',
    '.founders .lead', '.f-grid > div',
    '.invite-head', '.i-main',
    '.xp-hero-text', '.xp-fig', '.xp-text', '.xp-steps li', '.xp-cta .inner',
    '.tr-hero-text', '.tr-row', '.tr-sticky', '.tr-steps li', '.tr-sea .inner > *',
    '.ac-hero-text', '.ac-figure', '.ac-panels', '.ac-cabin-grid > *', '.ac-comfort-list li', '.ac-safety-grid > *', '.ac-node',
    '.ch-hero .inner > *', '.ch-personal .inner > *', '.ch-corporate .inner > *', '.ch-yacht-sec .inner > *', '.ch-film-head', '.ch-finder', '.ch-close .inner',
    '.ct-hero .inner', '.ct-card', '.ct-write .inner > *', '.ct-join .inner',
    '.lg-hero .inner', '.lg-toc', '.lg-sec', '.lg-quote', '.lg-related', '.lg-more .inner',
    '.jr-hero .inner', '.jr-head', '.jr-notes .inner',
    '.f-brand', '.social', '.f-col'
  ].join(',');
  var els = $$(sel);
  if (!els.length) return;
  document.body.classList.add('rv');
  els.forEach(function(el){ el.classList.add('rv-i'); });
  var io = new IntersectionObserver(function(entries){
    var d = 0;
    entries.forEach(function(en){
      if (!en.isIntersecting) return;
      var el = en.target;
      el.style.transitionDelay = (d += 80) + 'ms';
      el.classList.add('in');
      /* once it has landed, hand the element back to its own transitions */
      setTimeout(function(){ el.classList.remove('rv-i', 'in'); el.style.transitionDelay = ''; }, 1350);
      io.unobserve(el);
    });
  }, {rootMargin: '0px 0px -10% 0px', threshold: 0.05});
  els.forEach(function(el){ io.observe(el); });
})();

/* Floating sound / WhatsApp step aside while scrolling down, return on the way up */
(function(){
  var lastY = scrollY;
  scrollSubs.push(function(){
    var y = scrollY;
    if (y > 560 && y > lastY + 4) document.body.classList.add('floats-away');
    else if (y < lastY - 4 || y <= 560) document.body.classList.remove('floats-away');
    lastY = y;
  });
})();

/* ================= Statement: the manifesto illuminates word by word ================= */
(function(){
  var sec = $('.statement'), txt = $('#stText'), note = $('#stNote');
  if (!sec || !txt) return;
  var words = [], frag = document.createDocumentFragment();
  Array.prototype.slice.call(txt.childNodes).forEach(function(n){
    if (n.nodeType === 3){
      n.textContent.split(/(\s+)/).forEach(function(tk){
        if (!tk) return;
        if (/^\s+$/.test(tk)){ frag.appendChild(document.createTextNode(tk)); }
        else { var s = document.createElement('span'); s.className = 'w'; s.textContent = tk; frag.appendChild(s); words.push(s); }
      });
    } else if (n.nodeType === 1){
      var s = document.createElement('span'); s.className = 'w'; s.appendChild(n.cloneNode(true)); frag.appendChild(s); words.push(s);
    }
  });
  txt.innerHTML = ''; txt.appendChild(frag);
  var N = words.length;
  var env = $('#stEnv'), estage = $('#stStage'), envPlayed = false;
  if (reduce){
    words.forEach(function(w){ w.style.opacity = '1'; });
    if (note) note.style.opacity = '1';
    return;
  }
  scrollSubs.push(function(){
    var r = sec.getBoundingClientRect(), span = r.height - innerHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
    var wp = Math.min(1, p / .42);
    for (var i = 0; i < N; i++){
      var f = Math.min(1, Math.max(0, (wp * (N + 3) - i) / 3));
      words[i].style.opacity = (.16 + .84 * f).toFixed(2);
    }
    if (note) note.style.opacity = String(Math.min(1, Math.max(0, (p - .4) * 9)));
    if (env && estage){
      env.classList.toggle('on', p > .3);
      if (!envPlayed && p > .32){
        envPlayed = true;
        [[400, 's1'], [1100, 's2'], [2000, 's3'], [3300, 's4'], [4000, 's5']].forEach(function(st){
          setTimeout(function(){ estage.classList.add(st[1]); }, st[0]);
        });
      }
    }
  });
})();

/* ================= Route thread: the route continues down the page ================= */
(function(){
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'thread');
  svg.setAttribute('viewBox', '0 0 16 1000');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  var D = 'M8,0 C13,180 3,380 8,500 C13,620 3,820 8,1000';
  svg.innerHTML = '<path class="thread-run" d="' + D + '"/>';
  document.body.appendChild(svg);
  var heli = document.createElement('div');
  heli.className = 'thread-heli'; heli.setAttribute('aria-hidden', 'true');
  heli.innerHTML = '<i></i><b></b>';
  document.body.appendChild(heli);
  var run = svg.querySelector('.thread-run');
  var L = run.getTotalLength();
  run.style.strokeDasharray = String(L);
  run.style.strokeDashoffset = String(L);
  /* stations: dots on .ritual items land on the thread, wherever it curves */
  var stations = $$('.ritual li');
  var tSamples = [];
  for (var si = 0; si <= 40; si++){ var sq = run.getPointAtLength(L * si / 40); tSamples.push({y: sq.y, x: sq.x}); }
  function threadX(vpy){
    var vy = vpy / innerHeight * 1000;
    for (var k = 0; k < tSamples.length - 1; k++){
      var a = tSamples[k], b = tSamples[k + 1];
      if (vy <= b.y){ var f = b.y > a.y ? (vy - a.y) / (b.y - a.y) : 0; return a.x + (b.x - a.x) * f; }
    }
    return tSamples[40].x;
  }
  /* rotor spins with scroll speed, spools down to idle when the page is still */
  var rotor = heli.firstChild, rotA = 0, rotV = 0, rotY = scrollY;
  if (!reduce){
    (function rotorLoop(){
      var y = scrollY, dy = Math.abs(y - rotY); rotY = y;
      rotV += Math.min(dy, 60) * .1;
      rotV *= .93;
      if (rotV < .5) rotV = .5;
      rotA = (rotA + rotV) % 360;
      rotor.style.transform = 'rotate(' + rotA.toFixed(1) + 'deg)';
      requestAnimationFrame(rotorLoop);
    })();
  }
  scrollSubs.push(function(){
    var max = document.documentElement.scrollHeight - innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    var r = svg.getBoundingClientRect();
    /* the drawn line trails the helicopter — dashoffset + a hard clip so nothing can render past the tail */
    var tipL = Math.max(0, L * p - 22000 / r.height);
    run.style.strokeDashoffset = String(L - tipL);
    var tipY = run.getPointAtLength(tipL).y;
    run.style.clipPath = 'inset(0 0 ' + Math.max(0, 1000 - tipY - 2) + 'px 0)';
    var pt = run.getPointAtLength(L * p);
    var pa = run.getPointAtLength(Math.max(0, L * p - 3)), pb = run.getPointAtLength(Math.min(L, L * p + 3));
    var ang = Math.atan2((pb.y - pa.y) * r.height / 1000, (pb.x - pa.x) * r.width / 16) * 180 / Math.PI;
    heli.style.transform = 'translate(' + (r.left + pt.x * r.width / 16) + 'px,' + (r.top + pt.y * r.height / 1000) + 'px) rotate(' + ang.toFixed(1) + 'deg)';
    for (var m = 0; m < stations.length; m++){
      var mm = stations[m].getBoundingClientRect();
      if (mm.bottom < 0 || mm.top > innerHeight) continue;
      var x = r.left + threadX(mm.top + 23) * r.width / 16;
      stations[m].style.setProperty('--dx', (x - mm.left - 4.5).toFixed(1) + 'px');
    }
  });
})();

onScroll();
})();
