// Más extras: reservas, vuelos, huella, maravillas, gastronomía, destino, datos curiosos, presentación, fotolibro, banda sonora
(function () {
  const A = () => window.APP;
  const D = () => window.DATOS;
  const ex = o => (o.extra = o.extra || {});
  const ajEx = () => { const aj = A().S.datos.ajustes; return (aj.extra = aj.extra || {}); };
  const guardarAj = () => A().S.guardarAjustes({ extra: ajEx() }).catch(() => A().toast('Sin conexión: guardado en este móvil'));
  const kmEntre = (a, b) => A().km(a.lat, a.lon, b.lat, b.lon);
  const fmtNum = n => A().nf.format(Math.round(n));

  function capa(clase, html) {
    const el = document.createElement('div');
    el.className = 'pantalla ' + (clase || '');
    el.innerHTML = `<button class="pantalla-cerrar" aria-label="Cerrar">✕</button>${html}`;
    document.body.appendChild(el);
    el.querySelector('.pantalla-cerrar').onclick = () => el.remove();
    return el;
  }

  // ===================== RESERVAS =====================
  const TIPOS_RESERVA = [['🛫', 'Tarjeta de embarque'], ['🏨', 'Hotel'], ['🚗', 'Coche'], ['🚆', 'Tren / bus'], ['🎟️', 'Entrada'], ['🛡️', 'Seguro'], ['📄', 'Otro']];
  const reservasDe = v => v.fotos.filter(f => f.reserva);

  function htmlReservas(v, titulo) {
    const { esc, SOLO_LECTURA } = A();
    if (SOLO_LECTURA) return '';
    const rs = reservasDe(v);
    return `<h3 class="sec-tit">${titulo || '🎫 Reservas y tarjetas de embarque'}</h3>
      <div class="reservas">${rs.map(f => `<div class="reserva"><button class="reserva-btn" data-reserva="${f.id}"><span class="res-ico">${(f.nombre || '📄').split(' ')[0]}</span><div><b>${esc((f.nombre || 'Reserva').replace(/^\S+\s/, ''))}</b><small>${f.tipo === 'pdf' ? 'PDF' : 'Imagen'} · 📶 disponible sin conexión</small></div></button><button class="btn-icono" data-borrar-reserva="${f.id}" aria-label="Borrar">✕</button></div>`).join('') || '<p class="nota">Guarda aquí la tarjeta de embarque, la reserva del hotel, entradas… Se pueden ver aunque no haya internet.</p>'}
      <button class="btn sec mini" data-nueva-reserva>＋ Añadir reserva</button></div>`;
  }

  function enlazarReservas(v, h, refrescar) {
    const { S, toast, abrirHoja, confirmar } = A();
    h.querySelectorAll('[data-reserva]').forEach(b => b.onclick = () => verReserva(v.fotos.find(f => f.id === b.dataset.reserva)));
    h.querySelectorAll('[data-borrar-reserva]').forEach(b => b.onclick = async () => { if (await confirmar('¿Borrar esta reserva?')) { await S.borrarFoto(v, b.dataset.borrarReserva); refrescar(); } });
    const nr = h.querySelector('[data-nueva-reserva]'); if (nr) nr.onclick = () => {
      let tipo = TIPOS_RESERVA[0];
      const hh = abrirHoja(`<h2>Nueva reserva</h2><div class="emojis">${TIPOS_RESERVA.map((t, i) => `<button data-t="${i}" class="${i === 0 ? 'on' : ''}" title="${t[1]}">${t[0]}</button>`).join('')}</div>
        <form class="form"><label>Nombre</label><input class="campo" name="n" placeholder="Vuelo de ida, Hotel Roma…" value="Tarjeta de embarque">
        <label class="btn sec ancho">📎 Elegir foto o PDF<input type="file" accept="image/*,application/pdf" hidden name="f"></label><div class="n-fotos"></div>
        <button class="btn ancho">Guardar</button></form>`, { completa: true });
      hh.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tipo = TIPOS_RESERVA[+b.dataset.t]; hh.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); const n = hh.querySelector('[name=n]'); if (!n.dataset.tocado) n.value = tipo[1]; });
      const form = hh.querySelector('form');
      form.n.oninput = () => form.n.dataset.tocado = '1';
      form.f.onchange = () => { hh.querySelector('.n-fotos').textContent = form.f.files[0] ? '📎 ' + form.f.files[0].name : ''; };
      form.onsubmit = async e => {
        e.preventDefault();
        const file = form.f.files[0]; if (!file) { toast('Elige una foto o un PDF'); return; }
        const btn = form.querySelector('button:last-child'); btn.disabled = true; btn.textContent = 'Guardando…';
        try { await S.subirReserva(v, file, `${tipo[0]} ${form.n.value.trim() || tipo[1]}`); toast('Reserva guardada 🎫'); hh.cerrar(); refrescar(); }
        catch (er) { toast('No se pudo guardar'); btn.disabled = false; btn.textContent = 'Guardar'; }
      };
    };
  }

  async function verReserva(f) {
    const { S, esc } = A();
    const el = capa('vista-reserva', '<div class="cargando">Abriendo…</div>');
    const url = await S.reservaLocal(f);
    if (!url) { el.querySelector('.cargando').textContent = 'No se pudo abrir (sin conexión y sin copia en este móvil).'; return; }
    el.innerHTML = `<button class="pantalla-cerrar" aria-label="Cerrar">✕</button><h3>${esc(f.nombre || 'Reserva')}</h3>
      ${f.tipo === 'pdf' ? `<iframe src="${url}" title="PDF"></iframe>` : `<img src="${url}" alt="">`}
      <button class="btn ancho" data-compartir>📤 Abrir / compartir / imprimir</button><p class="nota">Consejo: sube el brillo al enseñar el código de barras 😉</p>`;
    el.querySelector('.pantalla-cerrar').onclick = () => el.remove();
    el.querySelector('[data-compartir]').onclick = async () => {
      try {
        const blob = await (await fetch(url)).blob();
        const file = new File([blob], (f.nombre || 'reserva').replace(/[^\w\- ]/g, '').trim() + (f.tipo === 'pdf' ? '.pdf' : '.jpg'), { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; }
      } catch (e) { if (e.name === 'AbortError') return; }
      const a = document.createElement('a'); a.href = url; a.download = f.nombre || 'reserva'; a.target = '_blank'; a.click();
    };
  }

  // ===================== VUELOS =====================
  const aero = code => D().aeropuertos.find(a => a.iata === code);
  function todosLosVuelos() { return A().S.datos.viajes.flatMap(v => (ex(v).vuelos || []).map(x => Object.assign({ viaje: v }, x))); }
  function kmVuelo(x) { const a = aero(x.o), b = aero(x.d); return a && b ? kmEntre(a, b) : 0; }
  function lineasVuelos() { return todosLosVuelos().map(x => [aero(x.o), aero(x.d)]).filter(p => p[0] && p[1]).map(([a, b]) => [[a.lon, a.lat], [b.lon, b.lat]]); }

  function selectorAeropuerto(cont, inicial, onCambio) {
    const { esc, P } = A();
    cont.innerHTML = `<input class="campo" placeholder="Ciudad o código (MAD, BCN…)" autocomplete="off"><div class="sugerencias"></div>`;
    const inp = cont.querySelector('input'), sug = cont.querySelector('.sugerencias');
    const fija = a => { inp.value = a ? `${a.iata} · ${a.ciudad}` : ''; sug.innerHTML = ''; onCambio(a ? a.iata : ''); };
    if (inicial) fija(aero(inicial));
    inp.oninput = () => {
      const n = P.normaliza(inp.value); if (!n) { sug.innerHTML = ''; onCambio(''); return; }
      const res = D().aeropuertos.filter(a => a.iata.toLowerCase().startsWith(n) || P.normaliza(a.ciudad).includes(n)).slice(0, 6);
      sug.innerHTML = res.map(a => `<button type="button" data-i="${a.iata}"><span class="sug-flag">${P.bandera(a.pais)}</span><span><b>${a.iata} · ${esc(a.ciudad)}</b><small>${esc(A().pais(a.pais).nombre)}</small></span></button>`).join('');
      sug.querySelectorAll('[data-i]').forEach(b => b.onclick = () => fija(aero(b.dataset.i)));
      const exacto = D().aeropuertos.find(a => a.iata.toLowerCase() === n);
      onCambio(exacto ? exacto.iata : '');
    };
  }

  function htmlVuelos(v) {
    const { esc, fecha, SOLO_LECTURA } = A();
    const vs = ex(v).vuelos || [];
    if (SOLO_LECTURA && !vs.length) return '';
    return `<h3 class="sec-tit">✈️ Vuelos</h3><div class="vuelos">${vs.map((x, i) => `<div class="vuelo-fila"><div class="vuelo-ruta"><b>${x.o}</b><span>✈︎</span><b>${x.d}</b></div><div class="vuelo-info"><small>${esc((aero(x.o) || {}).ciudad || x.o)} → ${esc((aero(x.d) || {}).ciudad || x.d)}</small><small>${x.f ? fecha(x.f) + ' · ' : ''}${esc(x.a || '')} ${esc(x.n || '')} · ${fmtNum(kmVuelo(x))} km</small></div>${SOLO_LECTURA ? '' : `<button class="btn-icono" data-borrar-vuelo="${i}">✕</button>`}</div>`).join('')}
      ${SOLO_LECTURA ? '' : '<button class="btn sec mini" data-nuevo-vuelo>＋ Añadir vuelo</button>'}</div>`;
  }

  function enlazarVuelos(v, h, refrescar) {
    const { S, toast, abrirHoja, esc } = A();
    const e = ex(v);
    const guardar = async () => { try { await S.guardarViaje(v); } catch (er) { toast('No se pudo guardar'); } };
    h.querySelectorAll('[data-borrar-vuelo]').forEach(b => b.onclick = async () => { e.vuelos.splice(+b.dataset.borrarVuelo, 1); await guardar(); refrescar(); A().render(); });
    const nv = h.querySelector('[data-nuevo-vuelo]'); if (!nv) return;
    nv.onclick = () => {
      const previo = (e.vuelos || [])[e.vuelos ? e.vuelos.length - 1 : -1];
      const x = { o: previo ? previo.d : 'ZAZ', d: previo ? previo.o : '', f: '', a: previo ? previo.a : '', n: '' };
      if (!previo) { const destino = D().aeropuertos.find(a => a.pais === v.pais && (!v.ciudad || A().P.normaliza(a.ciudad).includes(A().P.normaliza(v.ciudad).split(' ')[0]))) || D().aeropuertos.find(a => a.pais === v.pais); if (destino) x.d = destino.iata; x.f = v.inicio || ''; }
      else x.f = v.fin || '';
      const hh = abrirHoja(`<h2>Nuevo vuelo</h2><form class="form">
        <label>Desde</label><div data-o></div><label>Hasta</label><div data-d></div>
        <div class="fila2"><div><label>Fecha</label><input class="campo" type="date" name="f" value="${x.f}"></div><div><label>Nº de vuelo</label><input class="campo" name="n" placeholder="FR1234"></div></div>
        <label>Aerolínea</label><input class="campo" name="a" list="lista-aerolineas" value="${esc(x.a)}" placeholder="Ryanair, Vueling, Iberia…">
        <datalist id="lista-aerolineas">${D().AEROLINEAS.map(a => `<option value="${a}">`).join('')}</datalist>
        <p class="nota">¿No sale tu aeropuerto? Escribe su código de 3 letras igualmente.</p>
        <button class="btn ancho">Guardar vuelo</button></form>`, { completa: true });
      selectorAeropuerto(hh.querySelector('[data-o]'), x.o, c => x.o = c);
      selectorAeropuerto(hh.querySelector('[data-d]'), x.d, c => x.d = c);
      hh.querySelector('form').onsubmit = async ev => {
        ev.preventDefault();
        const f = ev.target;
        ['o', 'd'].forEach(k => { if (!x[k]) { const t = hh.querySelector(`[data-${k}] input`).value.trim().toUpperCase(); if (/^[A-Z]{3}$/.test(t)) x[k] = t; } });
        if (!x.o || !x.d) { toast('Elige origen y destino'); return; }
        Object.assign(x, { f: f.f.value, a: f.a.value.trim(), n: f.n.value.trim().toUpperCase() });
        e.vuelos = (e.vuelos || []).concat([x]);
        await guardar(); hh.cerrar(); refrescar(); A().render(); toast('Vuelo guardado ✈️');
      };
    };
  }

  function statsVuelos() {
    const vs = todosLosVuelos();
    const km = vs.reduce((n, x) => n + kmVuelo(x), 0);
    const horas = vs.reduce((n, x) => n + (kmVuelo(x) ? kmVuelo(x) / 800 + 0.5 : 0), 0);
    const cuenta = {}; vs.forEach(x => { if (x.a) cuenta[x.a] = (cuenta[x.a] || 0) + 1; });
    const fav = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0];
    const aeros = new Set(vs.flatMap(x => [x.o, x.d]));
    const largo = [...vs].sort((a, b) => kmVuelo(b) - kmVuelo(a))[0];
    return { n: vs.length, km, horas, fav, aeros: aeros.size, largo };
  }

  // ===================== HUELLA DE CARBONO =====================
  function huella(s) {
    const v = statsVuelos();
    const kmBase = v.km || s.km;   // si no hay vuelos apuntados, estimamos con los km de los viajes
    const kg = kmBase * 0.15;
    return { kg, arboles: Math.ceil(kg / 21), estimado: !v.km };
  }

  // ===================== MARAVILLAS =====================
  function maravillaVista(m) {
    if ((ajEx().maravillas || {})[m.id]) return true;
    const puntos = A().viajesHechos().flatMap(v => [v].concat(ex(v).sitios || []).filter(p => p.lat != null));
    return puntos.some(p => A().km(p.lat, p.lon, m.lat, m.lon) < 60);
  }

  // ===================== PASAPORTE GASTRONÓMICO =====================
  const platosDe = code => (D().PLATOS[code] || []).concat((ajEx().platosExtra || {})[code] || []);
  const probados = code => (ajEx().platos || {})[code] || [];

  function htmlPasaporte(s) {
    const { P, pais, esc } = A();
    const v = statsVuelos();
    const vuelosHtml = v.n ? `<div class="stats-vuelos">
        <div><b>${v.n}</b><small>vuelos</small></div><div><b>${fmtNum(v.km)}</b><small>km volados</small></div>
        <div><b>${fmtNum(v.horas)}</b><small>horas en el aire</small></div><div><b>${v.aeros}</b><small>aeropuertos</small></div></div>
        ${v.fav ? `<p class="nota">💺 Aerolínea favorita: <b>${esc(v.fav[0])}</b> (${v.fav[1]} ${v.fav[1] === 1 ? 'vuelo' : 'vuelos'})</p>` : ''}
        ${v.largo ? `<p class="nota">🛫 Vuelo más largo: <b>${v.largo.o} → ${v.largo.d}</b> · ${fmtNum(kmVuelo(v.largo))} km</p>` : ''}`
      : '<p class="nota">Añade los vuelos dentro de cada viaje para ver aquí tus estadísticas y verlos en el mapa (capa ✈️ Vuelos).</p>';
    const mars = D().maravillas;
    const vistas = mars.filter(maravillaVista);
    const modernas = mars.filter(m => m.moderna), modVistas = modernas.filter(maravillaVista);
    const conPlatos = [...s.visitados].filter(c => platosDe(c).length).sort((a, b) => pais(a).nombre.localeCompare(pais(b).nombre, 'es'));
    const totalProbados = conPlatos.reduce((n, c) => n + probados(c).length, 0);
    return `
      <h2 class="vista-tit">✈️ Mis vuelos</h2><div class="tarjeta">${vuelosHtml}</div>
      <h2 class="vista-tit">🏛️ Maravillas del mundo <small>${vistas.length}/${mars.length}</small></h2>
      <p class="nota maravillas-nota">Las 7 maravillas modernas: <b>${modVistas.length}/7</b>. Se marcan solas si tienes un viaje cerca, o tócalas para marcarlas.</p>
      <div class="maravillas">${mars.map(m => `<button class="maravilla${maravillaVista(m) ? ' vista' : ''}${m.moderna ? ' moderna' : ''}" data-maravilla="${m.id}"><span>${m.emoji}</span><b>${esc(m.nombre)}</b><small>${P.bandera(m.pais)} ${esc(pais(m.pais).nombre)}</small></button>`).join('')}</div>
      <h2 class="vista-tit">🍜 Pasaporte gastronómico <small>${totalProbados} probados</small></h2>
      ${conPlatos.length ? conPlatos.map(c => `<div class="tarjeta gastro"><div class="gastro-cab">${P.bandera(c)} <b>${esc(pais(c).nombre)}</b><small>${probados(c).length}/${platosDe(c).length}</small></div>
        <div class="platos">${platosDe(c).map(p => `<button class="plato${probados(c).includes(p) ? ' on' : ''}" data-plato="${c}|${esc(p)}">${probados(c).includes(p) ? '✅' : '🍽️'} ${esc(p)}</button>`).join('')}<button class="plato nuevo" data-nuevo-plato="${c}">＋</button></div></div>`).join('')
        : '<p class="nota">Cuando visites países, aquí aparecerán sus platos típicos para ir marcando los que pruebas.</p>'}`;
  }

  function enlazarPasaporte(el) {
    const { toast, abrirHoja, render } = A();
    const e = ajEx();
    el.querySelectorAll('[data-maravilla]').forEach(b => b.onclick = async () => {
      const id = b.dataset.maravilla, m = D().maravillas.find(x => x.id === id);
      e.maravillas = e.maravillas || {};
      if (e.maravillas[id]) delete e.maravillas[id];
      else if (maravillaVista(m)) { toast('Esta se ha marcado sola por tus viajes 🙂'); return; }
      else { e.maravillas[id] = true; Efectos.exito(); toast(`${m.emoji} ¡${m.nombre} vista!`); }
      await guardarAj(); render();
    });
    el.querySelectorAll('[data-plato]').forEach(b => b.onclick = async () => {
      const [c, p] = b.dataset.plato.split('|');
      e.platos = e.platos || {}; const l = e.platos[c] = e.platos[c] || [];
      const i = l.indexOf(p); if (i >= 0) l.splice(i, 1); else { l.push(p); Efectos.click(); }
      await guardarAj(); render();
    });
    el.querySelectorAll('[data-nuevo-plato]').forEach(b => b.onclick = () => {
      const c = b.dataset.nuevoPlato;
      const h = abrirHoja(`<h2>Añadir plato</h2><form class="form"><input class="campo" name="p" placeholder="Nombre del plato" required><button class="btn ancho">Añadir</button></form>`);
      h.querySelector('form').onsubmit = async ev => {
        ev.preventDefault(); const p = ev.target.p.value.trim(); if (!p) return;
        e.platosExtra = e.platosExtra || {}; (e.platosExtra[c] = e.platosExtra[c] || []).push(p);
        e.platos = e.platos || {}; (e.platos[c] = e.platos[c] || []).push(p);
        await guardarAj(); h.cerrar(); render();
      };
    });
  }

  // ===================== DESTINO: tiempo, hora, moneda, presupuesto =====================
  const ICONO_TIEMPO = c => c === 0 ? '☀️' : c <= 2 ? '🌤️' : c === 3 ? '☁️' : c <= 48 ? '🌫️' : c <= 57 ? '🌦️' : c <= 67 ? '🌧️' : c <= 77 ? '🌨️' : c <= 82 ? '🌧️' : c <= 86 ? '🌨️' : '⛈️';
  async function cambio(cod) {
    const clave = 'mv-cambio';
    let c; try { c = JSON.parse(localStorage.getItem(clave)); } catch (e) { }
    const hoy = A().hoyISO();
    if (!c || c.fecha !== hoy) {
      try { const r = await fetch('https://open.er-api.com/v6/latest/EUR'); const j = await r.json(); if (j.rates) { c = { fecha: hoy, rates: j.rates }; localStorage.setItem(clave, JSON.stringify(c)); } } catch (e) { }
    }
    return c && c.rates ? { tasa: c.rates[cod], fecha: c.fecha } : null;
  }

  function rellenarDestino(cont, code, lat, lon, fecha, obj, guardar) {
    const { esc, nf } = A();
    const f = D().ficha(code);
    cont.innerHTML = `<div class="destino-grid"><div class="tiempo" data-t><span>⏳</span><div><small>Mirando el tiempo…</small></div></div><div class="hora" data-h hidden></div></div>
      ${f && f.monedaCod !== 'EUR' ? `<div class="conversor" data-c><div class="conv-cab">💱 <b>Euros → ${esc(f.moneda)}</b><small data-fecha></small></div><div class="conv-fila"><input class="campo" type="number" inputmode="decimal" value="10" data-eur><span>€ =</span><b data-res>…</b></div><div class="conv-rapido" data-rapido></div></div>` : ''}
      ${obj ? `<div class="presupuesto"><label>💰 Presupuesto del viaje</label><div class="conv-fila"><input class="campo" type="number" inputmode="decimal" placeholder="800" value="${ex(obj).presupuesto || ''}" data-presu><span>€</span></div></div>` : ''}`;
    // Tiempo + hora local (Open-Meteo devuelve la zona horaria)
    if (lat != null) {
      const q = new URLSearchParams({ latitude: lat, longitude: lon, current: 'temperature_2m,weather_code', daily: 'weather_code,temperature_2m_max,temperature_2m_min', timezone: 'auto', forecast_days: '16' });
      fetch('https://api.open-meteo.com/v1/forecast?' + q).then(r => r.json()).then(j => {
        const i = fecha ? (j.daily.time || []).indexOf(fecha) : -1;
        const t = cont.querySelector('[data-t]');
        t.innerHTML = i >= 0
          ? `<span>${ICONO_TIEMPO(j.daily.weather_code[i])}</span><div><small>Previsión para tu llegada</small><b>${Math.round(j.daily.temperature_2m_min[i])}° / ${Math.round(j.daily.temperature_2m_max[i])}°</b></div>`
          : `<span>${ICONO_TIEMPO(j.current.weather_code)}</span><div><small>Ahora mismo allí</small><b>${Math.round(j.current.temperature_2m)}°</b></div>`;
        if (j.utc_offset_seconds != null) {
          const h = cont.querySelector('[data-h]');
          const pintarHora = () => {
            const allí = new Date(Date.now() + j.utc_offset_seconds * 1000);
            const hh = String(allí.getUTCHours()).padStart(2, '0') + ':' + String(allí.getUTCMinutes()).padStart(2, '0');
            const dif = Math.round((j.utc_offset_seconds / 60 + new Date().getTimezoneOffset()) / 60 * 2) / 2;
            h.innerHTML = `<span>🕐</span><div><small>Hora allí</small><b>${hh}</b><small>${dif === 0 ? 'Misma hora que en casa' : `${dif > 0 ? '+' : ''}${String(dif).replace('.', ',')} h respecto a casa`}</small></div>`;
          };
          pintarHora(); h.hidden = false;
          const tm = setInterval(() => { if (!document.body.contains(h)) clearInterval(tm); else pintarHora(); }, 30000);
        }
      }).catch(() => { cont.querySelector('[data-t]').innerHTML = '<span>📡</span><div><small>Sin conexión para ver el tiempo</small></div>'; });
    } else cont.querySelector('[data-t]').hidden = true;
    // Conversor
    const cv = cont.querySelector('[data-c]');
    if (cv) cambio(f.monedaCod).then(c => {
      if (!c || !c.tasa) { cv.querySelector('[data-res]').textContent = 'sin conexión'; return; }
      const fmt = n => new Intl.NumberFormat('es-ES', { maximumFractionDigits: n < 10 ? 2 : 0 }).format(n);
      const calc = () => { const e = parseFloat(cv.querySelector('[data-eur]').value.replace(',', '.')) || 0; cv.querySelector('[data-res]').textContent = `${fmt(e * c.tasa)} ${f.simbolo}`; };
      cv.querySelector('[data-eur]').oninput = calc; calc();
      cv.querySelector('[data-fecha]').textContent = `Cambio del ${A().fecha(c.fecha)}`;
      cv.querySelector('[data-rapido]').innerHTML = [5, 20, 50, 100].map(e => `<span>${e} € = <b>${fmt(e * c.tasa)} ${f.simbolo}</b></span>`).join('') + `<span>1 ${f.simbolo} = <b>${fmt(1 / c.tasa)} €</b></span>`;
    });
    // Presupuesto
    const pr = cont.querySelector('[data-presu]');
    if (pr) pr.onchange = async () => { const n = parseFloat(pr.value.replace(',', '.')); if (isNaN(n)) delete ex(obj).presupuesto; else ex(obj).presupuesto = n; try { await guardar(); A().toast('Presupuesto guardado 💰'); } catch (e) { } };
  }

  function htmlPresupuestoViaje(v) {
    const e = ex(v); if (!e.presupuesto) return '';
    const gastado = ((e.gastos || {}).items || []).reduce((s, x) => s + (+x.i || 0), 0);
    const pct = Math.round(gastado / e.presupuesto * 100);
    return `<div class="presu-barra ${pct > 100 ? 'pasado' : ''}"><div><span>💰 Presupuesto ${fmtNum(e.presupuesto)} €</span><b>${pct}%</b></div><div class="logro-barra"><i style="width:${Math.min(100, pct)}%"></i></div><small>${pct > 100 ? `Te has pasado ${fmtNum(gastado - e.presupuesto)} € 😅` : `Te quedan ${fmtNum(e.presupuesto - gastado)} €`}</small></div>`;
  }

  // ===================== DATOS CURIOSOS (Wikidata + Wikipedia, sin guardar nada) =====================
  const cacheCuriosos = {};
  async function datosCuriosos(code) {
    if (cacheCuriosos[code]) return cacheCuriosos[code];
    const q = `SELECT (SAMPLE(?pop) AS ?pop) (SAMPLE(?area) AS ?area) (SAMPLE(?hpL) AS ?hp) (SAMPLE(?elev) AS ?elev) (SAMPLE(?capL) AS ?cap) (SAMPLE(?anL) AS ?himno) (SAMPLE(?lema) AS ?lema) (SAMPLE(?conduce) AS ?conduce) (SAMPLE(?gent) AS ?gent) (SAMPLE(?desde) AS ?desde) (COUNT(DISTINCT ?b) AS ?fronteras) (COUNT(DISTINCT ?idi) AS ?idiomas) WHERE {
      ?c wdt:P297 "${code}" .
      OPTIONAL { ?c wdt:P1082 ?pop }
      OPTIONAL { ?c wdt:P2046 ?area }
      OPTIONAL { ?c wdt:P610 ?hpI . ?hpI rdfs:label ?hpL . FILTER(LANG(?hpL) = "es") OPTIONAL { ?hpI wdt:P2044 ?elev } }
      OPTIONAL { ?c wdt:P36 ?capI . ?capI rdfs:label ?capL . FILTER(LANG(?capL) = "es") }
      OPTIONAL { ?c wdt:P85 ?anI . ?anI rdfs:label ?anL . FILTER(LANG(?anL) = "es") }
      OPTIONAL { ?c wdt:P1451 ?lema }
      OPTIONAL { ?c wdt:P1622 ?conduce }
      OPTIONAL { ?c wdt:P1549 ?gent . FILTER(LANG(?gent) = "es") }
      OPTIONAL { ?c wdt:P571 ?desde }
      OPTIONAL { ?c wdt:P47 ?b . ?b wdt:P31 wd:Q3624078 }
      OPTIONAL { ?c wdt:P37 ?idi }
    }`;
    const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), { headers: { Accept: 'application/sparql-results+json' } });
    const j = await r.json();
    const b = (j.results.bindings || [])[0] || {};
    const v = k => b[k] ? b[k].value : null;
    const nombre = A().pais(code).nombre;
    const hechos = [];
    const ES = { pop: 48.6e6, area: 505990 };
    if (v('cap')) hechos.push(`Su capital es <b>${v('cap')}</b>.`);
    if (v('pop')) { const p = +v('pop'); const r2 = p / ES.pop; hechos.push(`Tiene unos <b>${p >= 1e6 ? fmtNum(p / 1e6) + ' millones' : fmtNum(p)}</b> de habitantes${r2 >= 1.5 ? `: ¡${fmtNum(r2)} veces la población de España!` : r2 < 0.5 ? `, ${r2 < 0.01 ? 'muchísimos menos' : 'bastantes menos'} que España` : ''}.`); }
    if (v('area')) { const a = +v('area'); const r3 = a / ES.area; hechos.push(r3 >= 1.5 ? `Es <b>${fmtNum(r3)} veces más grande</b> que España.` : r3 <= 0.6 ? `<b>${nombre} cabe ${fmtNum(1 / r3)} veces</b> dentro de España.` : `Tiene un tamaño parecido al de España (${fmtNum(a)} km²).`); }
    if (v('hp')) hechos.push(`Su punto más alto es <b>${v('hp')}</b>${v('elev') ? `, a ${fmtNum(+v('elev'))} metros` : ''}.`);
    if (v('conduce') && v('conduce').endsWith('Q13196750')) hechos.push('¡Allí <b>se conduce por la izquierda</b>! 🚗');
    if (v('gent')) hechos.push(`A sus habitantes se les llama <b>${v('gent')}</b>.`);
    if (v('lema')) hechos.push(`Su lema nacional es <b>«${v('lema')}»</b>.`);
    if (v('himno')) hechos.push(`Su himno se llama <b>«${v('himno')}»</b>.`);
    if (v('idiomas') && +v('idiomas') > 1) hechos.push(`Tiene <b>${v('idiomas')} idiomas oficiales</b>.`);
    if (v('fronteras') != null) { const n = +v('fronteras'); if (n === 0) hechos.push('No tiene frontera terrestre con ningún otro país 🏝️.'); else if (n >= 5) hechos.push(`Hace frontera con <b>${n} países</b>.`); }
    if (v('desde')) { const y = parseInt(v('desde').replace(/^\+/, '')); if (y && y > 0) hechos.push(`Existe como país desde el año <b>${y}</b>.`); }
    // Un resumen de Wikipedia como dato extra
    try {
      const w = await (await fetch('https://es.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(nombre))).json();
      if (w.extract) { const frases = w.extract.split(/(?<=\.)\s+/).slice(1, 4).filter(f => f.length > 40 && f.length < 260); frases.forEach(f => hechos.push(f)); }
    } catch (e) { }
    cacheCuriosos[code] = hechos;
    return hechos;
  }

  function datoCurioso(cont, code) {
    if (!cont) return;
    const nombre = A().pais(code).nombre;
    cont.innerHTML = `<div class="curioso"><div class="curioso-cab">🤓 <b>¿Sabías que…?</b></div><p class="cargando">Buscando un dato curioso…</p></div>`;
    datosCuriosos(code).then(hechos => {
      if (!hechos.length) { cont.innerHTML = ''; return; }
      let i = Math.floor(Math.random() * hechos.length);
      const pintar = () => {
        cont.innerHTML = `<div class="curioso"><div class="curioso-cab">🤓 <b>¿Sabías que…?</b></div><p>${hechos[i]}</p>
          <div class="curioso-pie"><button class="btn-link" data-otro>🔄 Otro dato</button><a class="btn-link" href="https://es.wikipedia.org/wiki/${encodeURIComponent(nombre)}" target="_blank" rel="noopener">Wikipedia ↗</a></div></div>`;
        cont.querySelector('[data-otro]').onclick = () => { i = (i + 1 + Math.floor(Math.random() * Math.max(1, hechos.length - 1))) % hechos.length; pintar(); };
      };
      pintar();
    }).catch(() => { cont.innerHTML = ''; });
  }

  // ===================== PRESENTACIÓN CON MÚSICA =====================
  function musicaAmbiente() {
    const ctx = Efectos.contexto && Efectos.contexto();
    if (!ctx) return { parar() { } };
    const salida = ctx.createGain(); salida.gain.value = 0; salida.connect(ctx.destination);
    salida.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 2);
    const acordes = [[261.6, 329.6, 392], [196, 246.9, 293.7], [220, 261.6, 329.6], [174.6, 220, 261.6]];
    let k = 0, vivo = true;
    const tocar = () => {
      if (!vivo) return;
      const t = ctx.currentTime, ac = acordes[k++ % acordes.length];
      ac.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.8); g.gain.linearRampToValueAtTime(0, t + 4);
        o.connect(g); g.connect(salida); o.start(t); o.stop(t + 4.1);
        const a = ctx.createOscillator(), ga = ctx.createGain();   // arpegio suave
        a.type = 'triangle'; a.frequency.value = f * 2; const ta = t + 0.5 + i * 0.6;
        ga.gain.setValueAtTime(0, ta); ga.gain.linearRampToValueAtTime(0.12, ta + 0.05); ga.gain.exponentialRampToValueAtTime(0.001, ta + 1.2);
        a.connect(ga); ga.connect(salida); a.start(ta); a.stop(ta + 1.3);
      });
      setTimeout(tocar, 3600);
    };
    tocar();
    return { parar() { vivo = false; salida.gain.cancelScheduledValues(ctx.currentTime); salida.gain.setValueAtTime(salida.gain.value, ctx.currentTime); salida.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8); setTimeout(() => salida.disconnect(), 1000); } };
  }

  function presentacion(titulo, subtitulo, fotos, cancion) {
    const { esc, toast } = A();
    if (!fotos.length) { toast('No hay fotos para la presentación'); return; }
    const el = capa('presentacion', `<div class="pres-fotos"></div><div class="pres-titulo"><h1>${esc(titulo)}</h1><p>${esc(subtitulo || '')}</p></div>
      <div class="pres-pie"><div class="pres-barra"><i></i></div><div class="pres-botones"><button data-musica>🔊</button><button data-pausa>⏸</button>${cancion ? `<a href="${esc(cancion)}" target="_blank" rel="noopener">🎵 Canción del viaje</a>` : ''}</div></div>`);
    const cont = el.querySelector('.pres-fotos');
    let i = -1, pausa = false, tempo, musica = Efectos.sonidoActivo ? musicaAmbiente() : null;
    const siguiente = (paso) => {
      clearTimeout(tempo);
      i = (i + (paso || 1) + fotos.length) % fotos.length;
      const img = document.createElement('img');
      img.src = fotos[i].url || fotos[i].thumbUrl; img.className = 'kb' + (i % 4);
      cont.appendChild(img);
      requestAnimationFrame(() => img.classList.add('visible'));
      const viejas = cont.querySelectorAll('img'); if (viejas.length > 2) viejas[0].remove();
      el.querySelector('.pres-barra i').style.width = ((i + 1) / fotos.length * 100) + '%';
      if (i === 0) setTimeout(() => el.querySelector('.pres-titulo').classList.add('fuera'), 3500);
      if (!pausa) tempo = setTimeout(() => siguiente(1), 4500);
    };
    el.querySelector('[data-pausa]').onclick = e => { e.stopPropagation(); pausa = !pausa; e.target.textContent = pausa ? '▶️' : '⏸'; if (!pausa) siguiente(1); else clearTimeout(tempo); };
    el.querySelector('[data-musica]').onclick = e => { e.stopPropagation(); if (musica) { musica.parar(); musica = null; e.target.textContent = '🔇'; } else { musica = musicaAmbiente(); e.target.textContent = '🔊'; } };
    if (!musica) el.querySelector('[data-musica]').textContent = '🔇';
    let x0 = null;
    el.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    el.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) siguiente(dx < 0 ? 1 : -1); });
    el.querySelector('.pantalla-cerrar').onclick = () => { clearTimeout(tempo); if (musica) musica.parar(); if (document.fullscreenElement) document.exitFullscreen().catch(() => { }); el.remove(); };
    try { if (el.requestFullscreen) el.requestFullscreen().catch(() => { }); } catch (e) { }
    siguiente(1);
  }

  function presentacionViaje(v) {
    const { pais, rangoFechas, P } = A();
    const fotos = v.fotos.filter(f => !f.billete && !f.audio && !f.reserva);
    const c = ex(v).cancion;
    const url = c ? (/^https?:/.test(c) ? c : 'https://open.spotify.com/search/' + encodeURIComponent(c)) : '';
    presentacion(`${P.bandera(v.pais)} ${v.ciudad || pais(v.pais).nombre}`, rangoFechas(v.inicio, v.fin), fotos, url);
  }

  // ===================== FOTOLIBRO (imprimir o guardar como PDF) =====================
  function fotolibro(viajes, titulo) {
    const { esc, P, pais, rangoFechas, C, M, calcular } = A();
    const vs = viajes.filter(v => v.inicio || v.fotos.length).sort((a, b) => (a.inicio || '').localeCompare(b.inicio || ''));
    if (!vs.length) { A().toast('No hay viajes para el fotolibro'); return; }
    const s = calcular();
    let pags = `<section class="pagina portada"><div class="portada-mapa">${M.features.length ? M.svgPoster(900, 470) : ''}</div><h1>${esc(titulo)}</h1><p>${esc(C.NOMBRE ? 'Los viajes de ' + C.NOMBRE : C.APP_NOMBRE)}</p><div class="portada-banderas">${[...new Set(vs.map(v => v.pais))].map(c => P.bandera(c)).join(' ')}</div></section>`;
    vs.forEach(v => {
      const e = ex(v);
      const fotos = v.fotos.filter(f => !f.billete && !f.audio && !f.reserva);
      const mejor = [['🍽️', e.comida], ['📍', e.sitio], ['😂', e.anecdota]].filter(x => x[1]);
      pags += `<section class="pagina"><div class="libro-cab"><span>${P.bandera(v.pais)}</span><div><h2>${esc(v.ciudad || pais(v.pais).nombre)}</h2><p>${esc(v.ciudad ? pais(v.pais).nombre + ' · ' : '')}${rangoFechas(v.inicio, v.fin)}${(e.con || []).length ? ' · con ' + esc(e.con.join(', ')) : ''}</p></div></div>
        ${v.diario ? `<p class="libro-diario">${esc(v.diario).replace(/\n/g, '<br>')}</p>` : ''}
        ${mejor.length ? `<div class="libro-mejor">${mejor.map(([i, t]) => `<p>${i} ${esc(t)}</p>`).join('')}</div>` : ''}
        ${(e.dias || []).filter(d => d.texto).slice(0, 6).map(d => `<p class="libro-dia"><b>${d.emoji || '📔'} ${A().fecha(d.fecha)}</b> ${esc(d.texto)}</p>`).join('')}
        <div class="libro-fotos">${fotos.slice(0, 4).map(f => `<img class="${f.instax ? 'instax' : ''}" src="${esc(f.url || f.thumbUrl)}" alt="">`).join('')}</div></section>`;
      for (let k = 4; k < fotos.length; k += 6) pags += `<section class="pagina"><div class="libro-fotos seis">${fotos.slice(k, k + 6).map(f => `<img class="${f.instax ? 'instax' : ''}" src="${esc(f.url || f.thumbUrl)}" alt="">`).join('')}</div><p class="libro-pie">${P.bandera(v.pais)} ${esc(v.ciudad || pais(v.pais).nombre)}</p></section>`;
    });
    pags += `<section class="pagina contraportada"><h2>${s.paises} países · ${s.continentes} continentes · ${A().nf.format(s.km)} km</h2><p>Y los que quedan por venir ✈️</p></section>`;
    const el = capa('fotolibro', `<div class="libro-barra"><b>📖 ${esc(titulo)}</b><button class="btn" data-imprimir>🖨️ Guardar como PDF / imprimir</button></div><p class="nota libro-ayuda">En el móvil: pulsa el botón y elige <b>Guardar como PDF</b> (Android) o <b>Compartir → Guardar en Archivos</b> (iPhone).</p><div class="libro">${pags}</div>`);
    document.body.classList.add('imprimiendo-libro');
    el.querySelector('[data-imprimir]').onclick = () => window.print();
    el.querySelector('.pantalla-cerrar').onclick = () => { document.body.classList.remove('imprimiendo-libro'); el.remove(); };
  }

  function elegirFotolibro() {
    const { abrirHoja, S } = A();
    const años = [...new Set(S.datos.viajes.filter(v => v.inicio).map(v => v.inicio.slice(0, 4)))].sort().reverse();
    const h = abrirHoja(`<h2>📖 Fotolibro</h2><p class="nota">Elige qué viajes quieres en el libro. Después lo guardas como PDF o lo imprimes.</p><div class="plantillas"><button class="plantilla" data-a="todos">🌍 Todos mis viajes</button>${años.map(a => `<button class="plantilla" data-a="${a}">📅 ${a}</button>`).join('')}</div>`);
    h.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      h.cerrar();
      const a = b.dataset.a;
      fotolibro(a === 'todos' ? S.datos.viajes : S.datos.viajes.filter(v => v.inicio && v.inicio.startsWith(a)), a === 'todos' ? 'Mis viajes' : `Mis viajes de ${a}`);
    });
  }

  // ===================== BANDA SONORA =====================
  function renderMusica(cont) {
    const { S, esc, P, pais, toast } = A();
    const vs = S.datos.viajes.filter(v => ex(v).cancion).sort((a, b) => (a.inicio || '').localeCompare(b.inicio || ''));
    if (!vs.length) { cont.innerHTML = '<p class="vacio grande">🎶 Aún no hay canciones.<br><br>Edita un viaje y, en "Lo mejor del viaje y su canción", pon la canción que lo resume.</p>'; return; }
    const url = c => /^https?:/.test(c) ? c : 'https://open.spotify.com/search/' + encodeURIComponent(c);
    cont.innerHTML = `<div class="banda-cab"><span class="disco grande"></span><div><h2>La banda sonora de mis viajes</h2><p>${vs.length} ${vs.length === 1 ? 'canción' : 'canciones'}</p></div></div>
      <div class="banda">${vs.map((v, i) => `<a class="pista" href="${esc(url(ex(v).cancion))}" target="_blank" rel="noopener"><span class="pista-n">${i + 1}</span><div><b>${esc(/^https?:/.test(ex(v).cancion) ? 'Canción de ' + (v.ciudad || pais(v.pais).nombre) : ex(v).cancion)}</b><small>${P.bandera(v.pais)} ${esc(v.ciudad || pais(v.pais).nombre)}${v.inicio ? ' · ' + v.inicio.slice(0, 4) : ''}</small></div><span>▶</span></a>`).join('')}</div>
      <button class="btn sec ancho" data-copiar-lista>📋 Copiar la lista (para crear la playlist en Spotify)</button>`;
    cont.querySelector('[data-copiar-lista]').onclick = async () => {
      const t = 'La banda sonora de mis viajes ✈️\n\n' + vs.map((v, i) => `${i + 1}. ${ex(v).cancion} — ${v.ciudad || pais(v.pais).nombre}`).join('\n');
      try { await navigator.clipboard.writeText(t); toast('Lista copiada 🎶'); } catch (e) { toast('No se pudo copiar'); }
    };
  }

  // ===================== DETALLE DEL VIAJE (secciones nuevas) =====================
  function htmlViaje(v) {
    return htmlPresupuestoViaje(v) + htmlReservas(v) + htmlVuelos(v) +
      `<div class="fila-botones"><button class="btn sec" data-presentacion>🎬 Presentación</button><button class="btn sec" data-fotolibro>📖 Fotolibro</button></div>`;
  }
  function enlazarViaje(v, h, refrescar) {
    enlazarReservas(v, h, refrescar);
    enlazarVuelos(v, h, refrescar);
    const p = h.querySelector('[data-presentacion]'); if (p) p.onclick = () => presentacionViaje(v);
    const f = h.querySelector('[data-fotolibro]'); if (f) f.onclick = () => fotolibro([v], v.ciudad || A().pais(v.pais).nombre);
  }

  window.EXTRAS2 = {
    htmlViaje, enlazarViaje, htmlReservas, enlazarReservas, reservasDe, verReserva, lineasVuelos, statsVuelos,
    htmlPasaporte, enlazarPasaporte, rellenarDestino, datoCurioso, presentacion, presentacionViaje, fotolibro, elegirFotolibro, renderMusica
  };
})();
