// Familia: perfiles, viajes compartidos, descargas, gastos repartidos y mensajes privados
(function () {
  const A = () => window.APP;
  const S = () => window.Store;
  const ex = o => (o.extra = o.extra || {});
  const familia = () => !S().MODO_PRUEBA;
  const nf2 = n => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(n);

  // ===================== PERFIL =====================
  function aplicarPerfil(p) {
    const C = A().C;
    if (!p) { try { p = JSON.parse(localStorage.getItem('mv-perfil')); } catch (e) { } }
    if (!p) {
      // Con cuentas, el nombre sale del perfil de cada persona (no del archivo de configuración)
      if (familia()) { C.NOMBRE = ''; const s = document.getElementById('saludo'); if (s) s.textContent = 'Tus viajes por el mundo'; }
      return;
    }
    if (p.nombre) C.NOMBRE = p.nombre;
    if (p.casa_lat != null) C.CASA = { ciudad: p.casa_ciudad || C.CASA.ciudad, lat: p.casa_lat, lon: p.casa_lon, pais: p.casa_pais || 'ES' };
    try { localStorage.setItem('mv-perfil', JSON.stringify(p)); } catch (e) { }
    const s = document.getElementById('saludo'); if (s && C.NOMBRE) s.textContent = `Hola, ${C.NOMBRE} 👋`;
    const l = document.getElementById('leyenda-casa'); if (l) l.textContent = `Casa (${C.CASA.ciudad})`;
  }

  function formPerfil(obligatorio) {
    return new Promise(res => {
      const { abrirHoja, esc, toast, selectorLugar } = A();
      const p = Object.assign({ nombre: '', casa_ciudad: '', casa_lat: null, casa_lon: null, casa_pais: 'ES' }, S().datos.perfil);
      const lugar = { ciudad: p.casa_ciudad, lat: p.casa_lat, lon: p.casa_lon };
      const h = abrirHoja(`<h2>${obligatorio ? '👋 ¡Bienvenida/o!' : '👤 Mi perfil'}</h2>
        ${obligatorio ? '<p class="nota">Antes de empezar, dinos cómo te llamas y desde dónde sales de viaje (para contar los kilómetros).</p>' : ''}
        <form class="form"><label>Tu nombre</label><input class="campo" name="n" value="${esc(p.nombre || '')}" placeholder="Lara" required>
        <label>Tu ciudad</label><div data-ciudad></div>
        <button class="btn ancho">Guardar</button></form>`, { completa: true, alCerrar: () => res() });
      if (obligatorio) { const c = h.querySelector('.hoja-cerrar'); if (c) c.remove(); h.onclick = null; }
      selectorLugar(h.querySelector('[data-ciudad]'), lugar, () => '', { placeholder: 'Calatayud, Zaragoza…', alElegir: r => { lugar.pais = r.pais; } });
      h.querySelector('form').onsubmit = async e => {
        e.preventDefault();
        const nombre = e.target.n.value.trim();
        if (!nombre) return;
        if (lugar.lat == null) { toast('Elige tu ciudad de la lista'); return; }
        try {
          const fila = await S().guardarPerfil({ nombre, casa_ciudad: lugar.ciudad, casa_lat: lugar.lat, casa_lon: lugar.lon, casa_pais: lugar.pais || 'ES' });
          aplicarPerfil(fila); h.remove(); A().render(); toast('Perfil guardado'); res();
        } catch (er) { toast('No se pudo guardar el perfil: ' + String(er.message || er).slice(0, 140)); }
      };
    });
  }

  async function revisarPerfil() {
    if (!familia()) return;
    const p = S().datos.perfil;
    if (p && p.nombre && p.casa_lat != null) { aplicarPerfil(p); return; }
    await formPerfil(true);
  }

  // ===================== MENSAJE DE BIENVENIDA (privado, desde la base de datos) =====================
  async function mensajesBienvenida() {
    if (!familia()) return false;
    const pend = S().datos.mensajes.filter(m => m.para === S().datos.yo && m.tipo === 'bienvenida' && !m.visto);
    for (const m of pend) {
      await cartaNavidad(m);
      await S().marcarMensajeVisto(m);
    }
    return true;
  }

  function cartaNavidad(m) {
    return new Promise(res => {
      const { esc, C } = A();
      const capa = document.createElement('div'); capa.className = 'sorpresa';
      const copos = Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i * 0.37) % 6}s;animation-duration:${6 + (i % 5)}s">❄</i>`).join('');
      capa.innerHTML = `<div class="nieve">${copos}</div><div class="sobre"><div class="carta"><h2>${esc(m.titulo || '¡Para ti!')}</h2>${C.NOMBRE ? `<p class="para">Para ${esc(C.NOMBRE)}:</p>` : ''}<p>${esc(m.texto).replace(/\n/g, '<br>')}</p>${m.firma ? `<p class="firma">— ${esc(m.firma)}</p>` : ''}<button class="btn ancho">Empezar a viajar ✈️</button></div></div>`;
      document.body.appendChild(capa);
      capa.querySelector('button').onclick = () => { capa.classList.add('fuera'); setTimeout(() => { capa.remove(); res(); }, 500); };
    });
  }

  // Mensajes escondidos en países (los de la base de datos)
  function mensajesPais() {
    if (!familia()) return null;
    return S().datos.mensajes.filter(m => m.para === S().datos.yo && m.tipo === 'pais' && m.pais).map(m => ({ pais: m.pais, de: m.firma || S().nombreDe(m.autor), titulo: m.titulo, texto: m.texto }));
  }

  // ===================== ESCRIBIR MENSAJES PARA LA FAMILIA =====================
  function htmlMensajesFamilia() {
    if (!familia()) return '';
    const { esc, P, pais } = A();
    const mios = S().datos.mensajes.filter(m => m.autor === S().datos.yo);
    return `<h2 class="vista-tit">💌 Mensajes para la familia</h2><div class="tarjeta">
      <p class="nota">Escribe un mensaje privado para alguien: que le salga <b>al entrar en la app</b> o que se desbloquee <b>cuando visite un país</b>. Solo lo verá esa persona.</p>
      ${mios.map(m => `<div class="doc"><div class="fila-opcion">${m.tipo === 'bienvenida' ? '🎄' : P.bandera(m.pais)} Para <b>${esc(S().nombreDe(m.para))}</b> · ${esc(m.titulo || m.texto.slice(0, 30))}<small>${m.tipo === 'bienvenida' ? 'Al entrar en la app' : 'Al visitar ' + esc(pais(m.pais).nombre)} · ${m.visto ? '✅ ya lo ha leído' : '⏳ sin leer'}</small></div><button class="btn-icono" data-borrar-msg="${m.id}">✕</button></div>`).join('')}
      <button class="btn sec ancho" data-escribir-msg>✍️ Escribir un mensaje</button></div>`;
  }

  function enlazarMensajesFamilia(el) {
    const { abrirHoja, toast, esc, confirmar, render, selectorPais } = A();
    el.querySelectorAll('[data-borrar-msg]').forEach(b => b.onclick = async () => { if (await confirmar('¿Borrar este mensaje?')) { await S().borrarMensaje(b.dataset.borrarMsg); render(); } });
    const w = el.querySelector('[data-escribir-msg]'); if (!w) return;
    w.onclick = () => {
      const otros = S().otros();
      if (!otros.length) { toast('Todavía no hay más personas con perfil en la app'); return; }
      let para = otros[0].user_id, tipo = 'bienvenida', codigo = '';
      const h = abrirHoja(`<h2>Nuevo mensaje</h2><form class="form">
        <label>Para</label><div class="chips" data-para>${otros.map((p, i) => `<button type="button" class="chip-btn${i === 0 ? ' on' : ''}" data-u="${p.user_id}">${esc(p.nombre)}</button>`).join('')}</div>
        <label>¿Cuándo le sale?</label><div class="chips" data-tipo><button type="button" class="chip-btn on" data-t="bienvenida">🎄 Al entrar en la app</button><button type="button" class="chip-btn" data-t="pais">🌍 Al visitar un país</button></div>
        <div data-pais hidden></div>
        <label>Título</label><input class="campo" name="t" placeholder="¡Feliz Navidad! 🎄">
        <label>Mensaje</label><textarea class="campo" name="x" rows="6" required></textarea>
        <label>Firma</label><input class="campo" name="f" value="${esc(A().C.NOMBRE || '')}">
        <button class="btn ancho">💌 Guardar mensaje</button></form>`, { completa: true });
      h.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { para = b.dataset.u; h.querySelectorAll('[data-u]').forEach(x => x.classList.toggle('on', x === b)); });
      const cp = h.querySelector('[data-pais]');
      h.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
        tipo = b.dataset.t; h.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b));
        cp.hidden = tipo !== 'pais'; if (tipo === 'pais' && !cp.innerHTML) selectorPais(cp, '', c => codigo = c);
      });
      h.querySelector('form').onsubmit = async e => {
        e.preventDefault();
        const f = e.target;
        if (tipo === 'pais' && !codigo) { toast('Elige el país'); return; }
        try {
          await S().enviarMensaje({ para, tipo, pais: tipo === 'pais' ? codigo : null, titulo: f.t.value.trim() || null, texto: f.x.value.trim(), firma: f.f.value.trim() || null });
          h.cerrar(); render(); toast('Mensaje guardado 💌'); Efectos.exito();
        } catch (er) { toast('No se pudo guardar el mensaje'); }
      };
    };
  }

  // ===================== VIAJES COMPARTIDOS =====================
  const compartido = v => (v.miembros || []).length > 0;
  const personasDe = v => [v.duenio].concat(v.miembros || []).filter(Boolean);

  function htmlCompartirForm(v) {
    if (!familia()) return '';
    const { esc } = A();
    if (v.id && !S().esMio(v)) return `<p class="nota">👥 Viaje de ${esc(S().nombreDe(v.duenio))}, compartido contigo.</p>`;
    const otros = S().otros(); if (!otros.length) return '';
    const sel = v.miembros || [];
    return `<label>👥 Compartir este viaje con</label><div class="chips chips-wrap" data-compartir>${otros.map(p => `<button type="button" class="chip-btn${sel.includes(p.user_id) ? ' on' : ''}" data-u="${p.user_id}">${esc(p.nombre)}</button>`).join('')}</div>
      <p class="nota">Si no eliges a nadie, el viaje y sus fotos son solo tuyos.</p>`;
  }
  function enlazarCompartirForm(h, v) {
    const cont = h.querySelector('[data-compartir]'); if (!cont) return () => null;
    let sel = (v.miembros || []).slice();
    cont.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { const u = b.dataset.u; sel = sel.includes(u) ? sel.filter(x => x !== u) : sel.concat([u]); b.classList.toggle('on', sel.includes(u)); });
    return () => sel;
  }

  function htmlViajeFamilia(v) {
    if (!familia() || !compartido(v)) return '';
    const { esc } = A();
    const nombres = personasDe(v).map(id => id === S().datos.yo ? 'tú' : S().nombreDe(id));
    return `<div class="compartido-banner">👥 <div><b>Viaje compartido</b><small>${esc(nombres.join(', '))} · lo creó ${S().esMio(v) ? 'tú' : esc(S().nombreDe(v.duenio))}</small></div></div>`;
  }

  // ===================== DESCARGAS =====================
  async function descargar(fotos, nombreBase) {
    const { toast } = A();
    if (!fotos.length) return;
    toast(fotos.length === 1 ? 'Preparando la foto…' : `Preparando ${fotos.length} fotos…`);
    const files = [];
    for (let i = 0; i < fotos.length; i++) {
      try { const b = await S().descargarFoto(fotos[i]); files.push(new File([b], `${nombreBase || 'foto'}-${i + 1}.jpg`, { type: b.type || 'image/jpeg' })); } catch (e) { }
    }
    if (!files.length) { toast('No se pudieron descargar'); return; }
    try { if (navigator.canShare && navigator.canShare({ files })) { await navigator.share({ files }); return; } } catch (e) { if (e.name === 'AbortError') return; }
    for (const f of files) {
      const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
      await new Promise(r => setTimeout(r, 350));
    }
    toast(files.length === 1 ? 'Foto descargada' : `${files.length} fotos descargadas`);
  }

  function htmlDescargas(v) {
    const fotos = v.fotos.filter(f => !f.billete && !f.audio && !f.reserva);
    if (!fotos.length) return '';
    const deOtros = fotos.filter(f => f.autor && f.autor !== S().datos.yo).length;
    return `<button class="btn sec ancho" data-descargar-todas>⬇️ ${fotos.length === 1 ? 'Descargar la foto' : `Descargar las ${fotos.length} fotos`}${deOtros ? ` (${deOtros} ${deOtros === 1 ? 'subida' : 'subidas'} por otros)` : ''}</button>`;
  }
  function enlazarDescargas(v, h) {
    const b = h.querySelector('[data-descargar-todas]'); if (!b) return;
    b.onclick = () => descargar(v.fotos.filter(f => !f.billete && !f.audio && !f.reserva), (v.ciudad || v.pais).toLowerCase().replace(/\s+/g, '-'));
  }

  // ===================== GASTOS REPARTIDOS =====================
  function htmlReparto(v) {
    if (!familia() || !compartido(v)) return '';
    const items = (ex(v).gastos || {}).items || [];
    if (!items.length) return '';
    const { esc } = A();
    const gente = personasDe(v);
    const pagado = {}; gente.forEach(id => pagado[id] = 0);
    items.forEach(x => { const q = x.quien || v.duenio; pagado[q] = (pagado[q] || 0) + (+x.i || 0); });
    const total = Object.values(pagado).reduce((a, b) => a + b, 0), parte = total / gente.length;
    const saldo = gente.map(id => ({ id, s: (pagado[id] || 0) - parte }));
    const deben = saldo.filter(x => x.s < -0.01).map(x => ({ ...x })), cobran = saldo.filter(x => x.s > 0.01).map(x => ({ ...x }));
    const pagos = [];
    deben.forEach(d => { cobran.forEach(c => { const m = Math.min(-d.s, c.s); if (m > 0.01) { pagos.push([d.id, c.id, m]); d.s += m; c.s -= m; } }); });
    const nom = id => id === S().datos.yo ? 'Tú' : esc(S().nombreDe(id));
    return `<div class="reparto"><b>🤝 Cuentas del grupo</b><small>Total ${nf2(total)} € · ${nf2(parte)} € por persona</small>
      ${gente.map(id => `<div class="reparto-fila"><span>${nom(id)}</span><span>pagó ${nf2(pagado[id] || 0)} €</span></div>`).join('')}
      ${pagos.length ? pagos.map(([d, c, m]) => `<div class="reparto-pago">💸 <b>${nom(d)}</b> ${d === S().datos.yo ? 'debes' : 'debe'} <b>${nf2(m)} €</b> a <b>${nom(c)}</b></div>`).join('') : '<div class="reparto-pago">✅ Estáis en paz</div>'}</div>`;
  }

  // Selector de "quién pagó" en el formulario de gastos
  function ajustarFormGastos(v, h) {
    if (!familia() || !compartido(v)) return;
    const f = h.querySelector('[data-gasto]'); if (!f) return;
    const { esc } = A();
    const sel = document.createElement('select'); sel.className = 'campo quien'; sel.name = 'q';
    sel.innerHTML = personasDe(v).map(id => `<option value="${id}" ${id === S().datos.yo ? 'selected' : ''}>${id === S().datos.yo ? 'Yo' : esc(S().nombreDe(id))}</option>`).join('');
    f.insertBefore(sel, f.querySelector('button'));
    // Etiquetar quién pagó en la lista
    const items = (ex(v).gastos || {}).items || [];
    h.querySelectorAll('.gasto').forEach((g, i) => { const x = items[i]; if (x) { const t = document.createElement('small'); t.className = 'gasto-quien'; t.textContent = (x.quien || v.duenio) === S().datos.yo ? 'tú' : S().nombreDe(x.quien || v.duenio); g.querySelector('span').appendChild(t); } });
  }

  // ===================== ESTADÍSTICAS JUNTOS =====================
  function htmlJuntos() {
    if (!familia()) return '';
    const { esc, viajesHechos, P } = A();
    const cuenta = {};
    viajesHechos().filter(compartido).forEach(v => personasDe(v).forEach(id => { if (id === S().datos.yo) return; (cuenta[id] = cuenta[id] || { viajes: 0, paises: new Set() }); cuenta[id].viajes++; cuenta[id].paises.add(v.pais); }));
    const filas = Object.entries(cuenta).sort((a, b) => b[1].viajes - a[1].viajes);
    if (!filas.length) return '';
    return `<h2 class="vista-tit">🤝 Viajes compartidos</h2><div class="tarjeta">${filas.map(([id, c]) => `<div class="juntos"><span class="avatar">${esc(S().nombreDe(id).slice(0, 1))}</span><div><b>Con ${esc(S().nombreDe(id))}</b><small>${c.viajes} ${c.viajes === 1 ? 'viaje' : 'viajes'} · ${c.paises.size} ${c.paises.size === 1 ? 'país' : 'países'} juntos</small></div><span class="juntos-flags">${[...c.paises].slice(0, 6).map(x => P.bandera(x)).join('')}</span></div>`).join('')}</div>`;
  }

  // ===================== SOLICITUDES DE ACCESO (solo administrador) =====================
  let solicitudes = [];
  let esAdmin = false;
  function marcarAvisoAjustes() {
    document.querySelectorAll('[data-ir="mas"]').forEach(b => b.classList.toggle('con-aviso', esAdmin && solicitudes.length > 0));
  }
  async function revisarSolicitudes(admin, avisar) {
    esAdmin = !!admin;
    if (!esAdmin) { solicitudes = []; marcarAvisoAjustes(); return; }
    try { solicitudes = await S().solicitudes() || []; } catch (e) { solicitudes = []; }
    marcarAvisoAjustes();
    if (avisar && solicitudes.length) {
      const n = solicitudes.length, pri = solicitudes[0].nombre || solicitudes[0].email;
      A().toast(n === 1 ? `🔔 ${pri} ha pedido acceso · Ajustes → Solicitudes` : `🔔 ${n} personas han pedido acceso · Ajustes → Solicitudes`);
    }
  }
  function htmlSolicitudes() {
    if (!esAdmin) return '';
    const { esc, fecha } = A();
    return `<h2 class="vista-tit">🔔 Solicitudes de acceso</h2><div class="tarjeta solicitudes">${solicitudes.length
      ? solicitudes.map(x => `<div class="solicitud" data-u="${esc(x.user_id)}"><span class="avatar">${esc((x.nombre || x.email || '?').slice(0, 1).toUpperCase())}</span>
          <div><b>${esc(x.nombre || 'Sin nombre')}</b><small>${esc(x.email || '')} · ${esc(fecha((x.creado || '').slice(0, 10)))}</small></div>
          <button class="btn mini" data-aceptar>Aceptar</button><button class="btn-link peligro" data-rechazar>Rechazar</button></div>`).join('')
      : '<p class="nota">No hay nadie esperando. Cuando alguien pulse <b>Pedir acceso</b> aparecerá aquí.</p>'}</div>`;
  }
  function enlazarSolicitudes(cont) {
    cont.querySelectorAll('.solicitud').forEach(f => {
      const u = f.dataset.u, x = solicitudes.find(s => s.user_id === u) || {};
      const nombre = x.nombre || x.email || 'esta persona';
      f.querySelector('[data-aceptar]').onclick = async () => {
        try { await S().aceptarSolicitud(u); A().toast(`✅ ${nombre} ya puede entrar`); await revisarSolicitudes(true); await S().cargar().catch(() => {}); A().render(); }
        catch (e) { A().toast('No se pudo aceptar: ' + String(e.message).slice(0, 120)); }
      };
      f.querySelector('[data-rechazar]').onclick = async () => {
        if (!await A().confirmar(`¿Rechazar a ${nombre}? No podrá ver nada. Si quieres borrar su cuenta del todo, hazlo en Supabase → Authentication → Users.`, 'Rechazar')) return;
        try { await S().rechazarSolicitud(u); A().toast('Solicitud rechazada'); await revisarSolicitudes(true); A().render(); }
        catch (e) { A().toast('No se pudo rechazar: ' + String(e.message).slice(0, 120)); }
      };
    });
  }

  window.EXTRAS3 = {
    aplicarPerfil, formPerfil, revisarPerfil, mensajesBienvenida, mensajesPais, htmlMensajesFamilia, enlazarMensajesFamilia,
    compartido, personasDe, htmlCompartirForm, enlazarCompartirForm, htmlViajeFamilia, htmlDescargas, enlazarDescargas, descargar,
    htmlReparto, ajustarFormGastos, htmlJuntos, familia,
    revisarSolicitudes, htmlSolicitudes, enlazarSolicitudes
  };
})();
