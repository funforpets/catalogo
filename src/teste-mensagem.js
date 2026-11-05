/* Teste da mensagem compacta do WhatsApp (out/2026).
   Uso: node src/teste-mensagem.js  (precisa do index.html gerado pelo build).
   Bloqueia GTM e RD de propósito: o WhatsApp tem que abrir mesmo com o envio ao CRM falhando. */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const PRODUCTS = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'products.json'), 'utf8'));
let falhas = 0; const ok = (c, m) => { if (!c) falhas++; console.log((c ? 'OK   ' : 'FAIL ') + m); };
const cents = v => Math.round(v * 100);
function esperado(cart, uf) { // conta independente, em centavos
  let t = 0; for (const [s, q] of Object.entries(cart)) { const p = PRODUCTS.find(x => x.s === s);
    const u = (p.l === 'nat' && p.pt) ? (['SC', 'RO'].includes(uf) ? p.pr : p.pt) : p.pr; t += cents(u) * q; }
  return (t / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// IPI, conta independente: por item, sobre quantidade x preço de tabela, arredondado em 2 casas (igual à NF 522411)
function ipiEsperado(cart) {
  let t = 0; for (const [s, q] of Object.entries(cart)) { const p = PRODUCTS.find(x => x.s === s);
    if (p.ipi) t += Math.round(cents(p.pr) * q * p.ipi / 100 + 1e-6); }
  return t;
}
const brlC = c => (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
async function caso(b, nome, o) {
  const ctx = await b.newContext(o.mobile ? { viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', hasTouch: true, isMobile: true } : { viewport: { width: 1366, height: 800 } });
  await ctx.route(/googletagmanager|clarity\.ms/, r => r.abort());
  let rd = 0; await ctx.route(/api\.rd\.services/, r => { rd++; return r.abort(); });
  await ctx.addInitScript(() => { window.__links = []; const oc = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (/wa\.me|whatsapp/.test(this.href)) { window.__links.push(this.href); return; } return oc.call(this); }; });
  await ctx.addInitScript(([cart, f]) => { try { localStorage.setItem('ffp-cot', JSON.stringify(cart)); localStorage.setItem('ffp-loja', JSON.stringify(f)); } catch (e) {} }, [o.cart, o.form]);
  const m = await ctx.newPage();
  await m.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '#' + o.vend); await m.waitForTimeout(400);
  await m.click('#topCart'); await m.waitForTimeout(150);
  await m.click('#send'); await m.waitForTimeout(150);
  if (!o.mobile && !(await m.isHidden('#waPick'))) { await m.click('#waWeb'); await m.waitForTimeout(150); }
  const links = await m.evaluate(() => window.__links);
  const res = { links, rd, errUf: await m.evaluate(() => document.getElementById('fUf').classList.contains('err')) };
  if (links.length) { const u = new URL(links[0]); res.num = u.searchParams.get('phone') || u.pathname.replace('/', ''); res.msg = u.searchParams.get('text'); res.encLen = links[0].length; }
  await ctx.close(); return res;
}
const form = (uf, cid) => ({ loja: 'Loja Teste', cnpj: '13.507.909/0001-82', contato: 'Fulano', email: 'teste@exemplo.com.br', whats: '(51) 99764-8812', cidade: cid || '', uf: uf || '' });
const nat = PRODUCTS.filter(p => p.l === 'nat'), imp = PRODUCTS.filter(p => p.grp === 'imp' && p.s !== '14256');
const mix = { [imp[0].s]: 2, [imp[1].s]: 1, [nat[0].s]: 3, [nat[1].s]: 1 };
(async () => {
  const b = await chromium.launch();
  // 1. Ionara, loja de SC, celular: It's Natural na TBRFP2, nomes na lista (até 40 itens)
  let r = await caso(b, 'sc', { mobile: true, vend: 'ionara', cart: mix, form: form('SC', 'Chapecó') });
  ok(r.links.length === 1 && r.links[0].startsWith('https://wa.me/5551991167392?text='), 'SC/celular: abre wa.me da Ionara');
  ok(r.rd === 1, 'SC: tentou o RD (bloqueado no teste) e o WhatsApp abriu mesmo assim');
  ok(r.msg.includes('*Valor de tabela:* R$ ' + esperado(mix, 'SC')), 'SC: valor de tabela com It\'s Natural na TBRFP2 = R$ ' + esperado(mix, 'SC'));
  ok(r.msg.includes('3x ' + nat[0].s + ' ' + nat[0].n), 'SC: até 40 itens leva o nome');
  ok(r.msg.includes('*Cidade/UF:* Chapecó/SC'), 'SC: cidade/UF na mensagem');
  console.log('---- mensagem SC ----\n' + r.msg + '\n---------------------');
  // 2. Link antigo da Camila (desde 03/11/2026 vai para a Ionara), loja do PR, computador: It's Natural na TBRPF
  r = await caso(b, 'pr', { mobile: false, vend: 'camila', cart: mix, form: form('PR', 'Curitiba') });
  ok(r.num === '5551991167392', 'PR/computador: link antigo #camila cai no WhatsApp Web da Ionara');
  ok(r.msg.includes('*Valor de tabela:* R$ ' + esperado(mix, 'PR')) && esperado(mix, 'PR') !== esperado(mix, 'SC'), 'PR: It\'s Natural na TBRPF = R$ ' + esperado(mix, 'PR'));
  // 3. Sem UF: não envia e marca o campo
  r = await caso(b, 'semuf', { mobile: true, vend: 'camila', cart: mix, form: form('', '') });
  ok(r.links.length === 0 && r.errUf, 'sem UF: não abre o WhatsApp e marca o campo UF');
  // 4. 41 itens: sem nome
  const c41 = {}; imp.slice(0, 41).forEach(p => c41[p.s] = 1);
  r = await caso(b, '41', { mobile: true, vend: 'ionara', cart: c41, form: form('RS') });
  ok(!r.msg.includes(imp[0].n) && r.msg.includes('\n1x ' + imp[0].s + '\n'), '41 itens: só quantidade e SKU');
  // 5. 200 itens
  const c200 = {}; PRODUCTS.filter(p => p.s !== '14256').slice(0, 200).forEach((p, i) => c200[p.s] = (i % 5) + 1);
  r = await caso(b, '200', { mobile: true, vend: 'camila', cart: c200, form: form('PA', 'Juruti') });
  const linhas = r.msg.split('\n').filter(l => /^\d+x \d+$/.test(l));
  ok(linhas.length === 200, '200 itens: as 200 linhas estão na mensagem');
  ok(r.msg.includes('*Total:* 200 produtos, 600 unidades.') && r.msg.includes('*Valor de tabela:* R$ ' + esperado(c200, 'PA')), '200 itens: total e valor (R$ ' + esperado(c200, 'PA') + ')');
  console.log('     200 itens: ' + r.msg.length + ' caracteres, link com ' + r.encLen);
  // 6. catálogo inteiro (301 itens no ar)
  const call = {}; PRODUCTS.filter(p => p.s !== '14256').forEach(p => call[p.s] = 12);
  r = await caso(b, 'all', { mobile: true, vend: 'camila', cart: call, form: form('SP') });
  const ipiAll = ipiEsperado(call), totAll = cents(parseFloat(esperado(call, 'SP').replace(/\./g, '').replace(',', '.'))) + ipiAll;
  ok(r.msg.length < 4000 && r.msg.includes('*Valor de tabela:* R$ ' + esperado(call, 'SP')) && r.msg.endsWith('*Total com IPI:* R$ ' + brlC(totAll)), 'catálogo inteiro: ' + r.msg.length + ' caracteres (antes cortava perto de 8.000), termina no total com IPI');
  // 7. IPI: os itens da NF 522411 (04/11/2026, TBRPF) dão R$ 357,04 de IPI no ERP
  const nf = { 13497: 5, 13505: 3, 13509: 3, 13510: 3, 13511: 3, 13512: 2, 13513: 2, 13514: 2, 13518: 4, 13519: 3, 13521: 3, 13522: 3, 13524: 6, 13525: 3, 13527: 3, 13528: 3, 13532: 6, 13544: 3, 13548: 6, 13550: 6,
    13590: 3, 13592: 3, 13599: 2, 13609: 4, 13614: 12, 13672: 12, 13673: 12, 13703: 6, 14379: 6, 14380: 3, 14381: 3, 14382: 6, 14383: 6, 14384: 6, 14392: 6, 14393: 6, 14394: 6, 14395: 6, 14418: 2, 14423: 4, 14433: 6, 14435: 5, 14439: 3, 14440: 3, 14441: 3, 13449: 2, 13567: 3 };
  ok(ipiEsperado(nf) === 35704, 'IPI: conta do teste bate com a NF 522411 (R$ 357,04)');
  r = await caso(b, 'ipi', { mobile: true, vend: 'ionara', cart: nf, form: form('RS', 'Porto Alegre') });
  ok(r.msg.includes('*IPI (destacado na nota):* R$ 357,04'), 'IPI: mensagem traz R$ 357,04, igual à NF do ERP');
  // 8. Só itens sem IPI: a mensagem não fala de IPI
  r = await caso(b, 'semipi', { mobile: true, vend: 'ionara', cart: { 13471: 2, [nat[0].s]: 1 }, form: form('SC') });
  ok(!/IPI/.test(r.msg), 'sem item com IPI: mensagem sem linha de IPI');
  await b.close();
  console.log(falhas ? falhas + ' falha(s)' : 'Tudo certo');
  process.exit(falhas ? 1 : 0);
})();
