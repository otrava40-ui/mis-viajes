// Capa de datos: Supabase (modo normal) o navegador (modo prueba).
(function () {
  const C = window.CONFIG;
  const URL_SB = (C.SUPABASE_URL || '').replace(/\/$/, '');
  const KEY = C.SUPABASE_ANON_KEY || '';
  const MODO_PRUEBA = !URL_SB || !KEY;
  const BUCKET = 'fotos';
  const LS_SESION = 'mv-sesion', LS_CACHE = 'mv-cache', LS_DEMO = 'mv-demo';

  const ls = {
    get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('No se pudo guardar', k, e); } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));

  // ---------- IndexedDB mínima (fotos del modo prueba) ----------
  const idb = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        const r = indexedDB.open('mis-viajes', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('fotos');
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      });
    },
    async put(k, v) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('fotos', 'readwrite'); t.objectStore('fotos').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
    async get(k) { const db = await this.open(); return new Promise((res) => { const r = db.transaction('fotos').objectStore('fotos').get(k); r.onsuccess = () => res(r.result); r.onerror = () => res(null); }); },
    async del(k) { const db = await this.open(); return new Promise((res) => { const t = db.transaction('fotos', 'readwrite'); t.objectStore('fotos').delete(k); t.oncomplete = res; t.onerror = res; }); }
  };

  // ---------- Compresión de fotos ----------
  async function comprimir(file, maxLado, calidad) {
    let fuente;
    try { fuente = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e) {
      fuente = await new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = URL.createObjectURL(file); });
    }
    const w = fuente.width, h = fuente.height;
    const k = Math.min(1, maxLado / Math.max(w, h));
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    cv.getContext('2d').drawImage(fuente, 0, 0, cv.width, cv.height);
    return new Promise(res => cv.toBlob(res, 'image/jpeg', calidad));
  }
  const blobADataURL = b => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });

  // ---------- Cliente Supabase (REST, sin librerías) ----------
  let sesion = ls.get(LS_SESION, null);

  async function token() {
    if (!sesion) throw new Error('SIN_SESION');
    if (Date.now() / 1000 > (sesion.expires_at || 0) - 60) {
      const r = await fetch(`${URL_SB}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: sesion.refresh_token })
      });
      if (!r.ok) { sesion = null; ls.del(LS_SESION); throw new Error('SIN_SESION'); }
      guardaSesion(await r.json());
    }
    return sesion.access_token;
  }
  function guardaSesion(s) {
    if (!s.expires_at) s.expires_at = Math.floor(Date.now() / 1000) + (s.expires_in || 3600);
    sesion = s; ls.set(LS_SESION, s);
  }
  async function cabeceras(extra) {
    return Object.assign({ apikey: KEY, Authorization: 'Bearer ' + await token() }, extra || {});
  }
  async function rest(ruta, opciones) {
    opciones = opciones || {};
    const r = await fetch(`${URL_SB}/rest/v1/${ruta}`, {
      method: opciones.method || 'GET',
      headers: await cabeceras(Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=representation' }, opciones.headers)),
      body: opciones.body ? JSON.stringify(opciones.body) : undefined
    });
    if (!r.ok) throw new Error(`Error ${r.status}: ${await r.text()}`);
    const t = await r.text();
    return t ? JSON.parse(t) : null;
  }
  async function firmar(rutas) {
    if (!rutas.length) return {};
    const r = await fetch(`${URL_SB}/storage/v1/object/sign/${BUCKET}`, {
      method: 'POST', headers: await cabeceras({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 7, paths: rutas })
    });
    if (!r.ok) return {};
    const lista = await r.json();
    const mapa = {};
    lista.forEach(x => { if (x.signedURL) mapa[x.path] = `${URL_SB}/storage/v1${x.signedURL}`; });
    return mapa;
  }

  // ---------- Conversión fila <-> objeto ----------
  const filaAViaje = f => ({ id: f.id, duenio: f.user_id || '', miembros: [], pais: f.pais, ciudad: f.ciudad || '', lat: f.lat, lon: f.lon, inicio: f.inicio || '', fin: f.fin || '', diario: f.diario || '', sola: !!f.sola, extra: f.extra || {}, fotos: [] });
  const viajeAFila = v => ({ pais: v.pais, ciudad: v.ciudad || null, lat: v.lat ?? null, lon: v.lon ?? null, inicio: v.inicio || null, fin: v.fin || null, diario: v.diario || null, sola: !!v.sola, extra: v.extra || {} });
  const filaADeseo = f => ({ id: f.id, pais: f.pais, ciudad: f.ciudad || '', lat: f.lat, lon: f.lon, nota: f.nota || '', fecha: f.fecha || '', extra: f.extra || {} });
  const deseoAFila = d => ({ pais: d.pais, ciudad: d.ciudad || null, lat: d.lat ?? null, lon: d.lon ?? null, nota: d.nota || null, fecha: d.fecha || null, extra: d.extra || {} });

  // ---------- API pública ----------
  const datos = { viajes: [], deseos: [], ajustes: { maleta: [], compartir: false, compartir_diario: false, token: '', extra: {} }, perfiles: [], perfil: null, mensajes: [], yo: '' };

  const Store = {
    MODO_PRUEBA,
    datos,
    get conectada() { return MODO_PRUEBA || !!sesion; },
    get email() { return sesion && sesion.user ? sesion.user.email : ''; },

    async entrar(email, password) {
      const r = await fetch(`${URL_SB}/auth/v1/token?grant_type=password`, {
        method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      if (!r.ok) throw new Error('Email o contraseña incorrectos');
      guardaSesion(await r.json());
    },
    salir() { sesion = null; ls.del(LS_SESION); ls.del(LS_CACHE); ls.del('mv-perfil'); },
    async cambiarPassword(nueva) {
      const r = await fetch(`${URL_SB}/auth/v1/user`, { method: 'PUT', headers: await cabeceras({ 'Content-Type': 'application/json' }), body: JSON.stringify({ password: nueva }) });
      if (!r.ok) throw new Error('No se pudo cambiar: ' + (await r.text()));
    },

    // Carga instantánea desde la copia local y luego refresca desde internet
    cargarCache() {
      const c = ls.get(MODO_PRUEBA ? LS_DEMO : LS_CACHE, null);
      if (c) Object.assign(datos, c);
      return !!c;
    },

    async cargar() {
      if (MODO_PRUEBA) {
        this.cargarCache();
        for (const v of datos.viajes) for (const f of v.fotos) {
          if (!f.url && f.reserva) { f.url = await idb.get('r-' + f.id) || ''; f.thumbUrl = f.tipo === 'pdf' ? '' : f.url; continue; }
          if (!f.url) { if (f.audio) f.url = await idb.get(f.id + '-a') || ''; else { f.url = await idb.get(f.id + '-g') || ''; f.thumbUrl = await idb.get(f.id + '-p') || f.url; } }
        }
        return;
      }
      const yo = sesion.user.id;
      const [viajes, fotos, deseos, ajustes, perfiles, miembros, mensajes] = await Promise.all([
        rest('viajes?select=*&order=inicio.desc.nullslast'),
        rest('fotos?select=*&order=creado.asc'),
        rest('deseos?select=*&order=fecha.asc.nullslast,creado.asc'),
        rest('ajustes?select=*'),
        rest('perfiles?select=*').catch(() => []),
        rest('viaje_miembros?select=*').catch(() => []),
        rest('mensajes?select=*&order=creado.asc').catch(() => [])
      ]);
      datos.yo = yo;
      datos.perfiles = perfiles;
      datos.perfil = perfiles.find(p => p.user_id === yo) || null;
      datos.mensajes = mensajes;
      let aj = ajustes[0];
      if (!aj) aj = (await rest('ajustes', { method: 'POST', body: {} }))[0];
      const rutas = [];
      fotos.forEach(f => { rutas.push(f.ruta); if (f.miniatura) rutas.push(f.miniatura); });
      const urls = await firmar(rutas);
      const porId = {};
      datos.viajes = viajes.map(f => (porId[f.id] = filaAViaje(f)));
      fotos.forEach(f => {
        const v = porId[f.viaje_id];
        if (v) v.fotos.push({ id: f.id, autor: f.user_id, path: f.ruta, thumb: f.miniatura, instax: !!f.instax, billete: !!f.billete, audio: !!f.audio, reserva: !!f.reserva, nombre: f.nombre || '', tipo: f.tipo || '', url: urls[f.ruta] || '', thumbUrl: urls[f.miniatura] || urls[f.ruta] || '' });
      });
      miembros.forEach(m => { const v = porId[m.viaje_id]; if (v) v.miembros.push(m.user_id); });
      datos.deseos = deseos.map(filaADeseo);
      datos.ajustes = { maleta: aj.maleta || [], compartir: !!aj.compartir, compartir_diario: !!aj.compartir_diario, token: aj.token, extra: aj.extra || {} };
      ls.set(LS_CACHE, datos);
    },

    guardarLocal() {
      if (MODO_PRUEBA) {
        const copia = JSON.parse(JSON.stringify(datos));
        copia.viajes.forEach(v => v.fotos.forEach(f => { f.url = ''; f.thumbUrl = ''; }));
        ls.set(LS_DEMO, copia);
      } else ls.set(LS_CACHE, datos);
    },

    async guardarViaje(v) {
      if (MODO_PRUEBA) {
        if (!v.id) { v.id = uid(); v.fotos = v.fotos || []; datos.viajes.push(v); }
        else { const i = datos.viajes.findIndex(x => x.id === v.id); datos.viajes[i] = Object.assign(datos.viajes[i], v); }
      } else if (!v.id) {
        const fila = (await rest('viajes', { method: 'POST', body: viajeAFila(v) }))[0];
        Object.assign(v, { id: fila.id, duenio: fila.user_id, miembros: [], fotos: v.fotos || [] });
        datos.viajes.push(v);
      } else {
        await rest(`viajes?id=eq.${v.id}`, { method: 'PATCH', body: viajeAFila(v) });
        const i = datos.viajes.findIndex(x => x.id === v.id); datos.viajes[i] = Object.assign(datos.viajes[i], v);
      }
      this.guardarLocal();
      return v;
    },

    // ---------- Familia: perfiles, viajes compartidos y mensajes ----------
    esMio(v) { return MODO_PRUEBA || !v.duenio || v.duenio === datos.yo; },
    nombreDe(id) { const p = datos.perfiles.find(x => x.user_id === id); return p && p.nombre ? p.nombre : 'Alguien'; },
    otros() { return datos.perfiles.filter(p => p.user_id !== datos.yo && p.nombre); },

    async guardarPerfil(p) {
      const r = await fetch(`${URL_SB}/rest/v1/perfiles?on_conflict=user_id`, {
        method: 'POST', headers: await cabeceras({ 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(Object.assign({ user_id: datos.yo }, p))
      });
      if (!r.ok) throw new Error(await r.text());
      const fila = (await r.json())[0];
      datos.perfil = fila;
      datos.perfiles = datos.perfiles.filter(x => x.user_id !== fila.user_id).concat([fila]);
      this.guardarLocal();
      return fila;
    },

    async guardarMiembros(v, ids) {
      if (MODO_PRUEBA) return;
      ids = [...new Set(ids)].filter(id => id && id !== v.duenio);
      const quitar = v.miembros.filter(id => !ids.includes(id));
      const poner = ids.filter(id => !v.miembros.includes(id));
      for (const id of quitar) await rest(`viaje_miembros?viaje_id=eq.${v.id}&user_id=eq.${id}`, { method: 'DELETE' });
      if (poner.length) await rest('viaje_miembros', { method: 'POST', body: poner.map(id => ({ viaje_id: v.id, user_id: id })), headers: { Prefer: 'return=minimal' } });
      v.miembros = ids;
      this.guardarLocal();
    },

    async salirDeViaje(v) {
      await rest(`viaje_miembros?viaje_id=eq.${v.id}&user_id=eq.${datos.yo}`, { method: 'DELETE' });
      datos.viajes = datos.viajes.filter(x => x.id !== v.id);
      this.guardarLocal();
    },

    async enviarMensaje(m) {
      const fila = (await rest('mensajes', { method: 'POST', body: m }))[0];
      datos.mensajes.push(fila);
      return fila;
    },
    async marcarMensajeVisto(m) {
      m.visto = true;
      try { await rest(`mensajes?id=eq.${m.id}`, { method: 'PATCH', body: { visto: true } }); } catch (e) { }
      this.guardarLocal();
    },
    async borrarMensaje(id) {
      await rest(`mensajes?id=eq.${id}`, { method: 'DELETE' });
      datos.mensajes = datos.mensajes.filter(m => m.id !== id);
    },

    async descargarFoto(f) {
      const r = await fetch(f.url || f.thumbUrl);
      return await r.blob();
    },

    async borrarViaje(id) {
      const v = datos.viajes.find(x => x.id === id);
      if (v) for (const f of [...v.fotos]) await this.borrarFoto(v, f.id);
      if (!MODO_PRUEBA) await rest(`viajes?id=eq.${id}`, { method: 'DELETE' });
      datos.viajes = datos.viajes.filter(x => x.id !== id);
      this.guardarLocal();
    },

    async subirFoto(viaje, file, instax, billete) {
      const grande = await comprimir(file, 1600, 0.8);
      const peque = await comprimir(file, 480, 0.72);
      const id = uid();
      let foto;
      if (MODO_PRUEBA) {
        const g = await blobADataURL(await comprimir(file, 1000, 0.7)), p = await blobADataURL(peque);
        await idb.put(id + '-g', g); await idb.put(id + '-p', p);
        foto = { id, instax: !!instax, billete: !!billete, url: g, thumbUrl: p };
      } else {
        const base = `${sesion.user.id}/${viaje.id}/${id}`;
        for (const [ruta, blob] of [[base + '.jpg', grande], [base + '-p.jpg', peque]]) {
          const r = await fetch(`${URL_SB}/storage/v1/object/${BUCKET}/${ruta}`, {
            method: 'POST', headers: await cabeceras({ 'Content-Type': 'image/jpeg', 'x-upsert': 'false' }), body: blob
          });
          if (!r.ok) throw new Error('No se pudo subir la foto: ' + await r.text());
        }
        const fila = (await rest('fotos', { method: 'POST', body: { viaje_id: viaje.id, ruta: base + '.jpg', miniatura: base + '-p.jpg', instax: !!instax, billete: !!billete } }))[0];
        foto = { id: fila.id, path: fila.ruta, thumb: fila.miniatura, instax: !!instax, billete: !!billete, url: URL.createObjectURL(grande), thumbUrl: URL.createObjectURL(peque) };
      }
      viaje.fotos.push(foto);
      this.guardarLocal();
      return foto;
    },

    async subirAudio(viaje, blob, duracion) {
      const id = uid();
      let nota;
      if (MODO_PRUEBA) {
        const url = await blobADataURL(blob);
        await idb.put(id + '-a', url);
        nota = { id, audio: true, url, dur: duracion };
      } else {
        const ext = (blob.type || '').includes('mp4') ? 'm4a' : 'webm';
        const ruta = `${sesion.user.id}/${viaje.id}/${id}.${ext}`;
        const r = await fetch(`${URL_SB}/storage/v1/object/${BUCKET}/${ruta}`, { method: 'POST', headers: await cabeceras({ 'Content-Type': blob.type || 'audio/webm' }), body: blob });
        if (!r.ok) throw new Error('No se pudo subir el audio');
        const fila = (await rest('fotos', { method: 'POST', body: { viaje_id: viaje.id, ruta, audio: true } }))[0];
        nota = { id: fila.id, path: ruta, audio: true, url: URL.createObjectURL(blob), dur: duracion };
      }
      viaje.fotos.push(nota);
      this.guardarLocal();
      return nota;
    },

    // Reservas del viaje (tarjetas de embarque, hotel…): imagen o PDF, con copia en el móvil para verlas sin internet
    async subirReserva(viaje, file, nombre) {
      const esPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      const blob = esPdf ? file : await comprimir(file, 2200, 0.88);
      const id = uid(), tipo = esPdf ? 'pdf' : 'img';
      const dataURL = await blobADataURL(blob);
      let r;
      if (MODO_PRUEBA) {
        await idb.put('r-' + id, dataURL);
        r = { id, reserva: true, nombre, tipo, url: dataURL, thumbUrl: esPdf ? '' : dataURL };
      } else {
        const ruta = `${sesion.user.id}/${viaje.id}/reserva-${id}.${esPdf ? 'pdf' : 'jpg'}`;
        const resp = await fetch(`${URL_SB}/storage/v1/object/${BUCKET}/${ruta}`, { method: 'POST', headers: await cabeceras({ 'Content-Type': esPdf ? 'application/pdf' : 'image/jpeg' }), body: blob });
        if (!resp.ok) throw new Error('No se pudo subir la reserva');
        const fila = (await rest('fotos', { method: 'POST', body: { viaje_id: viaje.id, ruta, reserva: true, nombre, tipo } }))[0];
        await idb.put('r-' + fila.id, dataURL);
        r = { id: fila.id, path: ruta, reserva: true, nombre, tipo, url: URL.createObjectURL(blob), thumbUrl: esPdf ? '' : URL.createObjectURL(blob) };
      }
      viaje.fotos.push(r);
      this.guardarLocal();
      return r;
    },
    // Devuelve la reserva desde la copia del móvil (sin internet) o la descarga y la guarda
    async reservaLocal(f) {
      const guardada = await idb.get('r-' + f.id);
      if (guardada) return guardada;
      if (!f.url) return null;
      try { const b = await (await fetch(f.url)).blob(); const d = await blobADataURL(b); await idb.put('r-' + f.id, d); return d; } catch (e) { return f.url; }
    },

    // Documentos de viaje: se guardan SOLO en este dispositivo (privados y sin internet)
    docs: {
      lista() { return ls.get('mv-docs', []); },
      async anadir(file, nombre) {
        const id = uid();
        const g = await blobADataURL(await comprimir(file, 2000, 0.85));
        await idb.put('doc-' + id, g);
        const l = this.lista(); l.push({ id, nombre: nombre || file.name || 'Documento', fecha: new Date().toISOString().slice(0, 10) });
        ls.set('mv-docs', l);
      },
      ver(id) { return idb.get('doc-' + id); },
      async borrar(id) { await idb.del('doc-' + id); ls.set('mv-docs', this.lista().filter(d => d.id !== id)); }
    },

    async marcarInstax(viaje, foto, valor) {
      foto.instax = valor;
      if (!MODO_PRUEBA) await rest(`fotos?id=eq.${foto.id}`, { method: 'PATCH', body: { instax: valor } });
      this.guardarLocal();
    },

    async borrarFoto(viaje, fotoId) {
      const f = viaje.fotos.find(x => x.id === fotoId);
      if (!f) return;
      await idb.del('r-' + f.id);
      if (MODO_PRUEBA) { await idb.del(f.id + '-g'); await idb.del(f.id + '-p'); await idb.del(f.id + '-a'); }
      else {
        await fetch(`${URL_SB}/storage/v1/object/${BUCKET}`, { method: 'DELETE', headers: await cabeceras({ 'Content-Type': 'application/json' }), body: JSON.stringify({ prefixes: [f.path, f.thumb].filter(Boolean) }) });
        await rest(`fotos?id=eq.${f.id}`, { method: 'DELETE' });
      }
      viaje.fotos = viaje.fotos.filter(x => x.id !== fotoId);
      this.guardarLocal();
    },

    async guardarDeseo(d) {
      if (MODO_PRUEBA) {
        if (!d.id) { d.id = uid(); datos.deseos.push(d); }
        else { const i = datos.deseos.findIndex(x => x.id === d.id); datos.deseos[i] = d; }
      } else if (!d.id) {
        const fila = (await rest('deseos', { method: 'POST', body: deseoAFila(d) }))[0];
        d.id = fila.id; datos.deseos.push(d);
      } else {
        await rest(`deseos?id=eq.${d.id}`, { method: 'PATCH', body: deseoAFila(d) });
        const i = datos.deseos.findIndex(x => x.id === d.id); datos.deseos[i] = d;
      }
      this.guardarLocal();
      return d;
    },
    async borrarDeseo(id) {
      if (!MODO_PRUEBA) await rest(`deseos?id=eq.${id}`, { method: 'DELETE' });
      datos.deseos = datos.deseos.filter(x => x.id !== id);
      this.guardarLocal();
    },

    async guardarAjustes(cambios) {
      Object.assign(datos.ajustes, cambios);
      if (!MODO_PRUEBA) {
        const fila = (await rest('ajustes?user_id=not.is.null', { method: 'PATCH', body: cambios }))[0];
        if (fila) datos.ajustes.token = fila.token;
      }
      this.guardarLocal();
    },

    // Vista compartida (solo lectura, sin iniciar sesión)
    async cargarCompartido(t) {
      const r = await fetch(`${URL_SB}/rest/v1/rpc/mapa_compartido`, {
        method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ t })
      });
      if (!r.ok) throw new Error('Enlace no válido');
      const j = await r.json();
      if (!j) throw new Error('Este mapa ya no está compartido');
      datos.viajes = (j.viajes || []).map((f, i) => Object.assign(filaAViaje(f), { id: 'c' + i }));
      datos.deseos = (j.deseos || []).map((f, i) => Object.assign(filaADeseo(f), { id: 'd' + i }));
    },

    async mapaDeOtro(t) {
      const r = await fetch(`${URL_SB}/rest/v1/rpc/mapa_compartido`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ t }) });
      if (!r.ok) throw new Error('Enlace no válido');
      const j = await r.json();
      if (!j) throw new Error('No compartido');
      return [...new Set((j.viajes || []).map(v => v.pais))];
    },

    exportar() {
      const copia = JSON.parse(JSON.stringify(datos));
      copia.viajes.forEach(v => v.fotos.forEach(f => { delete f.url; delete f.thumbUrl; }));
      return copia;
    },

    // Sugerencias mientras se escribe (Photon / OpenStreetMap)
    async sugerencias(texto, codigoPais, soloLugares) {
      const q = new URLSearchParams({ q: texto, limit: '12' });
      if (soloLugares) ['place:city', 'place:town', 'place:village', 'place:island', 'place:municipality'].forEach(t => q.append('osm_tag', t));
      const r = await fetch('https://photon.komoot.io/api/?' + q);
      if (!r.ok) throw new Error('Sin buscador');
      const j = await r.json();
      const peso = { city: 0, town: 1, island: 1, municipality: 2, village: 3 };
      return j.features.map(f => ({
        nombre: f.properties.name, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
        pais: (f.properties.countrycode || '').toUpperCase(),
        detalle: [f.properties.city !== f.properties.name ? f.properties.city : '', f.properties.state, f.properties.country].filter(Boolean).join(', '),
        tipo: f.properties.osm_value
      })).filter(x => x.nombre && (!codigoPais || x.pais === codigoPais))
        .sort((a, b) => (peso[a.tipo] ?? 4) - (peso[b.tipo] ?? 4)).slice(0, 6);
    },

    // Geocodificación con OpenStreetMap (gratis; 1 búsqueda por segundo como máximo)
    _ultimaBusqueda: 0,
    async buscarLugar(texto, codigoPais) {
      const espera = 1100 - (Date.now() - this._ultimaBusqueda);
      if (espera > 0) await new Promise(r => setTimeout(r, espera));
      this._ultimaBusqueda = Date.now();
      const q = new URLSearchParams({ q: texto, format: 'json', limit: '5', 'accept-language': 'es', addressdetails: '1' });
      if (codigoPais) q.set('countrycodes', codigoPais.toLowerCase());
      const r = await fetch('https://nominatim.openstreetmap.org/search?' + q);
      if (!r.ok) throw new Error('Búsqueda no disponible');
      return (await r.json()).map(x => ({
        nombre: x.address && (x.address.city || x.address.town || x.address.village || x.address.island || x.address.state) || x.display_name.split(',')[0],
        detalle: x.display_name, lat: +x.lat, lon: +x.lon,
        pais: x.address && x.address.country_code ? x.address.country_code.toUpperCase() : codigoPais
      }));
    }
  };

  window.Store = Store;
})();
