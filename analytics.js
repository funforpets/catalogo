/* =====================================================================
   analytics.js — camada de dados (dataLayer) do catálogo FunForPets Atacado
   Único ponto do site que escreve no window.dataLayer.
   Regras: nunca 'purchase'; nunca price/value/currency; nunca CNPJ ou nome
   da loja; 'ecommerce: null' antes de todo push com 'ecommerce'.
   Documentação dos eventos: TRACKING.md
   ===================================================================== */
(function (w) {
  "use strict";
  w.dataLayer = w.dataLayer || [];

  var CFG = {
    debounceMs: 800,
    listMax: 30,
    attrKey: "ffp_attribution",
    attrDays: 90,
    quotesKey: "ffp_quotes",
    product: null      // função (sku) -> produto; definida em init()
  };

  /* ---------- utilidades ---------- */
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function read(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function push(obj) { w.dataLayer.push(obj); }
  function pushEcom(obj) { w.dataLayer.push({ ecommerce: null }); w.dataLayer.push(obj); }
  function slug(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  /* ---------- objeto item ---------- */
  // p: produto do catálogo; list: {id, name} do recorte atual
  function buildItem(p, quantidade, indice, list) {
    var it = {
      item_id: String(p.s),
      item_name: p.n,
      item_brand: p.brand,
      item_category: p.secao,
      item_category2: p.c
    };
    if (p.pet) it.item_category3 = p.pet;
    if (quantidade != null) it.quantity = quantidade;
    if (indice != null) it.index = indice;
    if (list) { it.item_list_id = list.id; it.item_list_name = list.name; }
    return it;
  }

  // itens da cotação: [{p, qty}] na ordem exibida no drawer
  function cartItems(rows, list) {
    return rows.map(function (r, i) { return buildItem(r.p, r.qty, i, list); });
  }
  function counts(rows) {
    return {
      quote_items_count: rows.length,
      quote_total_units: rows.reduce(function (a, r) { return a + r.qty; }, 0)
    };
  }

  /* ---------- 1) view_item_list ---------- */
  var listSent = {};   // chave do recorte + página já enviada
  function viewItemList(list, products, startIndex, pageKey) {
    var key = (list.key || list.id) + "|" + (pageKey || 0);
    if (listSent[key]) return;
    listSent[key] = true;
    var items = products.slice(0, CFG.listMax).map(function (p, i) {
      return buildItem(p, null, startIndex + i, list);
    });
    if (!items.length) return;
    pushEcom({ event: "view_item_list", ecommerce: { item_list_id: list.id, item_list_name: list.name, items: items } });
  }
  function resetLists() { listSent = {}; }

  /* ---------- 2) add_to_cart pelo botão do card ---------- */
  var lastCardAdd = {};
  function addToCartCard(p, indice, list) {
    var now = Date.now();
    if (lastCardAdd[p.s] && now - lastCardAdd[p.s] < 600) return;   // clique duplo
    lastCardAdd[p.s] = now;
    pushEcom({ event: "add_to_cart", ecommerce: { items: [buildItem(p, 1, indice, list)] } });
  }

  /* ---------- 3) stepper com debounce de 800 ms (delta líquido) ---------- */
  var pend = {};   // chave sku|origem -> {p, delta, indice, list, src, t}
  function qtyChange(p, delta, source, indice, list) {
    if (!delta) return;
    var k = p.s + "|" + source;
    var e = pend[k] || (pend[k] = { p: p, delta: 0, indice: indice, list: list, src: source, t: null });
    e.delta += delta;
    clearTimeout(e.t);
    e.t = setTimeout(function () { flushOne(k); }, CFG.debounceMs);
  }
  function flushOne(k) {
    var e = pend[k]; if (!e) return;
    delete pend[k]; clearTimeout(e.t);
    if (!e.delta) return;
    pushEcom({
      event: e.delta > 0 ? "add_to_cart" : "remove_from_cart",
      interaction_source: e.src,
      ecommerce: { items: [buildItem(e.p, Math.abs(e.delta), e.indice, e.list)] }
    });
  }
  function flushQty() { Object.keys(pend).forEach(flushOne); }

  /* ---------- 4) esvaziar lista ---------- */
  function clearCart(rows) {
    flushQty();   // adições pendentes saem antes, para o saldo fechar no GA4
    if (!rows.length) return;
    pushEcom({ event: "remove_from_cart", removal_method: "esvaziar_lista", ecommerce: { items: cartItems(rows) } });
  }

  /* ---------- 5) view_cart / 6) begin_checkout ---------- */
  var formStarted = false;
  function viewCart(rows) {
    flushQty();
    formStarted = false;
    var c = counts(rows);
    pushEcom({ event: "view_cart", quote_items_count: c.quote_items_count, quote_total_units: c.quote_total_units, ecommerce: { items: cartItems(rows) } });
  }
  function beginCheckout(rows) {
    if (formStarted) return;
    formStarted = true;
    flushQty();
    var c = counts(rows);
    pushEcom({ event: "begin_checkout", quote_items_count: c.quote_items_count, quote_total_units: c.quote_total_units, ecommerce: { items: cartItems(rows) } });
  }

  /* ---------- 7) form_error ---------- */
  function formError(fields) {
    push({ event: "form_error", form_name: "solicitacao_orcamento", error_fields: fields.slice(), error_count: fields.length });
  }

  /* ---------- 8) copy_list ---------- */
  function copyList(rows) {
    flushQty();
    var c = counts(rows);
    pushEcom({ event: "copy_list", quote_items_count: c.quote_items_count, quote_total_units: c.quote_total_units, ecommerce: { items: cartItems(rows) } });
  }

  /* ---------- 9) close_cart ---------- */
  function closeCart(method, rows) {
    flushQty();
    var c = counts(rows);
    push({ event: "close_cart", close_method: method, quote_items_count: c.quote_items_count, quote_total_units: c.quote_total_units, reached_form: formStarted });
  }

  /* ---------- normalização (Enhanced Conversions) ---------- */
  function normEmail(v) {
    v = String(v || "").trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? v : "";
  }
  function normPhone(v) {
    var d = String(v || "").replace(/\D/g, "");
    if ((d.length === 12 || d.length === 13) && d.indexOf("55") === 0) d = d.slice(2);  // já veio com DDI
    d = d.replace(/^0+/, "");                                                          // zero antes do DDD
    if (d.length !== 10 && d.length !== 11) return "";
    return "+55" + d;
  }
  function splitName(v) {
    var t = String(v || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!t.length) return null;
    var o = { first_name: t[0] };
    if (t.length > 1) o.last_name = t.slice(1).join(" ");
    return o;
  }
  function userData(email, phone, name) {
    var u = {}, e = normEmail(email), ph = normPhone(phone), nm = splitName(name);
    if (e) u.email_address = e;
    if (ph) u.phone_number = ph;
    if (nm) u.address = nm;
    return u;
  }

  /* ---------- atribuição (primeiro toque, 90 dias) ---------- */
  var ATTR_KEYS = ["gclid", "gbraid", "wbraid", "fbclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  function captureAttribution() {
    var cur = read(CFG.attrKey);
    if (cur && cur.first_visit_at && (Date.now() - Date.parse(cur.first_visit_at)) < CFG.attrDays * 864e5) return cur;
    var q = {}, sp;
    try { sp = new URLSearchParams(w.location.search); } catch (e) { sp = null; }
    var a = {};
    ATTR_KEYS.forEach(function (k) { var v = sp && sp.get(k); if (v) a[k] = v; });
    a.landing_page = w.location.origin + w.location.pathname;
    if (document.referrer) a.referrer = document.referrer;
    a.first_visit_at = new Date().toISOString();
    store(CFG.attrKey, a);
    return a;
  }
  function getAttribution() {
    var a = read(CFG.attrKey) || {}, o = {};
    Object.keys(a).forEach(function (k) { if (a[k]) o[k] = a[k]; });
    return o;
  }

  /* ---------- protocolo da cotação ---------- */
  function newQuoteId() {
    var abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "", r;
    if (w.crypto && w.crypto.getRandomValues) { r = new Uint32Array(6); w.crypto.getRandomValues(r); }
    for (var i = 0; i < 6; i++) s += abc.charAt((r ? r[i] : Math.floor(Math.random() * 1e9)) % abc.length);
    return "FFP-" + s;
  }

  /* ---------- 10) generate_lead (CONVERSÃO) ---------- */
  // Chamar de forma síncrona, ANTES de abrir o WhatsApp.
  function generateLead(o) {
    flushQty();
    var c = counts(o.rows), attr = getAttribution();
    var ev = {
      event: "generate_lead",
      lead_method: "whatsapp",
      lead_type: "cotacao_atacado",
      quote_id: o.quoteId,
      quote_items_count: c.quote_items_count,
      quote_total_units: c.quote_total_units
    };
    if (o.target) ev.whatsapp_target = o.target;   // celular | web | app_computador | copiar
    if (o.city) ev.store_city = o.city;
    if (o.state) ev.store_state = o.state;
    var u = userData(o.email, o.phone, o.name);
    if (Object.keys(u).length) ev.user_data = u;
    if (Object.keys(attr).length) ev.attribution = attr;
    ev.ecommerce = { items: cartItems(o.rows) };
    pushEcom(ev);
    // snapshot local da cotação (sem CNPJ)
    var hist = read(CFG.quotesKey) || [];
    hist.push({ quote_id: o.quoteId, created_at: new Date().toISOString(), items: o.rows.map(function (r) { return { item_id: r.p.s, quantity: r.qty }; }), attribution: attr });
    store(CFG.quotesKey, hist.slice(-20));
  }

  /* ---------- Consent Mode v2 (para quando houver banner de cookies) ---------- */
  function consentDefault() {
    w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
    w.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
  }
  function consentGrant() {
    w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
    w.gtag("consent", "update", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
  }

  w.FFPAnalytics = {
    slug: slug, buildItem: buildItem,
    viewItemList: viewItemList, resetLists: resetLists,
    addToCartCard: addToCartCard, qtyChange: qtyChange, flushQty: flushQty,
    clearCart: clearCart, viewCart: viewCart, beginCheckout: beginCheckout,
    formError: formError, copyList: copyList, closeCart: closeCart,
    generateLead: generateLead, newQuoteId: newQuoteId,
    captureAttribution: captureAttribution, getAttribution: getAttribution,
    normEmail: normEmail, normPhone: normPhone,
    consentDefault: consentDefault, consentGrant: consentGrant
  };
})(window);
