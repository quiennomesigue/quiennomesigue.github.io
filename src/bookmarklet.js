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
  if (!/(^|\.)instagram\.com$/.test(location.hostname)) {
    alert("Abre instagram.com, inicia sesión y vuelve a pulsar el marcador «¿Quién no me sigue?».");
    location.href = "https://www.instagram.com/";
    return;
  }
  var m = document.cookie.match(/(?:^|;\s*)ds_user_id=(\d+)/);
  if (!m) { alert("Inicia sesión en instagram.com y vuelve a pulsar el marcador."); return; }
  var uid = m[1];

  /* ---------- Panel ---------- */
  var box = document.createElement("div");
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
  box.appendChild(h("div", "display:none;margin-top:14px;flex-direction:column;gap:8px", { "data-done": "" }, [
    h("button", BTN + "background:#12131a;color:#fff;border-radius:999px;padding:11px 16px;font-weight:600", { "data-open": "" }, ["Ver resultados"]),
    h("button", BTN + "color:#646a7e;text-decoration:underline;font-size:13px", { "data-save": "" }, ["Descargar archivo (si no se abren)"])
  ]));
  box.appendChild(h("p", "margin:12px 0 0;font-size:12px;color:#9aa0b4", {}, ["Solo lectura. No sigue ni deja de seguir a nadie. Tus datos no se envían a ningún servidor."]));
  document.body.appendChild(box);
  var $ = function (k) { return box.querySelector("[data-" + k + "]"); };
  var stopped = false;
  window.__qnms = { show: function () { box.style.display = "block"; } };
  $("x").onclick = function () { stopped = true; box.remove(); delete window.__qnms; };
  function msg(t) { $("msg").textContent = t; }
  function bar(p) { $("bar").style.width = Math.max(2, Math.min(100, p)) + "%"; }

  /* ---------- Lectura ---------- */
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  async function getJSON(url) {
    for (var attempt = 0; attempt < 4; attempt++) {
      var res = await fetch(url, { credentials: "include", headers: { "x-ig-app-id": APP_ID, "x-requested-with": "XMLHttpRequest" } });
      if (res.ok) return res.json();
      if (res.status === 429 || res.status >= 500) {
        var wait = 60 * (attempt + 1);
        for (var s = wait; s > 0 && !stopped; s--) { msg("Instagram pide ir más despacio. Reintentando en " + s + " s…"); await sleep(1000); }
        continue;
      }
      if (res.status === 401 || res.status === 403) throw new Error("Instagram no permite leer la lista ahora mismo. Comprueba que has iniciado sesión y prueba más tarde.");
      throw new Error("Error " + res.status + " al leer Instagram.");
    }
    throw new Error("Instagram está limitando las peticiones. Espera un rato y vuelve a probar, o usa la opción con archivo.");
  }

  var counts = { followers: 0, following: 0 };
  async function readList(kind, label, base, offset, total) {
    var out = [], max = "", page = 0;
    do {
      if (stopped) throw new Error("stop");
      var url = "/api/v1/friendships/" + uid + "/" + kind + "/?count=50" + (kind === "followers" ? "&search_surface=follow_list_page" : "") + (max ? "&max_id=" + encodeURIComponent(max) : "");
      var data = await getJSON(url);
      (data.users || []).forEach(function (u) { if (u && u.username) out.push({ u: String(u.username).toLowerCase(), n: u.full_name || "" }); });
      max = data.next_max_id || "";
      page++;
      var expected = total[kind] || out.length + (max ? 50 : 0);
      msg("Leyendo " + label + "… " + out.length.toLocaleString("es") + (total[kind] ? " de " + total[kind].toLocaleString("es") : ""));
      bar(offset + base * Math.min(1, out.length / Math.max(1, expected)));
      if (max) await sleep(900 + Math.random() * 900 + (page % 10 === 0 ? 4000 : 0));
    } while (max);
    return out;
  }

  var result = null;
  (async function () {
    try {
      var total = {};
      try {
        var info = await getJSON("/api/v1/users/" + uid + "/info/");
        if (info && info.user) { total.followers = info.user.follower_count; total.following = info.user.following_count; total.username = info.user.username; }
      } catch (e) { /* sin totales: seguimos igualmente */ }
      var following = await readList("following", "a quién sigues", 50, 0, total);
      var followers = await readList("followers", "tus seguidores", 50, 50, total);
      bar(100);
      var fset = {}; followers.forEach(function (x) { fset[x.u] = 1; });
      var notBack = following.filter(function (x) { return !fset[x.u]; }).length;
      result = { qnms: 1, source: "rapido", account: total.username || "", date: Date.now(), followers: followers, following: following };
      msg("Listo: " + notBack.toLocaleString("es") + " cuentas no te siguen de vuelta (de " + following.length.toLocaleString("es") + " que sigues).");
      $("done").style.display = "flex";
    } catch (e) {
      if (e.message !== "stop") msg(e.message);
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
