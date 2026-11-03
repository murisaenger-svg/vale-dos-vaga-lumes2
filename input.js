'use strict';
/* ============================================================
   Entrada: teclado, mouse, gamepad e toque
   ============================================================ */
VV.Input = (() => {
  const BIND = {
    up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
    use: ['Space', 'KeyJ'], act: ['KeyE', 'KeyK', 'Enter'], menu: ['Tab', 'KeyI'], back: ['Escape'],
    prev: ['KeyQ'], next: ['KeyR'], sprint: ['ShiftLeft', 'ShiftRight'], map: ['KeyM'], journal: ['KeyL'],
  };
  const HOTKEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'];
  const down = new Set();
  let hit = new Set();
  const m = { x: 0, y: 0, left: false, right: false, leftHit: false, rightHit: false, wheel: 0, active: false, onCanvas: false };
  const pad = { x: 0, y: 0, use: false, act: false, back: false, menu: false, prev: false, next: false, prevB: {} };
  let hotHit = -1;
  const keyToAct = {};
  for (const a in BIND) for (const k of BIND[a]) (keyToAct[k] = keyToAct[k] || []).push(a);
  let textFocus = () => false;
  let touchState = { x: 0, y: 0 };

  function onKey(e, isDown) {
    if (textFocus()) return;
    const acts = keyToAct[e.code];
    const hi = HOTKEYS.indexOf(e.code);
    if (acts || hi >= 0 || e.code === 'F11') {
      if (e.code !== 'F11' && e.code !== 'F5' && !e.ctrlKey && !e.metaKey) e.preventDefault();
    }
    if (isDown) {
      if (!down.has(e.code)) {
        down.add(e.code);
        if (acts) acts.forEach(a => hit.add(a));
        if (hi >= 0) hotHit = hi;
        VV.Audio && VV.Audio.init();
      }
    } else down.delete(e.code);
  }
  window.addEventListener('keydown', e => onKey(e, true));
  window.addEventListener('keyup', e => onKey(e, false));
  window.addEventListener('blur', () => { down.clear(); m.left = m.right = false; });

  function bindCanvas(canvas, toGame) {
    canvas.addEventListener('mousemove', e => { const p = toGame(e); m.x = p.x; m.y = p.y; m.active = true; });
    canvas.addEventListener('mousedown', e => {
      const p = toGame(e); m.x = p.x; m.y = p.y; m.active = true;
      VV.Audio && VV.Audio.init();
      if (e.button === 0) { m.left = true; m.leftHit = true; }
      if (e.button === 2) { m.right = true; m.rightHit = true; }
    });
    window.addEventListener('mouseup', e => { if (e.button === 0) m.left = false; if (e.button === 2) m.right = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => { m.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  }

  function pollPad() {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const g of gps) if (g && g.connected) { gp = g; break; }
    if (!gp) { pad.x = pad.y = 0; return; }
    const dz = 0.25;
    pad.x = Math.abs(gp.axes[0]) > dz ? gp.axes[0] : 0;
    pad.y = Math.abs(gp.axes[1]) > dz ? gp.axes[1] : 0;
    if (gp.buttons[14] && gp.buttons[14].pressed) pad.x = -1;
    if (gp.buttons[15] && gp.buttons[15].pressed) pad.x = 1;
    if (gp.buttons[12] && gp.buttons[12].pressed) pad.y = -1;
    if (gp.buttons[13] && gp.buttons[13].pressed) pad.y = 1;
    const map = { use: 0, back: 1, act: 2, menu: 3, prev: 4, next: 5 };
    for (const k in map) {
      const p = !!(gp.buttons[map[k]] && gp.buttons[map[k]].pressed);
      if (p && !pad.prevB[k]) hit.add(k);
      pad.prevB[k] = p;
      pad[k] = p;
    }
  }

  return {
    BIND,
    bindCanvas,
    setTextFocus(fn) { textFocus = fn; },
    held(a) {
      if (a === 'use' && (m.left && m.active)) return true;
      if (pad[a] === true) return true;
      return BIND[a] ? BIND[a].some(k => down.has(k)) : false;
    },
    pressed(a) { return hit.has(a); },
    hotbar() { return hotHit; },
    axis() {
      let x = 0, y = 0;
      if (this.held('left')) x -= 1; if (this.held('right')) x += 1;
      if (this.held('up')) y -= 1; if (this.held('down')) y += 1;
      if (!x) x = pad.x || touchState.x;
      if (!y) y = pad.y || touchState.y;
      return { x, y };
    },
    touch(x, y) { touchState.x = x; touchState.y = y; },
    fire(a) { hit.add(a); },
    mouse: m,
    begin() { pollPad(); },
    end() { hit = new Set(); hotHit = -1; m.leftHit = m.rightHit = false; m.wheel = 0; },
    clear() { hit = new Set(); down.clear(); m.left = m.right = false; },
  };
})();
