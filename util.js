'use strict';
/* ============================================================
   VALE DOS VAGA-LUMES — núcleo: utilidades
   Namespace global único: window.VV
   ============================================================ */
window.VV = window.VV || {};

VV.U = (() => {
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sign = v => (v > 0) - (v < 0);
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  // PRNG determinístico (mulberry32)
  function rng(seed) {
    let a = seed | 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // hash 2D -> [0,1)
  function hash2(x, y, s = 0) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2147483647);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  // value-noise suave 2D
  function vnoise(x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  const ri = (a, b, r = Math.random) => a + Math.floor(r() * (b - a + 1));
  const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
  function shuffle(arr, r = Math.random) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }
  const fmt = n => Math.floor(n).toLocaleString('pt-BR');
  const ease = {
    out: t => 1 - (1 - t) * (1 - t),
    inOut: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };

  // cores
  function hex2rgb(h) {
    if (h[0] === '#') h = h.slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  function shade(h, f) { // f>0 clareia, f<0 escurece; leve deslocamento de matiz (sombras mais frias / luzes mais quentes)
    const [r, g, b] = hex2rgb(h);
    if (f >= 0) return rgb2hex(r + (255 - r) * f + 6 * f, g + (255 - g) * f + 3 * f, b + (255 - b) * f);
    const k = -f;
    return rgb2hex(r * (1 - k) + 28 * k * 0.4, g * (1 - k) + 18 * k * 0.4, b * (1 - k) + 52 * k * 0.5);
  }
  function mix(a, b, t) {
    const A = hex2rgb(a), B = hex2rgb(b);
    return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
  }

  // DOM helper
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) for (const k in props) {
      const v = props[k];
      if (k === 'class') e.className = v;
      else if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v;
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return e;
  }
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const deep = o => JSON.parse(JSON.stringify(o));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  return { clamp, lerp, sign, dist, rng, hash2, vnoise, ri, pick, shuffle, fmt, ease, hex2rgb, rgb2hex, shade, mix, h, $, $$, deep, cap };
})();
