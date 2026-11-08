# Crear el atajo de iPhone

Solo hay que hacerlo una vez. Después se comparte el enlace de iCloud y cualquiera lo instala con un toque.

## 1. Permitir scripts en Atajos

Ajustes → Apps → Atajos → Avanzado → activa **Permitir ejecutar scripts**.

## 2. Crear el atajo

1. Abre la app **Atajos** y pulsa **+**.
2. Ponle de nombre **¿Quién no me sigue?** (y si quieres, un icono y un color).
3. Pulsa el icono de información (ⓘ) y activa **Mostrar en hoja para compartir**. En los tipos que acepta, deja solo **Páginas web de Safari**.
4. Añade la acción **Ejecutar JavaScript en la página web**. Como entrada, deja **Entrada del atajo**.
5. Borra el código de ejemplo y pega el contenido de [`src/atajo.js`](../src/atajo.js). En el iPhone, abre https://raw.githubusercontent.com/davcrelib/quien-no-me-sigue/main/src/atajo.js, selecciona todo y copia.
6. Añade la acción **Abrir URL** y elige como URL la variable **Resultado de JavaScript**.
7. Guarda.

## 3. Probarlo

1. Abre **instagram.com en Safari** e inicia sesión.
2. Pulsa **Compartir** → **¿Quién no me sigue?**.
3. La primera vez pedirá permiso para ejecutar el script en instagram.com: pulsa **Permitir**.
4. En un minuto (más si tienes muchos seguidores) se abre la web con tus resultados.

## 4. Compartirlo

En la app Atajos, mantén pulsado el atajo → **Compartir** → **Copiar enlace de iCloud**. Ese enlace va en `SHORTCUT_URL` dentro de `index.html`, y la web mostrará el botón «Instalar atajo» a los usuarios de iPhone.

Si se cambia `src/atajo.js`, hay que actualizar el código en el atajo y volver a compartir el enlace.
