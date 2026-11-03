'use strict';
/* ============================================================
   Ícones 16x16 de itens, gerados por código a partir de `sh` (forma)
   e `c` (cores) definidos em Data.ITEMS.
   ============================================================ */
VV.Art.Icons = (() => {
  const U = VV.U, Px = VV.Px;
  const cache = {}, urlCache = {};
  const S = U.shade;

  const WOOD = '#9a6e40';
  const shapes = {
    tool_hoe(p, c) { p.line(3, 13, 11, 5, WOOD); p.line(4, 13, 12, 5, S(WOOD, -0.2)); p.r(9, 3, 5, 2, c[0]); p.r(12, 3, 2, 5, c[0]); p.r(9, 3, 5, 1, c[1]); },
    tool_can(p, c) { p.r(3, 6, 9, 7, c[0]); p.r(3, 6, 9, 1, c[1]); p.r(3, 12, 9, 1, S(c[0], -0.3)); p.r(12, 7, 3, 1, c[0]); p.r(14, 5, 1, 3, c[0]); p.r(14, 4, 2, 1, c[1]); p.r(5, 3, 5, 1, S(c[0], -0.2)); p.p(4, 4, c[0]); p.p(10, 4, c[0]); p.r(5, 8, 2, 3, S(c[1], 0.2)); },
    tool_axe(p, c) { p.line(3, 14, 11, 4, WOOD); p.line(4, 14, 12, 4, S(WOOD, -0.2)); p.r(8, 2, 6, 5, c[0]); p.r(8, 2, 6, 1, c[1]); p.r(12, 3, 2, 5, S(c[0], -0.1)); p.p(8, 6, S(c[0], -0.3)); p.p(9, 7, c[0]); },
    tool_pick(p, c) { p.line(3, 14, 11, 6, WOOD); p.line(4, 14, 12, 6, S(WOOD, -0.2)); p.line(3, 5, 8, 2, c[0]); p.line(8, 2, 14, 6, c[0]); p.line(3, 6, 8, 3, c[1]); p.line(8, 3, 13, 7, c[1]); p.p(3, 5, c[1]); p.p(14, 7, S(c[0], -0.3)); },
    tool_scythe(p, c) { p.line(4, 14, 10, 4, WOOD); p.line(5, 14, 11, 4, S(WOOD, -0.2)); p.line(10, 3, 14, 5, c[0]); p.line(6, 2, 10, 3, c[1]); p.line(7, 3, 12, 5, c[0]); p.line(14, 5, 13, 8, c[0]); p.p(6, 2, c[1]); },
    tool_rod(p, c) { p.line(2, 14, 12, 2, WOOD); p.line(3, 14, 13, 2, S(WOOD, -0.2)); p.line(13, 2, 14, 10, 'rgba(240,240,255,0.9)'); p.r(13, 10, 2, 2, '#e8453a'); p.r(13, 11, 2, 1, '#fff'); p.r(4, 10, 3, 3, c[0]); p.p(5, 11, c[1]); },
    tool_sword(p, c) { p.line(3, 13, 12, 4, c[0]); p.line(4, 13, 13, 4, c[1]); p.line(3, 12, 11, 4, S(c[0], -0.15)); p.r(2, 11, 5, 2, '#b8803a'); p.line(2, 14, 5, 11, '#8a5a30'); p.p(13, 3, '#fff'); },
    tool_club(p, c) { p.line(3, 14, 10, 7, WOOD); p.line(4, 14, 11, 7, S(WOOD, -0.2)); p.ball(11, 5, 4, 4, c[0], { seed: 2 }); },
    log(p, c) { p.r(2, 5, 12, 7, c[0]); p.r(2, 5, 12, 1, S(c[0], 0.25)); p.r(2, 11, 12, 1, S(c[0], -0.3)); p.ell(3, 8, 2, 3, '#d0a060'); p.p(3, 8, '#9a6e40'); p.p(8, 8, S(c[0], -0.25)); p.p(10, 7, S(c[0], -0.25)); },
    stone(p, c) { p.ball(8, 9, 6, 4, c[0], { seed: 3 }); p.ball(10, 8, 3, 3, S(c[0], 0.1), { seed: 4 }); },
    fiber(p, c) { for (let i = 0; i < 5; i++) { p.line(4 + i * 2, 13, 3 + i * 2 + (i % 2 ? 2 : -1), 3 + (i % 3), c[0]); p.p(3 + i * 2 + (i % 2 ? 2 : -1), 3 + (i % 3), S(c[0], 0.3)); } },
    hay(p, c) { p.r(3, 6, 10, 7, c[0]); p.r(3, 6, 10, 1, S(c[0], 0.25)); for (let x = 4; x < 13; x += 2) p.line(x, 6, x + (x % 4 ? 1 : -1), 3, S(c[0], 0.1)); p.r(3, 9, 10, 1, '#b88049'); },
    coal(p, c) { p.ball(8, 9, 5, 4, c[0], { seed: 5, hi: 0.5 }); p.p(6, 7, '#8a8898'); p.p(10, 9, '#6a6878'); },
    drop(p, c) { p.disc(8, 10, 3, c[0]); p.r(7, 4, 2, 4, c[0]); p.p(7, 9, S(c[0], 0.5)); p.p(8, 6, S(c[0], 0.3)); },
    clay(p, c) { p.ball(8, 9, 6, 4, c[0], { seed: 6, noise: 0.1 }); },
    ore(p, c) { p.ball(8, 9, 6, 5, '#8a8494', { seed: 7 }); for (const [x, y] of [[5, 7], [9, 6], [10, 10], [6, 11], [8, 9]]) { p.p(x, y, c[0]); p.p(x + 1, y, c[0]); p.p(x, y - 1, c[1]); } },
    bar(p, c) { p.r(2, 7, 12, 6, c[0]); p.r(2, 7, 12, 2, c[1]); p.r(3, 5, 10, 2, S(c[1], 0.1)); p.r(2, 12, 12, 1, S(c[0], -0.3)); p.p(5, 8, '#fff'); p.p(6, 8, '#fff'); },
    gem(p, c) { p.line(8, 2, 3, 6, c[0]); p.line(8, 2, 13, 6, c[0]); p.r(3, 6, 11, 2, c[0]); p.line(3, 8, 8, 14, S(c[0], -0.2)); p.line(13, 8, 8, 14, S(c[0], -0.3)); for (let y = 3; y < 8; y++) p.r(8 - (y - 2) * 1.0, y, (y - 2) * 2, 1, c[0]); for (let y = 8; y < 13; y++) p.r(3 + (y - 8), y, 11 - (y - 8) * 2, 1, S(c[0], -0.12)); p.r(5, 4, 3, 2, c[1]); p.p(8, 3, c[1]); p.p(6, 7, c[1]); },
    geode(p, c) { p.ball(8, 9, 6, 5, c[0], { seed: 8 }); p.ell(8, 9, 3, 2, c[1]); p.p(7, 8, '#fff'); },
    leaf(p, c) { p.ell(8, 9, 5, 4, c[0]); p.ell(7, 8, 3, 2, c[1] || S(c[0], 0.2)); p.line(8, 4, 8, 14, S(c[0], -0.3)); p.line(8, 9, 11, 7, S(c[0], -0.3)); p.line(8, 11, 5, 9, S(c[0], -0.3)); },
    flower(p, c) { p.line(8, 9, 8, 15, '#4fa83a'); p.p(6, 12, '#4fa83a'); p.p(10, 11, '#4fa83a'); for (let a = 0; a < 6; a++) p.disc(Math.round(8 + Math.cos(a) * 3), Math.round(6 + Math.sin(a) * 3), 1, c[0]); p.p(8, 6, c[1] || '#ffe14a'); p.p(7, 5, S(c[0], 0.4)); },
    berries(p, c) { p.p(8, 3, '#4fa83a'); p.r(7, 4, 3, 1, '#4fa83a'); for (const [x, y] of [[5, 7], [8, 7], [11, 7], [6, 10], [9, 10], [7, 13], [10, 13]]) { p.disc(x, y, 2, c[0]); p.p(x - 1, y - 1, c[1]); } },
    shell(p, c) { p.ball(8, 9, 6, 5, c[0], { seed: 9 }); for (let i = -4; i <= 4; i += 2) p.line(8, 13, 8 + i, 6, S(c[0], -0.2)); p.p(6, 7, c[1]); },
    coral(p, c) { p.line(8, 14, 8, 8, c[0]); p.line(8, 11, 4, 6, c[0]); p.line(8, 10, 12, 4, c[0]); p.line(8, 9, 8, 3, c[0]); p.line(9, 14, 9, 8, S(c[0], -0.2)); p.p(4, 5, c[1]); p.p(12, 3, c[1]); p.p(8, 2, c[1]); },
    mushroom(p, c) { p.r(6, 9, 4, 5, '#f4eee0'); p.r(6, 9, 1, 5, '#fff'); p.ell(8, 8, 6, 4, c[0]); p.r(2, 8, 12, 1, S(c[0], -0.2)); p.p(5, 6, c[1]); p.p(9, 5, c[1]); p.p(11, 7, c[1]); },
    nut(p, c) { p.ball(8, 9, 5, 5, c[0], { seed: 4 }); p.r(5, 4, 6, 3, '#6a4a2a'); p.p(8, 3, '#6a4a2a'); p.p(6, 8, c[1]); },
    root(p, c) { p.ell(8, 9, 4, 5, c[0]); p.p(7, 7, S(c[0], 0.4)); p.p(8, 14, S(c[0], -0.3)); p.line(8, 4, 5, 1, '#6aa845'); p.line(8, 4, 8, 1, '#6aa845'); p.line(8, 4, 11, 1, '#6aa845'); },
    seed(p, c) { p.r(3, 3, 10, 11, '#e8dcc0'); p.r(3, 3, 10, 1, '#fff8e8'); p.r(3, 13, 10, 1, '#b8a888'); p.r(4, 4, 8, 4, c[1]); p.p(8, 7, c[0]); p.p(7, 6, c[0]); p.p(9, 6, c[0]); p.p(8, 6, c[0]); p.r(5, 9, 6, 1, '#8a7a5a'); p.r(5, 11, 4, 1, '#8a7a5a'); p.p(8, 5, c[0]); },
    round(p, c) { p.ball(8, 9, 5, 5, c[0], { seed: 2 }); p.r(7, 3, 3, 2, '#4fa83a'); p.p(6, 4, '#4fa83a'); p.p(10, 4, '#4fa83a'); },
    ear(p, c) { p.ell(8, 8, 3, 6, c[0]); for (let y = 4; y < 12; y += 2) { p.p(7, y, S(c[0], 0.4)); p.p(9, y + 1, S(c[0], -0.2)); } p.line(8, 14, 3, 6, '#5aa83a'); p.line(8, 14, 13, 5, '#4a9a2a'); p.line(7, 14, 3, 7, '#7ac85a'); },
    gourd(p, c) { p.ball(8, 9, 6, 5, c[0], { seed: 5 }); for (const x of [-3, 0, 3]) p.line(8 + x, 5, 8 + x * 0.8, 13, S(c[0], -0.25)); p.r(7, 3, 2, 2, '#4f7a2e'); },
    fish(p, c) { p.ell(7, 8, 5, 3, c[0]); p.ell(7, 9, 4, 2, c[1]); p.line(11, 8, 14, 5, c[0]); p.line(11, 8, 14, 11, c[0]); p.line(14, 5, 14, 11, c[0]); p.p(4, 7, '#fff'); p.p(4, 7, '#1c1c28'); p.line(6, 5, 8, 4, S(c[0], -0.2)); p.p(7, 8, S(c[0], 0.4)); p.p(8, 7, S(c[0], 0.3)); },
    octo(p, c) { p.ball(8, 6, 4, 4, c[0], { seed: 3 }); for (let i = 0; i < 4; i++) p.line(4 + i * 2.7, 9, 3 + i * 3, 14, c[0]); p.p(6, 6, '#fff'); p.p(10, 6, '#fff'); p.p(6, 6, '#1c1c28'); p.p(10, 6, '#1c1c28'); },
    boot(p, c) { p.r(4, 3, 5, 9, c[0]); p.r(4, 11, 10, 3, c[0]); p.r(4, 13, 10, 1, S(c[0], -0.3)); p.r(4, 3, 5, 1, S(c[0], 0.2)); },
    can(p, c) { p.r(4, 5, 8, 9, c[0]); p.r(4, 5, 8, 1, S(c[0], 0.3)); p.r(4, 7, 8, 1, S(c[0], -0.2)); p.r(4, 11, 8, 1, S(c[0], -0.2)); p.p(6, 8, S(c[0], 0.2)); },
    bait(p, c) { p.line(4, 12, 11, 5, c[0]); p.line(5, 12, 12, 5, S(c[0], -0.2)); p.p(12, 5, '#fff'); p.r(11, 11, 3, 2, '#9aa0ad'); },
    egg(p, c) { p.ell(8, 9, 4, 5, c[0]); p.p(7, 6, '#fff'); p.p(6, 8, S(c[0], 0.3)); p.r(6, 12, 5, 1, c[1]); },
    milk(p, c) { p.r(5, 6, 6, 8, c[0]); p.r(5, 6, 1, 8, '#fff'); p.r(10, 6, 1, 8, c[1]); p.r(6, 3, 4, 3, c[0]); p.r(6, 2, 4, 1, '#c4473a'); p.r(5, 9, 6, 3, '#4a7fc9'); },
    wool(p, c) { p.ball(8, 9, 6, 5, c[0], { seed: 5, noise: 0.35 }); p.ball(6, 7, 3, 3, c[0], { seed: 6, noise: 0.3 }); },
    jar(p, c) { p.r(4, 6, 8, 8, '#cfe8f0'); p.r(4, 6, 1, 8, '#fff'); p.r(5, 8, 6, 5, c[0]); p.r(5, 8, 2, 5, c[1]); p.r(4, 3, 8, 3, '#8a6a4a'); p.r(4, 3, 8, 1, '#b08a6a'); },
    cheese(p, c) { p.line(2, 11, 8, 4, c[0]); p.r(2, 9, 13, 4, c[0]); p.r(2, 9, 13, 1, S(c[0], 0.3)); p.r(2, 12, 13, 1, S(c[0], -0.3)); for (const [x, y] of [[5, 10], [9, 11], [12, 10]]) p.disc(x, y, 1, c[1]); },
    cloth(p, c) { p.r(3, 4, 10, 9, c[0]); for (let y = 4; y < 13; y += 2) p.r(3, y, 10, 1, c[1]); p.r(3, 4, 10, 1, S(c[0], 0.3)); for (let x = 3; x < 13; x += 2) p.p(x, 13, c[1]); },
    bottle(p, c) { p.r(7, 2, 2, 3, '#cfe8f0'); p.r(7, 1, 2, 1, '#8a6a4a'); p.r(5, 5, 6, 9, '#cfe8f0'); p.r(5, 7, 6, 7, c[0]); p.r(5, 7, 1, 7, c[1]); p.r(5, 5, 1, 2, '#fff'); },
    sack(p, c) { p.r(3, 5, 10, 9, c[0]); p.r(3, 5, 10, 1, c[1]); p.r(4, 3, 8, 3, c[0]); p.r(4, 5, 8, 1, '#7a5a38'); p.r(4, 3, 8, 1, c[1]); p.r(6, 8, 4, 3, c[1]); p.r(3, 13, 10, 1, S(c[0], -0.3)); },
    plate(p, c) { p.ell(8, 11, 7, 3, '#f0ece4'); p.ell(8, 10, 6, 2, '#d8d4cc'); p.ball(8, 8, 4, 3, c[0], { seed: 2 }); p.p(7, 7, c[1]); p.p(10, 8, c[1]); },
    bowl(p, c) { p.r(2, 8, 12, 2, '#f0ece4'); p.r(3, 10, 10, 3, '#d8d4cc'); p.r(5, 13, 6, 1, '#b8b4ac'); p.ell(8, 8, 5, 2, c[0]); p.p(6, 7, c[1]); p.p(9, 8, c[1]); p.p(11, 7, c[1]); p.p(8, 5, '#fff'); p.p(10, 4, '#fff'); },
    bread(p, c) { p.ball(8, 9, 6, 4, c[0], { seed: 4 }); for (const x of [5, 8, 11]) p.line(x, 6, x + 1, 9, S(c[0], -0.3)); },
    cake(p, c) { p.r(3, 8, 10, 5, c[0]); p.r(3, 8, 10, 1, S(c[0], 0.3)); p.r(3, 12, 10, 1, S(c[0], -0.3)); p.r(3, 6, 10, 3, c[1]); for (let x = 3; x < 13; x += 2) p.p(x, 9, c[1]); p.r(8, 3, 1, 3, '#ffe66a'); p.p(8, 2, '#ff8a2a'); p.p(5, 5, '#e8302d'); },
    fish_plate(p, c) { p.ell(8, 11, 7, 3, '#f0ece4'); p.ell(7, 9, 5, 2, c[0]); p.line(12, 9, 14, 7, c[0]); p.line(12, 9, 14, 11, c[0]); p.p(4, 8, '#1c1c28'); p.p(6, 7, S(c[0], 0.3)); },
    cookie(p, c) { p.ball(8, 9, 5, 5, c[0], { seed: 7 }); for (const [x, y] of [[6, 7], [10, 8], [8, 11], [6, 10]]) p.p(x, y, '#5a3a22'); },
    cup(p, c) { p.r(4, 6, 7, 7, '#f0ece4'); p.r(4, 6, 1, 7, '#fff'); p.r(5, 7, 5, 2, c[0]); p.r(11, 8, 2, 3, '#f0ece4'); p.r(12, 9, 1, 1, '#d8d4cc'); p.r(3, 13, 9, 1, '#b8b4ac'); p.p(6, 3, '#e8e8f0'); p.p(8, 2, '#e8e8f0'); p.p(7, 4, '#e8e8f0'); },
    bouquet(p, c) { p.line(8, 14, 8, 9, '#4fa83a'); p.line(7, 14, 4, 8, '#4fa83a'); p.line(9, 14, 12, 8, '#4fa83a'); p.r(6, 12, 5, 3, '#c8955a'); for (const [x, y, col] of [[5, 6, c[0]], [8, 5, c[1]], [11, 6, '#ffd23f'], [7, 8, '#c9a0ff'], [10, 8, c[0]]]) { p.disc(x, y, 1, col); p.p(x, y, '#ffe14a'); } },
    pendant(p, c) { p.line(3, 2, 8, 9, '#c8c0d0'); p.line(13, 2, 8, 9, '#c8c0d0'); p.ball(8, 11, 3, 3, c[0], { seed: 2, hi: 0.6 }); p.p(7, 10, '#fff'); p.p(8, 14, '#c08a1a'); },
    ring(p, c) { p.disc(8, 10, 5, '#c8962a'); p.disc(8, 10, 3, 'rgba(0,0,0,0)'); p.x.clearRect(6, 8, 5, 5); p.r(6, 8, 5, 5, 'rgba(0,0,0,0)'); p.x.clearRect(6, 8, 5, 5); p.p(5, 8, '#ffe488'); p.ball(8, 4, 2, 2, c[0], { seed: 2, hi: 0.6 }); p.p(7, 3, '#fff'); },
    boots(p, c) { p.r(4, 3, 5, 8, c[0]); p.r(4, 10, 9, 3, c[0]); p.r(4, 12, 9, 1, S(c[0], -0.35)); p.r(4, 3, 5, 1, S(c[0], 0.3)); p.r(4, 8, 5, 1, '#c8a060'); },
    book(p, c) { p.r(3, 3, 10, 11, c[0]); p.r(3, 3, 2, 11, S(c[0], -0.3)); p.r(5, 3, 8, 1, S(c[0], 0.3)); p.r(6, 5, 5, 4, '#f0e0a8'); p.p(8, 6, c[0]); p.p(9, 7, c[0]); },
    star(p, c) { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5, b = a + Math.PI * 2 / 10 * 2; p.line(8 + Math.cos(a) * 6, 8.5 + Math.sin(a) * 6, 8 + Math.cos(b + Math.PI / 5) * 2, 8.5 + Math.sin(b + Math.PI / 5) * 2, c[0]); } p.disc(8, 8, 3, c[0]); p.p(7, 7, c[1]); },
    key(p, c) { p.disc(5, 6, 3, c[0]); p.p(5, 6, 'rgba(0,0,0,0)'); p.x.clearRect(4, 5, 2, 2); p.r(8, 6, 6, 2, c[0]); p.r(11, 8, 2, 3, c[0]); p.r(13, 8, 1, 2, c[0]); },
    torch(p, c) { p.r(7, 7, 2, 8, '#7a5230'); p.r(6, 5, 4, 3, '#4a4858'); p.ell(8, 3, 3, 3, '#ff8a2a'); p.ell(8, 4, 2, 2, '#ffd23f'); p.p(8, 3, '#fff'); },
    fence(p, c) { p.r(2, 5, 4, 9, c[0]); p.r(10, 5, 4, 9, c[0]); p.r(2, 5, 4, 1, S(c[0], 0.3)); p.r(10, 5, 4, 1, S(c[0], 0.3)); p.r(0, 7, 16, 2, S(c[0], 0.1)); p.r(0, 11, 16, 2, S(c[0], 0.1)); },
    floor(p, c) { p.r(1, 4, 14, 9, c[0]); for (let x = 1; x < 15; x += 4) p.r(x, 4, 1, 9, S(c[0], -0.3)); p.r(1, 8, 14, 1, S(c[0], -0.3)); p.r(1, 4, 14, 1, S(c[0], 0.25)); },
    bomb(p, c) { p.ball(8, 10, 5, 5, '#3a3848', { seed: 4, hi: 0.5 }); p.r(7, 3, 2, 3, '#7a5230'); p.line(9, 3, 12, 1, '#c8a070'); p.p(12, 1, '#ffd23f'); p.p(13, 0, '#ff8a2a'); p.p(6, 8, '#9a98a8'); },
    lamp(p, c) { p.r(7, 6, 2, 9, '#4a4858'); p.r(5, 2, 6, 5, '#ffe9a0'); p.r(6, 3, 4, 3, '#fff7d8'); p.r(4, 1, 8, 1, '#3a3848'); p.r(4, 7, 8, 1, '#3a3848'); },
    pot(p, c) { p.r(4, 9, 8, 5, '#c4573a'); p.r(3, 8, 10, 2, '#d4674a'); p.r(4, 9, 1, 5, '#e07a58'); for (const [x, y, col] of [[5, 5, '#ff7aa6'], [8, 4, '#ffe14a'], [11, 6, '#c9a0ff']]) { p.disc(x, y, 1, col); p.line(x, y + 1, x, 8, '#4fa83a'); } },
  };
  const toolNames = { tool_hoe: 1, tool_can: 1, tool_axe: 1, tool_pick: 1, tool_scythe: 1, tool_rod: 1, tool_sword: 1, tool_club: 1 };

  function build(id, opt) {
    const it = VV.Data.ITEMS[id];
    const p = new Px(16, 16);
    if (!it) { p.r(4, 4, 8, 8, '#f0f'); return p.c; }
    let sh = it.sh, c = it.c;
    if (toolNames[sh]) {
      const t = opt.tier || 0;
      const tc = [['#9a8672', '#c8b8a0'], ['#e0873f', '#ffb06a'], ['#b8bcc8', '#f0f4ff'], ['#e8b830', '#fff08a']][t];
      c = it.fixed ? (it.c && it.c[0] ? [it.c[0], U.shade(it.c[0], 0.4)] : tc) : tc;
      if (id === 'sword') c = [['#8a7a6a', '#b8a890'], ['#e0873f', '#ffb06a'], ['#b8bcc8', '#f0f4ff'], ['#e8b830', '#fff08a']][t];
      if (id === 'can') c = [['#8a98b8', '#c0d0f0'], ['#e0873f', '#ffb06a'], ['#b8bcc8', '#f0f4ff'], ['#e8b830', '#fff08a']][t];
    }
    if (sh && sh.startsWith('m_')) {
      const kind = ({ m_furnace: 'furnace', m_keg: 'keg', m_jar: 'jar', m_loom: 'loom', m_maker: 'maker', m_hive: 'hive' })[sh];
      let spr = null;
      if (kind) spr = VV.Art.Build.machine(kind, false);
      else if (sh === 'm_scare') spr = VV.Art.Build.deco('scarecrow');
      else if (sh === 'm_sprk') spr = VV.Art.Build.deco('sprinkler', id === 'sprinkler2' ? 1 : 0);
      if (spr) { const w = spr.c.width, h = spr.c.height, sc = Math.min(15 / w, 15 / h); const dw = Math.round(w * sc), dh = Math.round(h * sc); p.x.drawImage(spr.c, (16 - dw) >> 1, 15 - dh, dw, dh); return p.c; }
    }
    if (sh === 'chest') { const spr = VV.Art.Build.deco('chest', id === 'chest_big' ? 'big' : ''); p.x.drawImage(spr.c, 0, 0, 22, 22, 0, 0, 16, 16); p.outline(); return p.c; }
    const f = shapes[sh] || shapes.round;
    f(p, c || ['#aaa', '#ddd']);
    p.outline({ strength: 0.85 });
    return p.c;
  }
  function key(id, opt) { return id + (opt && opt.tier ? '#' + opt.tier : ''); }
  function canvas(id, opt = {}) { const k = key(id, opt); return cache[k] || (cache[k] = build(id, opt)); }
  function url(id, opt = {}) { const k = key(id, opt); return urlCache[k] || (urlCache[k] = canvas(id, opt).toDataURL()); }
  // estrela de qualidade
  function quality(q) {
    const k = 'q' + q; if (cache[k]) return cache[k];
    const p = new Px(7, 7), col = ['#fff', '#c8d4e8', '#ffc21a', '#c07aff'][q];
    p.line(3, 0, 3, 6, col); p.line(0, 3, 6, 3, col); p.line(1, 1, 5, 5, col); p.line(5, 1, 1, 5, col); p.disc(3, 3, 1, col);
    p.outline({ color: '#3a2a10' });
    return (cache[k] = p.c);
  }
  return { canvas, url, quality };
})();
