'use strict';
/* ============================================================
   Px — biblioteca mínima de desenho pixel a pixel.
   Toda a arte do jogo é gerada por código com estas primitivas.
   ============================================================ */
VV.Px = class Px {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.c = document.createElement('canvas');
    this.c.width = w; this.c.height = h;
    this.x = this.c.getContext('2d', { willReadFrequently: true });
    this.x.imageSmoothingEnabled = false;
  }
  clear() { this.x.clearRect(0, 0, this.w, this.h); return this; }
  p(x, y, c) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this; this.x.fillStyle = c; this.x.fillRect(x | 0, y | 0, 1, 1); return this; }
  r(x, y, w, h, c) { this.x.fillStyle = c; this.x.fillRect(x | 0, y | 0, w | 0, h | 0); return this; }
  line(x0, y0, x1, y1, c) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (; ;) {
      this.p(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }
  disc(cx, cy, r, c) { // disco preenchido (centro em coordenada de pixel)
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) this.p(cx + x, cy + y, c);
    return this;
  }
  ell(cx, cy, rx, ry, c) {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) this.p(cx + x, cy + y, c);
    }
    return this;
  }
  // esfera sombreada: luz vinda do canto superior esquerdo
  ball(cx, cy, rx, ry, base, o = {}) {
    const U = VV.U, hi = U.shade(base, o.hi ?? 0.38), lt = U.shade(base, 0.16), md = U.shade(base, -0.16), dk = U.shade(base, -0.36);
    const seed = o.seed || 0;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const e = (x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3);
      if (e > 1) continue;
      const nx = x / (rx + 0.5), ny = y / (ry + 0.5);
      let l = -(nx * 0.55 + ny * 0.75) + (U.hash2(cx + x, cy + y, seed) - 0.5) * (o.noise ?? 0.22);
      let col;
      if (l > 0.62) col = hi; else if (l > 0.2) col = lt; else if (l > -0.22) col = base; else if (l > -0.55) col = md; else col = dk;
      this.p(cx + x, cy + y, col);
    }
    return this;
  }
  get(x, y) { return this.x.getImageData(x, y, 1, 1).data; }
  data() { return this.x.getImageData(0, 0, this.w, this.h); }
  put(id) { this.x.putImageData(id, 0, 0); return this; }
  blit(src, x, y) { this.x.drawImage(src.c || src, x | 0, y | 0); return this; }
  // desenha arte ASCII: rows = array de strings, pal = {char: cor}
  art(rows, pal, ox = 0, oy = 0) {
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch !== '.' && ch !== ' ' && pal[ch]) this.p(ox + x, oy + y, pal[ch]); }
    }
    return this;
  }
  // contorno automático de 1px: pinta pixels transparentes adjacentes a opacos
  // com uma versão escurecida (e levemente arroxeada) da cor vizinha — assinatura visual do jogo
  outline(o = {}) {
    const id = this.data(), d = id.data, w = this.w, h = this.h;
    const out = new Uint8ClampedArray(d);
    const strength = o.strength ?? 0.7, tint = o.tint || [34, 20, 54];
    const fixed = o.color ? VV.U.hex2rgb(o.color) : null;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] > 40) continue;
      let best = -1, bl = 999;
      const nb = [[x, y - 1], [x - 1, y], [x + 1, y], [x, y + 1]];
      for (const [nx, ny] of nb) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = (ny * w + nx) * 4;
        if (d[j + 3] > 200) { const l = d[j] + d[j + 1] + d[j + 2]; if (l < bl) { bl = l; best = j; } }
      }
      if (best < 0) continue;
      if (fixed) { out[i] = fixed[0]; out[i + 1] = fixed[1]; out[i + 2] = fixed[2]; }
      else {
        out[i] = d[best] * (1 - strength) + tint[0] * strength;
        out[i + 1] = d[best + 1] * (1 - strength) + tint[1] * strength;
        out[i + 2] = d[best + 2] * (1 - strength) + tint[2] * strength;
      }
      out[i + 3] = 255;
    }
    id.data.set(out);
    this.put(id);
    return this;
  }
  // sombra suave sob o sprite (elipse) — usada em objetos grandes
  shadow(cx, cy, rx, ry, a = 0.28) {
    this.x.fillStyle = `rgba(20,10,40,${a})`;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) this.x.fillRect(cx + x, cy + y, 1, 1);
    return this;
  }
  // espelha horizontalmente, retornando novo Px
  flipX() {
    const n = new VV.Px(this.w, this.h);
    n.x.translate(this.w, 0); n.x.scale(-1, 1); n.x.drawImage(this.c, 0, 0);
    return n;
  }
  tint(col, a) { // sobrepõe cor mantendo alfa
    this.x.globalCompositeOperation = 'source-atop';
    this.x.fillStyle = col; this.x.globalAlpha = a; this.x.fillRect(0, 0, this.w, this.h);
    this.x.globalAlpha = 1; this.x.globalCompositeOperation = 'source-over';
    return this;
  }
  url() { return this.c.toDataURL(); }
};

// ruído periódico (tileável) — usado nas texturas de terreno
VV.pnoise = function (x, y, period, seed) {
  const U = VV.U;
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const m = v => ((v % period) + period) % period;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = U.hash2(m(xi), m(yi), seed), b = U.hash2(m(xi + 1), m(yi), seed);
  const c = U.hash2(m(xi), m(yi + 1), seed), d = U.hash2(m(xi + 1), m(yi + 1), seed);
  return U.lerp(U.lerp(a, b, u), U.lerp(c, d, u), v);
};
