const { chromium } = require('playwright');
const ok=(c,m)=>console.log((c?'OK   ':'FAIL ')+m);
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 await ctx.addInitScript(()=>{ const oc=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ if(this.href.includes('wa.me')){ window.__waAt=(window.dataLayer||[]).map(e=>e.event||null); window.__waUrl=this.href; return; } return oc.call(this); }; });
 await ctx.route(/googletagmanager/, r=>r.abort()); const m=await ctx.newPage();
 await m.goto('file://'+require('path').resolve(__dirname,'..','index.html')+'?utm_source=google&utm_medium=cpc&gclid=TESTGCLID#ionara'); await m.waitForTimeout(600);
 const DL=()=>m.evaluate(()=>JSON.parse(JSON.stringify(window.dataLayer)));
 const evs=async(n)=>(await DL()).filter(e=>e.event===n);
 await m.evaluate(()=>document.getElementById('grid').scrollIntoView()); await m.waitForTimeout(400);
 let v=await evs('view_item_list'); ok(v.length===1 && v[0].ecommerce.item_list_id==='catalogo_geral' && v[0].ecommerce.items.length===24 && v[0].ecommerce.items[0].index===0 && !('quantity' in v[0].ecommerce.items[0]),'view_item_list catalogo_geral 24 itens sem quantity');
 console.log('   item exemplo:',JSON.stringify(v[0].ecommerce.items[0]));
 // re-render sem mudar recorte não duplica
 await m.evaluate(()=>{ renderGrid(0); }); await m.waitForTimeout(300);
 ok((await evs('view_item_list')).length===1,'re-render não duplica view_item_list');
 // add pelo card
 const sku1=await m.getAttribute('#grid [data-add]','data-add');
 await m.click('#grid [data-add]'); await m.waitForTimeout(100);
 let a=await evs('add_to_cart'); ok(a.length===1 && a[0].ecommerce.items[0].quantity===1 && a[0].ecommerce.items[0].item_id===sku1 && a[0].ecommerce.items[0].item_list_id==='catalogo_geral','add_to_cart do card, quantity 1, lista certa');
 // categoria
 await m.click('#rowCat [data-cat="Brinquedos"]'); await m.waitForTimeout(400);
 v=await evs('view_item_list'); ok(v.length===2 && v[1].ecommerce.item_list_id==='brinquedos' && v[1].ecommerce.item_list_name==='Brinquedos','troca de categoria dispara view_item_list brinquedos');
 await m.evaluate(()=>document.getElementById('moreBtn').scrollIntoView()); await m.click('#moreBtn'); await m.waitForTimeout(500);
 v=await evs('view_item_list'); ok(v.length===3 && v[2].ecommerce.items[0].index===24,'Ver mais dispara lote seguinte começando no index 24');
 // segundo produto pelo card na categoria
 const sku2=await m.getAttribute('#grid [data-add]','data-add'); await m.click('#grid [data-add]');
 // drawer
 await m.click('#barBtn'); await m.waitForTimeout(300);
 let vc=await evs('view_cart'); const sum=await m.textContent('#sumTxt');
 ok(vc.length===1 && sum.includes(vc[0].quote_items_count+' produtos') && sum.includes(vc[0].quote_total_units+' unidades'),'view_cart contadores = texto do drawer ('+sum+')');
 // stepper rápido: +++ -
 const inc='#sheet [data-inc="'+sku1+'"]', dec='#sheet [data-dec="'+sku1+'"]';
 for(const s of [inc,inc,inc,dec]) await m.click(s);
 await m.waitForTimeout(200); const before=(await evs('add_to_cart')).length;
 await m.waitForTimeout(900);
 a=await evs('add_to_cart'); const last=a[a.length-1];
 ok(a.length===before+1 && last.interaction_source==='minicheckout_stepper' && last.ecommerce.items[0].quantity===2,'debounce: +++− vira 1 add_to_cart de 2 unidades');
 await m.click(inc); await m.click(dec); await m.waitForTimeout(1000);
 ok((await evs('add_to_cart')).length===a.length && (await evs('remove_from_cart')).length===0,'+ e − em seguida: delta zero, nenhum evento');
 // envio vazio
 await m.click('#send'); await m.waitForTimeout(100);
 const bc=await evs('begin_checkout'); const fe=await evs('form_error');
 ok(bc.length===1,'begin_checkout uma vez'); ok(fe.length===1 && JSON.stringify(fe[0].error_fields)==='["loja","cnpj","email","whatsapp"]' && fe[0].error_count===4,'form_error '+JSON.stringify(fe[0]&&fe[0].error_fields));
 await m.click('#loja'); await m.click('#cnpj'); ok((await evs('begin_checkout')).length===1,'foco de novo não duplica begin_checkout');
 await m.fill('#loja','Pet Shop Teste'); await m.fill('#cnpj','13507909000182'); await m.fill('#contato','  João da Silva Souza ');
 await m.fill('#email','  Compras@PetShopTeste.com.br '); await m.type('#whats','051 99764-8812');
 console.log('   máscara:',await m.inputValue('#whats'));
 await m.click('#send'); await m.evaluate(()=>document.getElementById('send').click()); await m.waitForTimeout(200); // 2º toque direto no botão (a confirmação cobre a tela depois do 1º)
 ok(!(await m.isHidden('#sentOk')),'confirmação "Cotação enviada" aparece');
 const gl=await evs('generate_lead'); ok(gl.length===1,'toque duplo gera só 1 generate_lead');
 const at=await m.evaluate(()=>window.__waAt||[]); ok(at.includes('generate_lead'),'generate_lead já estava no dataLayer quando o WhatsApp abriu');
 const g=gl[0]; console.log('   generate_lead:',JSON.stringify(g));
 ok(/^FFP-[A-Z0-9]{6}$/.test(g.quote_id),'quote_id no formato');
 ok(g.user_data.email_address==='compras@petshopteste.com.br' && g.user_data.phone_number==='+5551997648812' && g.user_data.address.first_name==='joão' && g.user_data.address.last_name==='da silva souza','user_data normalizado');
 ok(g.attribution && g.attribution.gclid==='TESTGCLID' && g.attribution.utm_source==='google','atribuição com gclid e utm');
 const msg=decodeURIComponent((await m.evaluate(()=>window.__waUrl)).split('text=')[1]);
 ok(msg.split('\n')[0]==='Protocolo: '+g.quote_id,'1ª linha da mensagem = Protocolo'); console.log(msg.split('\n').slice(0,9).map(x=>'   | '+x).join('\n'));
 // reenvio depois de 2s mantém protocolo (some com a confirmação sem fechar a cotação)
 await m.evaluate(()=>{ document.getElementById('sentOk').hidden=true; });
 await m.waitForTimeout(2100); await m.click('#send'); const gl2=await evs('generate_lead'); ok(gl2.length===2 && gl2[1].quote_id===g.quote_id,'reenvio da mesma lista mantém o protocolo');
 // copiar
 await m.evaluate(()=>{ document.getElementById('sentOk').hidden=true; }); await m.click('#copy'); ok((await evs('copy_list')).length===1,'copy_list');
 // fechar no X
 await m.click('#sheet .x'); await m.waitForTimeout(100);
 let cc=await evs('close_cart'); ok(cc.length===1 && cc[0].close_method==='botao_x' && cc[0].reached_form===true,'close_cart botao_x reached_form true');
 // reabrir, fechar em continuar sem tocar no form
 await m.click('#barBtn'); await m.waitForTimeout(200); await m.click('#sheet [data-how="continuar_escolhendo"]');
 cc=await evs('close_cart'); ok(cc.length===2 && cc[1].close_method==='continuar_escolhendo' && cc[1].reached_form===false,'reabrir zera reached_form; continuar_escolhendo');
 ok((await evs('view_cart')).length===2,'view_cart de novo na reabertura');
 // esvaziar
 await m.click('#barBtn'); await m.waitForTimeout(200); await m.click('#clearCart'); await m.click('#clearCart');
 const rc=(await evs('remove_from_cart')).pop(); ok(rc && rc.removal_method==='esvaziar_lista' && rc.ecommerce.items.length===2,'esvaziar lista envia todos os itens');
 // regras gerais
 const dl=await DL(); let nullOk=true;
 dl.forEach((e,i)=>{ if(e.event && e.ecommerce && !(dl[i-1] && dl[i-1].ecommerce===null && Object.keys(dl[i-1]).length===1)) nullOk=false; });
 ok(nullOk,'ecommerce:null antes de cada push com ecommerce');
 const txt=JSON.stringify(dl);
 ok(!/purchase/.test(txt),'nenhum purchase'); ok(!/13507909|13\.507\.909/.test(txt),'nenhum CNPJ'); ok(!/Pet Shop Teste/.test(txt),'nome da loja fora do dataLayer');
 ok(!/"(price|value|currency)"/.test(txt),'sem price/value/currency');
 const ph=await m.evaluate(()=>['51997648812','(51) 99764-8812','051997648812','+55 51 99764-8812','5551997648812','55 (51) 3712-1234','(51)3712-1234','9976-48812','abc'].map(x=>x+' -> '+FFPAnalytics.normPhone(x)));
 console.log('   telefones:\n   '+ph.join('\n   '));
 const ls=await m.evaluate(()=>({q:localStorage.getItem('ffp_quotes'),a:localStorage.getItem('ffp_attribution'),f:localStorage.getItem('ffp-loja')}));
 ok(ls.q && !/13507909/.test(ls.q),'ffp_quotes salvo sem CNPJ'); ok(!!ls.a,'ffp_attribution salvo');
 // pré-preenchimento na visita seguinte
 const m2=await ctx.newPage(); await m2.goto('file://'+require('path').resolve(__dirname,'..','index.html')+''); await m2.waitForTimeout(400);
 ok(await m2.inputValue('#email')==='  Compras@PetShopTeste.com.br ' || (await m2.inputValue('#email')).includes('Compras'),'e-mail pré-preenchido'); ok(await m2.inputValue('#whats')==='(51) 99764-8812','WhatsApp pré-preenchido com máscara');
 const a2=await m2.evaluate(()=>JSON.parse(localStorage.getItem('ffp_attribution'))); ok(a2.gclid==='TESTGCLID','atribuição não sobrescrita na 2ª visita');
 console.log('   ordem:',dl.filter(e=>e.event).map(e=>e.event).join(' > '));
 await m.screenshot({path:'/tmp/claude-0/-home-claude-catalogo/586dc5a5-f066-5521-b472-3c1143c38641/scratchpad/form.png'});
 await b.close();
})();
