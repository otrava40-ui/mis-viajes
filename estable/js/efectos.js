// Confeti y sonidos (sin archivos: todo generado en el momento)
(function () {
  let ctxAudio = null;
  const activo = () => { try { return localStorage.getItem('mv-sonido') !== 'no'; } catch (e) { return true; } };

  function tono(frecs, dur, tipo, vol) {
    if (!activo()) return;
    try {
      ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = ctxAudio.currentTime;
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
    exito() { tono([523, 659, 784, 1046], 0.22, 'triangle', 0.1); },
    logro() { tono([784, 988, 1175, 1568], 0.18, 'sine', 0.1); },
    click() { tono([1200], 0.04, 'square', 0.03); },
    rascar() { tono([300 + Math.random() * 200], 0.03, 'sawtooth', 0.015); },

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
