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
    if (opciones.sinAnimacion) capa.classList.add('abierta', 'sin-anim'); else requestAnimationFrame(() => capa.classList.add('abierta'));
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
  const TITULOS = { viajes: 'Mis viajes', suenos: 'Próximos destinos', pasaporte: 'Mi pasaporte', mas: 'Más opciones' };
  function render() {
    const s = calcular();
    document.body.classList.toggle('en-mapa', vista === 'mapa');
    $$('.tab').forEach(t => t.classList.toggle('activa', t.dataset.vista === vista));
    moverBurbuja();
    $$('.vista').forEach(v => v.hidden = v.id !== 'vista-' + vista);
    $('#titulo-vista').textContent = TITULOS[vista] || '';
    M.opciones.sitios = EXTRAS.sitiosMapa();
    M.opciones.lineasVuelo = EXTRAS2.lineasVuelos();
    pintarMapa(s);
    renderInicio(s);
    EXTRAS.revisarLogros(s);
    if (vista === 'viajes') renderViajes();
    if (vista === 'pasaporte') renderPasaporte(s);
    if (vista === 'suenos') renderSuenos();
    if (vista === 'mas') renderMas();
  }

  function moverBurbuja() {
    const activa = $('.tab.activa'), burbuja = $('.tab-burbuja');
    if (!activa) { burbuja.style.opacity = 0; return; }
    const nav = $('.tabs').getBoundingClientRect(), r = activa.getBoundingClientRect();
    burbuja.style.opacity = 1;
    burbuja.style.width = r.width + 'px';
    burbuja.style.transform = `translateX(${r.left - nav.left}px)`;
  }

  function irA(v) {
    cerrarMenuMas();
    if (v === vista) { if (v === 'mapa') M.reset(); return; }
    vista = v; window.scrollTo(0, 0); render();
    const sec = $('#vista-' + v); if (sec) { sec.classList.remove('entra'); void sec.offsetWidth; sec.classList.add('entra'); }
  }

  function abrirMenuMas() {
    const m = $('#menu-mas'); m.hidden = false;
    requestAnimationFrame(() => m.classList.add('abierto'));
    $('#btn-nuevo').classList.add('abierto'); document.body.classList.add('menu-abierto');
  }
  function cerrarMenuMas() {
    const m = $('#menu-mas'); if (m.hidden) return;
    m.classList.remove('abierto'); $('#btn-nuevo').classList.remove('abierto'); document.body.classList.remove('menu-abierto');
    setTimeout(() => { if (!m.classList.contains('abierto')) m.hidden = true; }, 250);
  }

  function pintarMapa(s) {
    const estado = {};
    s.deseos.forEach(c => estado[c] = 'deseo');
    s.visitados.forEach(c => estado[c] = 'visitado');
    if (C.CONTAR_PAIS_DE_CASA && C.CASA.pais && !viajesHechos().some(v => v.pais === C.CASA.pais)) estado[C.CASA.pais] = 'casa';
    const pins = [
      ...viajesHechos().filter(v => v.lat != null).map(v => ({ lat: v.lat, lon: v.lon, pais: v.pais, tipo: EXTRAS3.compartido(v) ? 'viaje compartido' : 'viaje' })),
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
      cd.innerHTML = `<span class="cd-bandera">${P.bandera(prox.pais)}</span><div class="cd-txt"><div class="cd-num">${d === 0 ? '¡Es hoy!' : d === 1 ? '¡Mañana!' : `Faltan <b>${d}</b> días`}</div><div class="cd-dest">para ${esc(destino)} · ${fecha(prox.fecha)}</div></div><span class="cd-avion">✈️</span>`;
      cd.hidden = false;
      cd.onclick = () => EXTRAS.abrirProximo(prox);
    } else cd.hidden = true;
    const pct = s.porcentaje.toFixed(s.porcentaje < 10 ? 1 : 0).replace('.', ',');
    $('#stats').innerHTML = [
      ['🌍', s.paises, s.paises === 1 ? 'país' : 'países'],
      ['🧭', `${s.continentes}<small>/6</small>`, 'continentes'],
      ['📊', `${pct}<small>%</small>`, 'del mundo'],
      ['✈️', nf.format(s.km), 'km']
    ].map(([i, v, t]) => `<div class="stat"><div class="stat-v">${v}</div><div class="stat-t">${t}</div></div>`).join('');
    EXTRAS.tarjetasInicio();
  }

  // ================= FICHA DE PAÍS =================
  function abrirPais(code) {
    const p = pais(code);
    const viajes = S.datos.viajes.filter(v => v.pais === code).sort((a, b) => (b.inicio || '').localeCompare(a.inicio || ''));
    const deseo = S.datos.deseos.find(d => d.pais === code);
    const esCasa = code === C.CASA.pais;
    const hechos = viajes.filter(v => !esFuturo(v));
    let estadoTxt = hechos.length ? `${hechos.length} ${hechos.length === 1 ? 'viaje' : 'viajes'}` : esCasa ? 'Tu casa 🏠' : deseo ? 'En tu lista de sueños ✨' : 'Aún sin visitar';
    const html = `
      <div class="pais-cab"><span class="pais-bandera">${P.bandera(code)}</span><div><h2>${esc(p.nombre)}</h2><div class="sub">${esc(P.CONTINENTES[p.cont] || '')} · ${estadoTxt}</div></div></div>
      <div class="lista-viajes">${viajes.map(tarjetaViaje).join('') || '<p class="vacio">Todavía no hay viajes aquí.</p>'}</div>
      <div data-curioso></div>
      ${esCasa ? '' : EXTRAS.fichaPaisHTML(code)}
      ${SOLO_LECTURA ? '' : `<div class="fila-botones">
        <button class="btn" data-nuevo>＋ Añadir viaje</button>
        ${hechos.length ? '' : deseo ? `<button class="btn sec" data-quitar-deseo>Quitar de sueños</button>` : `<button class="btn sec" data-deseo>✨ Quiero ir</button>`}
      </div>`}`;
    const h = abrirHoja(html, { alCerrar: () => M.reset() });
    const conCoord = hechos.find(v => v.lat != null);
    if (vista === 'mapa' && code !== C.CASA.pais && (hechos.length || deseo)) M.volar(conCoord ? conCoord.lat : (deseo && deseo.lat != null ? deseo.lat : p.lat), conCoord ? conCoord.lon : (deseo && deseo.lon != null ? deseo.lon : p.lon));
    else M.enfocar(code);
    enlazarTarjetas(h);
    EXTRAS2.datoCurioso($('[data-curioso]', h), code);
    const b = $('[data-nuevo]', h); if (b) b.onclick = () => formViaje({ pais: code });
    const d = $('[data-deseo]', h); if (d) d.onclick = () => { h.cerrar(); formDeseo({ pais: code }); };
    const q = $('[data-quitar-deseo]', h); if (q) q.onclick = async () => { await S.borrarDeseo(deseo.id); h.cerrar(); render(); };
  }

  function tarjetaViaje(v) {
    const normales = v.fotos.filter(f => !f.billete && !f.audio && !f.reserva);
    const fotos = normales.slice(0, 4).map(f => `<img src="${esc(f.thumbUrl)}" alt="" loading="lazy">`).join('');
    return `<button class="tarjeta-viaje${esFuturo(v) ? ' futuro' : ''}" data-viaje="${v.id}">
      <div class="tv-cab"><span class="tv-bandera">${P.bandera(v.pais)}</span><div class="tv-txt"><b>${esc(v.ciudad || pais(v.pais).nombre)}</b><span>${rangoFechas(v.inicio, v.fin)}${esFuturo(v) ? ' · próximo' : ''}${v.sola ? ' · 🎒 sola' : ''}${v.extra && v.extra.valoracion ? ' · ' + '❤️'.repeat(v.extra.valoracion) : ''}${EXTRAS3.compartido(v) ? ' · 👥' : ''}</span></div></div>
      ${fotos ? `<div class="tv-fotos">${fotos}${normales.length > 4 ? `<span class="mas-fotos">+${normales.length - 4}</span>` : ''}</div>` : ''}
      ${v.diario ? `<p class="tv-diario">${esc(v.diario.slice(0, 140))}${v.diario.length > 140 ? '…' : ''}</p>` : ''}
    </button>`;
  }
  function enlazarTarjetas(el) {
    $$('[data-viaje]', el).forEach(b => b.onclick = () => abrirViaje(b.dataset.viaje));
  }

  // ================= DETALLE DE VIAJE =================
  function abrirViaje(id, sinAnimacion) {
    const v = S.datos.viajes.find(x => x.id === id);
    if (!v) return;
    const p = pais(v.pais);
    const n = dias(v.inicio, v.fin);
    const html = `
      <div class="pais-cab"><span class="pais-bandera">${P.bandera(v.pais)}</span><div><h2>${esc(v.ciudad || p.nombre)}</h2><div class="sub">${esc(v.ciudad ? p.nombre + ' · ' : '')}${rangoFechas(v.inicio, v.fin)}${n > 1 ? ` · ${n} días` : ''}</div></div></div>
      ${EXTRAS3.htmlViajeFamilia(v)}
      <div class="galeria">${EXTRAS.fotosNormales(v).map((f, i) => `<button class="foto${f.instax ? ' instax' : ''}" data-i="${i}"><img src="${esc(f.thumbUrl)}" alt="" loading="lazy">${EXTRAS3.compartido(v) && f.autor ? `<span class="autor">${esc(S.nombreDe(f.autor).slice(0, 1))}</span>` : ''}</button>`).join('')}</div>
      ${EXTRAS3.htmlDescargas(v)}
      ${v.diario ? `<div class="diario"><h3>Diario</h3><p>${esc(v.diario).replace(/\n/g, '<br>')}</p></div>` : ''}
      ${EXTRAS.htmlViajeExtra(v)}
      ${EXTRAS2.htmlViaje(v)}
      ${SOLO_LECTURA ? '' : `<div class="fila-botones">
        <label class="btn sec">📷 Añadir fotos<input type="file" accept="image/*" multiple hidden data-fotos></label>
        <button class="btn sec" data-editar>✏️ Editar</button>
      </div>
      <label class="check"><input type="checkbox" data-instax> Las fotos que añada son Instax escaneadas</label>
      ${S.esMio(v) ? '<button class="btn-link peligro" data-borrar>Borrar este viaje</button>' : '<button class="btn-link peligro" data-salir-viaje>Salir de este viaje compartido</button>'}`}`;
    const h = abrirHoja(html, { completa: true, sinAnimacion });
    const refrescar = () => { if (!h.isConnected) { const actual = $$('.hoja-capa').pop(); if (actual) { actual.remove(); abrirViaje(v.id, true); } return; } const y = $('.hoja-cuerpo', h).scrollTop; h.remove(); const n = abrirViaje(v.id, true); if (n) $('.hoja-cuerpo', n).scrollTop = y; render(); };
    $$('.galeria .foto', h).forEach(b => b.onclick = () => verFoto(EXTRAS.fotosNormales(v).map(f => ({ v, f })), +b.dataset.i, refrescar));
    EXTRAS.enlazarViajeExtra(v, h, refrescar);
    EXTRAS2.enlazarViaje(v, h, refrescar);
    EXTRAS3.enlazarDescargas(v, h);
    if (SOLO_LECTURA) return h;
    $('[data-editar]', h).onclick = () => { h.cerrar(); formViaje(v); };
    const sv = $('[data-salir-viaje]', h); if (sv) sv.onclick = async () => {
      if (await confirmar(`¿Salir del viaje a ${v.ciudad || p.nombre}? Dejarás de verlo (las fotos que subiste se quedan en el viaje).`, 'Salir')) {
        await S.salirDeViaje(v); $$('.hoja-capa').forEach(x => x.remove()); render(); toast('Has salido del viaje');
      }
    };
    if ($('[data-borrar]', h)) $('[data-borrar]', h).onclick = async () => {
      if (await confirmar(`¿Borrar el viaje a ${v.ciudad || p.nombre} y sus fotos?`)) {
        await S.borrarViaje(v.id); h.cerrar(); $$('.hoja-capa').forEach(x => x.cerrar && x.cerrar()); render(); toast('Viaje borrado');
      }
    };
    $('[data-fotos]', h).onchange = async e => {
      const files = [...e.target.files]; if (!files.length) return;
      await subirFotos(v, files, $('[data-instax]', h).checked);
      refrescar();
    };
    return h;
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

  // lista: [{ v: viaje, f: foto }]
  function verFoto(lista, i, alCambiar) {
    const capa = document.createElement('div'); capa.className = 'visor';
    const pintar = () => {
      if (!lista.length) { capa.remove(); return; }
      i = Math.max(0, Math.min(i, lista.length - 1));
      const { v, f } = lista[i];
      capa.innerHTML = `<img src="${esc(f.url || f.thumbUrl)}" alt="">
        <div class="visor-barra">${SOLO_LECTURA ? '' : `<button data-bajar>⬇️</button><button data-instax>${f.instax ? '✓ Instax' : 'Marcar Instax'}</button>${S.esMio(v) || !f.autor || f.autor === S.datos.yo ? '<button data-borrar>🗑</button>' : ''}`}<span>${i + 1}/${lista.length}</span><button data-cerrar>✕</button></div>
        <div class="visor-pie">${P.bandera(v.pais)} ${esc(v.ciudad || pais(v.pais).nombre)} · ${rangoFechas(v.inicio, v.fin)}</div>
        ${i > 0 ? '<button class="visor-ant" data-ant>‹</button>' : ''}${i < lista.length - 1 ? '<button class="visor-sig" data-sig>›</button>' : ''}`;
      const on = (sel, fn) => { const b = $(sel, capa); if (b) b.onclick = e => { e.stopPropagation(); fn(); }; };
      on('[data-cerrar]', () => capa.remove());
      on('[data-bajar]', () => EXTRAS3.descargar([f], (v.ciudad || v.pais).toLowerCase().replace(/\s+/g, '-')));
      on('[data-ant]', () => { i--; pintar(); });
      on('[data-sig]', () => { i++; pintar(); });
      on('[data-instax]', async () => { await S.marcarInstax(v, f, !f.instax); pintar(); if (alCambiar) alCambiar(); });
      on('[data-borrar]', async () => {
        if (await confirmar('¿Borrar esta foto?')) {
          await S.borrarFoto(v, f.id); lista.splice(i, 1); pintar(); if (alCambiar) alCambiar(); render();
        }
      });
    };
    let x0 = null;
    capa.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    capa.addEventListener('touchend', e => {
      if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (dx > 50 && i > 0) { i--; pintar(); } else if (dx < -50 && i < lista.length - 1) { i++; pintar(); }
    });
    capa.onclick = e => { if (e.target === capa || e.target.tagName === 'IMG') capa.remove(); };
    document.body.appendChild(capa); pintar();
  }
  const fotosDe = v => v.fotos.map(f => ({ v, f }));

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
    return { get: () => actual, set: fija };
  }

  // Buscador de ciudades: sugiere mientras escribes (lista propia + OpenStreetMap)
  function selectorLugar(cont, obj, getPais, opciones) {
    opciones = opciones || {};
    const marcador = opciones.placeholder || 'Ciudad o lugar (opcional)';
    cont.innerHTML = `<div class="buscador"><span class="lupa">🔎</span><input class="campo" placeholder="${esc(marcador)}" value="${esc(obj.ciudad || '')}" autocomplete="off" enterkeyhint="search"><span class="buscando" hidden></span></div><div class="sugerencias"></div><div class="lugar-ok">${obj.lat != null ? '📍 Ubicado en el mapa' : ''}</div>`;
    const inp = $('input', cont), sug = $('.sugerencias', cont), ok = $('.lugar-ok', cont), girando = $('.buscando', cont);
    let temporizador, ultima = 0;
    const elegir = r => {
      obj.ciudad = r.nombre; obj.lat = r.lat; obj.lon = r.lon; inp.value = r.nombre;
      sug.innerHTML = ''; ok.textContent = '📍 Ubicado en el mapa';
      if (opciones.alElegir) opciones.alElegir(r);
    };
    const pintar = lista => {
      const visto = new Set();
      lista = lista.filter(r => { const k = P.normaliza(r.nombre) + r.pais; if (visto.has(k)) return false; visto.add(k); return true; }).slice(0, 7);
      sug.innerHTML = lista.map((r, i) => `<button type="button" data-i="${i}"><span class="sug-flag">${P.bandera(r.pais)}</span><span><b>${esc(r.nombre)}</b><small>${esc(r.detalle || pais(r.pais).nombre)}</small></span></button>`).join('');
      $$('button', sug).forEach(b => b.onclick = () => elegir(lista[+b.dataset.i]));
    };
    const locales = (texto, code) => {
      const n = P.normaliza(texto);
      return window.DATOS.ciudades.filter(c => (!code || c.pais === code) && P.normaliza(c.nombre).includes(n))
        .sort((a, b) => P.normaliza(a.nombre).indexOf(n) - P.normaliza(b.nombre).indexOf(n))
        .map(c => Object.assign({ detalle: pais(c.pais).nombre }, c));
    };
    const buscar = async (forzar) => {
      const texto = inp.value.trim(), code = getPais();
      if (texto.length < 2) { sug.innerHTML = ''; return; }
      const loc = opciones.soloLugares === false ? [] : locales(texto, code);
      pintar(loc);
      const id = ++ultima;
      girando.hidden = false;
      try {
        let res = await S.sugerencias(texto, code, opciones.soloLugares !== false);
        if (!res.length && (forzar || texto.length > 3)) res = (await S.buscarLugar(texto, code)).map(r => Object.assign(r, { detalle: r.detalle.split(',').slice(1, 3).join(',').trim() }));
        if (id !== ultima) return;
        pintar(loc.concat(res));
        if (!loc.length && !res.length) sug.innerHTML = '<div class="cargando">No lo encuentro. Puedes guardarlo igual (sin chincheta exacta).</div>';
      } catch (e) { if (id === ultima && !loc.length) sug.innerHTML = '<div class="cargando">Sin conexión con el buscador. Se guardará sin chincheta.</div>'; }
      finally { if (id === ultima) girando.hidden = true; }
    };
    inp.oninput = () => { obj.ciudad = inp.value; obj.lat = null; obj.lon = null; ok.textContent = ''; clearTimeout(temporizador); temporizador = setTimeout(buscar, 320); };
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(temporizador); buscar(true); } };
  }

  // ================= FORMULARIO DE VIAJE =================
  function formViaje(original, alGuardar) {
    const v = Object.assign({ pais: '', ciudad: '', lat: null, lon: null, inicio: '', fin: '', diario: '', sola: false, fotos: [], extra: {} }, original);
    const e = v.extra = Object.assign({}, v.extra);
    const nuevo = !v.id;
    const html = `<h2>${nuevo ? 'Nuevo viaje' : 'Editar viaje'}</h2>
      <form class="form">
        <label>País</label><div data-pais></div>
        <label>Ciudad</label><div data-lugar></div>
        <div class="fila2"><div><label>Desde</label><input type="date" class="campo" name="inicio" value="${v.inicio}"></div>
        <div><label>Hasta</label><input type="date" class="campo" name="fin" value="${v.fin}"></div></div>
        <label class="check"><input type="checkbox" name="sola" ${v.sola ? 'checked' : ''}> 🎒 Viajé sola</label>
        ${EXTRAS3.htmlCompartirForm(v)}
        <label>¿Con quién fuiste?</label><input class="campo" name="con" placeholder="Laura, mamá… (separa con comas)" value="${esc((e.con || []).join(', '))}">
        <label>Diario</label><textarea class="campo" name="diario" rows="4" placeholder="Resumen del viaje. (Día a día lo puedes escribir dentro del viaje.)">${esc(v.diario)}</textarea>
        <details class="mas-campos"${e.comida || e.sitio || e.anecdota || e.cancion ? ' open' : ''}><summary>✨ Lo mejor del viaje y su canción</summary>
          <label>🍽️ Comida favorita</label><input class="campo" name="comida" value="${esc(e.comida || '')}" placeholder="Los pasteles de Belém">
          <label>📍 Sitio favorito</label><input class="campo" name="sitio" value="${esc(e.sitio || '')}" placeholder="El mirador de Santa Lucía">
          <label>😂 Anécdota</label><textarea class="campo" name="anecdota" rows="2" placeholder="Aquella vez que…">${esc(e.anecdota || '')}</textarea>
          <label>🎵 Canción del viaje</label><input class="campo" name="cancion" value="${esc(e.cancion || '')}" placeholder="Nombre de la canción o enlace de Spotify">
          <label>💰 Presupuesto (€)</label><input class="campo" name="presupuesto" type="number" inputmode="decimal" value="${e.presupuesto || ''}" placeholder="800">
        </details>
        ${nuevo ? `<label>Fotos</label><label class="btn sec ancho">📷 Elegir fotos<input type="file" accept="image/*" multiple hidden name="fotos"></label><div class="n-fotos"></div>
        <label class="check"><input type="checkbox" name="instax"> Son fotos Instax escaneadas</label>` : ''}
        <button class="btn ancho" type="submit">Guardar</button>
      </form>`;
    const h = abrirHoja(html, { completa: true });
    const f = $('form', h);
    const sp = selectorPais($('[data-pais]', h), v.pais, c => v.pais = c);
    selectorLugar($('[data-lugar]', h), v, () => sp.get(), { alElegir: r => { if (!sp.get() && r.pais) sp.set(r.pais); } });
    const miembrosSel = EXTRAS3.enlazarCompartirForm(h, v);
    let files = [];
    if (nuevo) $('[name=fotos]', f).onchange = e => { files = [...e.target.files]; $('.n-fotos', h).textContent = files.length ? `${files.length} foto${files.length > 1 ? 's' : ''} seleccionada${files.length > 1 ? 's' : ''}` : ''; };
    f.onsubmit = async e => {
      e.preventDefault();
      if (!v.pais) { toast('Elige un país'); return; }
      v.inicio = f.inicio.value; v.fin = f.fin.value && f.fin.value >= v.inicio ? f.fin.value : '';
      v.sola = f.sola.checked; v.diario = f.diario.value.trim();
      e.con = f.con.value.split(',').map(x => x.trim()).filter(Boolean);
      ['comida', 'sitio', 'anecdota', 'cancion'].forEach(k => { const val = f[k].value.trim(); if (val) e[k] = val; else delete e[k]; });
      const pr = parseFloat((f.presupuesto.value || '').replace(',', '.')); if (isNaN(pr)) delete e.presupuesto; else e.presupuesto = pr;
      const antes = calcular().visitados;
      const btn = $('[type=submit]', f); btn.disabled = true; btn.textContent = 'Guardando…';
      try {
        const guardado = await S.guardarViaje(v);
        const sel = miembrosSel(); if (sel && S.esMio(guardado)) await S.guardarMiembros(guardado, sel);
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
      const p2 = pos(e); ctx.beginPath(); ctx.moveTo(...ultimo); ctx.lineTo(...p2); ctx.stroke(); ultimo = p2; if (Math.random() < .3) Efectos.rascar();
    };
    const fin = () => {
      ultimo = null; if (revelado) return;
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let vacio = 0;
      for (let i = 3; i < d.length; i += 64) if (d[i] === 0) vacio++;
      if (vacio / (d.length / 64) > 0.5) descubrir();
    };
    const descubrir = () => { revelado = true; cv.classList.add('fuera'); zona.classList.add('brilla'); M.revelar(code); Efectos.exito(); Efectos.confeti(); };
    cv.addEventListener('pointerdown', e => { ultimo = pos(e); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', mover);
    cv.addEventListener('pointerup', fin);
    cv.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    const cerrar = () => { capa.remove(); EXTRAS.mensajeTrasRascar(code); };
    $('[data-ok]', capa).onclick = () => { if (!revelado) { descubrir(); setTimeout(cerrar, 900); } else cerrar(); };
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
    $('#seg-viajes').dataset.pos = { linea: 0, albumes: 1, musica: 2 }[subVistaViajes] || 0;
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
    } else if (subVistaViajes === 'musica') EXTRAS2.renderMusica(cont);
    else renderAlbumes(cont);
  }

  // ================= ÁLBUMES POR PAÍS =================
  function albumesPorPais() {
    const mapa = {};
    [...S.datos.viajes].sort((a, b) => (b.inicio || '0').localeCompare(a.inicio || '0')).forEach(v => {
      (mapa[v.pais] = mapa[v.pais] || { code: v.pais, viajes: [], fotos: [] });
      mapa[v.pais].viajes.push(v);
      EXTRAS.fotosNormales(v).forEach(f => mapa[v.pais].fotos.push({ v, f }));
    });
    return Object.values(mapa).sort((a, b) => b.fotos.length - a.fotos.length || pais(a.code).nombre.localeCompare(pais(b.code).nombre, 'es'));
  }

  function portada(fotos, extra) {
    const capas = fotos.slice(0, 3).map((x, k) => `<img class="alb-foto f${k}" src="${esc(x.f.thumbUrl)}" alt="" loading="lazy">`).reverse().join('');
    return `<div class="alb-portada${fotos.length ? '' : ' vacia'}">${capas || extra}</div>`;
  }

  function renderAlbumes(cont) {
    const albumes = albumesPorPais();
    const instax = S.datos.viajes.flatMap(v => EXTRAS.fotosNormales(v).filter(f => f.instax).map(f => ({ v, f })));
    let html = '<div class="albumes">';
    if (instax.length) html += `<button class="album especial" data-album="__instax">${portada(instax)}<div class="alb-info"><b>📸 Mis Instax</b><span>${instax.length} ${instax.length === 1 ? 'foto' : 'fotos'}</span></div></button>`;
    html += albumes.map(a => `<button class="album" data-album="${a.code}">
        ${portada(a.fotos, `<span class="alb-bandera">${P.bandera(a.code)}</span>`)}
        <span class="alb-flag">${P.bandera(a.code)}</span>
        <div class="alb-info"><b>${esc(pais(a.code).nombre)}</b><span>${a.fotos.length ? `${a.fotos.length} ${a.fotos.length === 1 ? 'foto' : 'fotos'}` : 'Sin fotos aún'} · ${a.viajes.length} ${a.viajes.length === 1 ? 'viaje' : 'viajes'}</span></div>
      </button>`).join('');
    cont.innerHTML = html + '</div>';
    $$('[data-album]', cont).forEach(b => b.onclick = () => abrirAlbum(b.dataset.album));
  }

  function abrirAlbum(code) {
    const esInstax = code === '__instax';
    let soloInstax = esInstax;
    const h = abrirHoja('<div class="album-hoja"></div>', { completa: true });
    const cuerpo = $('.album-hoja', h);
    const pintar = () => {
      const viajes = esInstax ? S.datos.viajes.filter(v => v.fotos.some(f => f.instax)) : S.datos.viajes.filter(v => v.pais === code);
      viajes.sort((a, b) => (b.inicio || '0').localeCompare(a.inicio || '0'));
      const todas = viajes.flatMap(v => EXTRAS.fotosNormales(v).filter(f => !soloInstax || f.instax).map(f => ({ v, f })));
      const titulo = esInstax ? '📸 Mis Instax' : `${P.bandera(code)} ${esc(pais(code).nombre)}`;
      let html = `<div class="album-cab"><h2>${titulo}</h2><div class="sub">${todas.length} ${todas.length === 1 ? 'foto' : 'fotos'}${esInstax ? '' : ` · ${viajes.length} ${viajes.length === 1 ? 'viaje' : 'viajes'}`}</div></div>`;
      if (todas.length) html += `<button class="btn sec ancho pres-btn" data-pres>🎬 Ver como presentación</button>`;
      if (!esInstax) html += `<div class="chips"><button class="chip-btn${soloInstax ? '' : ' on'}" data-f="todas">Todas</button><button class="chip-btn${soloInstax ? ' on' : ''}" data-f="instax">Solo Instax</button></div>`;
      let idx = 0;
      viajes.forEach(v => {
        const fs = EXTRAS.fotosNormales(v).filter(f => !soloInstax || f.instax);
        if (!fs.length && soloInstax) return;
        html += `<div class="album-viaje"><button class="gal-tit" data-viaje="${v.id}">${esc(v.ciudad || pais(v.pais).nombre)} <small>${rangoFechas(v.inicio, v.fin)}</small></button>
          <div class="galeria${soloInstax ? ' modo-instax' : ''}">${fs.map(f => `<button class="foto${f.instax ? ' instax' : ''}" data-idx="${idx++}"><img src="${esc(f.thumbUrl)}" alt="" loading="lazy"></button>`).join('')}
          ${SOLO_LECTURA ? '' : `<label class="foto foto-nueva" title="Añadir fotos">＋<input type="file" accept="image/*" multiple hidden data-subir="${v.id}"></label>`}</div></div>`;
      });
      if (!todas.length && !viajes.length) html += '<p class="vacio">No hay fotos todavía.</p>';
      if (!SOLO_LECTURA && !esInstax) html += `<label class="check"><input type="checkbox" data-instax ${soloInstax ? 'checked' : ''}> Las fotos que añada son Instax escaneadas</label>`;
      cuerpo.innerHTML = html;
      $$('[data-f]', cuerpo).forEach(b => b.onclick = () => { soloInstax = b.dataset.f === 'instax'; pintar(); });
      const pb = $('[data-pres]', cuerpo); if (pb) pb.onclick = () => EXTRAS2.presentacion(esInstax ? '📸 Mis Instax' : `${P.bandera(code)} ${pais(code).nombre}`, `${todas.length} fotos`, todas.map(x => x.f));
      $$('.foto[data-idx]', cuerpo).forEach(b => b.onclick = () => verFoto(todas, +b.dataset.idx, pintar));
      $$('[data-viaje]', cuerpo).forEach(b => b.onclick = () => abrirViaje(b.dataset.viaje));
      $$('[data-subir]', cuerpo).forEach(inp => inp.onchange = async e => {
        const files = [...e.target.files]; if (!files.length) return;
        const marcado = $('[data-instax]', cuerpo);
        await subirFotos(S.datos.viajes.find(v => v.id === inp.dataset.subir), files, esInstax || (marcado && marcado.checked));
        pintar(); render();
      });
    };
    pintar();
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
    const r = EXTRAS.rango(s.paises);
    $('#pasaporte-num').textContent = `${r.icono} ${r.nombre} · ${s.paises} ${s.paises === 1 ? 'país' : 'países'} · ${s.continentes} ${s.continentes === 1 ? 'continente' : 'continentes'}`;
    const px = $('#pasaporte-extra'); px.innerHTML = EXTRAS3.htmlJuntos() + EXTRAS.htmlPasaporteExtra(s) + '<div id="pasaporte-extra2"></div>'; EXTRAS.enlazarPasaporte(px);
    const px2 = $('#pasaporte-extra2'); px2.innerHTML = EXTRAS2.htmlPasaporte(s); EXTRAS2.enlazarPasaporte(px2);
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
    let html = SOLO_LECTURA ? '' : `<button class="ruleta-btn" data-ruleta><span>🎲</span><div><b>¿A dónde voy ahora?</b><small>Gira la ruleta de tus sueños</small></div></button>`;
    if (futuros.length) html += `<h3 class="sec-tit">Próximos viajes</h3>` + futuros.map(tarjetaViaje).join('');
    html += `<h3 class="sec-tit">Lugares que quiero visitar</h3>`;
    html += ds.length ? ds.map(d => `<div class="deseo" data-deseo-id="${d.id}">
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
    $$('[data-ed]', cont).forEach(b => b.onclick = e => { e.stopPropagation(); formDeseo(S.datos.deseos.find(x => x.id === b.dataset.ed)); });
    $$('[data-fui]', cont).forEach(b => { const f = b.onclick; b.onclick = e => { e.stopPropagation(); f(e); }; });
    const ru = $('[data-ruleta]', cont); if (ru) ru.onclick = () => EXTRAS.ruleta();
    $$('[data-deseo-id]', cont).forEach(el => el.onclick = async () => {
      const d = S.datos.deseos.find(x => x.id === el.dataset.deseoId);
      const h = abrirHoja(`<div class="pais-cab"><span class="pais-bandera">${P.bandera(d.pais)}</span><div><h2>${esc(d.ciudad || pais(d.pais).nombre)}</h2><div class="sub">${esc(d.ciudad ? pais(d.pais).nombre : '')}${d.fecha ? ' · ' + fecha(d.fecha) : ''}</div></div></div>
        ${d.nota ? `<p class="tv-diario">${esc(d.nota)}</p>` : ''}<div data-destino></div><div data-curioso></div>${EXTRAS.fichaPaisHTML(d.pais, true)}
        <div class="fila-botones"><button class="btn" data-fui2>¡Ya fui!</button><button class="btn sec" data-ed2>✏️ Editar</button></div>`, { completa: true });
      EXTRAS2.rellenarDestino($('[data-destino]', h), d.pais, d.lat ?? pais(d.pais).lat, d.lon ?? pais(d.pais).lon, d.fecha, d, () => S.guardarDeseo(d));
      EXTRAS2.datoCurioso($('[data-curioso]', h), d.pais);
      $('[data-fui2]', h).onclick = () => { h.cerrar(); formViaje({ pais: d.pais, ciudad: d.ciudad, lat: d.lat, lon: d.lon, inicio: d.fecha || '', extra: d.extra && d.extra.presupuesto ? { presupuesto: d.extra.presupuesto } : {} }, async () => { await S.borrarDeseo(d.id); }); };
      $('[data-ed2]', h).onclick = () => { h.cerrar(); formDeseo(d); };
    });
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
  const MALETA_BASE = [
    { nombre: '📄 Documentos', items: ['DNI / pasaporte', 'Tarjeta sanitaria europea', 'Reservas descargadas', 'Tarjetas y algo de efectivo'] },
    { nombre: '👕 Ropa', items: ['Pijama', 'Ropa interior y calcetines', 'Chaqueta', 'Calzado cómodo', 'Bañador'] },
    { nombre: '🧴 Aseo', items: ['Neceser', 'Cepillo y pasta de dientes', 'Crema solar', 'Medicinas básicas'] },
    { nombre: '🔌 Tecnología', items: ['Cargador del móvil', 'Batería externa', 'Adaptador de enchufe', 'Auriculares', 'Instax y carretes 📸'] },
    { nombre: '🎒 Otros', items: ['Gafas de sol', 'Botella de agua vacía', 'Candado para la maleta'] }
  ];
  let maletaEditando = false;
  const abiertas = new Set();

  function maletaNormalizada() {
    const aj = S.datos.ajustes;
    let m = aj.maleta;
    if (!Array.isArray(m) || !m.length) m = MALETA_BASE.map(c => ({ nombre: c.nombre, items: c.items.map(t => ({ t, ok: false })) }));
    else if (m[0] && m[0].t !== undefined) m = [{ nombre: '🎒 Mi lista', items: m }];   // formato antiguo
    aj.maleta = m;
    return m;
  }

  let listaMaleta = 0;
  function listasMaleta() {
    const aj = S.datos.ajustes; aj.extra = aj.extra || {};
    return [{ nombre: '🧳 General', cats: maletaNormalizada() }].concat(aj.extra.maletas || []);
  }
  function nuevaListaMaleta() {
    const tipos = window.DATOS.MALETAS_TIPO;
    const h = abrirHoja(`<h2>Nueva lista de maleta</h2><p class="nota">Empieza desde una plantilla y luego la cambias a tu gusto.</p>
      <div class="plantillas">${Object.keys(tipos).map(t => `<button class="plantilla" data-t="${esc(t)}">${t}</button>`).join('')}<button class="plantilla" data-t="">📝 Vacía</button></div>`);
    $$('[data-t]', h).forEach(b => b.onclick = async () => {
      const t = b.dataset.t, aj = S.datos.ajustes;
      const cats = t ? Object.entries(tipos[t]).map(([n, items]) => ({ nombre: n, items: items.map(x => ({ t: x, ok: false })) })) : [{ nombre: '📝 Mi lista', items: [] }];
      aj.extra.maletas = (aj.extra.maletas || []).concat([{ nombre: t || '📝 Nueva lista', cats }]);
      listaMaleta = aj.extra.maletas.length;
      await S.guardarAjustes({ extra: aj.extra }).catch(() => { });
      h.cerrar(); renderMaleta();
    });
  }

  function renderMaleta() {
    const listas = listasMaleta();
    if (listaMaleta >= listas.length) listaMaleta = 0;
    const m = listas[listaMaleta].cats;
    const total = m.reduce((n, c) => n + c.items.length, 0), hechos = m.reduce((n, c) => n + c.items.filter(x => x.ok).length, 0);
    const pct = total ? Math.round(hechos / total * 100) : 0;
    const guarda = () => S.guardarAjustes(listaMaleta === 0 ? { maleta: m } : { extra: S.datos.ajustes.extra }).catch(() => toast('Sin conexión: se guardará en este móvil'));
    const el = $('#maleta');
    el.innerHTML = `<div class="listas-maleta">${listas.map((l, i) => `<button class="chip-btn${i === listaMaleta ? ' on' : ''}" data-lista="${i}">${esc(l.nombre)}</button>`).join('')}<button class="chip-btn" data-nueva-lista>＋ Lista</button></div>
      <div class="maleta-cab">
        <div class="anillo" style="--p:${pct}"><span>${pct}%</span></div>
        <div class="maleta-res"><b>${hechos === total && total ? '¡Maleta lista! 🎉' : `${hechos} de ${total} cosas`}</b><span>${maletaEditando ? 'Modo edición' : 'Toca para marcar'}</span></div>
        <button class="btn mini ${maletaEditando ? '' : 'sec'}" data-editar>${maletaEditando ? '✓ Hecho' : '✏️ Editar'}</button>
      </div>
      ${m.map((c, ci) => {
        const ok = c.items.filter(x => x.ok).length;
        const abierta = maletaEditando || abiertas.has(ci) || (abiertas.size === 0 && ci === 0);
        return `<div class="cat${abierta ? ' abierta' : ''}">
          <div class="cat-cab" data-cat="${ci}">
            ${maletaEditando ? `<input class="campo cat-nombre" data-renombrar="${ci}" value="${esc(c.nombre)}">
              <button class="btn-icono" data-subir-cat="${ci}" ${ci === 0 ? 'disabled' : ''} aria-label="Subir">↑</button>
              <button class="btn-icono peligro" data-borrar-cat="${ci}" aria-label="Borrar categoría">🗑</button>`
            : `<b>${esc(c.nombre)}</b><span class="cat-cuenta${ok === c.items.length && c.items.length ? ' completa' : ''}">${ok}/${c.items.length}</span><span class="cat-flecha">›</span>`}
          </div>
          <div class="cat-items">
            ${c.items.map((x, i) => maletaEditando
              ? `<div class="maleta-item editando"><input class="campo" data-texto="${ci}:${i}" value="${esc(x.t)}">
                  <button class="btn-icono" data-arriba="${ci}:${i}" ${i === 0 ? 'disabled' : ''} aria-label="Subir">↑</button>
                  <button class="btn-icono peligro" data-quitar="${ci}:${i}" aria-label="Quitar">✕</button></div>`
              : `<label class="maleta-item${x.ok ? ' ok' : ''}"><input type="checkbox" data-marcar="${ci}:${i}" ${x.ok ? 'checked' : ''}><span class="caja"></span><span class="txt">${esc(x.t)}</span></label>`).join('')}
            <form class="fila-buscar add-item" data-anadir="${ci}"><input class="campo" placeholder="Añadir a ${esc(c.nombre.replace(/^\S+\s/, '').toLowerCase())}…"><button class="btn mini">＋</button></form>
          </div>
        </div>`;
      }).join('')}
      ${maletaEditando ? `<form class="fila-buscar nueva-cat" data-nueva-cat><input class="campo" placeholder="Nueva categoría (ej: 🏖️ Playa)"><button class="btn mini">＋</button></form>
        ${listaMaleta === 0 ? '<button class="btn-link" data-restaurar>Restaurar la lista original</button>' : `<div class="form"><label>Nombre de la lista</label><input class="campo" data-renombrar-lista value="${esc(listas[listaMaleta].nombre)}"></div><button class="btn-link peligro" data-borrar-lista>Borrar esta lista</button>`}`
      : `<button class="btn-link" data-reset>Desmarcar todo para el próximo viaje</button>`}`;

    const par = s => s.split(':').map(Number);
    $('[data-editar]', el).onclick = () => { maletaEditando = !maletaEditando; renderMaleta(); };
    $$('[data-lista]', el).forEach(b => b.onclick = () => { listaMaleta = +b.dataset.lista; abiertas.clear(); renderMaleta(); });
    $('[data-nueva-lista]', el).onclick = nuevaListaMaleta;
    const bl = $('[data-borrar-lista]', el); if (bl) bl.onclick = async () => { if (await confirmar(`¿Borrar la lista "${listas[listaMaleta].nombre}"?`)) { S.datos.ajustes.extra.maletas.splice(listaMaleta - 1, 1); listaMaleta = 0; await S.guardarAjustes({ extra: S.datos.ajustes.extra }).catch(() => { }); renderMaleta(); } };
    const rl = $('[data-renombrar-lista]', el); if (rl) rl.onchange = () => { const v = rl.value.trim(); if (v) { listas[listaMaleta].nombre = v; guarda(); } };
    $$('[data-cat]', el).forEach(c => { if (!maletaEditando) c.onclick = () => { const i = +c.dataset.cat; const ab = c.parentElement.classList.contains('abierta'); abiertas.clear(); if (!ab) abiertas.add(i); else abiertas.add(-1); renderMaleta(); }; });
    $$('[data-marcar]', el).forEach(c => c.onchange = () => { const [ci, i] = par(c.dataset.marcar); m[ci].items[i].ok = c.checked; guarda(); renderMaleta(); });
    $$('[data-anadir]', el).forEach(f => f.onsubmit = e => { e.preventDefault(); const v = $('input', f).value.trim(); if (!v) return; m[+f.dataset.anadir].items.push({ t: v, ok: false }); abiertas.clear(); abiertas.add(+f.dataset.anadir); guarda(); renderMaleta(); const nf2 = $(`[data-anadir="${f.dataset.anadir}"] input`); if (nf2) nf2.focus(); });
    $$('[data-texto]', el).forEach(inp => inp.onchange = () => { const [ci, i] = par(inp.dataset.texto); const v = inp.value.trim(); if (v) { m[ci].items[i].t = v; guarda(); } });
    $$('[data-quitar]', el).forEach(b => b.onclick = () => { const [ci, i] = par(b.dataset.quitar); m[ci].items.splice(i, 1); guarda(); renderMaleta(); });
    $$('[data-arriba]', el).forEach(b => b.onclick = () => { const [ci, i] = par(b.dataset.arriba); const it = m[ci].items; [it[i - 1], it[i]] = [it[i], it[i - 1]]; guarda(); renderMaleta(); });
    $$('[data-renombrar]', el).forEach(inp => inp.onchange = () => { const v = inp.value.trim(); if (v) { m[+inp.dataset.renombrar].nombre = v; guarda(); } });
    $$('[data-subir-cat]', el).forEach(b => b.onclick = () => { const i = +b.dataset.subirCat; [m[i - 1], m[i]] = [m[i], m[i - 1]]; guarda(); renderMaleta(); });
    $$('[data-borrar-cat]', el).forEach(b => b.onclick = async () => { const i = +b.dataset.borrarCat; if (await confirmar(`¿Borrar la categoría "${m[i].nombre}" y sus ${m[i].items.length} cosas?`)) { m.splice(i, 1); guarda(); renderMaleta(); } });
    const nc = $('[data-nueva-cat]', el); if (nc) nc.onsubmit = e => { e.preventDefault(); const v = $('input', nc).value.trim(); if (v) { m.push({ nombre: v, items: [] }); guarda(); renderMaleta(); } };
    const rs = $('[data-reset]', el); if (rs) rs.onclick = () => { m.forEach(c => c.items.forEach(x => x.ok = false)); guarda(); renderMaleta(); toast('Lista lista para el próximo viaje ✈️'); };
    const rt = $('[data-restaurar]', el); if (rt) rt.onclick = async () => { if (await confirmar('¿Volver a la lista original? Se perderán tus cambios.', 'Restaurar')) { S.datos.ajustes.maleta = []; maletaNormalizada(); guarda(); renderMaleta(); } };
  }

  function renderMas() {
    if (SOLO_LECTURA) { $('#vista-mas').innerHTML = '<p class="vacio grande">Estás viendo un mapa compartido.</p>'; return; }
    const aj = S.datos.ajustes;
    const mx = $('#mas-extra'); mx.innerHTML = EXTRAS3.htmlSolicitudes() + EXTRAS3.htmlMensajesFamilia() + EXTRAS.htmlMasExtra(calcular()); EXTRAS.enlazarMasExtra(mx); EXTRAS3.enlazarMensajesFamilia(mx); EXTRAS3.enlazarSolicitudes(mx);
    $('#avisos-mas').innerHTML = (S.MODO_PRUEBA ? '<div class="banner">🧪 Modo prueba · los datos se guardan solo en este navegador</div>' : '') + avisoInstalar();
    renderMaleta();

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
      : `<p class="nota">Sesión iniciada como <b>${esc(S.email)}</b></p><button class="btn sec ancho" data-perfil>👤 Mi perfil (nombre y ciudad)</button><button class="btn sec ancho" data-pass>Cambiar contraseña</button><button class="btn-link peligro" data-salir>Cerrar sesión</button>`;
    const dm = $('[data-demo]'); if (dm) dm.onclick = cargarEjemplo;
    const ps = $('[data-pass]'); if (ps) ps.onclick = cambiarPass;
    const pf = $('[data-perfil]'); if (pf) pf.onclick = () => EXTRAS3.formPerfil(false);
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
        const local = ciudad && window.DATOS.ciudades.find(c => c.pais === p.code && P.normaliza(c.nombre) === P.normaliza(ciudad));
        if (local) { obj.lat = local.lat; obj.lon = local.lon; }
        else if (ciudad && geo) { try { const r = await S.buscarLugar(ciudad, p.code); if (r[0]) { obj.lat = r[0].lat; obj.lon = r[0].lon; } } catch (e) { } }
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
    if (standalone) return '';
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    return `<div class="banner instalar">${ios
      ? '<b>Instálala como app:</b> en Safari pulsa <b>Compartir</b> → <b>Añadir a pantalla de inicio</b>.'
      : '<b>Instálala como app:</b> en el menú del navegador elige <b>Instalar app</b> o <b>Añadir a pantalla de inicio</b>.'}</div>`;
  }

  // ================= LOGIN =================
  function pantallaLogin(modo) {
    document.body.classList.add('sin-sesion');
    const el = $('#login'); el.hidden = false;
    const pedir = modo === 'pedir';
    el.innerHTML = `<div class="login-caja"><div class="login-globo">🌍</div><h1>${esc(C.APP_NOMBRE)}</h1>
      ${pedir ? '<p class="nota login-sub">Rellena tus datos. Cuando te acepten podrás entrar con este email y contraseña.</p>' : ''}
      <form class="form">${pedir ? '<input class="campo" name="n" placeholder="Tu nombre" autocomplete="given-name" required maxlength="40">' : ''}
      <input class="campo" type="email" name="e" placeholder="Email" autocomplete="username" required>
      <input class="campo" type="password" name="p" placeholder="${pedir ? 'Elige una contraseña (mín. 6)' : 'Contraseña'}" minlength="${pedir ? 6 : 1}" autocomplete="${pedir ? 'new-password' : 'current-password'}" required>
      <button class="btn ancho">${pedir ? 'Enviar solicitud' : 'Entrar'}</button><p class="login-err"></p></form>
      <button class="btn-link login-cambiar" data-cambiar>${pedir ? '← Ya tengo cuenta: entrar' : '¿No tienes cuenta? <b>Pedir acceso</b>'}</button></div>`;
    $('[data-cambiar]', el).onclick = () => pantallaLogin(pedir ? '' : 'pedir');
    $('form', el).onsubmit = async e => {
      e.preventDefault(); const b = $('form button', el), txt = b.textContent; b.disabled = true; b.textContent = pedir ? 'Enviando…' : 'Entrando…';
      try {
        if (pedir) {
          const r = await S.pedirAcceso(e.target.e.value, e.target.p.value, e.target.n.value);
          if (r === 'confirmar') { pantallaEspera('confirmar'); return; }
        } else await S.entrar(e.target.e.value, e.target.p.value);
        el.hidden = true; document.body.classList.remove('sin-sesion'); await arrancarApp();
      }
      catch (err) { $('.login-err', el).textContent = err.message; b.disabled = false; b.textContent = txt; }
    };
  }

  // Pantalla para quien ha pedido acceso y aún no está aceptado
  function pantallaEspera(estado) {
    document.body.classList.add('sin-sesion');
    const el = $('#login'); el.hidden = false;
    const textos = {
      pendiente: ['⏳', 'Solicitud enviada', 'En cuanto te acepten podrás entrar. Puedes cerrar la app y volver más tarde.'],
      confirmar: ['📬', 'Revisa tu correo', 'Te hemos mandado un email para confirmar la cuenta. Confírmalo y luego entra con tu email y contraseña.'],
      rechazado: ['🔒', 'Sin acceso', 'Esta cuenta no tiene acceso a la app.']
    }[estado] || ['⏳', 'Esperando', ''];
    el.innerHTML = `<div class="login-caja"><div class="login-globo">${textos[0]}</div><h1>${textos[1]}</h1><p class="nota login-sub">${textos[2]}</p>
      ${estado === 'confirmar' ? '<button class="btn ancho" data-entrar>Ir a entrar</button>' : `<button class="btn ancho" data-otra>Comprobar otra vez</button><button class="btn-link login-cambiar" data-fuera>Salir</button>`}</div>`;
    const en = $('[data-entrar]', el); if (en) en.onclick = () => pantallaLogin();
    const ot = $('[data-otra]', el); if (ot) ot.onclick = async () => { ot.disabled = true; ot.textContent = 'Comprobando…'; el.hidden = true; document.body.classList.remove('sin-sesion'); await arrancarApp(); };
    const fu = $('[data-fuera]', el); if (fu) fu.onclick = () => { S.salir(); pantallaLogin(); };
  }

  // ================= ARRANQUE =================
  let introLista = Promise.resolve();

  async function arrancarApp() {
    S.cargarCache();
    EXTRAS.aplicarTema();
    render();
    // ¿Esta cuenta está aceptada? (si la base de datos aún no tiene el sistema de solicitudes, se sigue normal)
    let est = null;
    if (!S.MODO_PRUEBA) {
      try { est = await S.estado(); }
      catch (e) {
        if (e.message === 'SIN_SESION') { await introLista; pantallaLogin(); return; }
      }
      if (est && est.estado && est.estado !== 'aprobado') { await introLista; pantallaEspera(est.estado); return; }
    }
    try { await S.cargar(); }
    catch (e) {
      if (e.message === 'SIN_SESION') { await introLista; pantallaLogin(); return; }
      toast('Sin conexión: mostrando la última copia guardada' + (navigator.onLine ? ' (' + String(e.message).slice(0, 80) + ')' : ''));
    }
    EXTRAS.aplicarTema();
    render();
    EXTRAS.cargarComparacionGuardada().then(() => pintarMapa(calcular()));
    await introLista;
    await EXTRAS3.revisarPerfil();
    render();
    if (est) EXTRAS3.revisarSolicitudes(est.admin, true);
    const conBaseDatos = await EXTRAS3.mensajesBienvenida();
    if (!conBaseDatos) mensajeSorpresa();
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

    EXTRAS3.aplicarPerfil();
    if (C.ANIMACION_ENTRADA !== false && window.Intro) introLista = Intro.mostrar({ esperar: () => M.listo });

    $$('.tab').forEach(t => t.onclick = () => irA(t.dataset.vista));
    $$('[data-ir]').forEach(b => b.onclick = () => irA(b.dataset.ir));
    $$('#seg-viajes button').forEach(b => b.onclick = () => { subVistaViajes = b.dataset.sub; renderViajes(); });
    $('#btn-nuevo').onclick = () => $('#menu-mas').hidden ? abrirMenuMas() : cerrarMenuMas();
    $$('#menu-mas [data-nuevo]').forEach(b => b.onclick = () => { cerrarMenuMas(); b.dataset.nuevo === 'sueno' ? formDeseo({}) : formViaje({}); });
    document.addEventListener('click', e => { if (!e.target.closest('#menu-mas, #btn-nuevo')) cerrarMenuMas(); });
    $('#btn-capas').onclick = e => { e.stopPropagation(); EXTRAS.menuCapas($('#btn-capas')); };
    M.opciones.noche = !!localStorage.getItem('mv-noche'); M.opciones.rutas = !!localStorage.getItem('mv-rutas'); M.opciones.vuelos = !!localStorage.getItem('mv-vuelos');
    let mundo = false;
    $('#btn-mundo').onclick = () => { mundo = !mundo; mundo ? M.mundoEntero() : M.reset(); };
    $('#btn-importar').onclick = importar;
    $('#btn-exportar').onclick = exportar;
    $('#btn-mensaje').onclick = () => mensajeSorpresa(true);
    $('#btn-intro').onclick = () => Intro.mostrar();
    window.addEventListener('resize', moverBurbuja);

    try { await M.iniciar($('#mapa'), abrirPais); }
    catch (e) { $('#mapa').innerHTML = `<p class="vacio mapa-error">${esc(e.message)}</p>`; M.listo = true; }

    if (SOLO_LECTURA) {
      document.body.classList.add('solo-lectura');
      try { await S.cargarCompartido(TOKEN_COMPARTIDO); } catch (e) { toast(e.message); }
      render(); return;
    }
    if (!S.conectada) { await introLista; pantallaLogin(); return; }
    await arrancarApp();
  }

  window.APP = {
    $, $$, esc, fecha, rangoFechas, dias, km, toast, pais, calcular, viajesHechos, esFuturo, abrirHoja, confirmar, render, irA,
    abrirPais, abrirViaje, formViaje, formDeseo, verFoto, fotosDe, selectorLugar, selectorPais, subirFotos, hoyISO, nf, LOGROS,
    SOLO_LECTURA, S, P, C, M, modoRasca: () => modoRasca,
    alternarRasca: () => { modoRasca = !modoRasca; ls.set('mv-rasca', modoRasca); render(); toast(modoRasca ? '✦ Modo rasca: lo dorado está por descubrir' : 'Modo normal'); }
  };

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
  document.addEventListener('DOMContentLoaded', iniciar);
})();
