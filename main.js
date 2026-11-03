'use strict';
/* ============================================================
   Inicialização e laço principal
   ============================================================ */
VV.Main = (() => {
  const G = VV.G, UI = VV.UI;
  let last = 0, errors = 0;

  function boot() {
    const canvas = document.getElementById('game');
    VV.Render.init(canvas, G.settings);
    VV.Input.bindCanvas(canvas, VV.Render.toGame);
    UI.init();
    VV.Audio.setVolume && ['music', 'sfx', 'amb'].forEach(k => VV.Audio.vol[k] = G.settings[k]);
    window.addEventListener('beforeunload', () => { if (G.mode === 'play' && G.S && G.slot && !G.sleeping) { try { G.save(true); } catch (e) { } } });
    document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play' && G.S) { try { G.save(true); } catch (e) { } } });
    UI.showTitle();
    last = performance.now();
    requestAnimationFrame(loop);
    document.getElementById('loading') && document.getElementById('loading').remove();
  }

  G.updateFade = function (dt) {
    const f = G.fade;
    if (f.a < f.to) { f.a = Math.min(f.to, f.a + dt * f.speed); if (f.a >= 1 && f.cb) { const cb = f.cb; f.cb = null; cb(); } }
    else if (f.a > f.to) f.a = Math.max(f.to, f.a - dt * f.speed);
  };
  function drawFade() {
    const a = G.fade.a; if (a <= 0.003) return;
    const c = VV.Render.ctx, sz = VV.Render.size(); c.fillStyle = `rgba(8,5,18,${Math.min(1, a)})`; c.fillRect(0, 0, sz.w, sz.h);
  }

  function loop(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
    VV.Input.begin();
    try {
      if (G.mode === 'play' && G.S) {
        G.updateFade(dt);
        G.update(dt);
        VV.Render.frame(G, dt);
        VV.Render.overlay(G);
        drawFade();
      } else UI.titleFrame(dt);
      UI.update(dt);
    } catch (e) {
      errors++; console.error(e);
      if (errors < 4) UI.toast && UI.toast('Erro: ' + e.message, 'bad');
    }
    VV.Input.end();
    requestAnimationFrame(loop);
  }

  function toTitle() {
    if (G.mode === 'play' && G.S && G.slot) { try { G.save(true); } catch (e) { } }
    G.mode = 'title'; G.S = null; UI.closeAll(); UI.showHud(false); VV.Audio.stop && VV.Audio.stop(); VV.Audio.setAmbience({}); UI.showTitle(); VV.Audio.play('title');
  }

  window.addEventListener('DOMContentLoaded', boot);
  return { boot, toTitle };
})();
