# 🌍 Mis Viajes: guía paso a paso

Una app (PWA) con un mapa del mundo de los viajes de tu cuñada. Funciona en iPhone, Android y ordenador, y cuesta 0 €.

- **La web** vive gratis en **GitHub Pages**.
- **Los datos y las fotos** se guardan en **Supabase** (plan gratis: 500 MB de datos y 1 GB de fotos; la app comprime cada foto a unos 250 KB).
- Una **tarea automática de GitHub** toca Supabase cada 3 días, para que el proyecto no se pause por falta de uso.

Tiempo total: unos 30–40 minutos la primera vez.

---

## PASO 1 · Subir la web a GitHub (modo prueba)

1. Crea una cuenta en **github.com** (gratis).
2. Arriba a la derecha, **＋ → New repository**.
   - Nombre: `mis-viajes`
   - Marca **Public**. El código queda a la vista, pero los datos de ella no: esos están en Supabase, protegidos con contraseña.
   - Pulsa **Create repository**.
3. En la página del repositorio vacío, pulsa **uploading an existing file**.
4. Descomprime el zip en tu PC y **arrastra todo su contenido** (las carpetas `css`, `js`, `icons`, `vendor`, `supabase`, `.github` y los archivos sueltos) a la ventana. Pulsa **Commit changes**.
   - ⚠️ Comprueba que se ha subido la carpeta `.github`. Si no aparece, créala a mano: **Add file → Create new file**, escribe como nombre `.github/workflows/mantener-activo.yml` y pega dentro el contenido de ese archivo.
5. **Settings → Pages**. En *Branch* elige `main` y `/ (root)` y pulsa **Save**.
6. Espera 1–2 minutos y abre `https://TU-USUARIO.github.io/mis-viajes/`.

✅ Ya puedes probarla en **modo prueba**: los datos se guardan solo en ese navegador. En **Más → Cargar viajes de ejemplo** la ves llena.

## PASO 2 · Crear la base de datos en Supabase

1. Crea una cuenta en **supabase.com** (puedes entrar con GitHub).
2. **New project**:
   - Nombre: `mis-viajes`
   - *Database password*: inventa una y guárdala (no la usa la app).
   - *Region*: **West EU (Ireland)** o **Central EU (Frankfurt)**.
   - Plan **Free**.
3. Cuando termine de crearse: menú izquierdo **SQL Editor → New query**. Abre el archivo `supabase/setup.sql`, copia **todo**, pégalo y pulsa **Run**. Debe salir *Success*.
4. **Crear la cuenta de tu cuñada:** **Authentication → Users → Add user → Create new user**.
   - Email: el de ella.
   - Contraseña: una provisional fácil (ella podrá cambiarla en *Más*).
   - ✅ Marca **Auto Confirm User**.
   Repite este paso para **cada persona**: Lara, Paul, Sergio, Blanca y "Jesús y Chus" (con el email que use tu suegra).
   La primera vez que cada uno entre, la app le pedirá **su nombre y su ciudad**.
5. **Cerrar la puerta a desconocidos:** en **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up**. Así nadie más puede crearse una cuenta.
6. **Copiar las llaves:** en **Project Settings → API Keys** (o **Data API**) copia dos cosas:
   - **Project URL**, del tipo `https://abcdxyz.supabase.co`
   - La clave **anon public** (o **publishable**). Esta clave puede ser pública: lo que protege los datos son las reglas del paso 3.

## PASO 3 · Conectar la web con Supabase

1. En GitHub, abre `js/config.js` y pulsa el lápiz ✏️ para editarlo.
2. Pega tus datos entre las comillas:
   ```js
   SUPABASE_URL: 'https://abcdxyz.supabase.co',
   SUPABASE_ANON_KEY: 'eyJhbGciOi...',
   ```
3. Personaliza también:
   - `NOMBRE`: su nombre, para el saludo y el pasaporte.
   - `APP_NOMBRE`: si quieres otro nombre. Cámbialo también en `manifest.webmanifest`, en `"name"` y `"short_name"`.
   - `MENSAJE_SORPRESA`: tu felicitación de Navidad.
   - `COLORES`: si quieres otros colores.
4. **Commit changes**. En 1–2 minutos la web se actualiza.
5. **Permitir la tarea automática:** **Settings → Actions → General → Workflow permissions → Read and write permissions → Save**.
6. Pruébala: **Actions → Mantener Supabase despierto → Run workflow**. Debe salir en verde ✅.

## PASO 3 bis · El mensaje de Navidad (privado)

Con Supabase conectado, el mensaje ya **no** va en `config.js` (ese archivo es público en GitHub):
1. Entra en la app con **tu** cuenta (Sergio).
2. **Más → 💌 Mensajes para la familia → Escribir un mensaje**.
3. Para: **Lara** · Cuándo: **Al entrar en la app** · escribe el texto y firma *Sergio y Blanca*.
4. También puedes esconder mensajes en países (*Al visitar un país*), para ella o para cualquiera.
5. Borra el texto de `MENSAJE_SORPRESA` en `config.js` para que no quede a la vista en GitHub.

## Viajes compartidos

- Al crear o editar un viaje, en **👥 Compartir este viaje con** eliges a quién. Si no eliges a nadie, es privado.
- Los del viaje pueden ver y subir fotos, diario, gastos y reservas, y **descargar** las fotos de los demás (⬇️ en cada foto o "Descargar las fotos").
- Solo quien creó el viaje puede borrarlo o cambiar con quién se comparte; los demás pueden **salirse**.
- En los gastos de un viaje compartido se elige **quién pagó** y la app calcula **quién debe a quién**.

## PASO 4 · Cargar sus viajes antes de regalárselo

