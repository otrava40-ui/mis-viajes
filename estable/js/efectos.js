// Confeti y sonidos (sin archivos: todo generado en el momento)
(function () {
  let ctxAudio = null;
  const activo = () => { try { return localStorage.getItem('mv-sonido') !== 'no'; } catch (e) { return true; } };

  // Los móviles bloquean el audio hasta que tocas la pantalla: lo "despertamos" con el primer toque
  function audio() {
    if (!ctxAudio) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctxAudio = new AC(); }
    if (ctxAudio.state === 'suspended' || ctxAudio.state === 'interrupted') ctxAudio.resume().catch(() => { });
    return ctxAudio;
  }
  const despertar = () => {
    const c = audio(); if (!c) return;
    // Un sonido silencioso de 1 ms desbloquea el audio en iPhone
    const b = c.createBuffer(1, 1, 22050), src = c.createBufferSource(); src.buffer = b; src.connect(c.destination); src.start(0);
  };
  ['touchend', 'pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, despertar, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ctxAudio) ctxAudio.resume().catch(() => { }); });
  let ultimoTono = 0;

  function tono(frecs, dur, tipo, vol, fuerza) {
    if (!activo()) return;
    const ahora = performance.now();
    if (!fuerza && ahora - ultimoTono < 35) return;   // evita saturar con muchos sonidos seguidos
    ultimoTono = ahora;
    try {
      const ctx = audio(); if (!ctx || ctx.state !== 'running') return;
      const t0 = ctxAudio.currentTime + 0.01;
      frecs.forEach((f, i) => {
        const o = ctxAudio.createOscillator(), g = ctxAudio.createGain();
        o.type = tipo || 'sine'; o.frequency.value = f;
        const ini = t0 + i * dur * 0.6;
        g.gain.setValueAtTime(0, ini); g.gain.linearRampToValueAtTime(vol || 0.12, ini + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
        o.connect(g); g.connect(ctxAudio.destination); o.start(ini); o.stop(ini + dur + 0.05);
      });
    } catch (e) { }
  }

  const Efectos = {
    get sonidoActivo() { return activo(); },
    set sonidoActivo(v) { try { localStorage.setItem('mv-sonido', v ? 'si' : 'no'); } catch (e) { } },
    exito() { tono([523, 659, 784, 1046], 0.22, 'triangle', 0.1, true); },
    logro() { tono([784, 988, 1175, 1568], 0.18, 'sine', 0.1, true); },
    click() { tono([1200], 0.04, 'square', 0.03); },
    rascar() { tono([300 + Math.random() * 200], 0.04, 'triangle', 0.02); },
    contexto: () => audio(),

    confeti(cantidad) {
      const cv = document.createElement('canvas');
      cv.className = 'confeti';
      document.body.appendChild(cv);
      const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      const colores = ['#e07a5f', '#5b8e7d', '#c9a227', '#23314a', '#f2cc8f', '#81b29a', '#f4a6a6'];
      const piezas = Array.from({ length: cantidad || 140 }, () => ({
        x: W / 2 + (Math.random() - .5) * 80, y: H * .45,
        vx: (Math.random() - .5) * 14, vy: -Math.random() * 16 - 6,
        r: Math.random() * 6 + 4, giro: Math.random() * 6, vg: (Math.random() - .5) * .4,
        c: colores[Math.floor(Math.random() * colores.length)], forma: Math.random() > .5
      }));
      const t0 = performance.now();
      const paso = ahora => {
        const t = ahora - t0;
        ctx.clearRect(0, 0, W, H);
        piezas.forEach(p => {
          p.vy += 0.42; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.giro += p.vg;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.giro); ctx.fillStyle = p.c;
          ctx.globalAlpha = Math.max(0, 1 - t / 2600);
          if (p.forma) ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2.5, 0, 7); ctx.fill(); }
          ctx.restore();
        });
        if (t < 2600) requestAnimationFrame(paso); else cv.remove();
      };
      requestAnimationFrame(paso);
    }
  };
  window.Efectos = Efectos;
})();
