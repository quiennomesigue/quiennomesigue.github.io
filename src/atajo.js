// ¿Quién no me sigue? · código para el Atajo de iPhone
// Va en la acción «Ejecutar JavaScript en la página web» de Atajos. El atajo se lanza desde
// Safari (Compartir) con instagram.com abierto y la sesión iniciada. Solo lee las listas,
// y al terminar devuelve la URL de la web con los datos comprimidos en el #, que la acción
// siguiente del atajo («Abrir URL») abre. No se envía nada a ningún servidor: lo que va
// detrás del # nunca sale del teléfono.
var SITE = "https://davcrelib.github.io/quien-no-me-sigue/";
var APP_ID = "936619743392459";

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function cookie(name) { var m = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; }
function fail(text, status) { var e = new Error(text); e.status = status; return e; }
function headers() {
  var claim = "0"; try { claim = sessionStorage.getItem("www-claim-v2") || "0"; } catch (e) {}
  return { "x-ig-app-id": APP_ID, "x-asbd-id": "129477", "x-csrftoken": cookie("csrftoken"), "x-ig-www-claim": claim, "x-requested-with": "XMLHttpRequest", "accept": "*/*" };
}
async function getJSON(url, step) {
  for (var attempt = 0; ; attempt++) {
    var res = await fetch(url, { credentials: "include", headers: headers() });
    if (res.ok) {
      var data = await res.json().catch(function () { return null; });
      if (data && data.status !== "fail") return data;
      throw fail("Respuesta inesperada de Instagram (" + step + ").", 200);
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 2) { await sleep(30000 * (attempt + 1)); continue; }
    throw fail(step + ": Instagram respondió con el código " + res.status + ".", res.status);
  }
}
var GQL = { followers: ["c76146de99bb02f6415203be841dd25a", "edge_followed_by"], following: ["d04b0a864b4b54837c0d870b0e77e076", "edge_follow"] };
async function pageV1(uid, kind, cursor, step) {
  var url = "/api/v1/friendships/" + uid + "/" + kind + "/?count=50" + (kind === "followers" ? "&search_surface=follow_list_page" : "") + (cursor ? "&max_id=" + encodeURIComponent(cursor) : "");
  var d = await getJSON(url, step);
  return { users: (d.users || []).map(function (u) { return u.username; }), next: d.next_max_id || "" };
}
async function pageGQL(uid, kind, cursor, step) {
  var vars = { id: uid, include_reel: false, fetch_mutual: false, first: 50 };
  if (cursor) vars.after = cursor;
  var d = await getJSON("/graphql/query/?query_hash=" + GQL[kind][0] + "&variables=" + encodeURIComponent(JSON.stringify(vars)), step);
  var edge = d && d.data && d.data.user && d.data.user[GQL[kind][1]];
  if (!edge) throw fail("Respuesta inesperada de Instagram (" + step + ").", 200);
  return { users: (edge.edges || []).map(function (e) { return e.node.username; }), next: edge.page_info && edge.page_info.has_next_page ? edge.page_info.end_cursor : "" };
}
async function readList(uid, kind, step) {
  var out = [], cursor = "", page = 0, fetcher = pageV1;
  do {
    var r;
    try { r = await fetcher(uid, kind, cursor, step); }
    catch (e) { if (fetcher === pageV1 && page === 0 && e.status !== 429) { fetcher = pageGQL; r = await fetcher(uid, kind, cursor, step); } else throw e; }
    r.users.forEach(function (u) { if (u) out.push({ u: String(u).toLowerCase() }); });
    cursor = r.next; page++;
    if (cursor) await sleep(900 + Math.random() * 900 + (page % 8 === 0 ? 4000 : 0));
  } while (cursor);
  return out;
}
function b64url(bytes) {
  var s = "", chunk = 0x8000;
  for (var i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function pack(obj) {
  var raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === "function") {
    var stream = new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    return "z" + b64url(new Uint8Array(await new Response(stream).arrayBuffer()));
  }
  return "j" + b64url(raw);
}

(async function () {
  try {
    if (!/(^|\.)instagram\.com$/.test(location.hostname)) throw fail("Abre instagram.com en Safari y lanza el atajo desde el botón Compartir.", 0);
    var m = document.cookie.match(/(?:^|;\s*)ds_user_id=(\d+)/);
    if (!m) throw fail("Inicia sesión en instagram.com en Safari y vuelve a lanzar el atajo.", 0);
    var following = await readList(m[1], "following", "a quién sigues");
    var followers = await readList(m[1], "followers", "tus seguidores");
    completion(SITE + "#d=" + await pack({ qnms: 1, source: "atajo", date: Date.now(), followers: followers, following: following }));
  } catch (e) {
    var text = e.status === 429 ? "Instagram está limitando las peticiones de tu cuenta. Espera unos minutos y vuelve a probar." : e.message;
    completion(SITE + "#error=" + encodeURIComponent(text));
  }
})();
