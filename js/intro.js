// Animación de entrada: globo girando con un avión dando la vuelta al mundo
(function () {
  const DURACION = 3200;   // ms hasta que empieza a desaparecer

  function avion(ctx, escala) {
    // Avión visto desde arriba, apuntando hacia la derecha (+x)
    ctx.save(); ctx.scale(escala, escala);
    ctx.beginPath();
    ctx.moveTo(14, 0); ctx.quadraticCurveTo(12, -2.2, 6, -2.2);
    ctx.lineTo(1, -2.2); ctx.lineTo(-5, -13); ctx.lineTo(-8.5, -13); ctx.lineTo(-4, -2.2);
    ctx.lineTo(-10, -2.2); ctx.lineTo(-13, -6.5); ctx.lineTo(-15, -6.5); ctx.lineTo(-13, 0);
    ctx.lineTo(-15, 6.5); ctx.lineTo(-13, 6.5); ctx.lineTo(-10, 2.2); ctx.lineTo(-4, 2.2);
    ctx.lineTo(-8.5, 13); ctx.lineTo(-5, 13); ctx.lineTo(1, 2.2); ctx.lineTo(6, 2.2);
    ctx.quadraticCurveTo(12, 2.2, 14, 0); ctx.closePath();
    ctx.fillStyle = '#fffdf8'; ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
    ctx.fill(); ctx.restore();
  }

  window.Intro = {
    mostrar(opciones) {
      opciones = opciones || {};
      return new Promise(resolver => {
        const C = window.CONFIG;
        const capa = document.createElement('div');
        capa.className = 'intro';
        capa.innerHTML = `<canvas></canvas><div class="intro-txt"><h1>${C.APP_NOMBRE}</h1><p>${C.NOMBRE ? 'Los viajes de ' + C.NOMBRE : 'Tus viajes por el mundo'}</p></div><div class="intro-saltar">Toca para entrar</div>`;
        document.body.appendChild(capa);
        const cv = capa.querySelector('canvas'), ctx = cv.getContext('2d');
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        let W, H;
        const medir = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
        medir();
        const proy = d3.geoOrthographic().clipAngle(90).precision(0.6);
        const path = d3.geoPath(proy, ctx);
        const reticula = d3.geoGraticule10();
        const estrellas = Array.from({ length: 70 }, () => [Math.random(), Math.random(), Math.random() * 1.3 + .2]);
        const t0 = performance.now();
        let fin = false, saliendo = 0, rafId;

        const salir = () => {
          if (fin) return; fin = true;
          const ts = performance.now();
          const paso = () => {
            saliendo = Math.min(1, (performance.now() - ts) / 650);
            dibujar(performance.now());
            capa.style.opacity = String(1 - saliendo * saliendo);
            if (saliendo < 1) requestAnimationFrame(paso);
            else { cancelAnimationFrame(rafId); capa.remove(); resolver(); }
          };
          paso();
        };
        capa.addEventListener('click', salir);

        function dibujar(ahora) {
          const t = (ahora - t0) / 1000;
          ctx.clearRect(0, 0, W, H);
          // Cielo con estrellas
          ctx.fillStyle = '#fff';
          estrellas.forEach(([x, y, r]) => { ctx.globalAlpha = .25 + .35 * Math.sin(t * 2 + x * 20) ** 2; ctx.beginPath(); ctx.arc(x * W, y * H, r, 0, 7); ctx.fill(); });
          ctx.globalAlpha = 1;

          const base = Math.min(W, H) * 0.27;
          const R = base * (1 + saliendo * saliendo * 5);
          const cx = W / 2, cy = H * 0.44;
          proy.scale(R).translate([cx, cy]).rotate([t * 38 + 10, -18, 0]);

          // Órbita del avión (elipse inclinada alrededor del globo)
          const a = base * 1.42, b = base * 0.46, incl = -0.32;
          const th = t * 2.1 - 1.2;
          const pos = ang => {
            const x = a * Math.cos(ang), y = b * Math.sin(ang);
            return [cx + x * Math.cos(incl) - y * Math.sin(incl), cy + x * Math.sin(incl) + y * Math.cos(incl)];
          };
          const delante = Math.sin(th) > 0;
          const pintarAvion = () => {
            if (saliendo > 0.4) return;
            // Estela
            ctx.save(); ctx.setLineDash([3, 7]); ctx.lineCap = 'round'; ctx.lineWidth = 2;
            for (let i = 0; i < 18; i++) {
              const a1 = th - i * 0.07, a2 = th - (i + 1) * 0.07;
              const p1 = pos(a1), p2 = pos(a2);
              ctx.strokeStyle = `rgba(255,253,248,${0.55 * (1 - i / 18)})`;
              ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke();
            }
            ctx.restore();
            const [x, y] = pos(th), [x2, y2] = pos(th + 0.01);
            ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(y2 - y, x2 - x));
            avion(ctx, (base / 140) * (0.75 + 0.35 * Math.sin(th)));
            ctx.restore();
          };
          if (!delante) pintarAvion();

          // Globo
          const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.25);
          halo.addColorStop(0, 'rgba(160,200,230,.35)'); halo.addColorStop(1, 'rgba(160,200,230,0)');
          ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, 7); ctx.fill();
          const mar = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .1, cx, cy, R);
          mar.addColorStop(0, '#cfe2ea'); mar.addColorStop(1, '#8fb3c4');
          ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = mar; ctx.fill();
          ctx.beginPath(); path(reticula); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = .6; ctx.stroke();
          const feats = (window.Mapa && window.Mapa.features) || [];
          const estado = (window.Mapa && window.Mapa.estado) || {};
          const col = window.CONFIG.COLORES;
          feats.forEach(f => {
            ctx.beginPath(); path(f);
            const e = estado[f.code];
            ctx.fillStyle = e === 'visitado' ? col.visitado : e === 'casa' ? col.casa : e === 'deseo' ? col.deseo : '#f1ead9';
            ctx.fill();
          });
          if (feats.length) { ctx.beginPath(); feats.forEach(f => path(f)); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = .5; ctx.stroke(); }
          // Sombra del globo para dar volumen
          const luz = ctx.createRadialGradient(cx - R * .4, cy - R * .45, R * .2, cx, cy, R * 1.02);
          luz.addColorStop(0, 'rgba(255,255,255,.18)'); luz.addColorStop(.6, 'rgba(0,0,0,0)'); luz.addColorStop(1, 'rgba(10,20,40,.35)');
          ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = luz; ctx.fill();

          if (delante) pintarAvion();
        }

        const bucle = ahora => {
          if (fin) return;
          dibujar(ahora);
          if (ahora - t0 > DURACION && (!opciones.esperar || opciones.esperar())) { salir(); return; }
          rafId = requestAnimationFrame(bucle);
        };
        rafId = requestAnimationFrame(bucle);
        // Por si tarda mucho en cargar algo, nunca más de 7 s
        setTimeout(salir, 7000);
      });
    }
  };
})();
