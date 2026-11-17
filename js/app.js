// Mis Viajes · lógica de la interfaz
(function () {
  const C = window.CONFIG, P = window.PAISES, S = window.Store, M = window.Mapa;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => [...(el || document).querySelectorAll(sel)];
  const esc = s => (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtMes = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
  const fecha = iso => iso ? fmt.format(new Date(iso + 'T12:00:00')) : '';
  const nf = new Intl.NumberFormat('es-ES');
  const pais = code => P.porCodigo[code] || { code, nombre: code, cont: '', lat: 0, lon: 0 };
  const ls = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };

  const params = new URLSearchParams(location.search);
  const TOKEN_COMPARTIDO = params.get('ver');
  const SOLO_LECTURA = !!TOKEN_COMPARTIDO;
  let vista = 'mapa', modoRasca = ls.get('mv-rasca', false), subVistaViajes = 'linea';

  function rangoFechas(a, b) {
    if (!a) return 'Sin fecha';
    if (!b || a === b) return fecha(a);
    const A = new Date(a + 'T12:00:00'), B = new Date(b + 'T12:00:00');
    if (A.getFullYear() === B.getFullYear()) return `${fmtMes.format(A)} – ${fmt.format(B)}`;
    return `${fecha(a)} – ${fecha(b)}`;
  }
  function dias(a, b) {
    if (!a) return 0;
    return Math.round((new Date((b || a) + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5) + 1;
  }
  function km(lat1, lon1, lat2, lon2) {
    const R = 6371, r = Math.PI / 180;
    const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  function toast(texto) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = texto;
    document.body.appendChild(t); setTimeout(() => t.classList.add('fuera'), 2600); setTimeout(() => t.remove(), 3100);
  }

  // ================= CÁLCULOS =================
  function esFuturo(v) { return v.inicio && v.inicio > hoyISO(); }
  function viajesHechos() { return S.datos.viajes.filter(v => !esFuturo(v)); }

  function calcular() {
    const hechos = viajesHechos();
    const visitados = new Set(hechos.map(v => v.pais));
    if (C.CONTAR_PAIS_DE_CASA && C.CASA.pais) visitados.add(C.CASA.pais);
    const soberanos = [...visitados].filter(c => P.porCodigo[c] && !P.porCodigo[c].territorio);
    const continentes = new Set([...visitados].map(c => pais(c).cont).filter(c => c && c !== 'AN'));
    let kms = 0;
    hechos.forEach(v => {
      const lat = v.lat ?? pais(v.pais).lat, lon = v.lon ?? pais(v.pais).lon;
      if (v.pais === C.CASA.pais && v.lat == null) return;
      kms += 2 * km(C.CASA.lat, C.CASA.lon, lat, lon);
    });
    const primeraVisita = {};
    [...hechos].sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999')).forEach(v => { if (!primeraVisita[v.pais]) primeraVisita[v.pais] = v.inicio || ''; });
    const deseos = new Set(S.datos.deseos.map(d => d.pais).concat(S.datos.viajes.filter(esFuturo).map(v => v.pais)));
    const fotos = S.datos.viajes.reduce((n, v) => n + v.fotos.length, 0);
    const diarios = hechos.filter(v => (v.diario || '').trim().length > 20).length;
    const repetidos = Object.values(hechos.reduce((m, v) => (m[v.pais] = (m[v.pais] || 0) + 1, m), {})).some(n => n > 1);
    return {
      visitados, deseos, primeraVisita,
      paises: soberanos.length, continentes: continentes.size, listaContinentes: continentes,
      porcentaje: Math.min(100, soberanos.length / P.TOTAL_MUNDO * 100),
      km: Math.round(kms), viajes: hechos.length, fotos, diarios, repetidos,
      sola: hechos.some(v => v.sola), sur: [...visitados].some(c => pais(c).lat < 0),
      fueraEuropa: [...visitados].some(c => pais(c).cont && pais(c).cont !== 'EU'),
      numDeseos: S.datos.deseos.length
    };
  }

  function proximo() {
    const hoy = hoyISO();
    const opciones = [
      ...S.datos.viajes.filter(esFuturo).map(v => ({ fecha: v.inicio, pais: v.pais, ciudad: v.ciudad })),
      ...S.datos.deseos.filter(d => d.fecha && d.fecha >= hoy).map(d => ({ fecha: d.fecha, pais: d.pais, ciudad: d.ciudad }))
    ].sort((a, b) => a.fecha.localeCompare(b.fecha));
    return opciones[0] || null;
  }

  const LOGROS = [
    { id: 'p1', icono: '🛫', titulo: 'Primer sello', desc: 'Visita tu primer país', ok: s => s.paises >= 1, prog: s => [s.paises, 1] },
    { id: 'p5', icono: '🗺️', titulo: '5 países', desc: 'Cinco sellos en el pasaporte', ok: s => s.paises >= 5, prog: s => [s.paises, 5] },
    { id: 'p10', icono: '🌍', titulo: '10 países', desc: 'Doble cifra', ok: s => s.paises >= 10, prog: s => [s.paises, 10] },
    { id: 'p25', icono: '🧭', titulo: '25 países', desc: 'Trotamundos de verdad', ok: s => s.paises >= 25, prog: s => [s.paises, 25] },
    { id: 'p50', icono: '👑', titulo: '50 países', desc: 'Leyenda viajera', ok: s => s.paises >= 50, prog: s => [s.paises, 50] },
    { id: 'c3', icono: '🧳', titulo: '3 continentes', desc: 'Tres continentes pisados', ok: s => s.continentes >= 3, prog: s => [s.continentes, 3] },
    { id: 'c5', icono: '🌐', titulo: '5 continentes', desc: 'Casi todo el planeta', ok: s => s.continentes >= 5, prog: s => [s.continentes, 5] },
    { id: 'sola', icono: '🎒', titulo: 'Primer viaje sola', desc: 'Marca un viaje como "viajé sola"', ok: s => s.sola },
    { id: 'fuera', icono: '✈️', titulo: 'Más allá de Europa', desc: 'Sal del continente', ok: s => s.fueraEuropa },
    { id: 'sur', icono: '🧭', titulo: 'Hemisferio sur', desc: 'Cruza el ecuador', ok: s => s.sur },
    { id: 'k10', icono: '🛣️', titulo: '10.000 km', desc: 'Desde Calatayud y vuelta', ok: s => s.km >= 10000, prog: s => [s.km, 10000] },
    { id: 'k40', icono: '🪐', titulo: 'La vuelta al mundo', desc: '40.075 km recorridos', ok: s => s.km >= 40075, prog: s => [s.km, 40075] },
    { id: 'rep', icono: '🔁', titulo: 'Repetidora', desc: 'Vuelve a un país que ya conocías', ok: s => s.repetidos },
    { id: 'diario', icono: '📔', titulo: 'Cuaderno de bitácora', desc: 'Escribe el diario de 10 viajes', ok: s => s.diarios >= 10, prog: s => [s.diarios, 10] },
    { id: 'foto', icono: '📸', titulo: 'Fotógrafa', desc: 'Sube 50 fotos', ok: s => s.fotos >= 50, prog: s => [s.fotos, 50] },
    { id: 'sueno', icono: '✨', titulo: 'Soñadora', desc: '10 destinos en tu lista de sueños', ok: s => s.numDeseos >= 10, prog: s => [s.numDeseos, 10] }
  ];

  // ================= HOJAS (ventanas que suben desde abajo) =================
  function abrirHoja(html, opciones) {
    opciones = opciones || {};
    const capa = document.createElement('div');
    capa.className = 'hoja-capa' + (opciones.completa ? ' completa' : '');
    capa.innerHTML = `<div class="hoja" role="dialog"><div class="hoja-asa"></div><button class="hoja-cerrar" aria-label="Cerrar">✕</button><div class="hoja-cuerpo">${html}</div></div>`;
    document.body.appendChild(capa);
    requestAnimationFrame(() => capa.classList.add('abierta'));
    const cerrar = () => { capa.classList.remove('abierta'); setTimeout(() => capa.remove(), 280); if (opciones.alCerrar) opciones.alCerrar(); };
    capa.addEventListener('click', e => { if (e.target === capa) cerrar(); });
    $('.hoja-cerrar', capa).onclick = cerrar;
    capa.cerrar = cerrar;
    return capa;
  }
  function confirmar(texto, botonSi) {
    return new Promise(res => {
      const h = abrirHoja(`<p class="confirmar-texto">${esc(texto)}</p><div class="fila-botones"><button class="btn sec" data-no>Cancelar</button><button class="btn peligro" data-si>${esc(botonSi || 'Borrar')}</button></div>`, { alCerrar: () => res(false) });
      $('[data-no]', h).onclick = () => h.cerrar();
      $('[data-si]', h).onclick = () => { res(true); h.remove(); };
    });
  }

  // ================= RENDER PRINCIPAL =================
  function render() {
    const s = calcular();
    $$('.tab').forEach(t => t.classList.toggle('activa', t.dataset.vista === vista));
    $$('.vista').forEach(v => v.hidden = v.id !== 'vista-' + vista);
    $('#fab').hidden = SOLO_LECTURA || !['mapa', 'viajes', 'suenos'].includes(vista);
    pintarMapa(s);
    renderInicio(s);
    if (vista === 'viajes') renderViajes();
    if (vista === 'pasaporte') renderPasaporte(s);
    if (vista === 'suenos') renderSuenos();
    if (vista === 'mas') renderMas();
  }

  function pintarMapa(s) {
    const estado = {};
    s.deseos.forEach(c => estado[c] = 'deseo');
    s.visitados.forEach(c => estado[c] = 'visitado');
    if (C.CONTAR_PAIS_DE_CASA && C.CASA.pais && !viajesHechos().some(v => v.pais === C.CASA.pais)) estado[C.CASA.pais] = 'casa';
    const pins = [
      ...viajesHechos().filter(v => v.lat != null).map(v => ({ lat: v.lat, lon: v.lon, pais: v.pais, tipo: 'viaje' })),
      ...S.datos.deseos.filter(d => d.lat != null).map(d => ({ lat: d.lat, lon: d.lon, pais: d.pais, tipo: 'deseo' }))
    ];
    M.pintar(estado, pins, modoRasca);
  }

  function renderInicio(s) {
    const prox = proximo();
    const cd = $('#cuenta-atras');
    if (prox) {
      const d = Math.ceil((new Date(prox.fecha + 'T00:00:00') - new Date(hoyISO() + 'T00:00:00')) / 864e5);
      const destino = prox.ciudad || pais(prox.pais).nombre;
      cd.innerHTML = `<span class="cd-bandera">${P.bandera(prox.pais)}</span><div><div class="cd-num">${d === 0 ? '¡Es hoy!' : d === 1 ? '¡Mañana!' : `Faltan <b>${d}</b> días`}</div><div class="cd-dest">para ${esc(destino)} · ${fecha(prox.fecha)}</div></div>`;
      cd.hidden = false;
    } else cd.hidden = true;
    $('#stats').innerHTML = [
      ['Países', s.paises], ['Continentes', `${s.continentes}<small>/6</small>`],
      ['Del mundo', `${s.porcentaje.toFixed(s.porcentaje < 10 ? 1 : 0).replace('.', ',')}<small>%</small>`], ['Km', nf.format(s.km)]
    ].map(([t, v]) => `<div class="stat"><div class="stat-v">${v}</div><div class="stat-t">${t}</div></div>`).join('');
    $('#barra-mundo').style.width = s.porcentaje + '%';
    $('#btn-rasca').classList.toggle('on', modoRasca);
  }

  // ================= FICHA DE PAÍS =================
  function abrirPais(code) {
    const p = pais(code);
    M.enfocar(code);
    const viajes = S.datos.viajes.filter(v => v.pais === code).sort((a, b) => (b.inicio || '').localeCompare(a.inicio || ''));
    const deseo = S.datos.deseos.find(d => d.pais === code);
    const esCasa = code === C.CASA.pais;
    const hechos = viajes.filter(v => !esFuturo(v));
    let estadoTxt = hechos.length ? `${hechos.length} ${hechos.length === 1 ? 'viaje' : 'viajes'}` : esCasa ? 'Tu casa 🏠' : deseo ? 'En tu lista de sueños ✨' : 'Aún sin visitar';
    const html = `
      <div class="pais-cab"><span class="pais-bandera">${P.bandera(code)}</span><div><h2>${esc(p.nombre)}</h2><div class="sub">${esc(P.CONTINENTES[p.cont] || '')} · ${estadoTxt}</div></div></div>
      <div class="lista-viajes">${viajes.map(tarjetaViaje).join('') || '<p class="vacio">Todavía no hay viajes aquí.</p>'}</div>
      ${SOLO_LECTURA ? '' : `<div class="fila-botones">
        <button class="btn" data-nuevo>＋ Añadir viaje</button>
        ${hechos.length ? '' : deseo ? `<button class="btn sec" data-quitar-deseo>Quitar de sueños</button>` : `<button class="btn sec" data-deseo>✨ Quiero ir</button>`}
      </div>`}`;
    const h = abrirHoja(html, { alCerrar: () => M.reset() });
    enlazarTarjetas(h);
    const b = $('[data-nuevo]', h); if (b) b.onclick = () => formViaje({ pais: code });
    const d = $('[data-deseo]', h); if (d) d.onclick = () => { h.cerrar(); formDeseo({ pais: code }); };
    const q = $('[data-quitar-deseo]', h); if (q) q.onclick = async () => { await S.borrarDeseo(deseo.id); h.cerrar(); render(); };
  }

  function tarjetaViaje(v) {
    const fotos = v.fotos.slice(0, 4).map(f => `<img src="${esc(f.thumbUrl)}" alt="" loading="lazy">`).join('');
    return `<button class="tarjeta-viaje${esFuturo(v) ? ' futuro' : ''}" data-viaje="${v.id}">
      <div class="tv-cab"><span class="tv-bandera">${P.bandera(v.pais)}</span><div class="tv-txt"><b>${esc(v.ciudad || pais(v.pais).nombre)}</b><span>${rangoFechas(v.inicio, v.fin)}${esFuturo(v) ? ' · próximo' : ''}${v.sola ? ' · 🎒 sola' : ''}</span></div></div>
      ${fotos ? `<div class="tv-fotos">${fotos}${v.fotos.length > 4 ? `<span class="mas-fotos">+${v.fotos.length - 4}</span>` : ''}</div>` : ''}
      ${v.diario ? `<p class="tv-diario">${esc(v.diario.slice(0, 140))}${v.diario.length > 140 ? '…' : ''}</p>` : ''}
    </button>`;
  }
  function enlazarTarjetas(el) {
    $$('[data-viaje]', el).forEach(b => b.onclick = () => abrirViaje(b.dataset.viaje));
  }

  // ================= DETALLE DE VIAJE =================
  function abrirViaje(id) {
    const v = S.datos.viajes.find(x => x.id === id);
    if (!v) return;
    const p = pais(v.pais);
    const n = dias(v.inicio, v.fin);
    const html = `
      <div class="pais-cab"><span class="pais-bandera">${P.bandera(v.pais)}</span><div><h2>${esc(v.ciudad || p.nombre)}</h2><div class="sub">${esc(v.ciudad ? p.nombre + ' · ' : '')}${rangoFechas(v.inicio, v.fin)}${n > 1 ? ` · ${n} días` : ''}</div></div></div>
      ${v.sola ? '<div class="chip">🎒 Viajé sola</div>' : ''}
      <div class="galeria">${v.fotos.map((f, i) => `<button class="foto${f.instax ? ' instax' : ''}" data-i="${i}"><img src="${esc(f.thumbUrl)}" alt="" loading="lazy"></button>`).join('')}</div>
      ${v.diario ? `<div class="diario"><h3>Diario</h3><p>${esc(v.diario).replace(/\n/g, '<br>')}</p></div>` : ''}
      ${SOLO_LECTURA ? '' : `<div class="fila-botones">
        <label class="btn sec">📷 Añadir fotos<input type="file" accept="image/*" multiple hidden data-fotos></label>
        <button class="btn sec" data-editar>✏️ Editar</button>
      </div>
      <label class="check"><input type="checkbox" data-instax> Las fotos que añada son Instax escaneadas</label>
      <button class="btn-link peligro" data-borrar>Borrar este viaje</button>`}`;
    const h = abrirHoja(html, { completa: true });
    $$('.foto', h).forEach(b => b.onclick = () => verFoto(v, +b.dataset.i));
    if (SOLO_LECTURA) return;
    $('[data-editar]', h).onclick = () => { h.cerrar(); formViaje(v); };
    $('[data-borrar]', h).onclick = async () => {
      if (await confirmar(`¿Borrar el viaje a ${v.ciudad || p.nombre} y sus fotos?`)) {
        await S.borrarViaje(v.id); h.cerrar(); $$('.hoja-capa').forEach(x => x.cerrar && x.cerrar()); render(); toast('Viaje borrado');
      }
    };
    $('[data-fotos]', h).onchange = async e => {
      const files = [...e.target.files]; if (!files.length) return;
      await subirFotos(v, files, $('[data-instax]', h).checked);
      h.remove(); abrirViaje(v.id); render();
    };
  }

  async function subirFotos(v, files, instax) {
    const aviso = document.createElement('div'); aviso.className = 'subiendo'; document.body.appendChild(aviso);
    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      aviso.textContent = `Subiendo foto ${i + 1} de ${files.length}…`;
      try { await S.subirFoto(v, files[i], instax); ok++; } catch (err) { console.error(err); toast('Una foto no se pudo subir'); }
    }
    aviso.remove();
    if (ok) toast(ok === 1 ? 'Foto guardada' : `${ok} fotos guardadas`);
  }

  function verFoto(v, i) {
    const capa = document.createElement('div'); capa.className = 'visor';
    const pintar = () => {
      const f = v.fotos[i];
      capa.innerHTML = `<img src="${esc(f.url || f.thumbUrl)}" alt="">
        <div class="visor-barra">${SOLO_LECTURA ? '' : `<button data-instax>${f.instax ? '✓ Instax' : 'Marcar Instax'}</button><button data-borrar>🗑</button>`}<span>${i + 1}/${v.fotos.length}</span><button data-cerrar>✕</button></div>
        ${i > 0 ? '<button class="visor-ant" data-ant>‹</button>' : ''}${i < v.fotos.length - 1 ? '<button class="visor-sig" data-sig>›</button>' : ''}`;
      const on = (s, fn) => { const b = $(s, capa); if (b) b.onclick = e => { e.stopPropagation(); fn(); }; };
      on('[data-cerrar]', () => capa.remove());
      on('[data-ant]', () => { i--; pintar(); });
      on('[data-sig]', () => { i++; pintar(); });
      on('[data-instax]', async () => { await S.marcarInstax(v, f, !f.instax); pintar(); });
      on('[data-borrar]', async () => {
        if (await confirmar('¿Borrar esta foto?')) {
          await S.borrarFoto(v, f.id); capa.remove(); $$('.hoja-capa').forEach(x => x.remove()); abrirViaje(v.id); render();
        }
      });
    };
    let x0 = null;
    capa.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    capa.addEventListener('touchend', e => {
      if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (dx > 50 && i > 0) { i--; pintar(); } else if (dx < -50 && i < v.fotos.length - 1) { i++; pintar(); }
    });
    capa.onclick = e => { if (e.target === capa || e.target.tagName === 'IMG') capa.remove(); };
    document.body.appendChild(capa); pintar();
  }

  // ================= SELECTOR DE PAÍS Y LUGAR =================
  function selectorPais(cont, codeInicial, onCambio) {
    cont.innerHTML = `<input type="search" class="campo" placeholder="Escribe el país…" autocomplete="off"><div class="sugerencias"></div>`;
    const inp = $('input', cont), sug = $('.sugerencias', cont);
    let actual = codeInicial || '';
    const fija = code => { actual = code; inp.value = code ? `${P.bandera(code)} ${pais(code).nombre}` : ''; sug.innerHTML = ''; onCambio(code); };
    if (codeInicial) fija(codeInicial);
    inp.onfocus = () => { if (actual) inp.select(); };
    inp.oninput = () => {
      const n = P.normaliza(inp.value.replace(/^\S+\s/, m => /\p{Regional_Indicator}/u.test(m) ? '' : m));
      if (!n) { sug.innerHTML = ''; return; }
      const res = P.lista.filter(p => P.normaliza(p.nombre).includes(n)).sort((a, b) => P.normaliza(a.nombre).indexOf(n) - P.normaliza(b.nombre).indexOf(n)).slice(0, 7);
      sug.innerHTML = res.map(p => `<button type="button" data-c="${p.code}">${P.bandera(p.code)} ${esc(p.nombre)}</button>`).join('');
      $$('button', sug).forEach(b => b.onclick = () => fija(b.dataset.c));
    };
    return { get: () => actual };
  }

  function selectorLugar(cont, obj, getPais) {
    cont.innerHTML = `<div class="fila-buscar"><input class="campo" placeholder="Ciudad o lugar (opcional)" value="${esc(obj.ciudad || '')}"><button type="button" class="btn sec mini">Buscar</button></div><div class="sugerencias"></div><div class="lugar-ok">${obj.lat != null ? '📍 Ubicado en el mapa' : ''}</div>`;
    const inp = $('input', cont), sug = $('.sugerencias', cont), ok = $('.lugar-ok', cont);
    inp.oninput = () => { obj.ciudad = inp.value; obj.lat = null; obj.lon = null; ok.textContent = ''; };
    const buscar = async () => {
      if (!inp.value.trim()) return;
      sug.innerHTML = '<div class="cargando">Buscando…</div>';
      try {
        const res = await S.buscarLugar(inp.value.trim(), getPais());
        if (!res.length) { sug.innerHTML = '<div class="cargando">No encontrado. Se guardará igual, sin chincheta exacta.</div>'; return; }
        sug.innerHTML = res.map((r, i) => `<button type="button" data-i="${i}">📍 ${esc(r.nombre)} <small>${esc(r.detalle)}</small></button>`).join('');
        $$('button', sug).forEach(b => b.onclick = () => {
          const r = res[+b.dataset.i];
          obj.ciudad = r.nombre; obj.lat = r.lat; obj.lon = r.lon; inp.value = r.nombre;
          sug.innerHTML = ''; ok.textContent = '📍 Ubicado en el mapa';
        });
      } catch (e) { sug.innerHTML = '<div class="cargando">Sin conexión con el buscador. Se guardará sin chincheta.</div>'; }
    };
    $('button', cont).onclick = buscar;
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } };
  }

  // ================= FORMULARIO DE VIAJE =================
  function formViaje(original, alGuardar) {
    const v = Object.assign({ pais: '', ciudad: '', lat: null, lon: null, inicio: '', fin: '', diario: '', sola: false, fotos: [] }, original);
    const nuevo = !v.id;
    const html = `<h2>${nuevo ? 'Nuevo viaje' : 'Editar viaje'}</h2>
      <form class="form">
        <label>País</label><div data-pais></div>
        <label>Ciudad</label><div data-lugar></div>
        <div class="fila2"><div><label>Desde</label><input type="date" class="campo" name="inicio" value="${v.inicio}"></div>
        <div><label>Hasta</label><input type="date" class="campo" name="fin" value="${v.fin}"></div></div>
        <label class="check"><input type="checkbox" name="sola" ${v.sola ? 'checked' : ''}> 🎒 Viajé sola</label>
        <label>Diario</label><textarea class="campo" name="diario" rows="5" placeholder="¿Qué fue lo mejor? ¿Qué comiste? ¿Alguna anécdota?">${esc(v.diario)}</textarea>
        ${nuevo ? `<label>Fotos</label><label class="btn sec ancho">📷 Elegir fotos<input type="file" accept="image/*" multiple hidden name="fotos"></label><div class="n-fotos"></div>
        <label class="check"><input type="checkbox" name="instax"> Son fotos Instax escaneadas</label>` : ''}
        <button class="btn ancho" type="submit">Guardar</button>
      </form>`;
    const h = abrirHoja(html, { completa: true });
    const f = $('form', h);
    const sp = selectorPais($('[data-pais]', h), v.pais, c => v.pais = c);
    selectorLugar($('[data-lugar]', h), v, () => sp.get());
    let files = [];
    if (nuevo) $('[name=fotos]', f).onchange = e => { files = [...e.target.files]; $('.n-fotos', h).textContent = files.length ? `${files.length} foto${files.length > 1 ? 's' : ''} seleccionada${files.length > 1 ? 's' : ''}` : ''; };
    f.onsubmit = async e => {
      e.preventDefault();
      if (!v.pais) { toast('Elige un país'); return; }
      v.inicio = f.inicio.value; v.fin = f.fin.value && f.fin.value >= v.inicio ? f.fin.value : '';
      v.sola = f.sola.checked; v.diario = f.diario.value.trim();
      const antes = calcular().visitados;
      const btn = $('[type=submit]', f); btn.disabled = true; btn.textContent = 'Guardando…';
      try {
        const guardado = await S.guardarViaje(v);
        if (files.length) await subirFotos(guardado, files, f.instax.checked);
        h.cerrar(); $$('.hoja-capa').forEach(x => x.remove());
        if (alGuardar) await alGuardar(guardado);
        render();
        if (!antes.has(v.pais) && !esFuturo(v)) rascarSello(v.pais, v.inicio);
        else toast(nuevo ? 'Viaje guardado ✈️' : 'Cambios guardados');
      } catch (err) { console.error(err); toast('No se pudo guardar. ¿Hay conexión?'); btn.disabled = false; btn.textContent = 'Guardar'; }
    };
  }

  // ================= RASCA Y DESCUBRE (nuevo país) =================
  function rascarSello(code, iso) {
    const p = pais(code);
    const capa = document.createElement('div'); capa.className = 'rasca-capa';
    capa.innerHTML = `<div class="rasca-caja"><p class="rasca-tit">¡Nuevo país!</p><p class="rasca-sub">Rasca para descubrir tu sello</p>
      <div class="rasca-zona"><div class="sello grande" style="--rot:-6deg;--c:${colorSello(code)}">${selloInterior(code, iso || hoyISO())}</div><canvas></canvas></div>
      <button class="btn ancho" data-ok>¡Al pasaporte!</button></div>`;
    document.body.appendChild(capa);
    const cv = $('canvas', capa), zona = $('.rasca-zona', capa);
    const r = zona.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const grad = ctx.createLinearGradient(0, 0, r.width, r.height);
    grad.addColorStop(0, '#b8963e'); grad.addColorStop(0.5, '#f0dc9a'); grad.addColorStop(1, '#a8842f');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, r.width, r.height);
    ctx.fillStyle = 'rgba(80,60,10,.55)'; ctx.font = '600 15px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('✦ RASCA AQUÍ ✦', r.width / 2, r.height / 2 + 5);
    ctx.globalCompositeOperation = 'destination-out'; ctx.lineCap = 'round'; ctx.lineWidth = 38;
    let ultimo = null, revelado = false;
    const pos = e => { const b = cv.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return [t.clientX - b.left, t.clientY - b.top]; };
    const mover = e => {
      if (!ultimo || revelado) return; e.preventDefault();
      const p2 = pos(e); ctx.beginPath(); ctx.moveTo(...ultimo); ctx.lineTo(...p2); ctx.stroke(); ultimo = p2;
    };
    const fin = () => {
      ultimo = null; if (revelado) return;
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let vacio = 0;
      for (let i = 3; i < d.length; i += 64) if (d[i] === 0) vacio++;
      if (vacio / (d.length / 64) > 0.5) descubrir();
    };
    const descubrir = () => { revelado = true; cv.classList.add('fuera'); zona.classList.add('brilla'); M.revelar(code); };
    cv.addEventListener('pointerdown', e => { ultimo = pos(e); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', mover);
    cv.addEventListener('pointerup', fin);
    cv.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    $('[data-ok]', capa).onclick = () => { if (!revelado) { descubrir(); setTimeout(() => capa.remove(), 900); } else capa.remove(); };
  }

  // ================= SELLOS =================
  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
  function colorSello(code) { return ['#b5423a', '#2d5f8b', '#3f7d4e', '#7b4b94', '#a8662a', '#1f6f73'][hash(code) % 6]; }
  function selloInterior(code, iso) {
    const p = pais(code);
    return `<span class="s-flag">${P.bandera(code)}</span><span class="s-nom">${esc(p.nombre)}</span><span class="s-fecha">${iso ? new Date(iso + 'T12:00:00').getFullYear() : '★'}</span>`;
  }

  // ================= VISTA: VIAJES =================
  function renderViajes() {
    $$('#seg-viajes button').forEach(b => b.classList.toggle('on', b.dataset.sub === subVistaViajes));
    const cont = $('#viajes-contenido');
    const todos = [...S.datos.viajes].sort((a, b) => (b.inicio || '0').localeCompare(a.inicio || '0'));
    if (!todos.length) { cont.innerHTML = '<p class="vacio grande">Aún no hay viajes. Pulsa ＋ para añadir el primero.</p>'; return; }
    if (subVistaViajes === 'linea') {
      let anio = null, html = '<div class="linea">';
      todos.forEach(v => {
        const a = v.inicio ? v.inicio.slice(0, 4) : 'Sin fecha';
        if (a !== anio) { html += `<div class="linea-anio">${a}</div>`; anio = a; }
        html += `<div class="linea-item">${tarjetaViaje(v)}</div>`;
      });
      const primero = todos.filter(v => v.inicio).slice(-1)[0];
      if (primero) html += `<div class="linea-inicio">🌱 Aquí empezó todo · ${fecha(primero.inicio)}</div>`;
      cont.innerHTML = html + '</div>';
      enlazarTarjetas(cont);
    } else {
      const soloInstax = subVistaViajes === 'instax';
      const grupos = todos.map(v => ({ v, fotos: v.fotos.map((f, i) => ({ f, i })).filter(x => !soloInstax || x.f.instax) })).filter(g => g.fotos.length);
      if (!grupos.length) { cont.innerHTML = `<p class="vacio grande">${soloInstax ? 'Aún no hay fotos Instax. Al subir fotos, marca "Son fotos Instax escaneadas".' : 'Aún no hay fotos.'}</p>`; return; }
      cont.innerHTML = grupos.map(g => `<div class="gal-grupo"><button class="gal-tit" data-viaje="${g.v.id}">${P.bandera(g.v.pais)} ${esc(g.v.ciudad || pais(g.v.pais).nombre)} <small>${rangoFechas(g.v.inicio, g.v.fin)}</small></button>
        <div class="galeria${soloInstax ? ' modo-instax' : ''}">${g.fotos.map(x => `<button class="foto${x.f.instax ? ' instax' : ''}" data-v="${g.v.id}" data-i="${x.i}"><img src="${esc(x.f.thumbUrl)}" alt="" loading="lazy"></button>`).join('')}</div></div>`).join('');
      enlazarTarjetas(cont);
      $$('.foto', cont).forEach(b => b.onclick = () => verFoto(S.datos.viajes.find(v => v.id === b.dataset.v), +b.dataset.i));
    }
  }

  // ================= VISTA: PASAPORTE =================
  function renderPasaporte(s) {
    const codigos = Object.keys(s.primeraVisita).sort((a, b) => (s.primeraVisita[a] || '9').localeCompare(s.primeraVisita[b] || '9'));
    if (C.CONTAR_PAIS_DE_CASA && !codigos.includes(C.CASA.pais)) codigos.unshift(C.CASA.pais);
    $('#pasaporte-nombre').textContent = C.NOMBRE || 'Viajera';
    $('#pasaporte-num').textContent = `${s.paises} ${s.paises === 1 ? 'país' : 'países'} · ${s.continentes} ${s.continentes === 1 ? 'continente' : 'continentes'}`;
    $('#sellos').innerHTML = codigos.map(c => `<button class="sello" data-c="${c}" style="--rot:${(hash(c) % 17) - 8}deg;--c:${colorSello(c)}">${selloInterior(c, s.primeraVisita[c])}</button>`).join('');
    $$('#sellos .sello').forEach(b => b.onclick = () => abrirPais(b.dataset.c));
    const ok = LOGROS.filter(l => l.ok(s)).length;
    $('#logros-num').textContent = `${ok} de ${LOGROS.length}`;
    $('#logros').innerHTML = LOGROS.map(l => {
      const hecho = l.ok(s);
      let barra = '';
      if (!hecho && l.prog) { const [a, b] = l.prog(s); barra = `<div class="logro-barra"><i style="width:${Math.min(100, a / b * 100)}%"></i></div><small>${nf.format(a)} / ${nf.format(b)}</small>`; }
      return `<div class="logro${hecho ? ' hecho' : ''}"><span class="logro-ico">${hecho ? l.icono : '🔒'}</span><div><b>${l.titulo}</b><span>${l.desc}</span>${barra}</div></div>`;
    }).join('');
  }

  // ================= VISTA: SUEÑOS =================
  function renderSuenos() {
    const cont = $('#suenos-lista');
    const futuros = S.datos.viajes.filter(esFuturo).sort((a, b) => a.inicio.localeCompare(b.inicio));
    const ds = [...S.datos.deseos].sort((a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999'));
    let html = '';
    if (futuros.length) html += `<h3 class="sec-tit">Próximos viajes</h3>` + futuros.map(tarjetaViaje).join('');
    html += `<h3 class="sec-tit">Lugares que quiero visitar</h3>`;
    html += ds.length ? ds.map(d => `<div class="deseo">
        <span class="tv-bandera">${P.bandera(d.pais)}</span>
        <div class="tv-txt"><b>${esc(d.ciudad || pais(d.pais).nombre)}</b><span>${esc(d.ciudad ? pais(d.pais).nombre : P.CONTINENTES[pais(d.pais).cont] || '')}${d.fecha ? ' · ' + fecha(d.fecha) : ''}</span>${d.nota ? `<p>${esc(d.nota)}</p>` : ''}</div>
        <div class="deseo-acc">${SOLO_LECTURA ? '' : `<button class="btn mini" data-fui="${d.id}">¡Ya fui!</button><button class="btn-icono" data-ed="${d.id}" aria-label="Editar">✏️</button>`}</div>
      </div>`).join('') : '<p class="vacio">Pulsa ＋ para añadir un destino soñado, o toca un país del mapa y elige "Quiero ir".</p>';
    cont.innerHTML = html;
    enlazarTarjetas(cont);
    $$('[data-fui]', cont).forEach(b => b.onclick = () => {
      const d = S.datos.deseos.find(x => x.id === b.dataset.fui);
      formViaje({ pais: d.pais, ciudad: d.ciudad, lat: d.lat, lon: d.lon, inicio: d.fecha || '' }, async () => { await S.borrarDeseo(d.id); });
    });
    $$('[data-ed]', cont).forEach(b => b.onclick = () => formDeseo(S.datos.deseos.find(x => x.id === b.dataset.ed)));
  }

  function formDeseo(original) {
    const d = Object.assign({ pais: '', ciudad: '', lat: null, lon: null, nota: '', fecha: '' }, original);
    const h = abrirHoja(`<h2>${d.id ? 'Editar destino' : 'Nuevo destino soñado'}</h2>
      <form class="form"><label>País</label><div data-pais></div><label>Ciudad</label><div data-lugar></div>
      <label>Fecha prevista (si ya lo tienes planeado)</label><input type="date" class="campo" name="fecha" value="${d.fecha}">
      <label>Nota</label><textarea class="campo" name="nota" rows="3" placeholder="¿Por qué quieres ir? ¿Qué quieres ver?">${esc(d.nota)}</textarea>
      <button class="btn ancho" type="submit">Guardar</button>${d.id ? '<button type="button" class="btn-link peligro" data-borrar>Quitar de la lista</button>' : ''}</form>`, { completa: true });
    const sp = selectorPais($('[data-pais]', h), d.pais, c => d.pais = c);
    selectorLugar($('[data-lugar]', h), d, () => sp.get());
    const f = $('form', h);
    f.onsubmit = async e => {
      e.preventDefault(); if (!d.pais) { toast('Elige un país'); return; }
      d.fecha = f.fecha.value; d.nota = f.nota.value.trim();
      try { await S.guardarDeseo(d); h.cerrar(); render(); toast('Añadido a tus sueños ✨'); } catch (err) { toast('No se pudo guardar'); }
    };
    const b = $('[data-borrar]', h); if (b) b.onclick = async () => { await S.borrarDeseo(d.id); h.cerrar(); render(); };
  }

  // ================= VISTA: MÁS =================
  const MALETA_BASE = ['DNI / pasaporte', 'Tarjeta sanitaria europea', 'Cargador del móvil', 'Batería externa', 'Adaptador de enchufe', 'Instax y carretes 📸', 'Auriculares', 'Neceser', 'Pijama', 'Chaqueta', 'Gafas de sol', 'Medicinas básicas', 'Reservas descargadas', 'Botella de agua vacía'];
  function renderMas() {
    if (SOLO_LECTURA) { $('#vista-mas').innerHTML = '<p class="vacio grande">Estás viendo un mapa compartido.</p>'; return; }
    const aj = S.datos.ajustes;
    if (!aj.maleta || !aj.maleta.length) aj.maleta = MALETA_BASE.map(t => ({ t, ok: false }));
    const hechos = aj.maleta.filter(x => x.ok).length;
    $('#maleta').innerHTML = `<div class="maleta-cab"><span>${hechos}/${aj.maleta.length} listo</span><button class="btn-link" data-reset>Desmarcar todo</button></div>
      ${aj.maleta.map((x, i) => `<div class="maleta-item${x.ok ? ' ok' : ''}"><label><input type="checkbox" data-i="${i}" ${x.ok ? 'checked' : ''}> ${esc(x.t)}</label><button class="btn-icono" data-del="${i}" aria-label="Quitar">✕</button></div>`).join('')}
      <form class="fila-buscar" data-add><input class="campo" placeholder="Añadir a la maleta…"><button class="btn mini">＋</button></form>`;
    const guarda = () => S.guardarAjustes({ maleta: aj.maleta }).catch(() => toast('Sin conexión: se guardará en este móvil'));
    $$('#maleta [data-i]').forEach(c => c.onchange = () => { aj.maleta[+c.dataset.i].ok = c.checked; guarda(); renderMas(); });
    $$('#maleta [data-del]').forEach(b => b.onclick = () => { aj.maleta.splice(+b.dataset.del, 1); guarda(); renderMas(); });
    $('#maleta [data-reset]').onclick = () => { aj.maleta.forEach(x => x.ok = false); guarda(); renderMas(); };
    $('#maleta [data-add]').onsubmit = e => { e.preventDefault(); const v = $('input', e.target).value.trim(); if (v) { aj.maleta.push({ t: v, ok: false }); guarda(); renderMas(); } };

    const comp = $('#compartir');
    if (S.MODO_PRUEBA) comp.innerHTML = '<p class="nota">Disponible cuando la app esté conectada a Supabase.</p>';
    else {
      const enlace = `${location.origin}${location.pathname}?ver=${aj.token}`;
      comp.innerHTML = `<label class="interruptor"><input type="checkbox" data-on ${aj.compartir ? 'checked' : ''}><span></span> Compartir mi mapa con un enlace</label>
        ${aj.compartir ? `<label class="interruptor"><input type="checkbox" data-diario ${aj.compartir_diario ? 'checked' : ''}><span></span> Mostrar también los diarios</label>
        <div class="enlace">${esc(enlace)}</div><button class="btn sec ancho" data-copiar>Enviar enlace</button>
        <p class="nota">Quien tenga el enlace ve tu mapa, tus estadísticas y la lista de viajes. Las fotos siempre son privadas.</p>` : '<p class="nota">Ahora mismo solo tú puedes ver tus viajes.</p>'}`;
      $('[data-on]', comp).onchange = async e => { await S.guardarAjustes({ compartir: e.target.checked }); renderMas(); };
      const di = $('[data-diario]', comp); if (di) di.onchange = async e => { await S.guardarAjustes({ compartir_diario: e.target.checked }); };
      const cp = $('[data-copiar]', comp); if (cp) cp.onclick = async () => {
        try { if (navigator.share) await navigator.share({ title: C.APP_NOMBRE, url: enlace }); else { await navigator.clipboard.writeText(enlace); toast('Enlace copiado'); } } catch (e) { }
      };
    }
    $('#cuenta').innerHTML = S.MODO_PRUEBA
      ? '<p class="nota">Modo prueba: los datos se guardan solo en este navegador.</p><button class="btn-link" data-demo>Cargar viajes de ejemplo</button>'
      : `<p class="nota">Sesión iniciada como <b>${esc(S.email)}</b></p><button class="btn sec ancho" data-pass>Cambiar contraseña</button><button class="btn-link peligro" data-salir>Cerrar sesión</button>`;
    const dm = $('[data-demo]'); if (dm) dm.onclick = cargarEjemplo;
    const ps = $('[data-pass]'); if (ps) ps.onclick = cambiarPass;
    const sl = $('[data-salir]'); if (sl) sl.onclick = async () => { if (await confirmar('¿Cerrar sesión en este dispositivo?', 'Cerrar sesión')) { S.salir(); location.reload(); } };
  }

  function cambiarPass() {
    const h = abrirHoja(`<h2>Cambiar contraseña</h2><form class="form"><input type="password" class="campo" name="p" minlength="6" placeholder="Nueva contraseña (mín. 6)" required autocomplete="new-password"><button class="btn ancho">Guardar</button></form>`);
    $('form', h).onsubmit = async e => { e.preventDefault(); try { await S.cambiarPassword(e.target.p.value); h.cerrar(); toast('Contraseña cambiada'); } catch (err) { toast('No se pudo cambiar'); } };
  }

  function importar() {
    const h = abrirHoja(`<h2>Importar viajes</h2>
      <p class="nota">Una línea por viaje, separando con punto y coma:<br><code>País; Ciudad; fecha inicio; fecha fin; nota</code><br>Fechas como 2023-08-14 o 14/08/2023. Para la lista de sueños empieza la línea con <code>*</code>.</p>
      <textarea class="campo mono" rows="9" placeholder="Italia; Roma; 12/04/2023; 16/04/2023; Primer viaje con amigas&#10;Japón; Tokio; 2024-10-01; 2024-10-12; &#10;* Islandia; ; ; ; Ver auroras"></textarea>
      <label class="check"><input type="checkbox" checked data-geo> Buscar cada ciudad en el mapa (1 por segundo)</label>
      <button class="btn ancho" data-ir>Importar</button><div class="import-log"></div>`, { completa: true });
    $('[data-ir]', h).onclick = async () => {
      const lineas = $('textarea', h).value.split('\n').map(l => l.trim()).filter(Boolean);
      const log = $('.import-log', h), geo = $('[data-geo]', h).checked;
      const aISO = s => { s = (s || '').trim(); let m; if ((m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; if (/^\d{4}$/.test(s)) return s + '-01-01'; return ''; };
      let ok = 0;
      for (const l of lineas) {
        const deseo = l.startsWith('*');
        const [paisTxt, ciudad, ini, fin, nota] = l.replace(/^\*/, '').split(';').map(x => (x || '').trim());
        const p = P.buscaPais(paisTxt);
        if (!p) { log.innerHTML += `<div class="err">❌ País no reconocido: ${esc(paisTxt)}</div>`; continue; }
        const obj = { pais: p.code, ciudad, lat: null, lon: null };
        if (ciudad && geo) { try { const r = await S.buscarLugar(ciudad, p.code); if (r[0]) { obj.lat = r[0].lat; obj.lon = r[0].lon; } } catch (e) { } }
        try {
          if (deseo) await S.guardarDeseo(Object.assign(obj, { nota: nota || '', fecha: aISO(ini) }));
          else await S.guardarViaje(Object.assign(obj, { inicio: aISO(ini), fin: aISO(fin), diario: nota || '', sola: false, fotos: [] }));
          ok++; log.innerHTML += `<div>✅ ${P.bandera(p.code)} ${esc(ciudad || p.nombre)}</div>`;
        } catch (e) { log.innerHTML += `<div class="err">❌ Error guardando ${esc(l)}</div>`; }
      }
      log.innerHTML += `<p><b>${ok} importados.</b></p>`; render();
    };
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(S.exportar(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `mis-viajes-${hoyISO()}.json`; a.click();
  }

  async function cargarEjemplo() {
    const ej = [
      ['FR', 'París', 48.8566, 2.3522, '2019-07-10', '2019-07-14', 'Torre Eiffel de noche, crepes en Montmartre y un picnic junto al Sena.'],
      ['IT', 'Roma', 41.9028, 12.4964, '2021-04-02', '2021-04-06', 'Lancé la moneda a la Fontana di Trevi, así que tendré que volver.'],
      ['PT', 'Oporto', 41.1579, -8.6291, '2022-03-18', '2022-03-20', ''],
      ['GB', 'Londres', 51.5072, -0.1276, '2023-02-10', '2023-02-14', 'Musicales en el West End y mercado de Camden.'],
      ['MA', 'Marrakech', 31.6295, -7.9811, '2023-10-05', '2023-10-09', 'El zoco, el té a la menta y una noche en el desierto.'],
      ['TH', 'Bangkok', 13.7563, 100.5018, '2024-08-01', '2024-08-15', 'Primer viaje largo yo sola. Templos, street food y playas de Krabi.']
    ];
    for (const [pais, ciudad, lat, lon, inicio, fin, diario] of ej) await S.guardarViaje({ pais, ciudad, lat, lon, inicio, fin, diario, sola: pais === 'TH', fotos: [] });
    const proxFecha = new Date(Date.now() + 40 * 864e5).toISOString().slice(0, 10);
    await S.guardarDeseo({ pais: 'JP', ciudad: 'Tokio', lat: 35.6762, lon: 139.6503, nota: 'Ver los cerezos en flor', fecha: proxFecha });
    await S.guardarDeseo({ pais: 'IS', ciudad: '', lat: null, lon: null, nota: 'Auroras boreales', fecha: '' });
    await S.guardarDeseo({ pais: 'PE', ciudad: 'Cuzco', lat: -13.532, lon: -71.9675, nota: 'Machu Picchu', fecha: '' });
    render(); toast('Viajes de ejemplo cargados');
  }

  // ================= MENSAJE SORPRESA =================
  function mensajeSorpresa(forzar) {
    const m = C.MENSAJE_SORPRESA;
    if (!m || !m.texto) return;
    if (!forzar && ls.get('mv-sorpresa-vista', false)) return;
    const capa = document.createElement('div'); capa.className = 'sorpresa';
    const copos = Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i * 0.37) % 6}s;animation-duration:${6 + (i % 5)}s">❄</i>`).join('');
    capa.innerHTML = `<div class="nieve">${copos}</div><div class="sobre">
      <div class="carta"><h2>${esc(m.titulo)}</h2>${C.NOMBRE ? `<p class="para">Para ${esc(C.NOMBRE)}:</p>` : ''}<p>${esc(m.texto).replace(/\n/g, '<br>')}</p><p class="firma">— ${esc(m.firma)}</p>
      <button class="btn ancho">Empezar a viajar ✈️</button></div></div>`;
    document.body.appendChild(capa);
    $('button', capa).onclick = () => { ls.set('mv-sorpresa-vista', true); capa.classList.add('fuera'); setTimeout(() => capa.remove(), 500); };
  }

  // ================= INSTALAR (iPhone) =================
  function avisoInstalar() {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const el = $('#instalar');
    if (standalone) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = ios
      ? `<b>Instálala como app:</b> en Safari pulsa <span class="ico-compartir">⎋</span> <b>Compartir</b> → <b>Añadir a pantalla de inicio</b>.`
      : `<b>Instálala como app:</b> en el menú del navegador elige <b>Instalar app</b> o <b>Añadir a pantalla de inicio</b>.`;
  }

  // ================= LOGIN =================
  function pantallaLogin() {
    document.body.classList.add('sin-sesion');
    const el = $('#login'); el.hidden = false;
    el.innerHTML = `<div class="login-caja"><div class="login-globo">🌍</div><h1>${esc(C.APP_NOMBRE)}</h1>
      <form class="form"><input class="campo" type="email" name="e" placeholder="Email" autocomplete="username" required>
      <input class="campo" type="password" name="p" placeholder="Contraseña" autocomplete="current-password" required>
      <button class="btn ancho">Entrar</button><p class="login-err"></p></form></div>`;
    $('form', el).onsubmit = async e => {
      e.preventDefault(); const b = $('button', el); b.disabled = true; b.textContent = 'Entrando…';
      try { await S.entrar(e.target.e.value, e.target.p.value); el.hidden = true; document.body.classList.remove('sin-sesion'); await arrancarApp(); }
      catch (err) { $('.login-err', el).textContent = err.message; b.disabled = false; b.textContent = 'Entrar'; }
    };
  }

  // ================= ARRANQUE =================
  async function arrancarApp() {
    S.cargarCache();
    render();
    try { await S.cargar(); }
    catch (e) {
      if (e.message === 'SIN_SESION') { pantallaLogin(); return; }
      toast('Sin conexión: mostrando la última copia guardada');
    }
    render();
    mensajeSorpresa();
  }

  async function iniciar() {
    document.title = C.APP_NOMBRE;
    const mt = document.querySelector('meta[name=apple-mobile-web-app-title]'); if (mt) mt.content = C.APP_NOMBRE;
    $('#titulo').textContent = C.APP_NOMBRE;
    $('#saludo').textContent = SOLO_LECTURA ? 'Mapa compartido' : C.NOMBRE ? `Hola, ${C.NOMBRE} 👋` : 'Tus viajes por el mundo';
    document.documentElement.style.setProperty('--visitado', C.COLORES.visitado);
    document.documentElement.style.setProperty('--deseo', C.COLORES.deseo);
    document.documentElement.style.setProperty('--casa', C.COLORES.casa);
    $('#leyenda-casa').textContent = `Casa (${C.CASA.ciudad})`;

    $$('.tab').forEach(t => t.onclick = () => { vista = t.dataset.vista; window.scrollTo(0, 0); render(); });
    $$('#seg-viajes button').forEach(b => b.onclick = () => { subVistaViajes = b.dataset.sub; renderViajes(); });
    $('#fab').onclick = () => vista === 'suenos' ? formDeseo({}) : formViaje({});
    $('#btn-rasca').onclick = () => { modoRasca = !modoRasca; ls.set('mv-rasca', modoRasca); render(); };
    $('#btn-centrar').onclick = () => M.reset();
    $('#btn-importar').onclick = importar;
    $('#btn-exportar').onclick = exportar;
    $('#btn-mensaje').onclick = () => mensajeSorpresa(true);
    if (S.MODO_PRUEBA && !SOLO_LECTURA) $('#banner-prueba').hidden = false;

    try { await M.iniciar($('#mapa'), abrirPais); }
    catch (e) { $('#mapa').innerHTML = `<p class="vacio">${esc(e.message)}</p>`; }

    if (SOLO_LECTURA) {
      document.body.classList.add('solo-lectura');
      try { await S.cargarCompartido(TOKEN_COMPARTIDO); } catch (e) { toast(e.message); }
      render(); return;
    }
    avisoInstalar();
    if (!S.conectada) { pantallaLogin(); return; }
    await arrancarApp();
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
  document.addEventListener('DOMContentLoaded', iniciar);
})();
