# Crear el atajo de iPhone

Solo hay que hacerlo una vez. Después se comparte el enlace de iCloud y cualquiera lo instala con un toque.

## 1. Permitir scripts en Atajos

Ajustes → Apps → Atajos → Avanzado → activa **Permitir ejecutar scripts**.

## 2. Crear el atajo

1. Abre la app **Atajos** y pulsa **+**.
2. Ponle de nombre **¿Quién no me sigue?** (y si quieres, un icono y un color).
3. Añade la acción **Ejecutar JavaScript en la página web** y, en ella, toca «Página web» y elige **Entrada del atajo**.
4. Arriba aparece «Recibir … de …»: toca el destino y activa **Hoja para compartir**; toca el tipo, pulsa **Borrar** y marca solo **Páginas web de Safari**.
5. Borra el código de ejemplo y pega el contenido de [`src/atajo.js`](../src/atajo.js). En el iPhone, abre https://raw.githubusercontent.com/davcrelib/quien-no-me-sigue/main/src/atajo.js, selecciona todo y copia.
6. No hace falta ninguna acción más (si añadiste «Abrir URL», bórrala). Guarda.

> Atajos corta la acción de JavaScript a los pocos segundos, así que el código solo arranca el proceso dentro de la página y termina al momento. La lectura sigue en Safari.

## 3. Probarlo

1. Abre **instagram.com en Safari** e inicia sesión.
2. Pulsa **Compartir** → **¿Quién no me sigue?**.
3. La primera vez pedirá permiso para ejecutar el script en instagram.com: pulsa **Permitir**.
4. Vuelves a Safari y aparece un panel abajo con el progreso. No cambies de app ni bloquees el móvil mientras lee.
5. Cuando termine, pulsa **Ver resultados** y se abre la web con tus listas.

## 4. Compartirlo

En la app Atajos, mantén pulsado el atajo → **Compartir** → **Copiar enlace de iCloud**. Ese enlace (actual: https://www.icloud.com/shortcuts/47d36a72fa5b44d286fad3d7fc3a7e5b) va en `SHORTCUT_URL` dentro de `index.html`, y la web mostrará el botón «Instalar atajo» a los usuarios de iPhone.

`src/atajo.js` se genera con `node scripts/build.js` a partir de `src/bookmarklet.js`. Si cambia, hay que actualizar el código en el atajo y volver a compartir el enlace.
