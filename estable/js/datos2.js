// Aeropuertos, aerolíneas, maravillas del mundo y platos típicos
(function () {
  // IATA|ciudad|país|lat|lon
  const AEROPUERTOS = `ZAZ|Zaragoza|ES|41.666|-1.042;MAD|Madrid|ES|40.472|-3.561;BCN|Barcelona|ES|41.297|2.078;VLC|Valencia|ES|39.489|-0.482;AGP|Málaga|ES|36.675|-4.499;SVQ|Sevilla|ES|37.418|-5.893;BIO|Bilbao|ES|43.301|-2.911;PMI|Palma de Mallorca|ES|39.552|2.739;IBZ|Ibiza|ES|38.873|1.373;MAH|Menorca|ES|39.863|4.219;ALC|Alicante|ES|38.282|-0.558;TFS|Tenerife Sur|ES|28.044|-16.573;TFN|Tenerife Norte|ES|28.483|-16.342;LPA|Gran Canaria|ES|27.932|-15.387;ACE|Lanzarote|ES|28.946|-13.605;FUE|Fuerteventura|ES|28.453|-13.864;SCQ|Santiago de Compostela|ES|42.896|-8.415;GRX|Granada|ES|37.189|-3.777;PNA|Pamplona|ES|42.77|-1.646;SDR|Santander|ES|43.427|-3.82;OVD|Asturias|ES|43.564|-6.035;REU|Reus|ES|41.147|1.167;GRO|Girona|ES|41.901|2.76;XRY|Jerez|ES|36.745|-6.06;LIS|Lisboa|PT|38.774|-9.134;OPO|Oporto|PT|41.248|-8.681;FAO|Faro|PT|37.014|-7.966;FNC|Funchal|PT|32.697|-16.774;CDG|París CDG|FR|49.01|2.548;ORY|París Orly|FR|48.723|2.379;BVA|París Beauvais|FR|49.454|2.113;NCE|Niza|FR|43.658|7.216;MRS|Marsella|FR|43.436|5.214;LYS|Lyon|FR|45.726|5.081;BOD|Burdeos|FR|44.828|-0.716;TLS|Toulouse|FR|43.629|1.364;LHR|Londres Heathrow|GB|51.47|-0.454;LGW|Londres Gatwick|GB|51.148|-0.19;STN|Londres Stansted|GB|51.885|0.235;LTN|Londres Luton|GB|51.875|-0.368;MAN|Mánchester|GB|53.354|-2.275;EDI|Edimburgo|GB|55.95|-3.373;LPL|Liverpool|GB|53.334|-2.85;DUB|Dublín|IE|53.421|-6.27;AMS|Ámsterdam|NL|52.31|4.768;EIN|Eindhoven|NL|51.45|5.374;BRU|Bruselas|BE|50.901|4.484;CRL|Bruselas Charleroi|BE|50.459|4.453;FRA|Fráncfort|DE|50.033|8.57;MUC|Múnich|DE|48.354|11.786;BER|Berlín|DE|52.366|13.503;HAM|Hamburgo|DE|53.63|9.988;DUS|Düsseldorf|DE|51.29|6.767;CGN|Colonia|DE|50.866|7.143;ZRH|Zúrich|CH|47.465|8.549;GVA|Ginebra|CH|46.238|6.109;BSL|Basilea|CH|47.59|7.529;VIE|Viena|AT|48.11|16.57;SZG|Salzburgo|AT|47.793|13.004;PRG|Praga|CZ|50.101|14.26;BUD|Budapest|HU|47.437|19.256;WAW|Varsovia|PL|52.166|20.967;KRK|Cracovia|PL|50.078|19.785;FCO|Roma Fiumicino|IT|41.8|12.239;CIA|Roma Ciampino|IT|41.799|12.595;MXP|Milán Malpensa|IT|45.63|8.723;BGY|Milán Bérgamo|IT|45.674|9.704;LIN|Milán Linate|IT|45.445|9.277;VCE|Venecia|IT|45.505|12.352;TSF|Venecia Treviso|IT|45.648|12.194;FLR|Florencia|IT|43.81|11.205;PSA|Pisa|IT|43.684|10.392;BLQ|Bolonia|IT|44.535|11.289;NAP|Nápoles|IT|40.886|14.291;PMO|Palermo|IT|38.176|13.091;CTA|Catania|IT|37.467|15.066;CAG|Cagliari|IT|39.251|9.054;BRI|Bari|IT|41.139|16.761;TRN|Turín|IT|45.2|7.65;MLA|Malta|MT|35.857|14.477;ATH|Atenas|GR|37.936|23.947;JTR|Santorini|GR|36.399|25.479;JMK|Mykonos|GR|37.435|25.348;HER|Heraclión (Creta)|GR|35.34|25.18;CFU|Corfú|GR|39.602|19.912;RHO|Rodas|GR|36.405|28.086;SKG|Tesalónica|GR|40.52|22.971;DBV|Dubrovnik|HR|42.561|18.268;SPU|Split|HR|43.539|16.298;ZAG|Zagreb|HR|45.743|16.069;LJU|Liubliana|SI|46.224|14.458;CPH|Copenhague|DK|55.618|12.656;ARN|Estocolmo|SE|59.652|17.919;OSL|Oslo|NO|60.194|11.1;BGO|Bergen|NO|60.293|5.218;TOS|Tromsø|NO|69.683|18.919;HEL|Helsinki|FI|60.317|24.963;RVN|Rovaniemi|FI|66.565|25.83;KEF|Reikiavik|IS|63.985|-22.606;TLL|Tallin|EE|59.413|24.833;RIX|Riga|LV|56.924|23.971;VNO|Vilna|LT|54.634|25.286;OTP|Bucarest|RO|44.571|26.085;SOF|Sofía|BG|42.695|23.406;IST|Estambul|TR|41.275|28.752;SAW|Estambul Sabiha|TR|40.899|29.309;AYT|Antalya|TR|36.9|30.793;NAV|Capadocia|TR|38.772|34.535;RAK|Marrakech|MA|31.607|-8.036;CMN|Casablanca|MA|33.367|-7.59;FEZ|Fez|MA|33.927|-4.978;TNG|Tánger|MA|35.727|-5.917;AGA|Agadir|MA|30.325|-9.413;TUN|Túnez|TN|36.851|10.227;CAI|El Cairo|EG|30.122|31.406;HRG|Hurghada|EG|27.178|33.799;SSH|Sharm el-Sheij|EG|27.977|34.395;LXR|Luxor|EG|25.671|32.706;CPT|Ciudad del Cabo|ZA|-33.965|18.602;JNB|Johannesburgo|ZA|-26.139|28.246;NBO|Nairobi|KE|-1.319|36.928;ZNZ|Zanzíbar|TZ|-6.222|39.225;DXB|Dubái|AE|25.253|55.364;AUH|Abu Dabi|AE|24.433|54.651;DOH|Doha|QA|25.273|51.608;AMM|Amán|JO|31.723|35.993;TLV|Tel Aviv|IL|32.011|34.887;HND|Tokio Haneda|JP|35.549|139.78;NRT|Tokio Narita|JP|35.765|140.386;KIX|Osaka|JP|34.427|135.244;PEK|Pekín|CN|40.08|116.585;PVG|Shanghái|CN|31.143|121.805;HKG|Hong Kong|HK|22.308|113.918;ICN|Seúl|KR|37.46|126.441;TPE|Taipéi|TW|25.078|121.233;BKK|Bangkok|TH|13.69|100.75;DMK|Bangkok Don Mueang|TH|13.913|100.607;HKT|Phuket|TH|8.113|98.317;CNX|Chiang Mai|TH|18.767|98.963;KBV|Krabi|TH|8.099|98.986;USM|Koh Samui|TH|9.548|100.062;SGN|Ciudad Ho Chi Minh|VN|10.819|106.652;HAN|Hanói|VN|21.221|105.807;REP|Siem Reap|KH|13.411|103.813;DPS|Bali|ID|-8.748|115.167;CGK|Yakarta|ID|-6.126|106.656;SIN|Singapur|SG|1.364|103.991;KUL|Kuala Lumpur|MY|2.746|101.71;MNL|Manila|PH|14.509|121.02;DEL|Nueva Delhi|IN|28.556|77.1;BOM|Bombay|IN|19.089|72.866;CMB|Colombo|LK|7.18|79.884;MLE|Malé (Maldivas)|MV|4.192|73.529;KTM|Katmandú|NP|27.697|85.359;JFK|Nueva York JFK|US|40.641|-73.778;EWR|Nueva York Newark|US|40.69|-74.175;LGA|Nueva York LaGuardia|US|40.777|-73.872;BOS|Boston|US|42.366|-71.01;IAD|Washington|US|38.953|-77.456;MIA|Miami|US|25.796|-80.287;MCO|Orlando|US|28.431|-81.308;ORD|Chicago|US|41.979|-87.905;LAX|Los Ángeles|US|33.942|-118.408;SFO|San Francisco|US|37.621|-122.379;LAS|Las Vegas|US|36.084|-115.154;SEA|Seattle|US|47.45|-122.309;HNL|Honolulu|US|21.318|-157.922;MSY|Nueva Orleans|US|29.993|-90.258;YYZ|Toronto|CA|43.677|-79.625;YUL|Montreal|CA|45.47|-73.741;YVR|Vancouver|CA|49.195|-123.18;MEX|Ciudad de México|MX|19.436|-99.072;CUN|Cancún|MX|21.037|-86.877;HAV|La Habana|CU|22.989|-82.409;PUJ|Punta Cana|DO|18.567|-68.363;SJO|San José|CR|9.994|-84.209;BOG|Bogotá|CO|4.702|-74.147;CTG|Cartagena de Indias|CO|10.442|-75.513;LIM|Lima|PE|-12.022|-77.114;CUZ|Cuzco|PE|-13.536|-71.939;EZE|Buenos Aires|AR|-34.822|-58.536;USH|Ushuaia|AR|-54.843|-68.296;GIG|Río de Janeiro|BR|-22.81|-43.251;GRU|São Paulo|BR|-23.432|-46.469;SCL|Santiago de Chile|CL|-33.393|-70.786;SYD|Sídney|AU|-33.939|151.175;MEL|Melbourne|AU|-37.67|144.843;AKL|Auckland|NZ|-37.008|174.792;ZQN|Queenstown|NZ|-45.021|168.739`;
  const aeropuertos = AEROPUERTOS.split(';').map(x => { const [iata, ciudad, pais, lat, lon] = x.split('|'); return { iata, ciudad, pais, lat: +lat, lon: +lon }; });

  const AEROLINEAS = ['Iberia', 'Iberia Express', 'Vueling', 'Air Europa', 'Ryanair', 'easyJet', 'Volotea', 'Binter', 'Air Nostrum', 'Wizz Air', 'Transavia', 'Air France', 'KLM', 'Lufthansa', 'British Airways', 'TAP Air Portugal', 'ITA Airways', 'Swiss', 'Austrian', 'Brussels Airlines', 'SAS', 'Norwegian', 'Finnair', 'Aegean', 'Turkish Airlines', 'Pegasus', 'Royal Air Maroc', 'Emirates', 'Qatar Airways', 'Etihad', 'Delta', 'United', 'American Airlines', 'JetBlue', 'Aeroméxico', 'LATAM', 'Avianca', 'Copa Airlines', 'Aerolíneas Argentinas', 'Air Canada', 'Japan Airlines', 'ANA', 'Singapore Airlines', 'Thai Airways', 'Cathay Pacific', 'Korean Air', 'Qantas', 'Air Asia', 'Vietnam Airlines'];

  // id|nombre|país|lat|lon|emoji|maravilla moderna (1)
  const MARAVILLAS = `muralla|Gran Muralla China|CN|40.43|116.57|🏯|1;petra|Petra|JO|30.33|35.44|🏜️|1;cristo|Cristo Redentor|BR|-22.95|-43.21|✝️|1;machu|Machu Picchu|PE|-13.16|-72.55|⛰️|1;chichen|Chichén Itzá|MX|20.68|-88.57|🛕|1;coliseo|Coliseo de Roma|IT|41.89|12.49|🏟️|1;taj|Taj Mahal|IN|27.175|78.04|🕌|1;giza|Pirámides de Guiza|EG|29.98|31.13|🔺|0;eiffel|Torre Eiffel|FR|48.858|2.294|🗼|0;sagrada|Sagrada Familia|ES|41.40|2.17|⛪|0;alhambra|Alhambra|ES|37.18|-3.59|🏰|0;libertad|Estatua de la Libertad|US|40.69|-74.04|🗽|0;angkor|Angkor Wat|KH|13.41|103.87|🛕|0;acropolis|Acrópolis|GR|37.97|23.73|🏛️|0;stonehenge|Stonehenge|GB|51.18|-1.83|🪨|0;pisa|Torre de Pisa|IT|43.72|10.40|🗼|0;fuji|Monte Fuji|JP|35.36|138.73|🗻|0;sidney|Ópera de Sídney|AU|-33.857|151.215|🎭|0;bigben|Big Ben|GB|51.50|-0.124|🕰️|0;niagara|Cataratas del Niágara|CA|43.08|-79.07|💦|0;canon|Gran Cañón|US|36.1|-112.1|🏜️|0;moai|Moáis de Isla de Pascua|CL|-27.12|-109.35|🗿|0;burj|Burj Khalifa|AE|25.197|55.274|🏙️|0;michel|Mont Saint-Michel|FR|48.636|-1.511|🏰|0;neusch|Castillo de Neuschwanstein|DE|47.557|10.75|🏰|0;kremlin|Plaza Roja y Kremlin|RU|55.754|37.62|⛪|0;sofia|Santa Sofía|TR|41.008|28.98|🕌|0;capadocia|Globos de Capadocia|TR|38.64|34.83|🎈|0;iguazu|Cataratas de Iguazú|AR|-25.69|-54.44|💦|0;victoria|Cataratas Victoria|ZW|-17.92|25.86|💦|0;borobudur|Borobudur|ID|-7.61|110.20|🛕|0;halong|Bahía de Ha Long|VN|20.91|107.18|⛵|0;venecia|Canales de Venecia|IT|45.44|12.33|🛶|0;santorini|Santorini|GR|36.46|25.38|🏝️|0;aurora|Auroras boreales (Laponia)|FI|68.0|25.0|🌌|0`;
  const maravillas = MARAVILLAS.split(';').map(x => { const [id, nombre, pais, lat, lon, emoji, moderna] = x.split('|'); return { id, nombre, pais, lat: +lat, lon: +lon, emoji, moderna: moderna === '1' }; });

  // Platos típicos por país
  const PLATOS = {
    ES: ['Paella', 'Tortilla de patatas', 'Jamón ibérico', 'Gazpacho', 'Churros con chocolate', 'Ternasco de Aragón'],
    PT: ['Pastel de nata', 'Bacalao a brás', 'Francesinha', 'Sardinas asadas'],
    FR: ['Croissant', 'Crêpes', 'Ratatouille', 'Escargots', 'Quiche lorraine', 'Macarons'],
    IT: ['Pizza napolitana', 'Pasta carbonara', 'Risotto', 'Gelato', 'Tiramisú', 'Lasaña'],
    GB: ['Fish and chips', 'Desayuno inglés', 'Scones con té', 'Sunday roast'],
    IE: ['Irish stew', 'Soda bread', 'Guinness'],
    DE: ['Bratwurst', 'Pretzel', 'Schnitzel', 'Strudel de manzana'],
    NL: ['Stroopwafel', 'Arenque crudo', 'Bitterballen', 'Poffertjes'],
    BE: ['Gofres', 'Patatas fritas belgas', 'Mejillones', 'Chocolate belga'],
    CH: ['Fondue', 'Raclette', 'Rösti'],
    AT: ['Wiener Schnitzel', 'Sachertorte', 'Apfelstrudel'],
    CZ: ['Trdelník', 'Goulash checo', 'Svíčková'],
    HU: ['Goulash', 'Lángos', 'Chimney cake'],
    PL: ['Pierogi', 'Żurek', 'Bigos'],
    GR: ['Gyros', 'Moussaka', 'Ensalada griega', 'Souvlaki', 'Baklava'],
    HR: ['Peka', 'Ćevapi', 'Risotto negro'],
    TR: ['Kebab', 'Baklava', 'Lahmacun', 'Delicias turcas', 'Té turco'],
    MA: ['Tajín', 'Cuscús', 'Pastela', 'Té a la menta'],
    EG: ['Koshari', 'Falafel (ta’amiya)', 'Ful medames'],
    TN: ['Brik', 'Cuscús tunecino', 'Shakshuka'],
    ZA: ['Braai', 'Bobotie', 'Biltong'],
    US: ['Hamburguesa', 'Hot dog', 'Pancakes', 'Barbacoa', 'Cheesecake de Nueva York'],
    CA: ['Poutine', 'Sirope de arce', 'Nanaimo bars'],
    MX: ['Tacos al pastor', 'Guacamole', 'Enchiladas', 'Mole', 'Churros'],
    CU: ['Ropa vieja', 'Moros y cristianos', 'Mojito'],
    PE: ['Ceviche', 'Lomo saltado', 'Ají de gallina', 'Pisco sour'],
    AR: ['Asado', 'Empanadas', 'Dulce de leche', 'Mate'],
    BR: ['Feijoada', 'Pão de queijo', 'Brigadeiro', 'Caipiriña'],
    CL: ['Empanada de pino', 'Pastel de choclo', 'Completo'],
    CO: ['Bandeja paisa', 'Arepas', 'Ajiaco'],
    JP: ['Sushi', 'Ramen', 'Tempura', 'Okonomiyaki', 'Mochi', 'Takoyaki'],
    CN: ['Pato pekinés', 'Dim sum', 'Dumplings', 'Hot pot'],
    KR: ['Kimchi', 'Bibimbap', 'Barbacoa coreana', 'Tteokbokki'],
    TH: ['Pad thai', 'Curry verde', 'Mango sticky rice', 'Tom yum'],
    VN: ['Pho', 'Banh mi', 'Rollitos frescos', 'Café vietnamita'],
    IN: ['Pollo tikka masala', 'Biryani', 'Naan', 'Samosas', 'Lassi'],
    ID: ['Nasi goreng', 'Satay', 'Rendang'],
    MY: ['Nasi lemak', 'Laksa', 'Roti canai'],
    SG: ['Pollo hainanés', 'Chili crab', 'Laksa'],
    AE: ['Shawarma', 'Hummus', 'Dátiles', 'Luqaimat'],
    JO: ['Mansaf', 'Falafel', 'Knafeh'],
    IL: ['Falafel', 'Hummus', 'Shakshuka'],
    SE: ['Albóndigas suecas', 'Kanelbulle', 'Salmón gravlax'],
    NO: ['Salmón noruego', 'Brunost', 'Kjøttkaker'],
    DK: ['Smørrebrød', 'Pastas danesas', 'Pølse'],
    FI: ['Karjalanpiirakka', 'Sopa de salmón', 'Reno salteado'],
    IS: ['Skyr', 'Sopa de cordero', 'Pylsur'],
    AU: ['Pavlova', 'Vegemite', 'Meat pie', 'Flat white'],
    NZ: ['Pavlova', 'Hāngī', 'Hokey pokey'],
    RU: ['Borsch', 'Blinis', 'Pelmeni']
  };

  Object.assign(window.DATOS, { aeropuertos, AEROLINEAS, maravillas, PLATOS });
})();