1. Abre la web en tu ordenador y entra **con el email y la contraseña de ella** (o crea los viajes desde tu cuenta y compártelos con ella).
2. Para meter muchos viajes de golpe, usa **Más → Importar viajes desde una lista**. El formato está en `plantilla-importar.txt`:
   ```
   Italia; Roma; 12/04/2023; 16/04/2023; Primer viaje con amigas
   * Islandia; ; ; ; Ver auroras      ← con * va a la lista de sueños
   ```
   La app busca sola cada ciudad en el mapa, a razón de una por segundo.
3. Abre cada viaje para **añadir fotos**, retocar el diario o marcar 🎒 *Viajé sola*. Para sus Instax, escanéalas o hazles una foto y marca *Son fotos Instax escaneadas*.
4. Mira el resultado en **Pasaporte** (sellos y logros) y en **Viajes** (cronología y galería).

## PASO 5 · El día del regalo

Prepárale una tarjeta con:

- Un **código QR** con la dirección de la web (cualquier generador de QR gratis sirve).
- Su **email y contraseña**.
- Estos 3 pasos para iPhone:
  1. Abre el enlace **en Safari**.
  2. Pulsa el botón **Compartir** (el cuadrado con la flecha).
  3. Elige **Añadir a pantalla de inicio**.

La primera vez que la abra desde el icono verá tu mensaje sorpresa ❄️. Después tendrá que iniciar sesión una vez: la app del icono no comparte la sesión con Safari.

---

## Cómo se usa (para ella)

| Quiero… | Cómo |
|---|---|
| Ver un país | Tócalo en el mapa |
| Añadir un viaje | Botón **＋** naranja |
| Marcar un sitio al que quiero ir | Toca el país → **✨ Quiero ir**, o pestaña **Sueños → ＋** |
| Poner la cuenta atrás | En *Sueños*, ponle **fecha prevista** al destino, o añade un viaje con fecha futura |
| Pasar un sueño a viaje | En *Sueños* → **¡Ya fui!** |
| Ver el mapa "para rascar" | Botón **✦ Rasca** del mapa |
| Compartir su mapa | **Más → Compartir**. Las fotos nunca se comparten. |
| Lista de la maleta | **Más → Mi maleta** |

## Preguntas frecuentes

- **¿Cuánto cuesta?** 0 €. GitHub Pages y Supabase Free bastan de sobra para una persona.
- **¿Y si Supabase pausa el proyecto?** Lo evita la tarea de GitHub. Si aun así pasara, entra en supabase.com y pulsa **Restore project**: no se pierde nada.
- **¿Y si cambio algo y en el móvil no se actualiza?** Sube el número de `VERSION` en `sw.js` (v1 → v2), cierra la app y vuelve a abrirla.
- **¿Se puede tener el mapa sin depender de internet?** El mapa se descarga una vez de jsDelivr y se queda guardado. Si quieres llevarlo en la propia web, descarga `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json` y súbelo como `data/countries-50m.json`.
- **Copia de seguridad:** **Más → Descargar copia de seguridad** baja todos los datos de los viajes (sin las fotos, que siguen en Supabase).
- **Kilómetros:** se calculan en línea recta, ida y vuelta, desde Calatayud hasta la ciudad de cada viaje.

## 🛟 Salvavidas: volver a la versión anterior

La versión anterior (la 4) va guardada dentro de la web, en la carpeta `estable/`:

- **Para usarla sin tocar nada:** abre `https://TU-USUARIO.github.io/mis-viajes/estable/`. Los datos son los mismos, porque están en el mismo sitio.
- **Para volver a ella del todo:** sube a GitHub el contenido de `mis-viajes-v4-estable.zip`, igual que cuando actualizas. (La v2 sigue en `mis-viajes-v2-estable.zip`.)
- **Otra opción desde GitHub:** pestaña **Commits** → abre el commit que quieras deshacer → **⋯ → Revert**.

## Qué hay en cada archivo

```
index.html               la página
css/app.css              estilos
js/config.js             ← TU CONFIGURACIÓN
js/app.js                pantallas y funciones
js/map.js                el mapa
js/intro.js              animación de entrada (avión)
js/extras.js             recuerdos, juegos, postales, cápsulas, mensajes…
js/datos.js              datos prácticos de países, frases y ciudades
js/efectos.js            confeti y sonidos
js/extras2.js            reservas, vuelos, maravillas, gastronomía, presentación, fotolibro…
js/datos2.js             aeropuertos, aerolíneas, maravillas y platos típicos
estable/                 copia de la versión anterior (salvavidas)
js/store.js              guardar y leer datos (Supabase o navegador)
js/countries.js          lista de países y continentes
vendor/d3.min.js         librería del mapa
sw.js, manifest...       lo que la hace instalable como app
supabase/setup.sql       base de datos (paso 2)
.github/workflows/...    tarea que mantiene Supabase despierto
```

## Solicitudes de acceso (v8)
- En la pantalla de entrada hay un botón **Pedir acceso**: cada persona se crea su cuenta con su nombre, email y contraseña.
- Hasta que el administrador la acepte **no ve nada**: ni nombres, ni viajes, ni fotos.
- El administrador ve un **punto rojo** en el engranaje y las solicitudes en **Ajustes → Solicitudes de acceso**, con los botones Aceptar o Rechazar.
- Las cuentas creadas a mano en Supabase también llegan como solicitud; acéptalas desde la app.
- Supabase: *Authentication → Sign In / Providers* → **Allow new users to sign up** activado y **Confirm email** desactivado.
- SQL: `supabase/acceso.sql`, que también va incluido al final de `setup.sql`.
