/* Teste de 03/11/2026: só a Ionara atende, o link antigo #camila vai para ela,
   e a cotação preenchida e não enviada vai ao RD com catalogo-cotacao-nao-enviada.
   Uso: node src/teste-vendedora-e-nao-enviada.js  (precisa do index.html gerado pelo build). */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const PRODUCTS = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'products.json'), 'utf8'));
const URL0 = 'file://' + path.resolve(__dirname, '..', 'index.html');
const IONARA = '5551991167392';
let falhas = 0; const ok = (c, m) => { if (!c) falhas++; console.log((c ? 'OK   ' : 'FAIL ') + m); };
const imp = PRODUCTS.filter(p => p.grp === 'imp' && p.s !== '14256');
const cart = { [imp[0].s]: 2, [imp[1].s]: 1 };
const form = { loja: 'Loja Teste', cnpj: '13.507.909/0001-82', contato: 'Fulano', email: 'teste@exemplo.com.br', whats: '(47) 99764-8812', cidade: 'Joinville', uf: 'SC' };

async function abre(b, hash, init) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', hasTouch: true, isMobile: true });
  await ctx.route(/googletagmanager|clarity\.ms/, r => r.abort());
  const rd = []; await ctx.route(/api\.rd\.services/, r => { try { rd.push(JSON.parse(r.request().postData()).payload); } catch (e) {} return r.fulfill({ status: 200, body: '{}' }); });
  await ctx.addInitScript(() => { window.__links = []; const oc = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (/wa\.me|whatsapp/.test(this.href)) { window.__links.push(this.href); return; } return oc.call(this); }; });
  await ctx.addInitScript(i => { try { if (!sessionStorage.getItem('__init')) { Object.keys(i).forEach(k => localStorage.setItem(k, i[k])); sessionStorage.setItem('__init', '1'); } } catch (e) {} }, init || {});
  const m = await ctx.newPage(); await m.goto(URL0 + (hash ? '#' + hash : '')); await m.waitForTimeout(400);
  return { ctx, m, rd };
}
const esconde = m => m.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
const base = { 'ffp-cot': JSON.stringify(cart), 'ffp-loja': JSON.stringify(form) };

(async () => {
  const b = await chromium.launch();
  // 1. link antigo #camila
  let t = await abre(b, 'camila', base);
  await t.m.click('#topCart'); await t.m.waitForTimeout(150);
  ok(await t.m.isHidden('#sellerBox'), '#camila: não aparece escolha de vendedora');
  await t.m.click('#send'); await t.m.waitForTimeout(200);
  let L = await t.m.evaluate(() => window.__links);
  ok(L.length === 1 && L[0].startsWith('https://wa.me/' + IONARA), '#camila: cotação vai para o WhatsApp da Ionara');
  ok(decodeURIComponent(L[0]).includes('Olá, Ionara!'), '#camila: saudação com o nome da Ionara');
  ok(t.rd.length === 1 && t.rd[0].conversion_identifier === 'catalogo-cotacao' && t.rd[0].cf_vendedoras === 'Ionara', '#camila: RD recebe catalogo-cotacao com vendedora Ionara');
  ok(await t.m.evaluate(() => localStorage.getItem('ffp-vend')) === 'ionara', '#camila: aparelho passa a guardar ionara');
  await esconde(t.m); await t.m.waitForTimeout(150);
  ok(t.rd.length === 1, 'depois de enviar, sair da página não manda "não enviada"');
  await t.ctx.close();

  // 2. aparelho com camila salva, link sem nada
  t = await abre(b, '', Object.assign({ 'ffp-vend': 'camila' }, base));
  await t.m.click('#topCart'); await t.m.waitForTimeout(150); await t.m.click('#send'); await t.m.waitForTimeout(200);
  L = await t.m.evaluate(() => window.__links);
  ok(L.length === 1 && L[0].startsWith('https://wa.me/' + IONARA), 'camila salva no aparelho: vai para a Ionara');
  await t.ctx.close();

  // 3. link sem vendedora e aparelho novo: sem escolha, vai para a Ionara
  t = await abre(b, '', base);
  await t.m.click('#topCart'); await t.m.waitForTimeout(150);
  ok(await t.m.isHidden('#sellerBox') && !(await t.m.evaluate(() => document.getElementById('sellerArea').innerHTML.includes('Tanto faz'))), 'sem link: sem escolha e sem "Tanto faz"');
  await t.m.click('#send'); await t.m.waitForTimeout(200);
  L = await t.m.evaluate(() => window.__links);
  ok(L.length === 1 && L[0].startsWith('https://wa.me/' + IONARA), 'sem link: vai para a Ionara');
  await t.ctx.close();

  // 4. preencheu e saiu sem enviar
  t = await abre(b, 'ionara', base);
  await t.m.click('#topCart'); await t.m.waitForTimeout(150);
  await esconde(t.m); await t.m.waitForTimeout(200);
  ok(t.rd.length === 1 && t.rd[0].conversion_identifier === 'catalogo-cotacao-nao-enviada', 'não enviada: RD recebe catalogo-cotacao-nao-enviada');
  ok(t.rd[0] && t.rd[0].cf_cnpj === '13.507.909/0001-82' && t.rd[0].cf_vendedoras === 'Ionara' && t.rd[0].email === 'teste@exemplo.com.br', 'não enviada: leva CNPJ, e-mail e vendedora');
  ok((await t.m.evaluate(() => (window.dataLayer || []).filter(e => e.event === 'generate_lead').length)) === 0, 'não enviada: não conta como conversão no GA');
  await esconde(t.m); await t.m.waitForTimeout(150);
  ok(t.rd.length === 1, 'não enviada: a mesma lista não é mandada duas vezes');
  await t.ctx.close();

  // 5. dados incompletos: não manda
  t = await abre(b, 'ionara', { 'ffp-cot': JSON.stringify(cart), 'ffp-loja': JSON.stringify(Object.assign({}, form, { email: '' })) });
  await esconde(t.m); await t.m.waitForTimeout(150);
  ok(t.rd.length === 0, 'sem e-mail: não manda nada ao RD');
  await t.ctx.close();

  // 6. dados completos e lista vazia: não manda
  t = await abre(b, 'ionara', { 'ffp-loja': JSON.stringify(form) });
  await esconde(t.m); await t.m.waitForTimeout(150);
  ok(t.rd.length === 0, 'lista vazia: não manda nada ao RD');
  await t.ctx.close();

  await b.close();
  console.log(falhas ? falhas + ' falha(s)' : 'Tudo certo');
  process.exit(falhas ? 1 : 0);
})();
