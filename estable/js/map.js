// Mapa del mundo interactivo a pantalla completa (d3 + Natural Earth vía world-atlas)
(function () {
  const FUENTES = [
    'data/countries-50m.json',
    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'
  ];

  // Decodificador TopoJSON mínimo → GeoJSON
  function topoAGeo(topo, nombreObjeto) {
    const tf = topo.transform;
    const arcos = topo.arcs.map(arco => {
      let x = 0, y = 0;
      return arco.map(p => {
        if (tf) { x += p[0]; y += p[1]; return [x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]]; }
        return p.slice();
      });
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
      this.features = topoAGeo(topo, 'countries').map(f => {
        const pais = P.porNumero[f.id] || P.porCodigo[P.POR_NOMBRE_MAPA[f.properties.name]];
        f.code = pais ? pais.code : null;
        return f;
      }).filter(f => f.code !== 'AQ');
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
      this.capaPaises = this.g.append('g').attr('class', 'paises').attr('filter', 'url(#relieve)');
      this.capaPuntos = this.g.append('g').attr('class', 'mini-paises');
      this.capaPins = this.g.append('g').attr('class', 'pins');

      this.capaPaises.selectAll('path').data(this.features).join('path')
        .attr('d', this.path)
        .attr('data-code', d => d.code)
        .on('click', (ev, d) => { if (d.code) this.onPais(d.code); });

      const margen = 60;
      this.zoom = d3.zoom().scaleExtent([1, 80])
        .translateExtent([[b[0][0] - margen, b[0][1] - margen], [b[1][0] + margen, b[1][1] + margen]])
        .on('zoom', ev => {
          this.k = ev.transform.k;
          this.g.attr('transform', ev.transform);
          this.ajustarEscala();
        });
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
      this.capaPaises.selectAll('path').attr('stroke-width', 0.7 / k);
      this.capaPins.selectAll('circle').attr('r', d => (d.tipo === 'deseo' ? 3.2 : 3.5) / s).attr('stroke-width', 1.3 / s);
      this.capaPuntos.selectAll('circle').attr('r', 3.5 / s).attr('stroke-width', 1 / s);
    },

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
      this.capaPaises.selectAll('path')
        .attr('fill', d => color(d.code))
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
      this.ajustarEscala();
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

  window.Mapa = Mapa;
})();
