// Funciones extra: recuerdos, juegos, estadísticas, postales, cápsulas, mensajes, temas…
(function () {
  const A = () => window.APP;
  const hoy = () => A().hoyISO();
  const anioActual = () => +hoy().slice(0, 4);
  const azar = arr => arr[Math.floor(Math.random() * arr.length)];
  const barajar = arr => arr.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const fotosNormales = v => v.fotos.filter(f => !f.billete && !f.audio);
  const ex = o => (o.extra = o.extra || {});

  function capaPantalla(clase, html) {
    const el = document.createElement('div');
    el.className = 'pantalla ' + (clase || '');
    el.innerHTML = `<button class="pantalla-cerrar" aria-label="Cerrar">✕</button>${html}`;
    document.body.appendChild(el);
    el.querySelector('.pantalla-cerrar').onclick = () => el.remove();
    return el;
  }

  function cargarImagen(src) {
    return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }

  async function compartirCanvas(cv, nombre, titulo) {
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
    const file = new File([blob], nombre, { type: 'image/jpeg' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: titulo }); return; }
    } catch (e) { if (e.name === 'AbortError') return; }
    const url = URL.createObjectURL(blob);
    const el = capaPantalla('vista-imagen', `<img src="${url}" alt=""><p>Mantén pulsada la imagen para guardarla o</p><a class="btn" href="${url}" download="${nombre}">⬇️ Descargar</a>`);
    return el;
  }

  // ===================== RANGOS =====================
  const RANGOS = [
    [0, '🧳', 'Turista'], [3, '🎒', 'Mochilera'], [6, '🧭', 'Exploradora'],
    [11, '🗺️', 'Aventurera'], [21, '🌍', 'Trotamundos'], [36, '👑', 'Leyenda viajera']
  ];
  function rango(n) {
    let i = 0; RANGOS.forEach((r, k) => { if (n >= r[0]) i = k; });
    const sig = RANGOS[i + 1];
    return { icono: RANGOS[i][1], nombre: RANGOS[i][2], siguiente: sig ? { nombre: sig[2], faltan: sig[0] - n, desde: RANGOS[i][0], hasta: sig[0] } : null };
  }

  // ===================== ESTADÍSTICAS =====================
  function viajesDelAnio(anio) { return A().viajesHechos().filter(v => v.inicio && +v.inicio.slice(0, 4) === anio); }

  function retos(s) {
    const { P, viajesHechos } = A();
    const a = anioActual(), va = viajesDelAnio(a);
    const antes = new Set(viajesHechos().filter(v => v.inicio && +v.inicio.slice(0, 4) < a).map(v => v.pais));
    const nuevos = new Set(va.map(v => v.pais).filter(c => !antes.has(c)));
    const fueraEU = va.some(v => P.porCodigo[v.pais] && P.porCodigo[v.pais].cont !== 'EU');
    const fotos = va.reduce((n, v) => n + fotosNormales(v).length, 0);
    const conDiario = va.filter(v => (v.diario || '').trim() || (ex(v).dias || []).length).length;
    return [
      ['🆕', `Un país nuevo en ${a}`, Math.min(1, nuevos.size), 1],
      ['✈️', `3 viajes en ${a}`, Math.min(3, va.length), 3],
      ['🌏', `Salir de Europa en ${a}`, fueraEU ? 1 : 0, 1],
      ['📸', `20 fotos de ${a}`, Math.min(20, fotos), 20],
      ['📔', `Diario de todos los viajes de ${a}`, va.length ? conDiario : 0, Math.max(1, va.length)]
    ];
  }

  function records() {
    const { viajesHechos, dias, km, C, pais } = A();
    const vs = viajesHechos();
    if (!vs.length) return [];
    const coord = v => [v.lat ?? pais(v.pais).lat, v.lon ?? pais(v.pais).lon];
    const largo = [...vs].sort((a, b) => dias(b.inicio, b.fin) - dias(a.inicio, a.fin))[0];
    const lejos = [...vs].sort((a, b) => km(C.CASA.lat, C.CASA.lon, ...coord(b)) - km(C.CASA.lat, C.CASA.lon, ...coord(a)))[0];
    const cuenta = {}; vs.forEach(v => cuenta[v.pais] = (cuenta[v.pais] || 0) + 1);
    const masVeces = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0];
    const nom = v => v.ciudad || pais(v.pais).nombre;
    const conCoord = vs.filter(v => v.lat != null);
    const ext = (f) => conCoord.length ? nom([...conCoord].sort(f)[0]) : '—';
    const totalDias = vs.reduce((n, v) => n + (v.inicio ? dias(v.inicio, v.fin) : 0), 0);
    return [
      ['⏳', 'Viaje más largo', `${nom(largo)} · ${dias(largo.inicio, largo.fin)} días`],
      ['📏', 'Destino más lejano', `${nom(lejos)} · ${A().nf.format(Math.round(km(C.CASA.lat, C.CASA.lon, ...coord(lejos))))} km`],
      masVeces[1] > 1 ? ['🔁', 'País al que más vuelves', `${A().P.bandera(masVeces[0])} ${pais(masVeces[0]).nombre} · ${masVeces[1]} veces`] : ['🌍', 'Países distintos', `${Object.keys(cuenta).length} países`],
      ['🗓️', 'Días viajando', `${totalDias} días en total`],
      ['⬆️', 'Más al norte', ext((a, b) => b.lat - a.lat)],
      ['⬇️', 'Más al sur', ext((a, b) => a.lat - b.lat)],
      ['➡️', 'Más al este', ext((a, b) => b.lon - a.lon)],
      ['⬅️', 'Más al oeste', ext((a, b) => a.lon - b.lon)]
    ];
  }

  function continentes(s) {
    const { P } = A();
    const tot = {}, vis = {};
    P.lista.filter(p => !p.territorio && p.cont !== 'AN').forEach(p => tot[p.cont] = (tot[p.cont] || 0) + 1);
    [...s.visitados].forEach(c => { const p = P.porCodigo[c]; if (p && !p.territorio) vis[p.cont] = (vis[p.cont] || 0) + 1; });
    return ['EU', 'AS', 'AF', 'NA', 'SA', 'OC'].map(k => ({ nombre: P.CONTINENTES[k], v: vis[k] || 0, t: tot[k] }));
  }

  function diasDeViaje(anio) {
    const set = new Set();
    A().viajesHechos().forEach(v => {
      if (!v.inicio) return;
      const d = new Date(v.inicio + 'T12:00:00'), f = new Date((v.fin || v.inicio) + 'T12:00:00');
      for (let x = new Date(d); x <= f; x.setDate(x.getDate() + 1)) if (x.getFullYear() === anio) set.add(x.toISOString().slice(0, 10));
    });
    return set;
  }

  function htmlCalendario(anio) {
    const set = diasDeViaje(anio);
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    let filas = '';
    meses.forEach((m, mi) => {
      const n = new Date(anio, mi + 1, 0).getDate();
      let celdas = '';
      for (let d = 1; d <= 31; d++) {
        const iso = `${anio}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        celdas += d > n ? '<i class="hueco"></i>' : `<i class="${set.has(iso) ? 'on' : ''}"></i>`;
      }
      filas += `<div class="cal-fila"><span class="cal-mes">${m}</span><div class="cal-dias">${celdas}</div></div>`;
    });
    return `<div class="cal-cab"><button class="btn-icono" data-anio="${anio - 1}">‹</button><b>${anio}</b><button class="btn-icono" data-anio="${anio + 1}" ${anio >= anioActual() ? 'disabled' : ''}>›</button><span>${set.size} ${set.size === 1 ? 'día' : 'días'} fuera de casa</span></div>
      <div class="calendario2">${filas}</div>`;
  }

  function monedas(s) {
    const vistos = {};
    [...s.visitados].forEach(c => { const f = window.DATOS.ficha(c); if (f && !vistos[f.monedaCod]) vistos[f.monedaCod] = Object.assign({ pais: c }, f); });
    return Object.values(vistos);
  }

  function htmlPasaporteExtra(s) {
    const { P, nf } = A();
    const r = rango(s.paises);
    const rh = `<div class="rango"><span class="rango-ico">${r.icono}</span><div><small>Rango</small><b>${r.nombre}</b>${r.siguiente ? `<div class="logro-barra"><i style="width:${(s.paises - r.siguiente.desde) / (r.siguiente.hasta - r.siguiente.desde) * 100}%"></i></div><span>${r.siguiente.faltan} ${r.siguiente.faltan === 1 ? 'país' : 'países'} para ${r.siguiente.nombre}</span>` : '<span>¡Rango máximo!</span>'}</div></div>`;
    const juegos = `<div class="juegos"><button class="juego" data-juego="wrapped"><span>🎬</span><b>Mi año viajero</b><small>Resumen de ${anioActual()}</small></button><button class="juego" data-juego="quiz"><span>🧠</span><b>Quiz</b><small>¿Te acuerdas de tus viajes?</small></button></div>`;
    const rt = retos(s).map(([i, t, a, b]) => `<div class="reto${a >= b ? ' hecho' : ''}"><span>${a >= b ? '✅' : i}</span><div><b>${t}</b><div class="logro-barra"><i style="width:${a / b * 100}%"></i></div></div><small>${a}/${b}</small></div>`).join('');
    const rc = records().map(([i, t, v]) => `<div class="record"><span>${i}</span><small>${t}</small><b>${v}</b></div>`).join('');
    const ct = continentes(s).map(c => `<div class="cont"><span>${c.nombre}</span><div class="cont-barra"><i style="width:${c.v / c.t * 100}%"></i></div><b>${c.v}<small>/${c.t}</small></b></div>`).join('');
    const mn = monedas(s).map(m => `<div class="moneda" title="${m.moneda}"><div class="moneda-disco"><span>${m.simbolo}</span></div><small>${m.moneda}</small></div>`).join('');
    return `${rh}${juegos}
      <h2 class="vista-tit">🎯 Retos de ${anioActual()}</h2><div class="tarjeta">${rt}</div>
      <h2 class="vista-tit">🏆 Récords</h2><div class="records">${rc || '<p class="vacio">Añade viajes para ver tus récords.</p>'}</div>
      <h2 class="vista-tit">🌐 Por continentes</h2><div class="tarjeta">${ct}</div>
      <h2 class="vista-tit">📅 Días de viaje</h2><div class="tarjeta" id="calendario-viajes">${htmlCalendario(anioActual())}</div>
      <h2 class="vista-tit">🪙 Monedas del mundo <small>${monedas(s).length}</small></h2><div class="monedas">${mn || '<p class="vacio">Cada país nuevo suma su moneda a la colección.</p>'}</div>`;
  }

  function enlazarPasaporte(el) {
    el.querySelectorAll('[data-juego]').forEach(b => b.onclick = () => b.dataset.juego === 'quiz' ? quiz() : wrapped());
    const cal = el.querySelector('#calendario-viajes');
    const enlazarCal = () => cal.querySelectorAll('[data-anio]').forEach(b => b.onclick = () => { cal.innerHTML = htmlCalendario(+b.dataset.anio); enlazarCal(); });
    if (cal) enlazarCal();
  }

  // ===================== LOGROS NUEVOS =====================
  function revisarLogros(s) {
    const { LOGROS, toast, SOLO_LECTURA } = A();
    if (SOLO_LECTURA) return;
    const ahora = LOGROS.filter(l => l.ok(s)).map(l => l.id);
    let antes; try { antes = JSON.parse(localStorage.getItem('mv-logros')); } catch (e) { antes = null; }
    localStorage.setItem('mv-logros', JSON.stringify(ahora));
    if (!antes) return;
    const nuevos = LOGROS.filter(l => ahora.includes(l.id) && !antes.includes(l.id));
    if (nuevos.length) setTimeout(() => {
      nuevos.forEach((l, i) => setTimeout(() => toast(`🏅 ¡Logro desbloqueado! ${l.icono} ${l.titulo}`), i * 1800));
      Efectos.logro(); Efectos.confeti(90);
    }, 1200);
  }

  // ===================== QUIZ =====================
  function quiz() {
    const { viajesHechos, pais, P, dias, rangoFechas } = A();
    const vs = viajesHechos().filter(v => v.inicio);
    if (vs.length < 2) { A().toast('Necesitas al menos 2 viajes con fecha para el quiz'); return; }
    const nom = v => v.ciudad || pais(v.pais).nombre;
    const preguntas = [];
    barajar(vs).slice(0, 3).forEach(v => {
      const a = +v.inicio.slice(0, 4);
      preguntas.push({ p: `¿En qué año fuiste a ${nom(v)}?`, ok: String(a), malas: barajar([a - 1, a + 1, a - 2, a + 2]).slice(0, 3).map(String) });
    });
    const v2 = azar(vs);
    const otrosPaises = barajar(P.lista.filter(p => p.code !== v2.pais && !p.territorio)).slice(0, 3).map(p => `${P.bandera(p.code)} ${p.nombre}`);
    preguntas.push({ p: `¿Qué país visitaste en ${rangoFechas(v2.inicio, v2.fin)}?`, ok: `${P.bandera(v2.pais)} ${pais(v2.pais).nombre}`, malas: otrosPaises });
    const v3 = azar(vs.filter(v => v.fin)) ; if (v3) { const d = dias(v3.inicio, v3.fin); preguntas.push({ p: `¿Cuántos días duró tu viaje a ${nom(v3)}?`, ok: String(d), malas: barajar([d + 1, d + 2, d - 1, d + 3].filter(x => x > 0 && x !== d)).slice(0, 3).map(String) }); }
    const con = vs.filter(v => (ex(v).con || []).length);
    if (con.length) { const v4 = azar(con); const todos = [...new Set(vs.flatMap(v => ex(v).con || []))]; const ok = ex(v4).con.join(', '); const malas = barajar(todos.filter(n => !ex(v4).con.includes(n))).slice(0, 2).concat(['Sola']).filter(x => x !== ok).slice(0, 3); if (malas.length >= 2) preguntas.push({ p: `¿Con quién fuiste a ${nom(v4)}?`, ok, malas }); }
    const n = A().calcular().paises;
    preguntas.push({ p: '¿Cuántos países has visitado ya?', ok: String(n), malas: barajar([n + 1, n + 2, n - 1, n + 3].filter(x => x > 0)).slice(0, 3).map(String) });

    let i = 0, puntos = 0;
    const el = capaPantalla('quiz', '<div class="quiz-caja"></div>');
    const caja = el.querySelector('.quiz-caja');
    const pintar = () => {
      if (i >= preguntas.length) {
        const pct = puntos / preguntas.length;
        caja.innerHTML = `<div class="quiz-fin"><span>${pct === 1 ? '🏆' : pct >= .6 ? '🎉' : '🤔'}</span><h2>${puntos} de ${preguntas.length}</h2><p>${pct === 1 ? '¡Memoria de elefante viajero!' : pct >= .6 ? '¡Muy bien! Te acuerdas de casi todo.' : 'Habrá que mirar más el diario 😄'}</p><button class="btn ancho" data-otra>Jugar otra vez</button></div>`;
        if (pct >= .6) { Efectos.exito(); Efectos.confeti(); }
        caja.querySelector('[data-otra]').onclick = () => { el.remove(); quiz(); };
        return;
      }
      const q = preguntas[i];
      const ops = barajar([q.ok, ...q.malas]);
      caja.innerHTML = `<div class="quiz-prog">Pregunta ${i + 1} de ${preguntas.length}</div><h2>${A().esc(q.p)}</h2><div class="quiz-ops">${ops.map(o => `<button data-o="${A().esc(o)}">${A().esc(o)}</button>`).join('')}</div>`;
      caja.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
        const bien = b.dataset.o === q.ok;
        if (bien) { puntos++; Efectos.exito(); } else Efectos.click();
        caja.querySelectorAll('[data-o]').forEach(x => { x.disabled = true; if (x.dataset.o === q.ok) x.classList.add('bien'); });
        if (!bien) b.classList.add('mal');
        setTimeout(() => { i++; pintar(); }, 1100);
      });
    };
    pintar();
  }

  // ===================== MI AÑO VIAJERO (tipo Wrapped) =====================
  function wrapped() {
    const { viajesHechos, pais, P, dias, km, C, nf, esc, rangoFechas } = A();
    let anio = anioActual();
    if (!viajesDelAnio(anio).length) { const años = viajesHechos().filter(v => v.inicio).map(v => +v.inicio.slice(0, 4)); if (años.length) anio = Math.max(...años); }
    const vs = viajesDelAnio(anio);
    if (!vs.length) { A().toast('Aún no hay viajes con fecha para hacer el resumen'); return; }
    const nom = v => v.ciudad || pais(v.pais).nombre;
    const antes = new Set(viajesHechos().filter(v => v.inicio && +v.inicio.slice(0, 4) < anio).map(v => v.pais));
    const paisesA = [...new Set(vs.map(v => v.pais))];
    const nuevos = paisesA.filter(c => !antes.has(c));
    const kms = Math.round(vs.reduce((n, v) => n + 2 * km(C.CASA.lat, C.CASA.lon, v.lat ?? pais(v.pais).lat, v.lon ?? pais(v.pais).lon), 0));
    const totalDias = vs.reduce((n, v) => n + dias(v.inicio, v.fin), 0);
    const largo = [...vs].sort((a, b) => dias(b.inicio, b.fin) - dias(a.inicio, a.fin))[0];
    const fotos = vs.flatMap(v => fotosNormales(v).map(f => ({ v, f })));
    const foto = fotos.length ? azar(fotos) : null;
    const comp = {}; vs.forEach(v => (ex(v).con || []).forEach(n => comp[n] = (comp[n] || 0) + 1));
    const top = Object.entries(comp).sort((a, b) => b[1] - a[1])[0];
    const sueno = A().S.datos.deseos[0];
    const vueltas = (kms / 40075);
    const diapos = [
      `<span class="w-emoji">✈️</span><h1>Tu ${anio}<br>viajero</h1><p>Toca para empezar</p>`,
      `<p>Este año hiciste</p><h1 class="w-num">${vs.length}</h1><h2>${vs.length === 1 ? 'viaje' : 'viajes'}</h2><p>y pasaste <b>${totalDias} días</b> fuera de casa</p>`,
      `<p>Pisaste</p><h1 class="w-num">${paisesA.length}</h1><h2>${paisesA.length === 1 ? 'país' : 'países'}</h2><div class="w-flags">${paisesA.map(c => `<span class="${nuevos.includes(c) ? 'nuevo' : ''}">${P.bandera(c)}</span>`).join('')}</div>${nuevos.length ? `<p><b>${nuevos.length}</b> ${nuevos.length === 1 ? 'era nuevo' : 'eran nuevos'} para tu pasaporte ✨</p>` : ''}`,
      `<p>Recorriste</p><h1 class="w-num">${nf.format(kms)}</h1><h2>kilómetros</h2><p>${vueltas >= 1 ? `¡Eso es dar <b>${vueltas.toFixed(1).replace('.', ',')} vueltas</b> al mundo! 🌍` : `Eso es el <b>${Math.round(vueltas * 100)}%</b> de una vuelta al mundo 🌍`}</p>`,
      `<p>Tu viaje más largo</p><span class="w-emoji">${P.bandera(largo.pais)}</span><h1>${esc(nom(largo))}</h1><p>${rangoFechas(largo.inicio, largo.fin)} · <b>${dias(largo.inicio, largo.fin)} días</b></p>`,
      foto ? `<p>Un momento de tu año</p><img class="w-foto" src="${esc(foto.f.url || foto.f.thumbUrl)}" alt=""><p>${P.bandera(foto.v.pais)} ${esc(nom(foto.v))}</p>` : null,
      top ? `<p>Tu compañero de aventuras</p><span class="w-emoji">🤝</span><h1>${esc(top[0])}</h1><p>${top[1]} ${top[1] === 1 ? 'viaje' : 'viajes'} juntos</p>` : null,
      `<span class="w-emoji">🗺️</span><h1>¿A dónde en ${anio + 1}?</h1>${sueno ? `<p>Tu lista de sueños dice… <b>${P.bandera(sueno.pais)} ${esc(sueno.ciudad || pais(sueno.pais).nombre)}</b></p>` : '<p>¡El mundo te espera!</p>'}<button class="btn" data-cerrar>Cerrar</button>`
    ].filter(Boolean);
    let i = 0, tempo;
    const el = capaPantalla('wrapped', `<div class="w-barras">${diapos.map(() => '<i><b></b></i>').join('')}</div><div class="w-diapo"></div>`);
    const caja = el.querySelector('.w-diapo');
    const pintar = () => {
      clearTimeout(tempo);
      el.querySelectorAll('.w-barras i').forEach((b, k) => { b.className = k < i ? 'lleno' : k === i ? 'activo' : ''; });
      caja.className = 'w-diapo f' + (i % 4);
      caja.innerHTML = diapos[i];
      caja.firstElementChild && caja.querySelectorAll('*').forEach((n, k) => n.style.animationDelay = (k * 0.08) + 's');
      const c = caja.querySelector('[data-cerrar]'); if (c) c.onclick = e => { e.stopPropagation(); el.remove(); };
      if (i === 2 && nuevos.length) Efectos.confeti(80);
      if (i < diapos.length - 1) tempo = setTimeout(() => { i++; pintar(); }, 5000);
    };
    caja.onclick = e => { if (e.clientX < innerWidth * 0.3 && i > 0) i--; else if (i < diapos.length - 1) i++; pintar(); };
    el.querySelector('.pantalla-cerrar').onclick = () => { clearTimeout(tempo); el.remove(); };
    pintar();
  }

  // ===================== RULETA =====================
  function ruleta() {
    const { S, P, pais, esc } = A();
    let opciones = S.datos.deseos.map(d => ({ pais: d.pais, txt: d.ciudad || pais(d.pais).nombre, deseo: d }));
    if (opciones.length < 3) {
      const vistos = A().calcular().visitados;
      const extra = barajar(window.DATOS.ciudades.filter(c => !vistos.has(c.pais) && c.pais !== 'ES')).slice(0, 8 - opciones.length).map(c => ({ pais: c.pais, txt: c.nombre, ciudad: c }));
      opciones = opciones.concat(extra);
    }
    opciones = opciones.slice(0, 12);
    const el = capaPantalla('ruleta', `<h2>¿A dónde voy ahora?</h2><div class="ruleta-zona"><canvas width="640" height="640"></canvas><div class="ruleta-flecha">▼</div></div><button class="btn ancho" data-girar>🎲 Girar</button><div class="ruleta-res"></div>`);
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), n = opciones.length;
    const cols = ['#e07a5f', '#5b8e7d', '#c9a227', '#23314a', '#81b29a', '#f2a65a', '#7b68b5', '#3d7ea6'];
    let ang = 0;
    const dibujar = () => {
      ctx.clearRect(0, 0, 640, 640);
      ctx.save(); ctx.translate(320, 320); ctx.rotate(ang);
      for (let k = 0; k < n; k++) {
        const a0 = k * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 300, a0, a1); ctx.closePath();
        ctx.fillStyle = cols[k % cols.length]; ctx.fill(); ctx.strokeStyle = '#fffdf8'; ctx.lineWidth = 4; ctx.stroke();
        ctx.save(); ctx.rotate((a0 + a1) / 2); ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
        ctx.font = '600 26px system-ui'; ctx.fillText(opciones[k].txt.slice(0, 14), 270, 9);
        ctx.font = '34px system-ui'; ctx.fillText(P.bandera(opciones[k].pais), 100, 12);
        ctx.restore();
      }
      ctx.restore();
      ctx.beginPath(); ctx.arc(320, 320, 40, 0, 7); ctx.fillStyle = '#fffdf8'; ctx.fill();
      ctx.font = '40px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🌍', 320, 334);
    };
    dibujar();
    el.querySelector('[data-girar]').onclick = function () {
      this.disabled = true;
      const giro = Math.PI * 2 * (5 + Math.random() * 3), ini = ang, t0 = performance.now(), dur = 4200;
      let ultimoSector = -1;
      const paso = ahora => {
        const t = Math.min(1, (ahora - t0) / dur), e = 1 - Math.pow(1 - t, 4);
        ang = ini + giro * e; dibujar();
        const sector = Math.floor(((-Math.PI / 2 - ang) % (2 * Math.PI) + 4 * Math.PI) % (2 * Math.PI) / (2 * Math.PI / n));
        if (sector !== ultimoSector) { ultimoSector = sector; Efectos.click(); }
        if (t < 1) requestAnimationFrame(paso);
        else {
          const o = opciones[sector];
          Efectos.exito(); Efectos.confeti(100);
          el.querySelector('.ruleta-res').innerHTML = `<div class="ruleta-ganador"><span>${P.bandera(o.pais)}</span><h2>${esc(o.txt)}</h2>${o.txt !== pais(o.pais).nombre ? `<p>${esc(pais(o.pais).nombre)}</p>` : '<p></p>'}${o.deseo ? '<button class="btn" data-planear>📅 Ponerle fecha</button>' : '<button class="btn" data-anadir>✨ Añadir a mis sueños</button>'}</div>`;
          const pl = el.querySelector('[data-planear]'); if (pl) pl.onclick = () => { el.remove(); A().formDeseo(o.deseo); };
          const an = el.querySelector('[data-anadir]'); if (an) an.onclick = async () => { await S.guardarDeseo({ pais: o.pais, ciudad: o.txt, lat: o.ciudad.lat, lon: o.ciudad.lon, nota: '¡Me lo dijo la ruleta! 🎲', fecha: '' }); A().toast('Añadido a tus sueños ✨'); el.remove(); A().render(); };
          this.disabled = false; this.textContent = '🎲 Girar otra vez';
        }
      };
      requestAnimationFrame(paso);
    };
  }

  // ===================== FICHA DEL PAÍS Y FRASES =====================
  function fichaPaisHTML(code, abierta) {
    const f = window.DATOS.ficha(code);
    if (!f) return '';
    const frases = (() => {
      const idioma = f.idiomaCods.find(i => window.DATOS.FRASES[i] && i !== 'es');
      if (!idioma) return '';
      const fr = window.DATOS.FRASES[idioma];
      return `<div class="frases"><b>🗣️ Frases útiles en ${A().esc(f.idiomas[f.idiomaCods.indexOf(idioma)])}</b>${window.DATOS.ETIQUETAS_FRASES.map((e, i) => `<div class="frase"><small>${e}</small><span>${A().esc(fr[i])}</span></div>`).join('')}</div>`;
    })();
    return `<details class="ficha"${abierta ? ' open' : ''}><summary>ℹ️ Datos prácticos</summary>
      <div class="ficha-grid">
        <div><span>💶</span><small>Moneda</small><b>${A().esc(f.moneda)} (${A().esc(f.simbolo)})</b></div>
        <div><span>💬</span><small>Idioma</small><b>${A().esc(f.idiomas.join(', '))}</b></div>
        <div><span>🔌</span><small>Enchufe</small><b>Tipo ${f.enchufes.join(', ')}${f.mismoEnchufe ? ' · ✅ el de España vale' : ' · ⚠️ lleva adaptador'}</b></div>
        <div><span>📞</span><small>Prefijo</small><b>${f.prefijo}</b></div>
      </div>${frases}</details>`;
  }

  // ===================== EL TIEMPO (Open-Meteo, gratis) =====================
  const ICONO_TIEMPO = c => c === 0 ? '☀️' : c <= 2 ? '🌤️' : c === 3 ? '☁️' : c <= 48 ? '🌫️' : c <= 57 ? '🌦️' : c <= 67 ? '🌧️' : c <= 77 ? '🌨️' : c <= 82 ? '🌧️' : c <= 86 ? '🌨️' : '⛈️';
  async function tiempoHTML(lat, lon, fecha) {
    if (lat == null) return '';
    try {
      const q = new URLSearchParams({ latitude: lat, longitude: lon, current: 'temperature_2m,weather_code', daily: 'weather_code,temperature_2m_max,temperature_2m_min', timezone: 'auto', forecast_days: '16' });
      const r = await fetch('https://api.open-meteo.com/v1/forecast?' + q);
      const j = await r.json();
      const i = fecha ? j.daily.time.indexOf(fecha) : -1;
      if (i >= 0) return `<div class="tiempo"><span>${ICONO_TIEMPO(j.daily.weather_code[i])}</span><div><small>Previsión para tu llegada</small><b>${Math.round(j.daily.temperature_2m_min[i])}° / ${Math.round(j.daily.temperature_2m_max[i])}°</b></div></div>`;
      return `<div class="tiempo"><span>${ICONO_TIEMPO(j.current.weather_code)}</span><div><small>Ahora mismo allí</small><b>${Math.round(j.current.temperature_2m)}°</b><small>${fecha ? 'La previsión de tu llegada sale 16 días antes' : ''}</small></div></div>`;
    } catch (e) { return ''; }
  }

  // ===================== PRÓXIMO VIAJE =====================
  const CHECKLIST = ['Hacer el check-in online', 'Seguro de viaje', 'Revisar DNI / pasaporte', 'Tarjeta sin comisiones o avisar al banco', 'Descargar mapas sin conexión', 'Cambiar algo de dinero', 'Preparar la maleta 🎒', 'Cargar móvil y batería externa'];
  async function abrirProximo(prox) {
    const { S, P, pais, esc, fecha, abrirHoja } = A();
    const obj = S.datos.viajes.find(v => v.inicio === prox.fecha && v.pais === prox.pais && A().esFuturo(v)) || S.datos.deseos.find(d => d.fecha === prox.fecha && d.pais === prox.pais);
    const esViaje = obj && S.datos.viajes.includes(obj);
    const c = pais(prox.pais);
    const lat = obj && obj.lat != null ? obj.lat : c.lat, lon = obj && obj.lon != null ? obj.lon : c.lon;
    const diasF = Math.ceil((new Date(prox.fecha + 'T00:00:00') - new Date(hoy() + 'T00:00:00')) / 864e5);
    const h = abrirHoja(`<div class="pais-cab"><span class="pais-bandera">${P.bandera(prox.pais)}</span><div><h2>${esc(prox.ciudad || c.nombre)}</h2><div class="sub">${fecha(prox.fecha)} · faltan ${diasF} días</div></div></div>
      <div data-tiempo><div class="cargando">Mirando el tiempo…</div></div>
      <h3 class="sec-tit">✅ Antes de salir</h3><div class="tarjeta checklist"></div>
      ${fichaPaisHTML(prox.pais, true)}
      <button class="btn sec ancho" data-pais>Ver ${esc(c.nombre)} en el mapa</button>`, { completa: true });
    tiempoHTML(lat, lon, prox.fecha).then(t => { const el = h.querySelector('[data-tiempo]'); if (el) el.innerHTML = t; });
    const lista = h.querySelector('.checklist');
    const pintar = () => {
      const marcas = obj ? (ex(obj).checklist || {}) : {};
      lista.innerHTML = CHECKLIST.map((t, i) => `<label class="maleta-item${marcas[i] ? ' ok' : ''}"><input type="checkbox" data-i="${i}" ${marcas[i] ? 'checked' : ''}><span class="caja"></span><span class="txt">${t}</span></label>`).join('');
      lista.querySelectorAll('[data-i]').forEach(cb => cb.onchange = async () => {
        if (!obj) return;
        ex(obj).checklist = Object.assign({}, ex(obj).checklist, { [cb.dataset.i]: cb.checked });
        pintar();
        try { esViaje ? await S.guardarViaje(obj) : await S.guardarDeseo(obj); } catch (e) { }
      });
    };
    pintar();
    h.querySelector('[data-pais]').onclick = () => { h.cerrar(); A().abrirPais(prox.pais); };
  }

  // ===================== TARJETAS DEL INICIO =====================
  function tarjetasInicio() {
    const { S, P, pais, esc, dias } = A();
    const cont = document.getElementById('recuerdo');
    if (!cont || A().SOLO_LECTURA) return;
    const h = hoy(), md = h.slice(5);
    // 1) Estoy de viaje
    const enViaje = S.datos.viajes.find(v => v.inicio && v.inicio <= h && (v.fin || v.inicio) >= h);
    if (enViaje) {
      const dia = dias(enViaje.inicio, h), total = dias(enViaje.inicio, enViaje.fin);
      cont.innerHTML = `<div class="recuerdo en-viaje"><span class="rec-ico">📍</span><div><small>¡Estás de viaje!</small><b>${esc(enViaje.ciudad || pais(enViaje.pais).nombre)} · día ${dia} de ${total}</b></div><button class="btn mini" data-hoy>✍️ Hoy</button></div>`;
      cont.querySelector('[data-hoy]').onclick = () => diaDiario(enViaje, h);
      cont.querySelector('.recuerdo').onclick = e => { if (!e.target.closest('button')) A().abrirViaje(enViaje.id); };
      cont.hidden = false; return;
    }
    let cerrado; try { cerrado = sessionStorage.getItem('mv-recuerdo'); } catch (e) { }
    if (cerrado === h) { cont.hidden = true; return; }
    // 2) Un día como hoy
    const aniv = A().viajesHechos().filter(v => v.inicio && v.inicio.slice(0, 4) < h.slice(0, 4) && v.inicio.slice(5) <= md && (v.fin || v.inicio).slice(5) >= md && v.inicio.slice(0, 4) === (v.fin || v.inicio).slice(0, 4));
    let v, titulo;
    if (aniv.length) { v = azar(aniv); const n = +h.slice(0, 4) - +v.inicio.slice(0, 4); titulo = `Un día como hoy, hace ${n} ${n === 1 ? 'año' : 'años'}…`; }
    else {
      const conFoto = S.datos.viajes.filter(x => fotosNormales(x).length);
      if (!conFoto.length) { cont.hidden = true; return; }
      v = azar(conFoto); titulo = 'Un recuerdo de tus viajes';
    }
    const f = fotosNormales(v).length ? azar(fotosNormales(v)) : null;
    cont.innerHTML = `<div class="recuerdo">${f ? `<img src="${esc(f.thumbUrl)}" alt="">` : `<span class="rec-ico">${P.bandera(v.pais)}</span>`}<div><small>${titulo}</small><b>${P.bandera(v.pais)} ${esc(v.ciudad || pais(v.pais).nombre)} · ${v.inicio ? v.inicio.slice(0, 4) : ''}</b></div><button class="btn-icono" data-x aria-label="Cerrar">✕</button></div>`;
    cont.querySelector('[data-x]').onclick = e => { e.stopPropagation(); try { sessionStorage.setItem('mv-recuerdo', h); } catch (er) { } cont.hidden = true; };
    cont.querySelector('.recuerdo').onclick = () => A().abrirViaje(v.id);
    cont.hidden = false;
  }

  // ===================== DIARIO POR DÍAS =====================
  const EMOJIS = ['🤩', '😍', '😊', '😌', '😐', '😴', '🥵', '🌧️', '😫', '🥳'];
  function diaDiario(v, iso, alGuardar) {
    const { abrirHoja, esc, fecha, S, toast } = A();
    const lista = ex(v).dias = ex(v).dias || [];
    const actual = lista.find(d => d.fecha === iso) || { fecha: iso, emoji: '', texto: '' };
    const h = abrirHoja(`<h2>${fecha(iso)}</h2><div class="emojis">${EMOJIS.map(e => `<button data-e="${e}" class="${actual.emoji === e ? 'on' : ''}">${e}</button>`).join('')}</div>
      <textarea class="campo" rows="6" placeholder="¿Qué hiciste hoy? ¿Qué comiste? ¿Qué te sorprendió?">${esc(actual.texto)}</textarea><button class="btn ancho" data-ok>Guardar día</button>`, { completa: true });
    let emoji = actual.emoji;
    h.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { emoji = b.dataset.e; h.querySelectorAll('[data-e]').forEach(x => x.classList.toggle('on', x === b)); });
    h.querySelector('[data-ok]').onclick = async () => {
      const texto = h.querySelector('textarea').value.trim();
      const i = lista.findIndex(d => d.fecha === iso);
      const nuevo = { fecha: iso, emoji, texto };
      if (i >= 0) lista[i] = nuevo; else lista.push(nuevo);
      lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
      try { await S.guardarViaje(v); toast('Día guardado 📔'); } catch (e) { toast('No se pudo guardar'); }
      h.cerrar(); if (alGuardar) alGuardar();
    };
  }

  // ===================== DETALLE DE VIAJE: SECCIONES EXTRA =====================
  const TIPOS_SITIO = { '🍽️': 'Comida', '☕': 'Café', '🌅': 'Mirador', '🏛️': 'Visita', '🛍️': 'Compras', '🏨': 'Alojamiento', '🍸': 'Noche', '⭐': 'Otro' };

  function htmlViajeExtra(v) {
    const { esc, dias, rangoFechas, SOLO_LECTURA, nf } = A();
    const e = ex(v);
    let html = '';
    const val = e.valoracion || 0;
    html += `<div class="valoracion" data-valorar>${[1, 2, 3, 4, 5].map(i => `<button data-v="${i}" class="${i <= val ? 'on' : ''}" ${SOLO_LECTURA ? 'disabled' : ''}>${i <= val ? '❤️' : '🤍'}</button>`).join('')}</div>`;
    const chips = [];
    if (v.sola) chips.push('🎒 Viajé sola');
    (e.con || []).forEach(n => chips.push('🤝 ' + esc(n)));
    if (chips.length) html += `<div class="chips-viaje">${chips.map(c => `<span class="chip">${c}</span>`).join('')}</div>`;
    if (e.cancion) {
      const url = /^https?:\/\//.test(e.cancion) ? e.cancion : 'https://open.spotify.com/search/' + encodeURIComponent(e.cancion);
      html += `<a class="cancion" href="${esc(url)}" target="_blank" rel="noopener"><span class="disco">🎵</span><div><small>La canción del viaje</small><b>${esc(/^https?:/.test(e.cancion) ? 'Escuchar en Spotify' : e.cancion)}</b></div><span>▶</span></a>`;
    }
    const mejor = [['🍽️', 'Comida favorita', e.comida], ['📍', 'Sitio favorito', e.sitio], ['😂', 'Anécdota', e.anecdota]].filter(x => x[2]);
    if (mejor.length) html += `<div class="lo-mejor">${mejor.map(([i, t, x]) => `<div><span>${i}</span><small>${t}</small><p>${esc(x)}</p></div>`).join('')}</div>`;

    // Diario por días
    if (v.inicio) {
      const n = Math.min(60, dias(v.inicio, v.fin));
      const lista = e.dias || [];
      let dd = '';
      for (let k = 0; k < n; k++) {
        const d = new Date(v.inicio + 'T12:00:00'); d.setDate(d.getDate() + k);
        const iso = d.toISOString().slice(0, 10), en = lista.find(x => x.fecha === iso);
        if (SOLO_LECTURA && !en) continue;
        dd += `<button class="dia${en ? ' lleno' : ''}" data-dia="${iso}"><span class="dia-n">Día ${k + 1}</span><span class="dia-e">${en && en.emoji ? en.emoji : en ? '📝' : '＋'}</span>${en && en.texto ? `<span class="dia-t">${esc(en.texto.slice(0, 60))}</span>` : ''}</button>`;
      }
      if (dd) html += `<h3 class="sec-tit">📔 Diario día a día</h3><div class="dias">${dd}</div>`;
    }

    // Sitios favoritos
    const sitios = e.sitios || [];
    html += `<h3 class="sec-tit">⭐ Sitios favoritos</h3><div class="sitios-lista">${sitios.map((st, i) => `<div class="sitio"><span>${st.icono || '⭐'}</span><div><b>${esc(st.nombre)}</b>${st.nota ? `<small>${esc(st.nota)}</small>` : ''}</div>${SOLO_LECTURA ? '' : `<button class="btn-icono" data-borrar-sitio="${i}">✕</button>`}</div>`).join('') || '<p class="nota">Restaurantes, miradores, rincones… se verán en el mapa al hacer zoom.</p>'}</div>
      ${SOLO_LECTURA ? '' : '<button class="btn sec mini" data-nuevo-sitio>＋ Añadir sitio</button>'}`;

    // Gastos
    const g = e.gastos || { items: [] };
    const total = g.items.reduce((s, x) => s + (+x.i || 0), 0);
    if (!SOLO_LECTURA) html += `<h3 class="sec-tit">💸 Gastos</h3><div class="tarjeta gastos">
      ${g.items.map((x, i) => `<div class="gasto"><span>${esc(x.c)}</span><b>${nf.format(+x.i || 0)} €</b><button class="btn-icono" data-borrar-gasto="${i}">✕</button></div>`).join('')}
      <form class="fila-buscar" data-gasto><input class="campo" name="c" placeholder="Concepto (vuelos, hotel…)"><input class="campo importe" name="i" type="number" inputmode="decimal" step="0.01" placeholder="€"><button class="btn mini">＋</button></form>
      ${total ? `<div class="gasto-total"><span>Total</span><b>${nf.format(Math.round(total * 100) / 100)} €</b>${v.inicio && dias(v.inicio, v.fin) > 1 ? `<small>${nf.format(Math.round(total / dias(v.inicio, v.fin)))} € / día</small>` : ''}</div>` : ''}</div>`;

    // Billetes y entradas
    const billetes = v.fotos.map((f, i) => ({ f, i })).filter(x => x.f.billete);
    html += `<h3 class="sec-tit">🎟️ Billetes y entradas</h3><div class="billetes">${billetes.map(x => `<button class="billete" data-billete="${x.i}"><img src="${esc(x.f.thumbUrl)}" alt=""></button>`).join('')}
      ${SOLO_LECTURA ? '' : '<label class="billete nuevo">＋<small>Foto de un billete o entrada</small><input type="file" accept="image/*" multiple hidden data-subir-billete></label>'}</div>`;

    // Notas de voz
    const audios = v.fotos.filter(f => f.audio);
    html += `<h3 class="sec-tit">🎙️ Notas de voz</h3><div class="audios">${audios.map(a => `<div class="audio"><audio controls preload="none" src="${esc(a.url)}"></audio>${SOLO_LECTURA ? '' : `<button class="btn-icono" data-borrar-audio="${a.id}">✕</button>`}</div>`).join('')}
      ${SOLO_LECTURA ? '' : '<button class="btn sec mini" data-grabar>🎙️ Grabar nota de voz</button>'}</div>`;

    html += `<div class="fila-botones"><button class="btn sec" data-postal>🖼️ Crear postal</button><button class="btn sec" data-recomendar>💌 Recomendar</button></div>`;
    return html;
  }

  function enlazarViajeExtra(v, h, refrescar) {
    const { S, toast, verFoto, abrirHoja, esc, P } = A();
    const e = ex(v);
    const guardar = async () => { try { await S.guardarViaje(v); } catch (er) { toast('No se pudo guardar'); } };
    h.querySelectorAll('[data-valorar] [data-v]').forEach(b => b.onclick = async () => { e.valoracion = +b.dataset.v === e.valoracion ? 0 : +b.dataset.v; Efectos.click(); await guardar(); refrescar(); });
    h.querySelectorAll('[data-dia]').forEach(b => b.onclick = () => diaDiario(v, b.dataset.dia, refrescar));
    h.querySelectorAll('[data-borrar-sitio]').forEach(b => b.onclick = async () => { e.sitios.splice(+b.dataset.borrarSitio, 1); await guardar(); refrescar(); A().render(); });
    const ns = h.querySelector('[data-nuevo-sitio]'); if (ns) ns.onclick = () => {
      const sitio = { nombre: '', lat: null, lon: null, icono: '🍽️', nota: '' };
      const hh = abrirHoja(`<h2>Nuevo sitio favorito</h2><div class="emojis">${Object.entries(TIPOS_SITIO).map(([i, t]) => `<button data-i="${i}" class="${i === '🍽️' ? 'on' : ''}" title="${t}">${i}</button>`).join('')}</div>
        <div data-buscar></div><textarea class="campo" rows="2" placeholder="Nota (qué pedir, cuándo ir…)"></textarea><button class="btn ancho" data-ok>Guardar</button>`, { completa: true });
      hh.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { sitio.icono = b.dataset.i; hh.querySelectorAll('[data-i]').forEach(x => x.classList.toggle('on', x === b)); });
      A().selectorLugar(hh.querySelector('[data-buscar]'), new Proxy(sitio, { set(t, k, val) { t[k === 'ciudad' ? 'nombre' : k] = val; return true; }, get(t, k) { return t[k === 'ciudad' ? 'nombre' : k]; } }), () => v.pais, { soloLugares: false, placeholder: 'Nombre del sitio (restaurante, mirador…)' });
      hh.querySelector('[data-ok]').onclick = async () => {
        sitio.nota = hh.querySelector('textarea').value.trim();
        if (!sitio.nombre) { toast('Escribe el nombre del sitio'); return; }
        e.sitios = (e.sitios || []).concat([sitio]); await guardar(); hh.cerrar(); refrescar(); A().render();
      };
    };
    const fg = h.querySelector('[data-gasto]'); if (fg) fg.onsubmit = async ev => {
      ev.preventDefault();
      const c = fg.c.value.trim(), i = parseFloat(fg.i.value.replace(',', '.'));
      if (!c || isNaN(i)) { toast('Pon concepto e importe'); return; }
      e.gastos = e.gastos || { items: [] }; e.gastos.items.push({ c, i }); await guardar(); refrescar();
    };
    h.querySelectorAll('[data-borrar-gasto]').forEach(b => b.onclick = async () => { e.gastos.items.splice(+b.dataset.borrarGasto, 1); await guardar(); refrescar(); });
    const billetes = v.fotos.filter(f => f.billete).map(f => ({ v, f }));
    h.querySelectorAll('[data-billete]').forEach(b => b.onclick = () => verFoto(billetes, billetes.findIndex(x => x.f === v.fotos[+b.dataset.billete]), refrescar));
    const sb = h.querySelector('[data-subir-billete]'); if (sb) sb.onchange = async ev => {
      const files = [...ev.target.files]; if (!files.length) return;
      for (const f of files) { try { await S.subirFoto(v, f, false, true); } catch (er) { toast('No se pudo subir'); } }
      refrescar();
    };
    h.querySelectorAll('[data-borrar-audio]').forEach(b => b.onclick = async () => { if (await A().confirmar('¿Borrar esta nota de voz?')) { await S.borrarFoto(v, b.dataset.borrarAudio); refrescar(); } });
    const gb = h.querySelector('[data-grabar]'); if (gb) gb.onclick = () => grabarVoz(v, refrescar);
    h.querySelector('[data-postal]').onclick = () => postal(v);
    h.querySelector('[data-recomendar]').onclick = () => recomendar(v);
  }

  // ===================== NOTAS DE VOZ =====================
  async function grabarVoz(v, alTerminar) {
    const { toast, S } = A();
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Este navegador no permite grabar audio'); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { toast('Hace falta permiso para el micrófono'); return; }
    const tipo = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
    const trozos = []; rec.ondataavailable = e => e.data.size && trozos.push(e.data);
    const el = capaPantalla('grabando', `<div class="grab-caja"><div class="grab-punto"></div><h2 data-t>0:00</h2><p>Grabando… cuenta lo que estás viviendo</p><button class="btn ancho" data-parar>⏹ Parar y guardar</button></div>`);
    const t0 = Date.now(); const reloj = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); el.querySelector('[data-t]').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (s >= 180) parar(); }, 250);
    let parado = false;
    const parar = () => { if (parado) return; parado = true; clearInterval(reloj); rec.stop(); };
    rec.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(trozos, { type: rec.mimeType || tipo || 'audio/webm' });
      el.querySelector('.grab-caja').innerHTML = '<h2>Guardando…</h2>';
      try { await S.subirAudio(v, blob, Math.round((Date.now() - t0) / 1000)); toast('Nota de voz guardada 🎙️'); } catch (e) { toast('No se pudo guardar el audio'); }
      el.remove(); alTerminar();
    };
    el.querySelector('[data-parar]').onclick = parar;
    el.querySelector('.pantalla-cerrar').onclick = () => { parado = true; clearInterval(reloj); rec.onstop = () => stream.getTracks().forEach(t => t.stop()); rec.stop(); el.remove(); };
    rec.start();
  }

  // ===================== POSTAL =====================
  async function postal(v) {
    const { P, pais, rangoFechas, C, toast } = A();
    toast('Creando postal…');
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const fs = fotosNormales(v);
    ctx.fillStyle = '#23314a'; ctx.fillRect(0, 0, W, H);
    if (fs.length) {
      try {
        const img = await cargarImagen(fs[0].url || fs[0].thumbUrl);
        const k = Math.max(W / img.width, H / img.height);
        ctx.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
      } catch (e) { }
    }
    const g = ctx.createLinearGradient(0, H * .35, 0, H); g.addColorStop(0, 'rgba(20,28,42,0)'); g.addColorStop(1, 'rgba(20,28,42,.92)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // marco
    ctx.strokeStyle = 'rgba(255,253,248,.9)'; ctx.lineWidth = 14; ctx.strokeRect(36, 36, W - 72, H - 72);
    // sello
    ctx.save(); ctx.translate(W - 190, 200); ctx.rotate(-0.15);
    ctx.strokeStyle = '#fffdf8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 110, 0, 7); ctx.stroke(); ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.arc(0, 0, 94, 0, 7); ctx.stroke();
    ctx.font = '84px system-ui'; ctx.textAlign = 'center'; ctx.fillText(P.bandera(v.pais), 0, 20);
    ctx.fillStyle = '#fffdf8'; ctx.font = '700 22px system-ui'; ctx.fillText((pais(v.pais).nombre || '').toUpperCase().slice(0, 14), 0, 66); ctx.fillText(v.inicio ? v.inicio.slice(0, 4) : '', 0, -56);
    ctx.restore();
    ctx.fillStyle = '#fffdf8'; ctx.textAlign = 'left';
    ctx.font = 'italic 44px Georgia, serif'; ctx.fillText('Saludos desde', 90, H - 330);
    ctx.font = '700 120px Georgia, serif';
    let titulo = v.ciudad || pais(v.pais).nombre; while (ctx.measureText(titulo).width > W - 180 && titulo.length > 4) titulo = titulo.slice(0, -1);
    ctx.fillText(titulo, 90, H - 200);
    ctx.font = '38px system-ui'; ctx.fillStyle = 'rgba(255,253,248,.85)';
    ctx.fillText(`${P.bandera(v.pais)}  ${pais(v.pais).nombre} · ${rangoFechas(v.inicio, v.fin)}`, 90, H - 135);
    ctx.font = '600 28px system-ui'; ctx.fillStyle = 'rgba(255,253,248,.6)'; ctx.fillText(C.APP_NOMBRE + (C.NOMBRE ? ' · ' + C.NOMBRE : ''), 90, H - 80);
    try { await compartirCanvas(cv, `postal-${(v.ciudad || v.pais).toLowerCase().replace(/\s+/g, '-')}.jpg`, 'Mi postal'); } catch (e) { toast('No se pudo crear la postal'); }
  }

  // ===================== PÓSTER DEL MAPA =====================
  async function poster() {
    const { M, C, P, calcular, nf, toast } = A();
    if (!M.features.length) { toast('El mapa aún no ha cargado'); return; }
    toast('Creando póster…');
    const s = calcular();
    const W = 3000, H = 2121, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#f6f1e7'; ctx.fillRect(0, 0, W, H);
    const svg = M.svgPoster(2700, 1400);
    const img = await cargarImagen('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    ctx.drawImage(img, 150, 300);
    ctx.fillStyle = '#23314a'; ctx.textAlign = 'center';
    ctx.font = '700 130px Georgia, serif'; ctx.fillText(C.NOMBRE ? `Los viajes de ${C.NOMBRE}` : C.APP_NOMBRE, W / 2, 200);
    ctx.font = '600 64px system-ui';
    const datos = [[s.paises, 'países'], [s.continentes, 'continentes'], [nf.format(s.km), 'km'], [s.viajes, 'viajes']];
    datos.forEach(([v, t], i) => { const x = W / 2 + (i - 1.5) * 560; ctx.fillStyle = '#e07a5f'; ctx.font = '700 110px Georgia, serif'; ctx.fillText(String(v), x, 1880); ctx.fillStyle = '#5d6576'; ctx.font = '600 44px system-ui'; ctx.fillText(t.toUpperCase(), x, 1950); });
    ctx.font = '44px system-ui'; ctx.fillStyle = '#5d6576';
    ctx.fillText([...s.visitados].map(c => P.bandera(c)).join(' '), W / 2, 2060);
    try { await compartirCanvas(cv, 'poster-mis-viajes.jpg', 'Mi mapa de viajes'); } catch (e) { toast('No se pudo crear el póster'); }
  }

  // ===================== RECOMENDAR =====================
  async function recomendar(v) {
    const { P, pais, toast } = A();
    const e = ex(v), nom = v.ciudad || pais(v.pais).nombre;
    let t = `${P.bandera(v.pais)} Mis consejos para ${nom}\n\n`;
    if (e.comida) t += `🍽️ Tienes que probar: ${e.comida}\n`;
    if (e.sitio) t += `📍 No te pierdas: ${e.sitio}\n`;
    (e.sitios || []).forEach(st => t += `${st.icono || '⭐'} ${st.nombre}${st.nota ? ' — ' + st.nota : ''}\n`);
    if (e.anecdota) t += `\n😂 ${e.anecdota}\n`;
    if (e.valoracion) t += `\nMi nota: ${'❤️'.repeat(e.valoracion)}\n`;
    const f = window.DATOS.ficha(v.pais); if (f) t += `\n💶 ${f.moneda} · 🔌 ${f.mismoEnchufe ? 'El enchufe de España vale' : 'Lleva adaptador'}\n`;
    try { if (navigator.share) { await navigator.share({ text: t }); return; } } catch (er) { if (er.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(t); toast('Consejos copiados: pégalos en WhatsApp'); } catch (er) { capaPantalla('vista-texto', `<pre>${A().esc(t)}</pre>`); }
  }

  // ===================== MENSAJES DE LA FAMILIA =====================
  function mensajes() { return (A().C.MENSAJES_FAMILIA || []).filter(m => m.pais && m.texto); }
  function carta(m, titulo) {
    const { esc, P, pais } = A();
    const el = capaPantalla('carta-capa', `<div class="sobre"><div class="carta"><p class="para">${titulo || `${P.bandera(m.pais)} Un mensaje escondido en ${esc(pais(m.pais).nombre)}`}</p><h2>${esc(m.titulo || 'Para ti')}</h2><p>${esc(m.texto).replace(/\n/g, '<br>')}</p>${m.de ? `<p class="firma">— ${esc(m.de)}</p>` : ''}<button class="btn ancho" data-ok>💛 Guardar en el corazón</button></div></div>`);
    el.querySelector('[data-ok]').onclick = () => el.remove();
    Efectos.exito();
  }
  function mensajeTrasRascar(code) {
    const m = mensajes().find(x => x.pais === code);
    if (m) setTimeout(() => carta(m), 400);
  }

  // ===================== CÁPSULAS DEL TIEMPO =====================
  function capsulaAbierta(c, s) { return c.abrir === 'pais' ? s.visitados.has(c.pais) : c.fecha && c.fecha <= hoy(); }

  function htmlMasExtra(s) {
    const { S, P, pais, esc, fecha, C } = A();
    const aj = S.datos.ajustes, e = aj.extra = aj.extra || {};
    const caps = e.capsulas || [];
    const msgs = mensajes();
    const desbloq = msgs.filter(m => s.visitados.has(m.pais)), bloq = msgs.filter(m => !s.visitados.has(m.pais));
    const docs = S.docs.lista();
    const tema = e.tema || 'clasico';
    return `
      ${msgs.length ? `<h2 class="vista-tit">💌 Mensajes escondidos <small>${desbloq.length}/${msgs.length}</small></h2><div class="tarjeta">
        ${desbloq.map((m, i) => `<button class="fila-opcion" data-msg="${msgs.indexOf(m)}">${P.bandera(m.pais)} Mensaje de ${esc(m.de || 'alguien')} en ${esc(pais(m.pais).nombre)}</button>`).join('')}
        ${bloq.map(m => `<div class="fila-opcion bloqueado">🔒 ${esc(m.de || 'Alguien')} te ha dejado un mensaje en algún país de ${esc(P.CONTINENTES[pais(m.pais).cont] || 'el mundo')}</div>`).join('')}
        <p class="nota">Se desbloquean al visitar el país 🌍</p></div>` : ''}

      <h2 class="vista-tit">⏳ Cápsulas del tiempo</h2><div class="tarjeta">
        ${caps.map(c => { const ok = capsulaAbierta(c, s); return `<button class="fila-opcion${ok ? '' : ' bloqueado'}" data-capsula="${c.id}">${ok ? '📬' : '🔒'} ${esc(c.titulo || 'Carta a mi yo futuro')} <small>${ok ? '¡Ya puedes abrirla!' : c.abrir === 'pais' ? `Se abre cuando vayas a ${P.bandera(c.pais)} ${esc(pais(c.pais).nombre)}` : `Se abre el ${fecha(c.fecha)}`}</small></button>`; }).join('') || '<p class="nota">Escribe una carta a tu "yo" del futuro. Solo podrás leerla en una fecha o al llegar a un país.</p>'}
        <button class="btn sec ancho" data-nueva-capsula>✍️ Escribir una cápsula</button></div>

      <h2 class="vista-tit">🛂 Documentos de viaje</h2><div class="tarjeta">
        <p class="nota">Pasaporte, seguro, reservas… Se guardan <b>solo en este móvil</b> y se ven sin internet.</p>
        ${docs.map(d => `<div class="doc"><button class="fila-opcion" data-doc="${d.id}">📄 ${esc(d.nombre)} <small>${fecha(d.fecha)}</small></button><button class="btn-icono" data-borrar-doc="${d.id}">✕</button></div>`).join('')}
        <label class="btn sec ancho">📷 Añadir documento<input type="file" accept="image/*" hidden data-nuevo-doc></label></div>

      <h2 class="vista-tit">🎨 Apariencia</h2><div class="tarjeta">
        <div class="temas">${Object.entries(TEMAS).map(([k, t]) => `<button class="tema${k === tema ? ' on' : ''}" data-tema="${k}"><span style="background:linear-gradient(135deg,${t.visitado} 50%,${t.deseo} 50%)"></span>${t.nombre}</button>`).join('')}</div>
        <label class="interruptor"><input type="checkbox" data-sonido ${Efectos.sonidoActivo ? 'checked' : ''}><span></span> Sonidos y efectos</label></div>

      <h2 class="vista-tit">🎁 Extras</h2><div class="tarjeta">
        <button class="fila-opcion" data-poster>🖼️ Crear póster de mi mapa para imprimir</button>
        <button class="fila-opcion" data-wrapped>🎬 Ver mi año viajero</button>
        <button class="fila-opcion" data-quiz>🧠 Jugar al quiz de mis viajes</button>
        <button class="fila-opcion" data-ruleta>🎲 Ruleta: ¿a dónde voy ahora?</button>
        <button class="fila-opcion" data-comparar>🤝 Comparar mi mapa con otra persona ${e.comparar ? `<small>Ahora: ${esc(e.comparar.nombre)}</small>` : ''}</button>
      </div>`;
  }

  function enlazarMasExtra(el) {
    const { S, toast, abrirHoja, esc, P, render, confirmar } = A();
    const aj = S.datos.ajustes, e = aj.extra = aj.extra || {};
    const guardaAj = () => S.guardarAjustes({ extra: e }).catch(() => toast('Sin conexión: guardado en este móvil'));
    const s = A().calcular();
    el.querySelectorAll('[data-msg]').forEach(b => b.onclick = () => carta(mensajes()[+b.dataset.msg]));
    el.querySelectorAll('[data-capsula]').forEach(b => b.onclick = () => {
      const c = (e.capsulas || []).find(x => x.id === b.dataset.capsula);
      if (!capsulaAbierta(c, s)) { toast('🔒 Todavía no se puede abrir… ¡paciencia!'); return; }
      carta({ pais: c.pais || 'ES', titulo: c.titulo, texto: c.texto, de: `Tú, el ${A().fecha(c.creada)}` }, '⏳ Cápsula del tiempo');
      Efectos.confeti(60);
    });
    el.querySelector('[data-nueva-capsula]').onclick = () => {
      const h = abrirHoja(`<h2>Nueva cápsula del tiempo</h2><form class="form">
        <label>Título</label><input class="campo" name="t" placeholder="Para mí, cuando vuelva a viajar sola" required>
        <label>Carta</label><textarea class="campo" name="x" rows="7" placeholder="Querida yo del futuro…" required></textarea>
        <label>¿Cuándo se abre?</label><div class="chips"><button type="button" class="chip-btn on" data-modo="fecha">📅 En una fecha</button><button type="button" class="chip-btn" data-modo="pais">🌍 Al visitar un país</button></div>
        <div data-cuando><input class="campo" type="date" name="f"></div>
        <button class="btn ancho">🔒 Cerrar cápsula</button></form>`, { completa: true });
      let modo = 'fecha', codigo = '';
      const cuando = h.querySelector('[data-cuando]');
      h.querySelectorAll('[data-modo]').forEach(b => b.onclick = () => {
        modo = b.dataset.modo; h.querySelectorAll('[data-modo]').forEach(x => x.classList.toggle('on', x === b));
        if (modo === 'fecha') cuando.innerHTML = '<input class="campo" type="date" name="f">';
        else A().selectorPais(cuando, '', c => codigo = c);
      });
      h.querySelector('form').onsubmit = async ev => {
        ev.preventDefault();
        const f = ev.target;
        const c = { id: 'c' + Date.now(), titulo: f.t.value.trim(), texto: f.x.value.trim(), abrir: modo, creada: A().hoyISO() };
        if (modo === 'fecha') { c.fecha = f.f && f.f.value; if (!c.fecha || c.fecha <= A().hoyISO()) { toast('Elige una fecha futura'); return; } }
        else { c.pais = codigo; if (!codigo) { toast('Elige un país'); return; } if (s.visitados.has(codigo)) { toast('Ese país ya lo has visitado: elige uno nuevo'); return; } }
        e.capsulas = (e.capsulas || []).concat([c]); await guardaAj(); h.cerrar(); render(); toast('⏳ Cápsula guardada'); Efectos.exito();
      };
    };
    el.querySelectorAll('[data-doc]').forEach(b => b.onclick = async () => { const url = await S.docs.ver(b.dataset.doc); if (url) capaPantalla('vista-imagen doc-vista', `<img src="${url}" alt="">`); });
    el.querySelectorAll('[data-borrar-doc]').forEach(b => b.onclick = async () => { if (await confirmar('¿Borrar este documento del móvil?')) { await S.docs.borrar(b.dataset.borrarDoc); render(); } });
    const nd = el.querySelector('[data-nuevo-doc]'); if (nd) nd.onchange = async ev => {
      const f = ev.target.files[0]; if (!f) return;
      const h = abrirHoja(`<h2>Nombre del documento</h2><form class="form"><input class="campo" name="n" placeholder="Pasaporte, seguro de viaje…" required><button class="btn ancho">Guardar</button></form>`);
      h.querySelector('form').onsubmit = async e2 => { e2.preventDefault(); await S.docs.anadir(f, e2.target.n.value.trim()); h.cerrar(); render(); toast('Documento guardado en este móvil 🔐'); };
    };
    el.querySelectorAll('[data-tema]').forEach(b => b.onclick = async () => { e.tema = b.dataset.tema; aplicarTema(); await guardaAj(); render(); });
    el.querySelector('[data-sonido]').onchange = ev => { Efectos.sonidoActivo = ev.target.checked; if (ev.target.checked) Efectos.exito(); };
    el.querySelector('[data-poster]').onclick = poster;
    el.querySelector('[data-wrapped]').onclick = wrapped;
    el.querySelector('[data-quiz]').onclick = quiz;
    el.querySelector('[data-ruleta]').onclick = ruleta;
    el.querySelector('[data-comparar]').onclick = comparar;
  }

  // ===================== TEMAS =====================
  const TEMAS = {
    clasico: { nombre: 'Clásico', visitado: '#e07a5f', deseo: '#5b8e7d', casa: '#c9a227' },
    atardecer: { nombre: 'Atardecer', visitado: '#f2734f', deseo: '#9b6bb5', casa: '#f2b134' },
    oceano: { nombre: 'Océano', visitado: '#2a7fb8', deseo: '#3fb4a6', casa: '#f0a43a' },
    bosque: { nombre: 'Bosque', visitado: '#4f8a4b', deseo: '#c7883a', casa: '#8b5a3c' },
    rosa: { nombre: 'Rosa', visitado: '#e0608a', deseo: '#7c86d6', casa: '#e8a33d' },
    vintage: { nombre: 'Vintage', visitado: '#b5533c', deseo: '#6d7f5a', casa: '#b8913a' }
  };
  function aplicarTema() {
    const { S, C } = A();
    const base = window.CONFIG_COLORES_ORIGINALES || (window.CONFIG_COLORES_ORIGINALES = Object.assign({}, C.COLORES));
    const nombre = (S.datos.ajustes.extra || {}).tema;
    const t = nombre && nombre !== 'clasico' ? TEMAS[nombre] : base;
    C.COLORES.visitado = t.visitado; C.COLORES.deseo = t.deseo; C.COLORES.casa = t.casa;
    const r = document.documentElement.style;
    r.setProperty('--visitado', t.visitado); r.setProperty('--deseo', t.deseo); r.setProperty('--casa', t.casa);
  }

  // ===================== COMPARAR MAPAS =====================
  function comparar() {
    const { S, abrirHoja, toast, M, render, esc } = A();
    if (S.MODO_PRUEBA) { toast('Disponible cuando la app esté conectada a Supabase'); return; }
    const e = S.datos.ajustes.extra = S.datos.ajustes.extra || {};
    const h = abrirHoja(`<h2>Comparar mapas</h2><p class="nota">Pídele a la otra persona su enlace de "Compartir mi mapa" (en Más) y pégalo aquí. Se verán vuestros países en común a rayas.</p>
      <form class="form"><label>Nombre</label><input class="campo" name="n" placeholder="Laura" value="${esc(e.comparar ? e.comparar.nombre : '')}" required>
      <label>Enlace</label><input class="campo" name="l" placeholder="https://…?ver=…" value="${esc(e.comparar ? e.comparar.enlace : '')}" required>
      <button class="btn ancho">Comparar</button>${e.comparar ? '<button type="button" class="btn-link peligro" data-quitar>Dejar de comparar</button>' : ''}</form>`);
    h.querySelector('form').onsubmit = async ev => {
      ev.preventDefault();
      const enlace = ev.target.l.value.trim(), nombre = ev.target.n.value.trim();
      const token = (enlace.match(/[?&]ver=([a-z0-9]+)/i) || [])[1] || enlace;
      try {
        const otros = await S.mapaDeOtro(token);
        e.comparar = { nombre, enlace, token };
        await S.guardarAjustes({ extra: e });
        activarComparacion(otros, nombre);
        h.cerrar();
      } catch (er) { toast('Ese enlace no funciona o ya no está compartido'); }
    };
    const q = h.querySelector('[data-quitar]'); if (q) q.onclick = async () => { delete e.comparar; await S.guardarAjustes({ extra: e }); M.setOpcion('otros', null); h.cerrar(); render(); };
  }
  function activarComparacion(otros, nombre) {
    const { M, toast, calcular, irA } = A();
    const set = new Set(otros);
    M.setOpcion('otros', set);
    const mios = calcular().visitados;
    const comunes = [...set].filter(c => mios.has(c));
    toast(`🤝 ${comunes.length} países en común con ${nombre} · ${set.size - comunes.length} que solo conoce ${nombre}`);
    irA('mapa');
  }
  async function cargarComparacionGuardada() {
    const { S } = A();
    const c = (S.datos.ajustes.extra || {}).comparar;
    if (!c || S.MODO_PRUEBA) return;
    try { const otros = await S.mapaDeOtro(c.token); A().M.setOpcion('otros', new Set(otros)); } catch (e) { }
  }

  // ===================== GLOBO 3D =====================
  function globo() {
    const { M, C, P, esc } = A();
    const el = capaPantalla('globo3d', `<canvas></canvas><p class="globo-ayuda">Arrastra para girar el mundo · pellizca para acercar</p>`);
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    let W, H;
    const medir = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    medir();
    const proy = d3.geoOrthographic().clipAngle(90).precision(0.5);
    const path = d3.geoPath(proy, ctx);
    let rot = [-C.CASA.lon, -C.CASA.lat * 0.6], zoom = 1, arrastrando = false, inercia = [0.15, 0], vivo = true;
    const est = M.estado, col = C.COLORES;
    const pins = M.pins.filter(p => p.lat != null);
    const dibujar = () => {
      const R = Math.min(W, H) * 0.42 * zoom;
      proy.scale(R).translate([W / 2, H / 2]).rotate(rot);
      ctx.clearRect(0, 0, W, H);
      const halo = ctx.createRadialGradient(W / 2, H / 2, R * .95, W / 2, H / 2, R * 1.2); halo.addColorStop(0, 'rgba(160,200,230,.35)'); halo.addColorStop(1, 'rgba(160,200,230,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * 1.2, 0, 7); ctx.fill();
      ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = '#9fc2d2'; ctx.fill();
      ctx.beginPath(); path(d3.geoGraticule10()); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = .6; ctx.stroke();
      M.features.forEach(f => { ctx.beginPath(); path(f); const e = est[f.code]; ctx.fillStyle = e === 'visitado' ? col.visitado : e === 'casa' ? col.casa : e === 'deseo' ? col.deseo : '#f1ead9'; ctx.fill(); });
      ctx.beginPath(); M.features.forEach(f => path(f)); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = .5; ctx.stroke();
      pins.forEach(p => { const d = d3.geoDistance([p.lon, p.lat], [-rot[0], -rot[1]]); if (d > Math.PI / 2) return; const [x, y] = proy([p.lon, p.lat]); ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fillStyle = p.tipo === 'deseo' ? '#fff' : '#23314a'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); });
      const luz = ctx.createRadialGradient(W / 2 - R * .4, H / 2 - R * .45, R * .2, W / 2, H / 2, R * 1.02); luz.addColorStop(0, 'rgba(255,255,255,.18)'); luz.addColorStop(.6, 'rgba(0,0,0,0)'); luz.addColorStop(1, 'rgba(10,20,40,.35)');
      ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = luz; ctx.fill();
    };
    const bucle = () => { if (!vivo) return; if (!arrastrando) { rot[0] += inercia[0]; rot[1] = Math.max(-80, Math.min(80, rot[1] + inercia[1])); inercia[0] = inercia[0] * 0.97 + 0.15 * 0.03; inercia[1] *= 0.95; } dibujar(); requestAnimationFrame(bucle); };
    const punteros = new Map(); let dist0 = null, zoom0 = 1, ult = null;
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); punteros.set(e.pointerId, [e.clientX, e.clientY]); arrastrando = true; ult = [e.clientX, e.clientY, performance.now()]; if (punteros.size === 2) { const [a, b] = [...punteros.values()]; dist0 = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom0 = zoom; } });
    cv.addEventListener('pointermove', e => {
      if (!punteros.has(e.pointerId)) return;
      punteros.set(e.pointerId, [e.clientX, e.clientY]);
      if (punteros.size === 2 && dist0) { const [a, b] = [...punteros.values()]; zoom = Math.max(.6, Math.min(4, zoom0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / dist0)); return; }
      const k = 0.25 / zoom, dx = e.clientX - ult[0], dy = e.clientY - ult[1];
      rot[0] += dx * k; rot[1] = Math.max(-80, Math.min(80, rot[1] - dy * k));
      inercia = [dx * k * 0.6, -dy * k * 0.6];
      ult = [e.clientX, e.clientY, performance.now()];
    });
    const fin = e => { punteros.delete(e.pointerId); if (punteros.size < 2) dist0 = null; if (!punteros.size) arrastrando = false; };
    cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
    cv.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(.6, Math.min(4, zoom * (e.deltaY < 0 ? 1.1 : 0.9))); }, { passive: false });
    window.addEventListener('resize', medir);
    el.querySelector('.pantalla-cerrar').onclick = () => { vivo = false; window.removeEventListener('resize', medir); el.remove(); };
    bucle();
  }

  // ===================== MAPA DE ESPAÑA =====================
  async function mapaEspana() {
    const { S, C, P, esc, viajesHechos, toast } = A();
    const el = capaPantalla('espana', `<h2>🇪🇸 Mi España</h2><p class="esp-res">Cargando mapa…</p><div class="esp-mapa"></div><div class="esp-info"></div>`);
    let topo;
    try { const r = await fetch('https://cdn.jsdelivr.net/npm/es-atlas@0.6.0/es/provinces.json'); topo = await r.json(); }
    catch (e) { el.querySelector('.esp-res').textContent = 'No se pudo cargar el mapa de España. Revisa la conexión.'; return; }
    const provincias = window.Mapa.topoAGeo(topo, 'provinces');
    const W = Math.min(innerWidth - 24, 640), H = W * 0.78;
    const canarias = f => ['35', '38'].includes(String(f.id));
    const pen = provincias.filter(f => !canarias(f)), can = provincias.filter(canarias);
    const proyP = d3.geoMercator().fitExtent([[W * 0.02, 4], [W * 0.98, H * 0.96]], { type: 'FeatureCollection', features: pen });
    const proyC = d3.geoMercator().fitExtent([[4, H * 0.74], [W * 0.3, H * 0.98]], { type: 'FeatureCollection', features: can });
    const pathP = d3.geoPath(proyP), pathC = d3.geoPath(proyC);
    // Qué provincias ha pisado: por las coordenadas de sus viajes y sitios en España + casa
    const puntos = [[C.CASA.lon, C.CASA.lat, 'casa']];
    viajesHechos().filter(v => v.pais === 'ES' && v.lat != null).forEach(v => { puntos.push([v.lon, v.lat, 'viaje', v]); (ex(v).sitios || []).forEach(st => st.lat != null && puntos.push([st.lon, st.lat, 'viaje', v])); });
    const vistas = {};
    provincias.forEach(f => { puntos.forEach(p => { if (d3.geoContains(f, [p[0], p[1]])) (vistas[f.id] = vistas[f.id] || []).push(p); }); });
    const n = Object.keys(vistas).length;
    el.querySelector('.esp-res').innerHTML = `<b>${n}</b> de 52 provincias · ${Math.round(n / 52 * 100)}%`;
    const svg = d3.select(el.querySelector('.esp-mapa')).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%');
    svg.append('rect').attr('x', 2).attr('y', H * 0.72).attr('width', W * 0.31).attr('height', H * 0.27).attr('rx', 8).attr('fill', 'none').attr('stroke', '#cbbfa6').attr('stroke-dasharray', '4 3');
    svg.selectAll('path').data(provincias).join('path')
      .attr('d', f => canarias(f) ? pathC(f) : pathP(f))
      .attr('fill', f => vistas[f.id] ? (vistas[f.id].some(p => p[2] === 'viaje') ? C.COLORES.visitado : C.COLORES.casa) : '#ece4d3')
      .attr('stroke', '#fff').attr('stroke-width', .8).style('cursor', 'pointer')
      .on('click', (ev, f) => {
        const vs = [...new Set((vistas[f.id] || []).filter(p => p[3]).map(p => p[3]))];
        el.querySelector('.esp-info').innerHTML = `<b>${esc(f.properties.name)}</b> ${vistas[f.id] ? (vs.length ? '· ' + vs.map(v => esc(v.ciudad)).join(', ') : '· 🏠 Casa') : '· Aún sin visitar'}`;
      });
    el.querySelector('.esp-info').innerHTML = '<p class="nota">Toca una provincia. Se colorean las que tienen un viaje (o un sitio favorito) con ciudad ubicada en el mapa.</p>';
  }

  // ===================== MENÚ DE CAPAS =====================
  function menuCapas(boton) {
    const { M, toast } = A();
    let pop = document.querySelector('.capas-pop');
    if (pop) { pop.remove(); return; }
    const o = M.opciones, rasca = A().modoRasca();
    pop = document.createElement('div'); pop.className = 'capas-pop';
    pop.innerHTML = `
      <button data-c="rasca" class="${rasca ? 'on' : ''}"><span>✦</span>Modo rasca</button>
      <button data-c="noche" class="${o.noche ? 'on' : ''}"><span>🌙</span>Modo noche</button>
      <button data-c="rutas" class="${o.rutas ? 'on' : ''}"><span>🧵</span>Rutas desde casa</button>
      <button data-c="globo"><span>🌍</span>Globo 3D</button>
      <button data-c="espana"><span>🇪🇸</span>Mi España</button>
      ${o.otros ? '<button data-c="comparar" class="on"><span>🤝</span>Comparando mapas</button>' : ''}`;
    document.body.appendChild(pop);
    const r = boton.getBoundingClientRect();
    pop.style.top = (r.top) + 'px'; pop.style.right = (innerWidth - r.left + 8) + 'px';
    pop.querySelectorAll('[data-c]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const c = b.dataset.c;
      if (c === 'rasca') A().alternarRasca();
      if (c === 'noche') { M.setOpcion('noche', !o.noche); localStorage.setItem('mv-noche', o.noche ? '1' : ''); }
      if (c === 'rutas') { M.setOpcion('rutas', !o.rutas); localStorage.setItem('mv-rutas', o.rutas ? '1' : ''); }
      if (c === 'globo') { pop.remove(); globo(); return; }
      if (c === 'espana') { pop.remove(); mapaEspana(); return; }
      if (c === 'comparar') { M.setOpcion('otros', null); toast('Comparación desactivada'); }
      pop.remove(); menuCapas(boton);
    });
    setTimeout(() => document.addEventListener('click', function cerrar(e) { if (!e.target.closest('.capas-pop')) { pop.remove(); document.removeEventListener('click', cerrar); } }), 0);
  }

  // ===================== SITIOS EN EL MAPA =====================
  function sitiosMapa() {
    return A().S.datos.viajes.flatMap(v => (ex(v).sitios || []).filter(s => s.lat != null).map(s => Object.assign({ pais: v.pais }, s)));
  }

  window.EXTRAS = {
    rango, htmlPasaporteExtra, enlazarPasaporte, revisarLogros, quiz, wrapped, ruleta, fichaPaisHTML, tiempoHTML,
    abrirProximo, tarjetasInicio, diaDiario, htmlViajeExtra, enlazarViajeExtra, postal, poster, recomendar,
    mensajeTrasRascar, htmlMasExtra, enlazarMasExtra, aplicarTema, comparar, cargarComparacionGuardada, globo, mapaEspana,
    menuCapas, sitiosMapa, fotosNormales, MALETAS_TIPO: () => window.DATOS.MALETAS_TIPO
  };
})();
