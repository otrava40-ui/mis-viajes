// ============================================================
//  CONFIGURACIÓN  ·  Este es el ÚNICO archivo que tienes que tocar
// ============================================================
window.CONFIG = {
  // 1) Datos de Supabase (Project Settings → API). Déjalos vacíos para el
  //    "modo prueba": todo se guarda solo en el navegador que lo abre.
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  // 2) Personalización
  APP_NOMBRE: 'Mis Viajes',           // Nombre que sale arriba y bajo el icono
  NOMBRE: 'Lara',                      // Nombre de tu cuñada (para el saludo)
  CASA: { ciudad: 'Calatayud', lat: 41.3536, lon: -1.6432, pais: 'ES' },
  CONTAR_PAIS_DE_CASA: true,           // España cuenta como país visitado
  ANIMACION_ENTRADA: true,             // Avión dando la vuelta al mundo al abrir

  // 3) Mensaje sorpresa SOLO PARA EL MODO PRUEBA. Con Supabase conectado esto no se usa:
  //    el mensaje se escribe desde la app (Más → Mensajes para la familia) y queda privado.
  //    Ojo: este archivo es público en GitHub, así que bórralo cuando conectes Supabase.
  //    Puedes usar saltos de línea con \n
  MENSAJE_SORPRESA: {
    titulo: '¡Feliz Navidad! 🎄',
    texto: 'Esta app es para que guardes todos tus viajes en un solo sitio.\n\nYa te he dejado cargados los que conocía. A partir de ahora, cada sitio nuevo que visites ¡a rascar el mapa!\n\nQue este año sumes muchos sellos al pasaporte.',
    firma: 'Sergio y Blanca'
  },

  // 4) Mensajes escondidos (SOLO MODO PRUEBA; con Supabase se escriben desde la app).
  //    pais = código de 2 letras (JP Japón, IT Italia, US EEUU, MX México, TH Tailandia…)
  MENSAJES_FAMILIA: [
    // { pais: 'JP', de: 'Tu hermana', titulo: '¡Por fin Japón!', texto: 'Escribe aquí el mensaje…' },
    // { pais: 'IS', de: 'Mamá', titulo: 'Auroras', texto: '…' },
  ],

  // 5) Colores (también se pueden cambiar desde la app en Más → Apariencia)
  COLORES: {
    visitado: '#e07a5f',
    deseo: '#5b8e7d',
    casa: '#c9a227'
  }
};
