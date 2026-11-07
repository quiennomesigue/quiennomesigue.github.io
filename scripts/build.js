// Inserta el marcador (src/bookmarklet.js) minificado dentro de index.html.
// Uso: node scripts/build.js   (usa terser vía npx si está disponible)
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");
const root = path.join(__dirname, "..");
const src = path.join(root, "src/bookmarklet.js");
let code;
try {
  code = execSync(`npx --yes terser@5.31.0 "${src}" --compress --mangle`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
} catch (e) {
  console.warn("terser no disponible: se inserta sin minificar");
  code = fs.readFileSync(src, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
}
if (code.includes("</script")) throw new Error("El marcador no puede contener </script");
const file = path.join(root, "index.html");
const html = fs.readFileSync(file, "utf8");
const re = /(<script type="text\/plain" id="bm-src">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) throw new Error("No encuentro el bloque bm-src en index.html");
fs.writeFileSync(file, html.replace(re, (_, a, b) => `${a}\n${code.trim()}\n${b}`));
console.log("Marcador insertado:", code.length, "caracteres");
