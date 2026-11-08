// Genera el código minificado del modo rápido a partir de src/bookmarklet.js:
//  - lo inserta en index.html (marcador para ordenador y Android)
//  - escribe src/atajo.js (código para el atajo de iPhone)
// Uso: node scripts/build.js   (usa terser vía npx si está disponible)
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");
const root = path.join(__dirname, "..");
const src = path.join(root, "src/bookmarklet.js");
const SITE = "https://davcrelib.github.io/quien-no-me-sigue/";
let code;
try {
  code = execSync(`npx --yes terser@5.31.0 "${src}" --compress --mangle`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch (e) {
  console.warn("terser no disponible: se usa sin minificar");
  code = fs.readFileSync(src, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").trim();
}
if (code.includes("</script")) throw new Error("El marcador no puede contener </script");

// 1. index.html
const file = path.join(root, "index.html");
const html = fs.readFileSync(file, "utf8");
const re = /(<script type="text\/plain" id="bm-src">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) throw new Error("No encuentro el bloque bm-src en index.html");
fs.writeFileSync(file, html.replace(re, (_, a, b) => `${a}\n${code}\n${b}`));

// 2. src/atajo.js: Atajos corta la acción «Ejecutar JavaScript» a los pocos segundos, así que
//    el atajo solo arranca el mismo código del marcador dentro de la página y termina al momento.
//    La lectura sigue en Safari, con el panel visible, y «Ver resultados» abre la web.
const atajo = `// ¿Quién no me sigue? · código para el atajo de iPhone (generado por scripts/build.js, no editar a mano)
// Va en la acción «Ejecutar JavaScript en la página web». Arranca el modo rápido en la pestaña de
// instagram.com y termina enseguida; el panel aparece en la página al volver a Safari.
setTimeout(function () {
${code.replace("__SITE__", SITE)}
}, 300);
completion();
`;
fs.writeFileSync(path.join(root, "src/atajo.js"), atajo);
console.log("Marcador:", code.length, "caracteres · atajo.js:", atajo.length, "caracteres");
