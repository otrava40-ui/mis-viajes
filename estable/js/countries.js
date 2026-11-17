// Tabla de países: código numérico ISO (el que usa el mapa), código de 2 letras,
// continente y coordenadas aproximadas (para chinchetas y kilómetros).
// Los marcados con * son territorios (no cuentan para el "% del mundo").
(function () {
  const RAW = `004 AF AS 33.9 67.7|008 AL EU 41.2 20.2|010 AQ AN -75 0 *|012 DZ AF 28 1.7|016 AS OC -14.3 -170.7 *|020 AD EU 42.5 1.5|024 AO AF -11.2 17.9|028 AG NA 17.1 -61.8|031 AZ AS 40.1 47.6|032 AR SA -38.4 -63.6|036 AU OC -25.3 133.8|040 AT EU 47.5 14.6|044 BS NA 25 -77.4|048 BH AS 26 50.6|050 BD AS 23.7 90.4|051 AM AS 40.1 45|052 BB NA 13.2 -59.5|056 BE EU 50.5 4.5|060 BM NA 32.3 -64.8 *|064 BT AS 27.5 90.4|068 BO SA -16.3 -63.6|070 BA EU 43.9 17.7|072 BW AF -22.3 24.7|076 BR SA -14.2 -51.9|084 BZ NA 17.2 -88.5|090 SB OC -9.6 160.2|092 VG NA 18.4 -64.6 *|096 BN AS 4.5 114.7|100 BG EU 42.7 25.5|104 MM AS 21.9 95.9|108 BI AF -3.4 29.9|112 BY EU 53.7 28|116 KH AS 12.6 105|120 CM AF 7.4 12.4|124 CA NA 56.1 -106.3|132 CV AF 16 -24|136 KY NA 19.3 -81.3 *|140 CF AF 6.6 20.9|144 LK AS 7.9 80.8|148 TD AF 15.5 18.7|152 CL SA -35.7 -71.5|156 CN AS 35.9 104.2|158 TW AS 23.7 121|170 CO SA 4.6 -74.3|174 KM AF -11.9 43.9|178 CG AF -0.2 15.8|180 CD AF -4 21.8|184 CK OC -21.2 -159.8 *|188 CR NA 9.7 -83.8|191 HR EU 45.1 15.2|192 CU NA 21.5 -77.8|196 CY EU 35.1 33.4|203 CZ EU 49.8 15.5|204 BJ AF 9.3 2.3|208 DK EU 56.3 9.5|212 DM NA 15.4 -61.4|214 DO NA 18.7 -70.2|218 EC SA -1.8 -78.2|222 SV NA 13.8 -88.9|226 GQ AF 1.7 10.3|231 ET AF 9.1 40.5|232 ER AF 15.2 39.8|233 EE EU 58.6 25|234 FO EU 61.9 -6.9 *|238 FK SA -51.8 -59.5 *|239 GS AN -54.4 -36.6 *|242 FJ OC -17.7 178.1|246 FI EU 61.9 25.7|248 AX EU 60.2 20 *|250 FR EU 46.2 2.2|254 GF SA 3.9 -53.1 *|258 PF OC -17.7 -149.4 *|260 TF AN -49.3 69.3 *|262 DJ AF 11.8 42.6|266 GA AF -0.8 11.6|268 GE AS 42.3 43.4|270 GM AF 13.4 -15.3|275 PS AS 31.9 35.2|276 DE EU 51.2 10.5|288 GH AF 7.9 -1|292 GI EU 36.14 -5.35 *|296 KI OC 1.9 -157.4|300 GR EU 39.1 21.8|304 GL NA 71.7 -42.6 *|308 GD NA 12.1 -61.7|312 GP NA 16.2 -61.6 *|316 GU OC 13.4 144.8 *|320 GT NA 15.8 -90.2|324 GN AF 9.9 -9.7|328 GY SA 4.9 -58.9|332 HT NA 19 -72.3|334 HM AN -53.1 73.5 *|336 VA EU 41.9 12.45|340 HN NA 15.2 -86.2|344 HK AS 22.3 114.2 *|348 HU EU 47.2 19.5|352 IS EU 64.9 -19|356 IN AS 20.6 79|360 ID AS -0.8 113.9|364 IR AS 32.4 53.7|368 IQ AS 33.2 43.7|372 IE EU 53.4 -8.2|376 IL AS 31 34.9|380 IT EU 41.9 12.6|384 CI AF 7.5 -5.5|388 JM NA 18.1 -77.3|392 JP AS 36.2 138.3|398 KZ AS 48 66.9|400 JO AS 30.6 36.2|404 KE AF 0 37.9|408 KP AS 40.3 127.5|410 KR AS 35.9 127.8|414 KW AS 29.3 47.5|417 KG AS 41.2 74.8|418 LA AS 19.9 102.5|422 LB AS 33.9 35.9|426 LS AF -29.6 28.2|428 LV EU 56.9 24.6|430 LR AF 6.4 -9.4|434 LY AF 26.3 17.2|438 LI EU 47.2 9.55|440 LT EU 55.2 23.9|442 LU EU 49.8 6.1|446 MO AS 22.2 113.5 *|450 MG AF -18.8 46.9|454 MW AF -13.3 34.3|458 MY AS 4.2 102|462 MV AS 3.2 73.2|466 ML AF 17.6 -4|470 MT EU 35.9 14.4|474 MQ NA 14.6 -61 *|478 MR AF 21 -10.9|480 MU AF -20.3 57.6|484 MX NA 23.6 -102.6|492 MC EU 43.74 7.42|496 MN AS 46.9 103.8|498 MD EU 47.4 28.4|499 ME EU 42.7 19.4|504 MA AF 31.8 -7.1|508 MZ AF -18.7 35.5|512 OM AS 21.5 55.9|516 NA AF -22.9 18.5|520 NR OC -0.5 166.9|524 NP AS 28.4 84.1|528 NL EU 52.1 5.3|531 CW NA 12.2 -69 *|533 AW NA 12.5 -70 *|540 NC OC -20.9 165.6 *|548 VU OC -15.4 166.9|554 NZ OC -40.9 174.9|558 NI NA 12.9 -85.2|562 NE AF 17.6 8.1|566 NG AF 9.1 8.7|570 NU OC -19 -169.9 *|574 NF OC -29 168 *|578 NO EU 60.5 8.5|580 MP OC 15.2 145.7 *|583 FM OC 7.4 150.6|584 MH OC 7.1 171.2|585 PW OC 7.5 134.6|586 PK AS 30.4 69.3|591 PA NA 8.5 -80.8|598 PG OC -6.3 143.9|600 PY SA -23.4 -58.4|604 PE SA -9.2 -75|608 PH AS 12.9 121.8|612 PN OC -24.4 -128.3 *|616 PL EU 51.9 19.1|620 PT EU 39.4 -8.2|624 GW AF 11.8 -15.2|626 TL AS -8.9 125.7|630 PR NA 18.2 -66.6 *|634 QA AS 25.4 51.2|638 RE AF -21.1 55.5 *|642 RO EU 45.9 25|643 RU EU 61.5 105.3|646 RW AF -1.9 29.9|652 BL NA 17.9 -62.8 *|654 SH AF -15.9 -5.7 *|659 KN NA 17.3 -62.7|660 AI NA 18.2 -63.1 *|662 LC NA 13.9 -61|663 MF NA 18.1 -63.05 *|666 PM NA 46.9 -56.3 *|670 VC NA 13.25 -61.2|674 SM EU 43.9 12.45|678 ST AF 0.2 6.6|682 SA AS 23.9 45.1|686 SN AF 14.5 -14.5|688 RS EU 44 21|690 SC AF -4.7 55.5|694 SL AF 8.5 -11.8|702 SG AS 1.35 103.8|703 SK EU 48.7 19.7|704 VN AS 14.1 108.3|705 SI EU 46.2 15|706 SO AF 5.2 46.2|710 ZA AF -30.6 22.9|716 ZW AF -19 29.2|724 ES EU 40.4 -3.7|728 SS AF 6.9 31.3|729 SD AF 12.9 30.2|732 EH AF 24.2 -12.9 *|740 SR SA 3.9 -56|748 SZ AF -26.5 31.5|752 SE EU 60.1 18.6|756 CH EU 46.8 8.2|760 SY AS 34.8 39|762 TJ AS 38.9 71.3|764 TH AS 15.9 101|768 TG AF 8.6 0.8|776 TO OC -21.2 -175.2|780 TT NA 10.7 -61.2|784 AE AS 23.4 53.8|788 TN AF 33.9 9.5|792 TR AS 39 35.2|795 TM AS 38.97 59.6|796 TC NA 21.7 -71.8 *|798 TV OC -7.1 177.6|800 UG AF 1.4 32.3|804 UA EU 48.4 31.2|807 MK EU 41.6 21.7|818 EG AF 26.8 30.8|826 GB EU 54 -2.5|831 GG EU 49.45 -2.58 *|832 JE EU 49.2 -2.13 *|833 IM EU 54.2 -4.5 *|834 TZ AF -6.4 34.9|840 US NA 39.5 -98.5|850 VI NA 18.3 -64.9 *|854 BF AF 12.2 -1.6|858 UY SA -32.5 -55.8|860 UZ AS 41.4 64.6|862 VE SA 6.4 -66.6|876 WF OC -13.8 -177.2 *|882 WS OC -13.8 -172.1|887 YE AS 15.6 48.5|894 ZM AF -13.1 27.8|XKX XK EU 42.6 20.9`;

  const CONTINENTES = {
    EU: 'Europa', AS: 'Asia', AF: 'África', NA: 'América del Norte',
    SA: 'América del Sur', OC: 'Oceanía', AN: 'Antártida'
  };

  let nombres;
  try { nombres = new Intl.DisplayNames(['es'], { type: 'region' }); } catch (e) { nombres = null; }
  const EXTRA = { XK: 'Kosovo' };

  const lista = RAW.split('|').map(row => {
    const [num, code, cont, lat, lon, t] = row.trim().split(/\s+/);
    let nombre = EXTRA[code] || (nombres ? nombres.of(code) : code);
    return { num, code, cont, lat: +lat, lon: +lon, territorio: t === '*', nombre };
  }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const porCodigo = {}, porNumero = {};
  lista.forEach(p => { porCodigo[p.code] = p; porNumero[p.num] = p; });

  // Algunos trozos del mapa no tienen código numérico: se reconocen por su nombre en inglés.
  const POR_NOMBRE_MAPA = { 'Kosovo': 'XK', 'N. Cyprus': 'CY', 'Somaliland': 'SO', 'Siachen Glacier': 'IN' };

  function bandera(code) {
    if (!code || code.length !== 2) return '🏳️';
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
  }

  function normaliza(s) {
    return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  // Búsqueda tolerante de un país por nombre (para el importador).
  const ALIAS = { 'eeuu': 'US', 'ee.uu.': 'US', 'usa': 'US', 'estados unidos': 'US', 'reino unido': 'GB', 'inglaterra': 'GB', 'escocia': 'GB', 'gales': 'GB', 'holanda': 'NL', 'paises bajos': 'NL', 'republica checa': 'CZ', 'chequia': 'CZ', 'corea': 'KR', 'corea del sur': 'KR', 'emiratos': 'AE', 'emiratos arabes': 'AE', 'vaticano': 'VA', 'rusia': 'RU', 'birmania': 'MM', 'costa de marfil': 'CI', 'suiza': 'CH', 'turquia': 'TR' };
  function buscaPais(texto) {
    const n = normaliza(texto);
    if (!n) return null;
    if (ALIAS[n]) return porCodigo[ALIAS[n]];
    if (n.length === 2 && porCodigo[n.toUpperCase()]) return porCodigo[n.toUpperCase()];
    return lista.find(p => normaliza(p.nombre) === n) || lista.find(p => normaliza(p.nombre).startsWith(n)) || null;
  }

  window.PAISES = { lista, porCodigo, porNumero, POR_NOMBRE_MAPA, CONTINENTES, bandera, buscaPais, normaliza, TOTAL_MUNDO: 195 };
})();
