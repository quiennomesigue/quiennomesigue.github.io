# ¿Quién no me sigue?

Herramienta web gratuita para ver quién no te sigue de vuelta en Instagram, quién te ha dejado de seguir y tus seguidores mutuos.

**Pruébala:** https://quiennomesigue.github.io/

## Dos formas de usarla

### ⚡ Modo rápido (ordenador, 1 minuto)

1. Arrastra el botón «⚡ ¿Quién no me sigue?» de la web a tu barra de marcadores.
2. Abre instagram.com con tu sesión iniciada y pulsa el marcador.
3. Pulsa «Ver resultados» y la web se abre con tus listas.

Lee tus listas desde tu propia sesión, despacio y solo en lectura (nunca sigue ni deja de seguir). Instagram no permite oficialmente este tipo de herramientas y podría limitar temporalmente la cuenta si se abusa.

### ⚡ Modo rápido en el móvil

- **iPhone:** atajo de la app Atajos que se lanza desde Safari (Compartir) con instagram.com abierto. Cómo crearlo: [docs/atajo-iphone.md](docs/atajo-iphone.md).
- **Android:** el mismo marcador, guardado en Chrome y lanzado escribiendo su nombre en la barra de direcciones.

### Con archivo (100% seguro, también en móvil)

1. Pide a Instagram la exportación de tus datos (Centro de cuentas → Tu información y permisos → Exportar tu información), marcando solo **Seguidores y seguidos** y el formato **JSON**.
2. Sube el `.zip` que te envían a la web.
3. Mira tus listas al instante.

## Desarrollo

- `index.html`: toda la web (HTML, CSS y JS en un solo archivo).
- `src/atajo.js`: código del atajo de iPhone, generado por el build (se pega en la acción «Ejecutar JavaScript en la página web»).
- `src/bookmarklet.js`: código del modo rápido. Tras editarlo, ejecuta `node scripts/build.js` para insertarlo minificado en `index.html` y regenerar `src/atajo.js`.
- GitHub Pages publica automáticamente la rama `main`.

## Privacidad

- No pide usuario ni contraseña.
- La web no tiene servidor: en modo rápido los datos van directamente de tu pestaña de Instagram a la de la web.
- Todo el archivo se procesa en tu navegador; no hay servidor ni base de datos.
- Para detectar quién te deja de seguir se guarda un resumen solo en tu navegador (puedes borrarlo desde la propia web).
- La página tiene un contador de visitas anónimo ([GoatCounter](https://www.goatcounter.com/)): sin cookies ni datos personales, y nunca recibe datos de Instagram.

Proyecto sin ánimo de lucro. No está afiliado a Instagram ni a Meta.
