/* ¿Quién no me sigue? · modo rápido
   Se ejecuta en instagram.com con la sesión del propio usuario. Solo lee las listas de
   seguidores y seguidos (nunca sigue ni deja de seguir) y va despacio para no saturar.
   Al terminar envía las listas a la web (postMessage) o las descarga como archivo.
   __SITE__ se sustituye por la URL de la web al generar el marcador. */
(function () {
  var SITE = "__SITE__";
  var SITE_ORIGIN = new URL(SITE).origin;
  var APP_ID = "936619743392459";
  if (window.__qnms) { window.__qnms.show(); return; }
  var IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  var AGAIN = IOS ? "vuelve a pulsar Compartir → «¿Quién no me sigue?»" : "vuelve a pulsar el marcador «¿Quién no me sigue?»";
  if (!/(^|\.)instagram\.com$/.test(location.hostname)) {
    alert("Esto funciona en instagram.com. Te llevamos allí: inicia sesión y " + AGAIN + ".");
    location.href = "https://www.instagram.com/";
    return;
  }
  var old = document.querySelector("[data-qnms-box]"); if (old) old.remove();
  var m = document.cookie.match(/(?:^|;\s*)ds_user_id=(\d+)/);
  var uid = m ? m[1] : "";

  /* ---------- Panel ---------- */
  var box = document.createElement("div");
  box.setAttribute("data-qnms-box", "");
  box.style.cssText = "position:fixed;z-index:2147483647;right:20px;bottom:20px;width:340px;max-width:calc(100vw - 40px);background:#fff;color:#12131a;border-radius:18px;box-shadow:0 20px 60px -10px rgba(0,0,0,.35),0 0 0 1px rgba(0,0,0,.06);font:15px/1.5 -apple-system,system-ui,'Segoe UI',sans-serif;padding:20px;";
  /* DOM construido a mano: instagram.com puede exigir Trusted Types y bloquear innerHTML */
  function h(tag, css, attrs, kids) {
    var el = document.createElement(tag);
    if (css) el.style.cssText = css;
    for (var k in (attrs || {})) el.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var BTN = "all:unset;cursor:pointer;text-align:center;";
  box.appendChild(h("div", "display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px", {}, [
    h("b", "font-size:16px", {}, ["¿Quién no me ", h("span", "color:#f0386b", {}, ["sigue"]), "?"]),
    h("button", BTN + "color:#646a7e;font-size:20px;line-height:1;padding:2px 6px", { "data-x": "", "aria-label": "Cerrar" }, ["×"])
  ]));
  box.appendChild(h("p", "margin:0 0 10px;color:#646a7e", { "data-msg": "" }, ["Preparando…"]));
  box.appendChild(h("div", "height:6px;border-radius:6px;background:#eef0f7;overflow:hidden", {}, [
    h("i", "display:block;height:100%;width:2%;background:linear-gradient(90deg,#3b5bfd,#f0386b);transition:width .4s", { "data-bar": "" })
  ]));
  box.appendChild(h("p", "margin:10px 0 0;font-size:13px;font-weight:600;color:#12131a", { "data-wait": "" }, ["No cierres esta página ni cambies de app hasta que termine."]));
  box.appendChild(h("div", "display:none;margin-top:14px;flex-direction:column;gap:8px", { "data-login": "" }, [
    h("button", BTN + "background:#12131a;color:#fff;border-radius:999px;padding:11px 16px;font-weight:600", { "data-go": "" }, ["Iniciar sesión"])
  ]));
  box.appendChild(h("div", "display:none;margin-top:14px;flex-direction:column;gap:8px", { "data-done": "" }, [
    h("button", BTN + "background:#12131a;color:#fff;border-radius:999px;padding:11px 16px;font-weight:600", { "data-open": "" }, ["Ver resultados"]),
    h("button", BTN + "color:#646a7e;text-decoration:underline;font-size:13px", { "data-save": "" }, ["Descargar archivo (si no se abren)"])
  ]));
  box.appendChild(h("p", "margin:12px 0 0;font-size:12px;color:#9aa0b4", {}, ["Solo lectura. No sigue ni deja de seguir a nadie. Tus datos no se envían a ningún servidor."]));
  document.body.appendChild(box);
  var $ = function (k) { return box.querySelector("[data-" + k + "]"); };
  var stopped = false;
  function msg(t) { $("msg").textContent = t; }
  function bar(p) { $("bar").style.width = Math.max(2, Math.min(100, p)) + "%"; }
  $("x").onclick = function () { stopped = true; box.remove(); delete window.__qnms; };
  if (!uid) {
    // Sin sesión: lo explicamos en el panel en vez de un aviso del navegador
    msg("Primero inicia sesión en Instagram aquí, en " + (IOS ? "Safari" : "este navegador") + ". Cuando veas tu inicio, " + AGAIN + ".");
    $("bar").parentNode.style.display = "none"; $("wait").style.display = "none";
    $("login").style.display = "flex";
    $("go").onclick = function () { location.href = "https://www.instagram.com/accounts/login/"; };
    return;
  }
  window.__qnms = { show: function () { box.style.display = "block"; } };

  /* ---------- Lectura ---------- */
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function cookie(name) { var m = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; }
  function headers() {
    var claim = "0"; try { claim = sessionStorage.getItem("www-claim-v2") || "0"; } catch (e) {}
    return { "x-ig-app-id": APP_ID, "x-asbd-id": "129477", "x-csrftoken": cookie("csrftoken"), "x-ig-www-claim": claim, "x-requested-with": "XMLHttpRequest", "accept": "*/*" };
  }
  function fail(text, status) { var e = new Error(text); e.status = status; return e; }
  // retries: cuántas veces esperar y reintentar si Instagram pide ir más despacio (429) o falla (5xx)
  async function getJSON(url, retries, step) {
    for (var attempt = 0; ; attempt++) {
      var res;
      try { res = await fetch(url, { credentials: "include", headers: headers() }); }
      catch (netErr) {
        // Fallo de red (p. ej. al cambiar de app en el móvil): esperamos a que vuelva y reintentamos
        if (attempt >= 4) throw fail("No hay conexión con Instagram (" + step + "). Revisa tu conexión y vuelve a probar.", -1);
        msg("Se ha cortado la conexión. Vuelve a esta página para continuar…");
        while (document.hidden && !stopped) await sleep(500);
        if (stopped) throw fail("stop", 0);
        await sleep(1500);
        continue;
      }
      if (res.ok) {
        var data = await res.json().catch(function () { return null; });
        if (data && data.status !== "fail") return data;
        throw fail("Respuesta inesperada de Instagram (" + step + ").", 200);
      }
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        var wait = 45 * (attempt + 1);
        for (var s = wait; s > 0 && !stopped; s--) { msg("Instagram pide ir más despacio (" + step + ", código " + res.status + "). Reintentando en " + s + " s…"); await sleep(1000); }
        if (stopped) throw fail("stop", 0);
        continue;
      }
      throw fail(step + ": Instagram respondió con el código " + res.status + ".", res.status);
    }
  }

  // Dos formas de leer cada lista: la API web (v1) y, si falla, la consulta GraphQL que usa la web antigua
  var GQL = { followers: ["c76146de99bb02f6415203be841dd25a", "edge_followed_by"], following: ["d04b0a864b4b54837c0d870b0e77e076", "edge_follow"] };
  async function pageV1(kind, cursor, step) {
    var url = "/api/v1/friendships/" + uid + "/" + kind + "/?count=50" + (kind === "followers" ? "&search_surface=follow_list_page" : "") + (cursor ? "&max_id=" + encodeURIComponent(cursor) : "");
    var d = await getJSON(url, 3, step);
    return { users: (d.users || []).map(function (u) { return { u: u.username, n: u.full_name }; }), next: d.next_max_id || "" };
  }
  async function pageGQL(kind, cursor, step) {
    var vars = { id: uid, include_reel: false, fetch_mutual: false, first: 50 };
    if (cursor) vars.after = cursor;
    var d = await getJSON("/graphql/query/?query_hash=" + GQL[kind][0] + "&variables=" + encodeURIComponent(JSON.stringify(vars)), 3, step);
    var edge = d && d.data && d.data.user && d.data.user[GQL[kind][1]];
    if (!edge) throw fail("Respuesta inesperada de Instagram (" + step + ").", 200);
    if (!total[kind]) total[kind] = edge.count;
    return { users: (edge.edges || []).map(function (e) { return { u: e.node.username, n: e.node.full_name }; }), next: edge.page_info && edge.page_info.has_next_page ? edge.page_info.end_cursor : "" };
  }

  var total = {};
  async function readList(kind, label, base, offset) {
    var out = [], cursor = "", page = 0, fetcher = pageV1, step = label;
    do {
      if (stopped) throw fail("stop", 0);
      var r;
      try { r = await fetcher(kind, cursor, step); }
      catch (e) {
        // Si la API v1 falla en la primera página (no por límite de velocidad), probamos GraphQL
        if (fetcher === pageV1 && page === 0 && e.status !== 0 && e.status !== -1 && e.status !== 429) { fetcher = pageGQL; r = await fetcher(kind, cursor, step); }
        else throw e;
      }
      r.users.forEach(function (u) { if (u && u.u) out.push({ u: String(u.u).toLowerCase(), n: u.n || "" }); });
      cursor = r.next; page++;
      var expected = total[kind] || out.length + (cursor ? 50 : 0);
      msg("Leyendo " + label + "… " + out.length.toLocaleString("es") + (total[kind] ? " de " + total[kind].toLocaleString("es") : ""));
      bar(offset + base * Math.min(1, out.length / Math.max(1, expected)));
      if (cursor) await sleep(1200 + Math.random() * 1200 + (page % 8 === 0 ? 5000 : 0));
    } while (cursor);
    return out;
  }

  var result = null;
  (async function () {
    try {
      msg("Conectando con tu cuenta…");
      try {
        // Solo para mostrar el progreso: un intento, sin reintentos
        var info = await getJSON("/api/v1/users/" + uid + "/info/", 0, "perfil");
        if (info && info.user) { total.followers = info.user.follower_count; total.following = info.user.following_count; total.username = info.user.username; }
      } catch (e) { /* sin totales: seguimos igualmente */ }
      var following = await readList("following", "a quién sigues", 50, 0);
      var followers = await readList("followers", "tus seguidores", 50, 50);
      bar(100);
      var fset = {}; followers.forEach(function (x) { fset[x.u] = 1; });
      var notBack = following.filter(function (x) { return !fset[x.u]; }).length;
      result = { qnms: 1, source: "rapido", account: total.username || "", date: Date.now(), followers: followers, following: following };
      msg("Listo: " + notBack.toLocaleString("es") + " cuentas no te siguen de vuelta (de " + following.length.toLocaleString("es") + " que sigues).");
      $("done").style.display = "flex"; $("wait").style.display = "none";
    } catch (e) {
      if (e.message === "stop") return;
      $("wait").style.display = "none";
      msg(e.status === 429
        ? "Instagram está limitando las peticiones de tu cuenta ahora mismo. Espera unos minutos y vuelve a probar, o usa la opción con archivo."
        : e.status === 401 || e.status === 403
          ? "Instagram no permite leer la lista. Comprueba que has iniciado sesión en instagram.com y " + AGAIN + "."
          : e.message + " Haz una captura y pásasela al creador de la web.");
    }
  })();

  /* ---------- Envío a la web ---------- */
  $("open").onclick = function () {
    var w = window.open(SITE + "#recibir", "_blank");
    if (!w) { msg("Tu navegador ha bloqueado la ventana. Usa «Descargar archivo» y súbelo en la web."); return; }
    var sent = false;
    function onMsg(e) {
      if (e.origin !== SITE_ORIGIN || !e.data || e.data.type !== "qnms-ready" || sent) return;
      sent = true; w.postMessage({ type: "qnms-data", payload: result }, SITE_ORIGIN);
      msg("Resultados enviados. Puedes cerrar este panel.");
      window.removeEventListener("message", onMsg);
    }
    window.addEventListener("message", onMsg);
    setTimeout(function () { if (!sent) msg("No se pudo conectar con la web. Usa «Descargar archivo» y súbelo allí."); }, 15000);
  };
  $("save").onclick = function () {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(result)], { type: "application/json" }));
    a.download = "quien-no-me-sigue-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    msg("Archivo descargado. Súbelo en la web con «Elegir archivo».");
  };
})();
