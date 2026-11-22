// Datos prácticos: ficha de cada país, frases útiles y ciudades populares
(function () {
  // código · moneda · idiomas · enchufes · prefijo
  const FICHA = `AD EUR ca C,F 376|AE AED ar G 971|AF AFN ps,fa C,F 93|AL ALL sq C,F 355|AM AMD hy C,F 374|AO AOA pt C 244|AR ARS es C,I 54|AT EUR de C,F 43|AU AUD en I 61|AZ AZN az C,F 994|BA BAM bs,hr,sr C,F 387|BB BBD en A,B 1|BD BDT bn C,D,G,K 880|BE EUR nl,fr,de C,E 32|BG BGN bg C,F 359|BH BHD ar G 973|BO BOB es A,C 591|BR BRL pt C,N 55|BS BSD en A,B 1|BT BTN dz D,F,G 975|BW BWP en,tn D,G,M 267|BY BYN be,ru C,F 375|BZ BZD en A,B,G 501|CA CAD en,fr A,B 1|CD CDF fr C,D,E 243|CH CHF de,fr,it C,J 41|CI XOF fr C,E 225|CL CLP es C,L 56|CM XAF fr,en C,E 237|CN CNY zh A,C,I 86|CO COP es A,B 57|CR CRC es A,B 506|CU CUP es A,B,C,L 53|CV CVE pt C,F 238|CY EUR el,tr G 357|CZ CZK cs C,E 420|DE EUR de C,F 49|DK DKK da C,E,F,K 45|DO DOP es A,B 1|DZ DZD ar,fr C,F 213|EC USD es A,B 593|EE EUR et C,F 372|EG EGP ar C,F 20|ES EUR es C,F 34|ET ETB am C,E,F,L 251|FI EUR fi,sv C,F 358|FJ FJD en I 679|FR EUR fr C,E 33|GB GBP en G 44|GE GEL ka C,F 995|GH GHS en D,G 233|GR EUR el C,F 30|GT GTQ es A,B 502|HK HKD zh,en G 852|HN HNL es A,B 504|HR EUR hr C,F 385|HU HUF hu C,F 36|ID IDR id C,F 62|IE EUR en,ga G 353|IL ILS he,ar C,H 972|IN INR hi,en C,D,M 91|IQ IQD ar C,D,G 964|IR IRR fa C,F 98|IS ISK is C,F 354|IT EUR it C,F,L 39|JM JMD en A,B 1|JO JOD ar B,C,D,F,G,J 962|JP JPY ja A,B 81|KE KES sw,en G 254|KG KGS ky,ru C,F 996|KH KHR km A,C,G 855|KR KRW ko C,F 82|KW KWD ar C,G 965|KZ KZT kk,ru C,F 7|LA LAK lo A,B,C,E,F 856|LB LBP ar C,D,G 961|LI CHF de C,J 423|LK LKR si,ta D,G,M 94|LT EUR lt C,F 370|LU EUR lb,fr,de C,F 352|LV EUR lv C,F 371|MA MAD ar,fr C,E 212|MC EUR fr C,E,F 377|MD MDL ro C,F 373|ME EUR sr C,F 382|MG MGA mg,fr C,D,E,J,K 261|MK MKD mk C,F 389|MM MMK my A,C,D,F,G 95|MN MNT mn C,E 976|MO MOP zh,pt D,G 853|MT EUR mt,en G 356|MU MUR en,fr C,G 230|MV MVR dv C,D,G,J,K,L 960|MX MXN es A,B 52|MY MYR ms G 60|MZ MZN pt C,F,M 258|NA NAD en D,M 264|NG NGN en D,G 234|NI NIO es A,B 505|NL EUR nl C,F 31|NO NOK no C,F 47|NP NPR ne C,D,M 977|NZ NZD en,mi I 64|OM OMR ar C,G 968|PA PAB es A,B 507|PE PEN es A,B,C 51|PH PHP tl,en A,B,C 63|PK PKR ur,en C,D 92|PL PLN pl C,E 48|PR USD es,en A,B 1|PS ILS ar C,H 970|PT EUR pt C,F 351|PY PYG es,gn C 595|QA QAR ar D,G 974|RO RON ro C,F 40|RS RSD sr C,F 381|RU RUB ru C,F 7|RW RWF rw,fr,en C,J 250|SA SAR ar G 966|SC SCR fr,en G 248|SE SEK sv C,F 46|SG SGD en,ms,zh,ta G 65|SI EUR sl C,F 386|SK EUR sk C,E 421|SM EUR it C,F,L 378|SN XOF fr C,D,E,K 221|SV USD es A,B 503|SY SYP ar C,E,L 963|TH THB th A,B,C,O 66|TJ TJS tg C,F 992|TM TMT tk B,C,F 993|TN TND ar,fr C,E 216|TR TRY tr C,F 90|TT TTD en A,B 1|TW TWD zh A,B 886|TZ TZS sw,en D,G 255|UA UAH uk C,F 380|UG UGX en,sw G 256|US USD en A,B 1|UY UYU es C,F,I,L 598|UZ UZS uz C,F 998|VA EUR it C,F,L 379|VE VES es A,B 58|VN VND vi A,C,F 84|ZA ZAR en,af,zu C,D,M,N 27|ZM ZMW en C,D,G 260|ZW ZWL en D,G 263|XK EUR sq,sr C,F 383|GI GBP en G 350|IM GBP en G 44|JE GBP en G 44|GG GBP en G 44|PF XPF fr C,E 689|NC XPF fr C,F 687|GP EUR fr C,E 590|MQ EUR fr C,E 596|RE EUR fr C,E 262|GL DKK kl C,E,F,K 299|FO DKK fo C,E,F,K 298|AW AWG nl A,B,F 297|CW ANG nl A,B 599|KY KYD en A,B 1|BM BMD en A,B 1`;

  const fichas = {};
  FICHA.split('|').forEach(l => { const [c, mon, idi, enc, pre] = l.split(' '); fichas[c] = { moneda: mon, idiomas: idi.split(','), enchufes: enc.split(','), prefijo: '+' + pre }; });

  let nomIdioma, nomMoneda;
  try { nomIdioma = new Intl.DisplayNames(['es'], { type: 'language' }); nomMoneda = new Intl.DisplayNames(['es'], { type: 'currency' }); } catch (e) { }
  function simbolo(cod) {
    try { return new Intl.NumberFormat('es', { style: 'currency', currency: cod, currencyDisplay: 'narrowSymbol' }).formatToParts(1).find(p => p.type === 'currency').value; } catch (e) { return cod; }
  }
  function ficha(code) {
    const f = fichas[code];
    if (!f) return null;
    return {
      monedaCod: f.moneda,
      moneda: nomMoneda ? nomMoneda.of(f.moneda) : f.moneda,
      simbolo: simbolo(f.moneda),
      idiomas: f.idiomas.map(i => nomIdioma ? nomIdioma.of(i) : i),
      idiomaCods: f.idiomas,
      enchufes: f.enchufes,
      mismoEnchufe: f.enchufes.includes('C') || f.enchufes.includes('F') || f.enchufes.includes('E'),
      prefijo: f.prefijo
    };
  }

  // Frases útiles: [hola, gracias, por favor, perdón, ¿cuánto cuesta?, la cuenta por favor] (con pronunciación si no es alfabeto latino)
  const FRASES = {
    en: ['Hello', 'Thank you', 'Please', 'Sorry', 'How much is it?', 'The bill, please'],
    fr: ['Bonjour', 'Merci', "S'il vous plaît", 'Pardon', 'Combien ça coûte ?', "L'addition, s'il vous plaît"],
    it: ['Ciao / Buongiorno', 'Grazie', 'Per favore', 'Scusi', 'Quanto costa?', 'Il conto, per favore'],
    pt: ['Olá', 'Obrigada', 'Por favor', 'Desculpe', 'Quanto custa?', 'A conta, por favor'],
    de: ['Hallo', 'Danke', 'Bitte', 'Entschuldigung', 'Wie viel kostet das?', 'Die Rechnung, bitte'],
    nl: ['Hallo', 'Dank je wel', 'Alsjeblieft', 'Sorry', 'Hoeveel kost het?', 'De rekening, alstublieft'],
    ca: ['Hola', 'Gràcies', 'Si us plau', 'Perdó', 'Quant costa?', 'El compte, si us plau'],
    el: ['Γεια σας (yia sas)', 'Ευχαριστώ (efjaristó)', 'Παρακαλώ (parakaló)', 'Συγγνώμη (signómi)', 'Πόσο κάνει; (póso káni?)', 'Τον λογαριασμό, παρακαλώ (ton logariasmó, parakaló)'],
    tr: ['Merhaba', 'Teşekkür ederim', 'Lütfen', 'Pardon', 'Ne kadar?', 'Hesap, lütfen'],
    ar: ['مرحبا (marhaba)', 'شكرا (shukran)', 'من فضلك (min fadlak)', 'آسف (asif)', 'بكم هذا؟ (bikam hadha?)', 'الحساب من فضلك (al-hisab min fadlak)'],
    ja: ['こんにちは (konnichiwa)', 'ありがとう (arigatō)', 'お願いします (onegaishimasu)', 'すみません (sumimasen)', 'いくらですか？ (ikura desu ka?)', 'お会計お願いします (okaikei onegaishimasu)'],
    zh: ['你好 (nǐ hǎo)', '谢谢 (xièxie)', '请 (qǐng)', '对不起 (duìbuqǐ)', '多少钱？ (duōshao qián?)', '买单 (mǎidān)'],
    ko: ['안녕하세요 (annyeonghaseyo)', '감사합니다 (gamsahamnida)', '주세요 (juseyo)', '죄송합니다 (joesonghamnida)', '얼마예요? (eolmayeyo?)', '계산해 주세요 (gyesanhae juseyo)'],
    th: ['สวัสดี (sawasdee ka)', 'ขอบคุณ (khob khun ka)', 'กรุณา (karuna)', 'ขอโทษ (kho thot)', 'เท่าไหร่ (tao rai?)', 'เช็คบิล (check bin)'],
    vi: ['Xin chào', 'Cảm ơn', 'Làm ơn', 'Xin lỗi', 'Bao nhiêu tiền?', 'Tính tiền'],
    ru: ['Здравствуйте (zdrávstvuyte)', 'Спасибо (spasíba)', 'Пожалуйста (pazhálusta)', 'Извините (izviníte)', 'Сколько стоит? (skólka stóit?)', 'Счёт, пожалуйста (shchot, pazhálusta)'],
    pl: ['Dzień dobry', 'Dziękuję', 'Proszę', 'Przepraszam', 'Ile to kosztuje?', 'Poproszę rachunek'],
    cs: ['Dobrý den', 'Děkuji', 'Prosím', 'Promiňte', 'Kolik to stojí?', 'Zaplatím, prosím'],
    hr: ['Bok / Dobar dan', 'Hvala', 'Molim', 'Oprostite', 'Koliko košta?', 'Račun, molim'],
    sv: ['Hej', 'Tack', 'Snälla', 'Förlåt', 'Hur mycket kostar det?', 'Notan, tack'],
    id: ['Halo', 'Terima kasih', 'Tolong', 'Maaf', 'Berapa harganya?', 'Minta bon'],
    ms: ['Helo', 'Terima kasih', 'Tolong', 'Maaf', 'Berapa harganya?', 'Minta bil'],
    hi: ['नमस्ते (namaste)', 'धन्यवाद (dhanyavaad)', 'कृपया (kripya)', 'माफ़ कीजिए (maaf kijiye)', 'कितने का है? (kitne ka hai?)', 'बिल दीजिए (bill dijiye)'],
    hu: ['Szia / Jó napot', 'Köszönöm', 'Kérem', 'Elnézést', 'Mennyibe kerül?', 'A számlát, kérem'],
    ro: ['Bună ziua', 'Mulțumesc', 'Vă rog', 'Scuzați', 'Cât costă?', 'Nota, vă rog'],
    is: ['Halló', 'Takk', 'Vinsamlegast', 'Fyrirgefðu', 'Hvað kostar þetta?', 'Reikninginn, takk'],
    sw: ['Jambo', 'Asante', 'Tafadhali', 'Samahani', 'Bei gani?', 'Naomba bili'],
    he: ['שלום (shalom)', 'תודה (toda)', 'בבקשה (bevakasha)', 'סליחה (slicha)', 'כמה זה עולה? (kama ze ole?)', 'חשבון בבקשה (heshbon bevakasha)']
  };
  const ETIQUETAS_FRASES = ['Hola', 'Gracias', 'Por favor', 'Perdón', '¿Cuánto cuesta?', 'La cuenta, por favor'];

  // Ciudades populares (sugerencias instantáneas, sin internet): país|nombre|lat|lon
  const CIUDADES = `FR|París|48.857|2.352;FR|Niza|43.71|7.262;FR|Marsella|43.297|5.381;FR|Lyon|45.764|4.836;FR|Burdeos|44.838|-0.579;FR|Biarritz|43.483|-1.559;IT|Roma|41.903|12.496;IT|Venecia|45.441|12.316;IT|Florencia|43.77|11.256;IT|Milán|45.464|9.19;IT|Nápoles|40.852|14.268;IT|Bolonia|44.494|11.343;IT|Turín|45.07|7.687;IT|Palermo|38.116|13.361;IT|Pisa|43.723|10.402;PT|Lisboa|38.722|-9.139;PT|Oporto|41.158|-8.629;PT|Faro|37.019|-7.93;PT|Funchal (Madeira)|32.65|-16.909;GB|Londres|51.507|-0.128;GB|Edimburgo|55.953|-3.188;GB|Mánchester|53.481|-2.243;GB|Liverpool|53.408|-2.991;IE|Dublín|53.35|-6.26;NL|Ámsterdam|52.37|4.895;NL|Róterdam|51.924|4.478;BE|Bruselas|50.85|4.352;BE|Brujas|51.209|3.225;DE|Berlín|52.52|13.405;DE|Múnich|48.135|11.582;DE|Hamburgo|53.551|9.994;DE|Colonia|50.938|6.96;CH|Zúrich|47.377|8.541;CH|Ginebra|46.204|6.143;AT|Viena|48.208|16.373;AT|Salzburgo|47.81|13.055;CZ|Praga|50.075|14.438;HU|Budapest|47.498|19.04;PL|Cracovia|50.065|19.945;PL|Varsovia|52.23|21.012;GR|Atenas|37.984|23.728;GR|Santorini|36.393|25.461;GR|Mykonos|37.446|25.329;GR|Creta (Heraclión)|35.339|25.144;HR|Dubrovnik|42.65|18.094;HR|Split|43.508|16.44;HR|Zagreb|45.815|15.982;SI|Liubliana|46.057|14.506;DK|Copenhague|55.676|12.568;SE|Estocolmo|59.329|18.069;NO|Oslo|59.914|10.752;NO|Bergen|60.391|5.322;NO|Tromsø|69.649|18.956;FI|Helsinki|60.17|24.938;FI|Rovaniemi (Laponia)|66.503|25.729;IS|Reikiavik|64.147|-21.943;EE|Tallin|59.437|24.754;LV|Riga|56.95|24.105;LT|Vilna|54.687|25.28;MT|La Valeta|35.899|14.514;MC|Mónaco|43.738|7.425;TR|Estambul|41.008|28.978;TR|Capadocia|38.643|34.828;MA|Marrakech|31.63|-7.981;MA|Fez|34.033|-5;MA|Chefchaouen|35.171|-5.27;MA|Tánger|35.759|-5.834;EG|El Cairo|30.044|31.236;EG|Luxor|25.687|32.64;TN|Túnez|36.806|10.181;ZA|Ciudad del Cabo|-33.925|18.424;KE|Nairobi|-1.292|36.822;TZ|Zanzíbar|-6.165|39.199;AE|Dubái|25.205|55.271;AE|Abu Dabi|24.453|54.377;JO|Petra|30.329|35.444;IL|Jerusalén|31.769|35.216;JP|Tokio|35.676|139.65;JP|Kioto|35.012|135.768;JP|Osaka|34.694|135.502;CN|Pekín|39.904|116.407;CN|Shanghái|31.23|121.474;HK|Hong Kong|22.319|114.169;KR|Seúl|37.567|126.978;TH|Bangkok|13.756|100.502;TH|Chiang Mai|18.788|98.986;TH|Phuket|7.88|98.392;TH|Krabi|8.086|98.907;VN|Hanói|21.028|105.854;VN|Ciudad Ho Chi Minh|10.823|106.63;VN|Bahía de Ha Long|20.91|107.184;KH|Siem Reap (Angkor)|13.367|103.845;ID|Bali|-8.34|115.092;SG|Singapur|1.352|103.82;MY|Kuala Lumpur|3.139|101.687;PH|Manila|14.6|120.984;IN|Nueva Delhi|28.614|77.209;IN|Agra|27.177|78.008;IN|Jaipur|26.912|75.787;LK|Colombo|6.927|79.861;MV|Malé (Maldivas)|4.175|73.509;NP|Katmandú|27.717|85.324;US|Nueva York|40.713|-74.006;US|Los Ángeles|34.052|-118.244;US|San Francisco|37.775|-122.419;US|Las Vegas|36.17|-115.14;US|Miami|25.762|-80.192;US|Orlando|28.538|-81.379;US|Chicago|41.878|-87.63;US|Washington D. C.|38.907|-77.037;US|Boston|42.36|-71.059;US|Nueva Orleans|29.951|-90.072;US|Honolulu|21.307|-157.858;CA|Toronto|43.653|-79.383;CA|Vancouver|49.283|-123.121;CA|Montreal|45.502|-73.567;MX|Ciudad de México|19.433|-99.133;MX|Cancún|21.162|-86.851;MX|Tulum|20.211|-87.465;CU|La Habana|23.113|-82.366;DO|Punta Cana|18.582|-68.405;CR|San José|9.928|-84.091;PE|Cuzco|-13.532|-71.968;PE|Lima|-12.046|-77.043;AR|Buenos Aires|-34.604|-58.382;AR|Ushuaia|-54.801|-68.303;BR|Río de Janeiro|-22.907|-43.173;BR|São Paulo|-23.551|-46.633;CL|Santiago de Chile|-33.449|-70.669;CO|Cartagena de Indias|10.391|-75.479;CO|Bogotá|4.711|-74.072;AU|Sídney|-33.869|151.209;AU|Melbourne|-37.814|144.963;NZ|Auckland|-36.848|174.763;NZ|Queenstown|-45.031|168.663;ES|Madrid|40.417|-3.704;ES|Barcelona|41.385|2.173;ES|Zaragoza|41.649|-0.889;ES|Sevilla|37.389|-5.984;ES|Granada|37.177|-3.599;ES|Valencia|39.47|-0.376;ES|Málaga|36.721|-4.421;ES|Bilbao|43.263|-2.935;ES|San Sebastián|43.318|-1.981;ES|Santiago de Compostela|42.878|-8.545;ES|Palma de Mallorca|39.57|2.65;ES|Ibiza|38.907|1.421;ES|Menorca (Mahón)|39.889|4.265;ES|Tenerife|28.291|-16.629;ES|Gran Canaria|27.958|-15.593;ES|Lanzarote|29.046|-13.59;ES|Cádiz|36.527|-6.288;ES|Córdoba|37.888|-4.779;ES|Salamanca|40.97|-5.664;ES|Toledo|39.863|-4.027;ES|Segovia|40.948|-4.118;ES|Teruel|40.345|-1.106;ES|Calatayud|41.353|-1.643;ES|La Almunia de Doña Godina|41.478|-1.374;ES|Tarazona|41.905|-1.725;ES|Ejea de los Caballeros|42.126|-1.137;ES|Alcañiz|41.051|-0.133;ES|Jaca|42.571|-0.549;ES|Huesca|42.14|-0.408;ES|Pamplona|42.812|-1.646;ES|Logroño|42.466|-2.445;ES|Benidorm|38.541|-0.122;ES|Santander|43.462|-3.81;ES|Oviedo|43.361|-5.849;AD|Andorra la Vieja|42.506|1.522`;
  const ciudades = CIUDADES.split(';').map(s => { const [pais, nombre, lat, lon] = s.split('|'); return { pais, nombre, lat: +lat, lon: +lon }; });

  const MALETAS_TIPO = {
    '🏖️ Playa': { '👙 Playa': ['Bañador (x2)', 'Toalla de playa', 'Crema solar alta', 'After sun', 'Chanclas', 'Gafas de sol', 'Gorra o sombrero', 'Bolsa estanca para el móvil'], '👕 Ropa': ['Ropa ligera', 'Vestido o camisa para la noche', 'Sudadera fina'] },
    '❄️ Nieve': { '🧥 Ropa de abrigo': ['Abrigo impermeable', 'Térmicas', 'Guantes', 'Gorro', 'Braga de cuello', 'Calcetines gordos', 'Botas de nieve'], '🧴 Cuidado': ['Crema solar', 'Cacao de labios', 'Crema hidratante'] },
    '🏙️ Ciudad': { '👟 Para patear': ['Zapatillas cómodas', 'Mochila pequeña', 'Botella reutilizable', 'Batería externa', 'Paraguas plegable'], '📋 Planes': ['Entradas de museos', 'Mapa offline descargado', 'Lista de restaurantes'] },
    '🎒 Mochilero': { '🎒 Equipo': ['Mochila grande', 'Candado', 'Toalla de microfibra', 'Linterna frontal', 'Tapones y antifaz', 'Bolsas zip', 'Navaja (en facturado)'], '💊 Botiquín': ['Tiritas', 'Ibuprofeno', 'Antidiarreico', 'Repelente de mosquitos', 'Gel desinfectante'] }
  };

  window.DATOS = { ficha, FRASES, ETIQUETAS_FRASES, ciudades, MALETAS_TIPO };
})();
