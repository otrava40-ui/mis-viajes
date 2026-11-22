// Mapa del mundo interactivo a pantalla completa (d3 + Natural Earth vía world-atlas)
(function () {
  const FUENTES = [
    'data/countries-50m.json',
    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'
  ];

  // Decodificador TopoJSON mínimo → GeoJSON
  // tolerancia (en grados): quita puntos muy juntos para que el mapa vaya fluido
  function topoAGeo(topo, nombreObjeto, tolerancia) {
    const tf = topo.transform, tol2 = (tolerancia || 0) ** 2;
    const arcos = topo.arcs.map(arco => {
      let x = 0, y = 0;
      const pts = arco.map(p => {
        if (tf) { x += p[0]; y += p[1]; return [x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]]; }
        return p.slice();
      });
      if (!tol2 || pts.length < 4) return pts;
      const out = [pts[0]];
      for (let i = 1; i < pts.length - 1; i++) {
        const u = out[out.length - 1], dx = pts[i][0] - u[0], dy = pts[i][1] - u[1];
        if (dx * dx + dy * dy >= tol2) out.push(pts[i]);
      }
      out.push(pts[pts.length - 1]);
      return out;
    });
    const anillo = indices => {
      const pts = [];
      indices.forEach((i, k) => {
        const a = i < 0 ? arcos[~i].slice().reverse() : arcos[i];
        a.forEach((p, j) => { if (k === 0 || j > 0) pts.push(p); });
      });
      return pts;
    };
    return topo.objects[nombreObjeto].geometries.map(g => {
      let coordinates = null;
      if (g.type === 'Polygon') coordinates = g.arcs.map(anillo);
      else if (g.type === 'MultiPolygon') coordinates = g.arcs.map(p => p.map(anillo));
      return { type: 'Feature', id: g.id, properties: g.properties || {}, geometry: coordinates ? { type: g.type, coordinates } : null };
    }).filter(f => f.geometry);
  }

  async function cargarTopo() {
    for (const url of FUENTES) {
      try { const r = await fetch(url); if (r.ok) return await r.json(); } catch (e) { }
    }
    throw new Error('No se pudo cargar el mapa. Revisa la conexión.');
  }

  const Mapa = {
    features: [], k: 1, estado: {}, pins: [], rasca: false, onPais: () => { }, listo: false,

    async iniciar(contenedor, onPais) {
      this.cont = contenedor; this.onPais = onPais;
      const topo = await cargarTopo();
      const P = window.PAISES;
      const conCodigo = f => {
        const pais = P.porNumero[f.id] || P.porCodigo[P.POR_NOMBRE_MAPA[f.properties.name]];
        f.code = pais ? pais.code : null;
        return f;
      };
      this.features = topoAGeo(topo, 'countries', 0.035).map(conCodigo).filter(f => f.code !== 'AQ');
      // Versión más ligera para el globo 3D y la animación de entrada
      this.featuresLigeros = topoAGeo(topo, 'countries', 0.3).map(conCodigo).filter(f => f.code !== 'AQ');
      this.construir();
      this.listo = true;
      let t;
      window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (this.cont.clientWidth && Math.abs(this.cont.clientWidth - this.W) + Math.abs(this.cont.clientHeight - this.H) > 40) { this.construir(); this.pintar(this.estado, this.pins, this.rasca); } }, 250); });
    },

    construir() {
      const W = this.cont.clientWidth || 390, H = this.cont.clientHeight || 700;
      this.W = W; this.H = H;
      const esfera = { type: 'Sphere' };
      this.proy = d3.geoNaturalEarth1().fitSize([W, H], esfera);
      this.path = d3.geoPath(this.proy);
      const b = this.path.bounds(esfera);
      this.limites = b;
      // Zoom inicial: el mapa llena la pantalla (en móvil vertical, todo el alto)
      const ancho = b[1][0] - b[0][0], alto = b[1][1] - b[0][1];
      this.kInicial = Math.min(4, Math.max(1, Math.max(W / ancho, (H * 0.92) / alto)));

      this.cont.innerHTML = '';
      const svg = d3.select(this.cont).append('svg')
        .attr('viewBox', `0 0 ${W} ${H}`).attr('class', 'mapa-svg').attr('role', 'img').attr('aria-label', 'Mapa del mundo');
      const defs = svg.append('defs');
      const pat = defs.append('pattern').attr('id', 'rasca').attr('patternUnits', 'userSpaceOnUse').attr('width', 6).attr('height', 6).attr('patternTransform', 'rotate(35)');
      pat.append('rect').attr('width', 6).attr('height', 6).attr('fill', '#cfb36b');
      pat.append('rect').attr('width', 2).attr('height', 6).attr('fill', '#e6d293');
      const sombra = defs.append('filter').attr('id', 'relieve').attr('x', '-5%').attr('y', '-5%').attr('width', '110%').attr('height', '110%');
      sombra.append('feDropShadow').attr('dx', 0).attr('dy', 0.6).attr('stdDeviation', 0.8).attr('flood-color', '#23314a').attr('flood-opacity', 0.25);

      this.svg = svg;
      this.g = svg.append('g');
      this.g.append('path').attr('class', 'oceano').attr('d', this.path(esfera));
      this.g.append('path').attr('class', 'reticula').attr('d', this.path(d3.geoGraticule10()));
      const comun = defs.append('pattern').attr('id', 'comun').attr('patternUnits', 'userSpaceOnUse').attr('width', 5).attr('height', 5).attr('patternTransform', 'rotate(45)');
      comun.append('rect').attr('width', 5).attr('height', 5).attr('fill', 'var(--visitado)');
      comun.append('rect').attr('width', 2.5).attr('height', 5).attr('fill', '#7b68b5');
      this.capaPaises = this.g.append('g').attr('class', 'paises');
      this.capaPuntos = this.g.append('g').attr('class', 'mini-paises');
      this.capaRutas = this.g.append('g').attr('class', 'rutas');
      this.capaLineasVuelo = this.g.append('g').attr('class', 'lineas-vuelo');
      this.capaPins = this.g.append('g').attr('class', 'pins');
      this.capaSitios = this.g.append('g').attr('class', 'sitios');
      this.capaVuelo = this.g.append('g').attr('class', 'vuelo');

      this.capaPaises.selectAll('path').data(this.features).join('path')
        .attr('d', this.path)
        .attr('data-code', d => d.code)
        .on('click', (ev, d) => { if (d.code) this.onPais(d.code); });

      const margen = 60;
      this.zoom = d3.zoom().scaleExtent([1, 80])
        .translateExtent([[b[0][0] - margen, b[0][1] - margen], [b[1][0] + margen, b[1][1] + margen]])
        .on('start', () => this.cont.classList.add('moviendo'))
        .on('zoom', ev => {
          this.k = ev.transform.k;
          this.g.attr('transform', ev.transform);
        })
        .on('end', () => { this.cont.classList.remove('moviendo'); this.ajustarEscala(); });
      svg.call(this.zoom).on('dblclick.zoom', null);
      svg.call(this.zoom.transform, this.vistaInicial());
    },

    vistaInicial() {
      // Centrado un poco a la izquierda de Europa para ver América, Europa, África y Asia
      const [x, y] = this.proy([12, 18]);
      const k = this.kInicial;
      return d3.zoomIdentity.translate(this.W / 2, this.H / 2).scale(k).translate(-x, -y);
    },

    ajustarEscala() {
      const k = this.k, s = Math.pow(k, 0.75);
      this.capaPins.selectAll('circle').attr('r', d => (d.tipo === 'deseo' ? 3.2 : 3.5) / s).attr('stroke-width', 1.3 / s);
      this.capaPuntos.selectAll('circle').attr('r', 3.5 / s).attr('stroke-width', 1 / s);
      this.capaRutas.selectAll('path').attr('stroke-width', 1.4 / s).attr('stroke-dasharray', `${4 / s} ${3 / s}`);
      this.capaLineasVuelo.selectAll('path').attr('stroke-width', 1.6 / s);
      this.capaLineasVuelo.selectAll('circle').attr('r', 2.6 / s).attr('stroke-width', 1 / s);
      this.capaSitios.style('display', k >= 7 ? null : 'none').selectAll('text').attr('font-size', 14 / k);
      this.capaVuelo.selectAll('path.estela').attr('stroke-width', 2 / s);
      this.capaVuelo.selectAll('text').attr('font-size', 22 / s);
    },

    opciones: { rutas: false, noche: false, otros: null, sitios: [], vuelos: false, lineasVuelo: [] },
    setOpcion(nombre, valor) { this.opciones[nombre] = valor; if (this.svg) this.pintar(this.estado, this.pins, this.rasca); },

    pintar(estado, pins, rasca) {
      this.estado = estado; this.pins = pins; this.rasca = rasca;
      if (!this.svg) return;
      const C = window.CONFIG.COLORES;
      const color = code => {
        const e = estado[code];
        if (e === 'visitado') return C.visitado;
        if (e === 'casa') return C.casa;
        if (e === 'deseo') return C.deseo;
        return rasca ? 'url(#rasca)' : 'var(--tierra)';
      };
      const otros = this.opciones.otros;
      const colorFinal = code => {
        if (otros && otros.has(code)) return (estado[code] === 'visitado' || estado[code] === 'casa') ? 'url(#comun)' : '#a99ad6';
        return color(code);
      };
      this.cont.classList.toggle('noche', !!this.opciones.noche);
      this.capaPaises.selectAll('path')
        .attr('fill', d => colorFinal(d.code))
        .attr('class', d => 'pais ' + (estado[d.code] || 'nada'));

      const conForma = new Set(this.features.map(f => f.code));
      const mini = Object.keys(estado).filter(c => !conForma.has(c) && window.PAISES.porCodigo[c]).map(c => window.PAISES.porCodigo[c]);
      this.capaPuntos.selectAll('circle').data(mini, d => d.code).join('circle')
        .attr('cx', d => this.proy([d.lon, d.lat])[0]).attr('cy', d => this.proy([d.lon, d.lat])[1])
        .attr('fill', d => color(d.code)).attr('stroke', '#fff')
        .on('click', (ev, d) => this.onPais(d.code));

      this.capaPins.selectAll('circle').data(pins.filter(p => p.lat != null && p.lon != null)).join('circle')
        .attr('class', d => 'pin ' + d.tipo)
        .attr('cx', d => this.proy([d.lon, d.lat])[0]).attr('cy', d => this.proy([d.lon, d.lat])[1])
        .on('click', (ev, d) => this.onPais(d.pais));

      // Rutas desde casa
      const casa = window.CONFIG.CASA;
      const rutas = this.opciones.rutas ? pins.filter(p => p.tipo === 'viaje' && p.lat != null) : [];
      this.capaRutas.selectAll('path').data(rutas).join('path')
        .attr('d', p => this.path({ type: 'LineString', coordinates: [[casa.lon, casa.lat], [p.lon, p.lat]] }));

      // Vuelos registrados
      const lv = this.opciones.vuelos ? (this.opciones.lineasVuelo || []) : [];
      this.capaLineasVuelo.selectAll('path').data(lv).join('path').attr('d', l => this.path({ type: 'LineString', coordinates: l }));
      const aeros = []; lv.forEach(l => aeros.push(l[0], l[1]));
      this.capaLineasVuelo.selectAll('circle').data(aeros).join('circle').attr('cx', p => this.proy(p)[0]).attr('cy', p => this.proy(p)[1]);

      // Sitios favoritos (se ven al hacer zoom)
      this.capaSitios.selectAll('text').data(this.opciones.sitios || []).join('text')
        .attr('x', d => this.proy([d.lon, d.lat])[0]).attr('y', d => this.proy([d.lon, d.lat])[1])
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'central').text(d => d.icono || '⭐');
      this.ajustarEscala();
    },

    // Avión que vuela desde casa hasta el destino
    volar(lat, lon) {
      if (!this.svg || lat == null) return;
      const casa = window.CONFIG.CASA;
      const linea = { type: 'LineString', coordinates: [[casa.lon, casa.lat], [lon, lat]] };
      const b = this.path.bounds(linea);
      const dx = Math.max(30, b[1][0] - b[0][0]), dy = Math.max(30, b[1][1] - b[0][1]);
      const k = Math.max(this.kInicial * 0.6, Math.min(30, 0.7 / Math.max(dx / this.W, dy / (this.H * 0.38))));
      const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2;
      this.svg.transition().duration(700).ease(d3.easeCubicInOut).call(this.zoom.transform, d3.zoomIdentity.translate(this.W / 2, this.H * 0.26).scale(k).translate(-cx, -cy));
      this.capaVuelo.selectAll('*').remove();
      const estela = this.capaVuelo.append('path').attr('class', 'estela').attr('d', this.path(linea));
      const largo = estela.node().getTotalLength();
      const avion = this.capaVuelo.append('text').attr('class', 'avion-vuelo').text('✈️').attr('text-anchor', 'middle').attr('dominant-baseline', 'central');
      this.ajustarEscala();
      estela.attr('stroke-dasharray', `0 ${largo}`);
      const t0 = performance.now() + 500, dur = 1800;
      const paso = ahora => {
        const t = Math.min(1, Math.max(0, (ahora - t0) / dur)), e = d3.easeCubicInOut(t);
        const p = estela.node().getPointAtLength(e * largo), p2 = estela.node().getPointAtLength(Math.min(largo, e * largo + 1));
        const ang = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI + 45;
        avion.attr('transform', `translate(${p.x},${p.y}) rotate(${ang})`);
        estela.attr('stroke-dasharray', `${e * largo} ${largo}`);
        if (t < 1) this._vueloRaf = requestAnimationFrame(paso);
        else setTimeout(() => this.capaVuelo.selectAll('*').transition().duration(800).style('opacity', 0).remove(), 1500);
      };
      cancelAnimationFrame(this._vueloRaf);
      this._vueloRaf = requestAnimationFrame(paso);
    },

    // SVG del mundo entero para el póster
    svgPoster(ancho, alto) {
      const proy = d3.geoNaturalEarth1().fitSize([ancho, alto], { type: 'Sphere' });
      const path = d3.geoPath(proy);
      const C = window.CONFIG.COLORES, est = this.estado;
      const col = c => est[c] === 'visitado' ? C.visitado : est[c] === 'casa' ? C.casa : est[c] === 'deseo' ? C.deseo : '#ece4d3';
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">`;
      svg += `<path d="${path({ type: 'Sphere' })}" fill="#dfeaee"/>`;
      svg += `<path d="${path(d3.geoGraticule10())}" fill="none" stroke="#fff" stroke-width="1"/>`;
      this.features.forEach(f => { svg += `<path d="${path(f)}" fill="${col(f.code)}" stroke="#fff" stroke-width="0.8"/>`; });
      return svg + '</svg>';
    },

    enfocar(code) {
      if (!this.svg) return;
      const f = this.features.find(x => x.code === code);
      let b;
      if (f) {
        b = this.path.bounds(f);
        if (f.geometry.type === 'MultiPolygon') {
          let mejor = null, area = 0;
          f.geometry.coordinates.forEach(c => { const g = { type: 'Polygon', coordinates: c }; const a = d3.geoArea(g); if (a > area) { area = a; mejor = g; } });
          if (mejor) b = this.path.bounds(mejor);
        }
      } else {
        const p = window.PAISES.porCodigo[code]; if (!p) return;
        const [x, y] = this.proy([p.lon, p.lat]); b = [[x - 4, y - 4], [x + 4, y + 4]];
      }
      const dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1];
      const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2;
      const k = Math.max(this.kInicial, Math.min(40, 0.6 / Math.max(dx / this.W, dy / (this.H * 0.4))));
      const t = d3.zoomIdentity.translate(this.W / 2, this.H * 0.26).scale(k).translate(-cx, -cy);
      this.svg.transition().duration(700).ease(d3.easeCubicInOut).call(this.zoom.transform, t);
    },

    reset() { if (this.svg) this.svg.transition().duration(600).ease(d3.easeCubicInOut).call(this.zoom.transform, this.vistaInicial()); },
    mundoEntero() { if (this.svg) this.svg.transition().duration(600).ease(d3.easeCubicInOut).call(this.zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1)); },

    revelar(code) {
      if (!this.capaPaises) return;
      const sel = this.capaPaises.selectAll('path').filter(d => d.code === code);
      sel.classed('revelando', false); void (sel.node() && sel.node().getBBox());
      sel.classed('revelando', true);
      setTimeout(() => sel.classed('revelando', false), 1600);
    }
  };

  Mapa.topoAGeo = topoAGeo;
  window.Mapa = Mapa;
})();
