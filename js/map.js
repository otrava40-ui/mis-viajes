// Mapa del mundo interactivo (d3 + datos de Natural Earth vía world-atlas)
(function () {
  const FUENTES = [
    'data/countries-50m.json',                                   // copia local opcional
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
    const obj = topo.objects[nombreObjeto];
    return obj.geometries.map(g => {
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
    svg: null, g: null, zoom: null, proy: null, path: null, features: [], k: 1,
    estado: {}, rasca: false, onPais: () => { },

    async iniciar(contenedor, onPais) {
      this.onPais = onPais;
      const topo = await cargarTopo();
      const P = window.PAISES;
      this.features = topoAGeo(topo, 'countries').map(f => {
        const pais = P.porNumero[f.id] || P.porCodigo[P.POR_NOMBRE_MAPA[f.properties.name]];
        f.code = pais ? pais.code : null;
        return f;
      }).filter(f => f.code !== 'AQ');

      const W = 1000, H = 560;
      this.proy = d3.geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' });
      this.path = d3.geoPath(this.proy);

      contenedor.innerHTML = '';
      const svg = d3.select(contenedor).append('svg')
        .attr('viewBox', `0 0 ${W} ${H}`).attr('class', 'mapa-svg').attr('role', 'img').attr('aria-label', 'Mapa del mundo');
      const defs = svg.append('defs');
      const pat = defs.append('pattern').attr('id', 'rasca').attr('patternUnits', 'userSpaceOnUse').attr('width', 6).attr('height', 6).attr('patternTransform', 'rotate(35)');
      pat.append('rect').attr('width', 6).attr('height', 6).attr('fill', '#cfb36b');
      pat.append('rect').attr('width', 2).attr('height', 6).attr('fill', '#e6d293');
      this.svg = svg;
      svg.append('path').attr('class', 'oceano').attr('d', this.path({ type: 'Sphere' }));
      this.g = svg.append('g');
      this.g.append('path').attr('class', 'reticula').attr('d', this.path(d3.geoGraticule10()));
      this.capaPaises = this.g.append('g').attr('class', 'paises');
      this.capaPuntos = this.g.append('g').attr('class', 'mini-paises');
      this.capaPins = this.g.append('g').attr('class', 'pins');

      this.capaPaises.selectAll('path').data(this.features).join('path')
        .attr('d', this.path)
        .attr('data-code', d => d.code)
        .on('click', (ev, d) => { if (d.code) this.onPais(d.code); });

      this.zoom = d3.zoom().scaleExtent([1, 60]).translateExtent([[0, 0], [W, H]])
        .on('zoom', ev => {
          this.k = ev.transform.k;
          this.g.attr('transform', ev.transform);
          this.g.style('--k', this.k);
          this.ajustarEscala();
        });
      svg.call(this.zoom).on('dblclick.zoom', null);
      this.W = W; this.H = H;
    },

    ajustarEscala() {
      const k = this.k;
      this.capaPaises.selectAll('path').attr('stroke-width', 0.5 / k);
      this.capaPins.selectAll('circle').attr('r', d => (d.tipo === 'deseo' ? 3.2 : 3.6) / Math.sqrt(k)).attr('stroke-width', 1.2 / Math.sqrt(k));
      this.capaPuntos.selectAll('circle').attr('r', 3.5 / Math.sqrt(k)).attr('stroke-width', 1 / Math.sqrt(k));
    },

    // estado: { code: 'visitado' | 'deseo' | 'casa' }
    pintar(estado, pins, rasca) {
      if (!this.svg) return;
      this.estado = estado; this.rasca = rasca;
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

      // Países diminutos que no aparecen en el mapa: se dibujan como punto
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
      const f = this.features.find(x => x.code === code);
      let b;
      if (f) b = this.path.bounds(f);
      else {
        const p = window.PAISES.porCodigo[code]; if (!p) return;
        const [x, y] = this.proy([p.lon, p.lat]); b = [[x - 8, y - 8], [x + 8, y + 8]];
      }
      // Países con territorios lejanos (Francia, EEUU…): usa el trozo más grande
      if (f && f.geometry.type === 'MultiPolygon') {
        let mejor = null, area = 0;
        f.geometry.coordinates.forEach(c => { const g = { type: 'Polygon', coordinates: c }; const a = d3.geoArea(g); if (a > area) { area = a; mejor = g; } });
        if (mejor) b = this.path.bounds(mejor);
      }
      const dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1];
      const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2;
      const k = Math.max(1, Math.min(14, 0.55 / Math.max(dx / this.W, dy / this.H)));
      // Deja hueco abajo para la ficha del país
      const t = d3.zoomIdentity.translate(this.W / 2, this.H * 0.32).scale(k).translate(-cx, -cy);
      this.svg.transition().duration(650).call(this.zoom.transform, t);
    },

    reset() { if (this.svg) this.svg.transition().duration(500).call(this.zoom.transform, d3.zoomIdentity); },

    revelar(code) {
      const sel = this.capaPaises.selectAll('path').filter(d => d.code === code);
      sel.classed('revelando', false); void (sel.node() && sel.node().getBBox());
      sel.classed('revelando', true);
      setTimeout(() => sel.classed('revelando', false), 1600);
    }
  };

  window.Mapa = Mapa;
})();
