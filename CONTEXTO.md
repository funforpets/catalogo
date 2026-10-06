# Catálogo de cotação FunForPets: contexto para continuar o trabalho

Atualizado em 06/10/2026 (filtros Mais vendidos e Novidades, setas nas fotos, preço no card). Este arquivo existe para que uma conversa nova com o Claude retome o catálogo sem precisar reconstruir o histórico. Ele também fica no projeto Expansão Indústria (claude/Catalogo-Cotacao-Contexto.md) e na pasta Comunicacao/Catalogo Cotacao.

## O que é

Site de catálogo de atacado, feito para o celular, com os importados (Its Pet e FunForPets) e a indústria (It's Natural e Mordidinhas Naturais). Desde 06/10/2026 mostra o preço de tabela e o preço com desconto (antes não mostrava, e o retorno das vendedoras foi que a falta de preço atrapalhava). O lojista busca e filtra, adiciona produtos "à cotação", preenche os dados da loja e envia a lista pronta para o WhatsApp da vendedora. Substitui o flipbook do FlipHTML5 e foi pensado para tirar atrito do pedido. O visual segue a landing page de atacado (euamo.funforpets.com.br/revenda-atacado-produtos-pets-funforpets).

- No ar: **catalogo.funforpets.com.br** (domínio próprio desde 06/10/2026). O endereço antigo funforpets.github.io/catalogo redireciona sozinho para o novo.
- Links das vendedoras: catalogo.funforpets.com.br/#ionara e catalogo.funforpets.com.br/#camila
- DNS: no Cloudflare, CNAME `catalogo` apontando para `funforpets.github.io`, nuvem cinza (somente DNS). Se ligar a nuvem laranja, o certificado do GitHub para de renovar. O domínio fica gravado no arquivo `CNAME` da raiz do repositório; apagar esse arquivo tira o site do domínio.
- Repositório: github.com/funforpets/catalogo (usuário GitHub "funforpets"). Publicação pelo GitHub Pages, branch main, raiz.
- Cópia local: pasta "Projeto Industria/Comunicacao/Catalogo Cotacao" no computador da Gerência Comercial.

## Vendedoras

| Vendedora | WhatsApp | Link dela |
|---|---|---|
| Ionara | 51 99116-7392 | .../catalogo/#ionara |
| Camila | 51 99677-7293 | .../catalogo/#camila |

Sem nada no fim do link, o cliente escolhe entre Ionara, Camila ou "Tanto faz" (sorteia). Quem entrou pelo link de uma vendedora fica com ela guardada no aparelho. Os números ficam em `CONFIG.VENDEDORAS`, no começo do script do `src/template.html`.

## Como o site está montado

- `src/template.html`: a página inteira (HTML, CSS e JS) com o marcador `__DATA__` no lugar da lista de produtos.
- `src/products.json`: 302 produtos cadastrados (301 no ar; o 14256 espera foto). Os campos estão explicados no topo de `src/build.py`. Produto sem `img/SKU.jpg` fica fora do site automaticamente até a foto chegar.
- `python3 src/build.py` gera o `index.html` da raiz. Nunca editar o `index.html` direto, sempre o template ou o json e rodar o build.
- `analytics.js`: único arquivo que escreve no dataLayer (GTM/GA4). Documentação dos eventos em `TRACKING.md`.
- `img/SKU.jpg` é a foto principal (640x640), `img/SKU-2.jpg` em diante são a galeria e `img/t/SKU-k.jpg` as miniaturas (110x110). Desde out/2026 o máximo é 3 fotos por produto (os antigos têm até 4). `python3 src/fotos.py SKU foto1 foto2 foto3` prepara um produto; `python3 src/fotos_lote.py "/pasta/Fotos"` procura na pasta os arquivos que começam pelo SKU de todos os produtos sem foto e prepara de uma vez, já acertando o campo `g`.
- `banners/b1` a `b7`: artes do carrossel (1200x600, sem texto, o texto vai no HTML). O carrossel gira a cada 5 s.
- `logo/funforpets-branco.png`: logo do topo.
- `src/teste-datalayer.js` e `src/teste-whatsapp-desktop.js`: testes automáticos (Playwright) do funil de medição e do envio pelo computador.

Para publicar: rodar o build, `git commit` e `git push` na main. O GitHub leva menos de um minuto. Em 05/10/2026 a fila de publicação do GitHub travou à tarde e só voltou com um push novo no dia seguinte; se o site não atualizar, olhar a aba Actions do repositório e mandar "Re-run".

## Decisões já tomadas

- Menu em dois níveis. Importados: Brinquedos, Comedouros e bebedouros, Higiene e beleza, Passeio, Arranhadores, Conforto. Indústria: It's Natural, Mordidinhas Naturais. Filtro de pet (cães, gatos) e de marca dos importados (Its Pet, FunForPets) numa gaveta de filtros.
- Fotos: nos importados, a principal é a ilustrada (feita para a Shopee), com galeria de até 4. Na indústria, fundo branco.
- It's Natural pode ser comprado fora da caixa, então não mostra "Caixa com". Mordidinhas mostra.
- Mordidinhas Crispy e Tradicionais (14 SKUs) ficaram fora até segunda ordem.
- Os 103 cadastros de variação de cor (13883 a 14011) estão inativos no ERP e não entram. O catálogo mostra o produto pai.
- Banners desenhados no GPT a partir do doc "Briefing dos banners do catálogo" (Claude Docs). Arte 1536x1024, recortada para 2:1, lado esquerdo livre para o texto, nenhuma letra na arte.
- Texto da página sem cara de IA, sem emoji, poucos travessões, sempre com o SKU junto do nome.
- A lista de cotação e os dados da loja ficam salvos no aparelho do cliente, para ele montar aos poucos.
- Mensagem do WhatsApp: primeira linha "Protocolo: FFP-XXXXXX", depois saudação com o nome da vendedora, loja, CNPJ, contato, e-mail, WhatsApp, cidade e a lista "quantidade | SKU | nome".
- No computador, o botão de envio abre uma janela com WhatsApp Web (principal), aplicativo ou copiar a mensagem. Motivo: o link wa.me no aplicativo de desktop às vezes abre "encaminhar para" em vez da conversa. No celular abre direto.
- Formulário: nome da loja, CNPJ (com validação), seu nome, e-mail e WhatsApp (obrigatórios, pedidos pelo gerente de tráfego para conversões otimizadas), cidade e UF.

## Mais vendidos e Novidades (out/2026)

- Linha de destaque acima das seções com dois botões, "Mais vendidos" e "Novidades", também na gaveta de filtros (grupo "Destaques"). Combina com o filtro de pet e de categoria. Tocar num destaque limpa seção e categoria para mostrar a lista inteira.
- Os produtos dessas listas ganham um selo sobre a foto ("Mais vendido" em amarelo, "Novidade" em azul-marinho).
- **Mais vendidos** = os 50 produtos do catálogo com maior faturamento de 01/04/2026 a 06/10/2026, aparecem em ordem de ranking (campo `mv`, 1 a 50). Regra de venda efetiva da casa (`tipo_nf='S'`, situação AB/DP, `tp_ped` VE/MK/SH/ML/RF/SC, sem bonificação, descontando devolução) e os filtros do painel t3-comercial: fora vendedor INTERNO, ECOMMERCE e INADIMPLENTES e fora a EQUIPE REPRE FFP. Produtos fora do catálogo (Mordidinhas Crispy e Tradicionais) não entram na conta.
- **Novidades** = produtos cadastrados no ERP a partir de 01/06/2026 (campo `nov`): o 14200 (Mordidinhas lascas de fígado suíno) e os 65 da Its Pet (14256 e 14378 a 14441). Aparecem do SKU mais novo para o mais antigo. Em 06/10/2026 estavam no ar 65 novidades (falta só o 14256, sem foto).
- Para atualizar o ranking: rodar a consulta abaixo no Teia (connection_id 1), pegar os 50 primeiros SKUs que existem no `products.json`, gravar `mv` neles (e tirar dos outros), build e push.

```sql
SELECT i.cd_prod,
  SUM(i.vl_tot_liquido - CASE WHEN ISNULL(i.qtde_dev,0)>0 AND i.qtde_est>0
      THEN i.qtde_dev*ISNULL(i.fator_est_vda,1)*i.vl_tot_liquido/i.qtde_est ELSE 0 END) fat
FROM nota n JOIN ped_vda p ON p.nu_ped=n.nu_ped AND p.cd_emp=n.cd_emp
JOIN it_nota i ON i.nu_nf=n.nu_nf JOIN produto pr ON pr.cd_prod=i.cd_prod
LEFT JOIN vendedor v ON LTRIM(RTRIM(v.cd_vend))=LTRIM(RTRIM(n.cd_vend)) AND v.cd_emp=n.cd_emp
WHERE n.dt_emis>='2026-04-01' AND n.tipo_nf='S' AND n.situacao IN ('AB','DP')
  AND p.tp_ped IN ('VE','MK','SH','ML','RF','SC') AND i.bonificado=0
  AND LTRIM(RTRIM(pr.cd_fabric)) IN ('ITS IM','FUNFOR','FRN')
  AND ISNULL(LTRIM(RTRIM(v.nome)),'') NOT IN ('INTERNO','ECOMMERCE','INADIMPLENTES')
  AND ISNULL(n.desc_equipe,'')<>'EQUIPE REPRE FFP'
GROUP BY i.cd_prod ORDER BY fat DESC;
```

## Preço no card (06/10/2026)

- Embaixo do código vem o preço de tabela por unidade e as faixas de desconto da política v1.3, com o link "Ver condições do desconto", que abre a gaveta de descontos. O preço também aparece na foto ampliada.
- Importados: preço, "20% off" (faixa de R$ 5.000 em importados) e "30% off" (faixa máxima mais 10% à vista). Indústria (It's Natural e Mordidinhas): preço e só "10% off à vista", porque a política limita o desconto da indústria a 10%.
- Tabela de preço: **TBRPF, Tabela FunForPets Padrão**, a mesma que a Láuria usa, para importados e Mordidinhas. **It's Natural usa a TBRFP2, Tabela FunForPets Sem ST**, porque a prospecção é em SC, onde não tem ST (decisão da Gerência Comercial). Nos importados e nas Mordidinhas as duas tabelas têm o mesmo preço; só o It's Natural muda (a Sem ST é cerca de 17% mais alta).
- Seletor "Ordenar" ao lado da contagem de produtos: **Menor preço é o padrão** ao abrir o site (decisão da Gerência Comercial), depois Maior preço e Recomendados (ordem do catálogo; em Mais vendidos segue o ranking, em Novidades o SKU mais novo primeiro). Vale junto com qualquer filtro. A troca de ordem reinicia a contagem de posições do `view_item_list`.
- O "/un." some quando o nome já diz a embalagem (pote com 50, display com 24, kit, unidades).
- O preço fica no campo `pr` do `src/products.json`. A foto de preços de 06/10/2026 está em `src/precos-2026-10-06.txt` (SKU:preço). Para atualizar, rodar no Teia:

```sql
SELECT pr.cd_prod, MAX(CASE WHEN LTRIM(RTRIM(pr.cd_linha))='ITS' OR pr.descricao LIKE 'NATURA SNACKS%'
         THEN CASE WHEN LTRIM(RTRIM(p.cd_tabela))='TBRFP2' THEN p.vl_preco END
         ELSE CASE WHEN LTRIM(RTRIM(p.cd_tabela))='TBRPF' THEN p.vl_preco END END) preco
FROM preco p JOIN produto pr ON pr.cd_prod=p.cd_prod
WHERE LTRIM(RTRIM(p.cd_tabela)) IN ('TBRPF','TBRFP2')
  AND LTRIM(RTRIM(pr.cd_fabric)) IN ('ITS IM','FUNFOR','FRN') AND pr.ativo=1
GROUP BY pr.cd_prod;
```

  gravar o `pr` de cada produto, build e push. O preço continua fora do dataLayer e da mensagem do WhatsApp; a vendedora fecha o valor na conversa.
- Cabeçalho: o selo ao lado do logo diz "COMPRE DIRETO DA FÁBRICA E IMPORTADORA" (antes "ATACADO"). O texto do topo passou a "A vendedora confirma estoque, prazo e frete pelo WhatsApp".

## Prévia do link (WhatsApp)

- `og-catalogo.jpg` (1200 x 630, na raiz) é a imagem que aparece quando o link é colado no WhatsApp: logo, selo "Compre direto da fábrica e importadora", cinco produtos e "Catálogo de atacado com preço". As tags `og:` ficam no começo do `src/template.html`.
- O endereço da imagem e o `og:url` apontam para catalogo.funforpets.com.br.
- O WhatsApp guarda a prévia de um endereço por um tempo. Se a imagem não aparecer num link que já foi enviado antes, acrescentar algo no fim do endereço antes do # (ex.: `.../catalogo/?v=2#ionara`) força uma prévia nova.

## Fotos no card

- Produto com mais de uma foto mostra setas dos dois lados da foto e um contador (1/3) no canto. A seta passa a foto sem abrir a ampliação. Arrastar o dedo para o lado na foto também passa. As miniaturas embaixo continuam.
- Na foto ampliada as setas também aparecem, e no computador as setas do teclado passam a foto.
- A lista de medição (`item_list_id`) ganhou `mais_vendidos` e `novidades`.

## Medição (GTM/GA4)

- Contêiner GTM-MXBCVCT5 instalado.
- Eventos: view_item_list, add_to_cart, remove_from_cart, view_cart, begin_checkout, form_error, copy_list, close_cart e generate_lead (a conversão). Nunca purchase, nunca preço, nunca CNPJ ou nome da loja no dataLayer.
- O protocolo (quote_id) liga a conversa da vendedora à origem do tráfego. A origem da primeira visita (gclid, utm etc.) fica guardada 90 dias no aparelho.
- Tudo detalhado em `TRACKING.md`, que foi feito para o gerente de tráfego configurar o GTM.
- Política de privacidade apontando para funforpets.com.br/politica-de-privacidade/.

## Pendências

1. **Domínio próprio: conferir o https.** Feito em 06/10/2026 (CNAME no Cloudflare e arquivo `CNAME` no repositório). Falta marcar "Enforce HTTPS" em Settings > Pages do repositório assim que o GitHub liberar o certificado. Cliente que já tinha lista salva no endereço antigo começa com a lista vazia no novo, porque o navegador guarda a lista por endereço.
2. **14256 Tapete de silicone para comedouros sem foto.** Em 06/10/2026 entraram no ar 64 dos 65 produtos novos da Its Pet, com as fotos da pasta "Fotos 2" (pendrive ADK), até 3 por produto, PNG de fundo transparente convertido para fundo branco. Só o 14256 ficou de fora porque não veio foto (e está com estoque zero). Quando a foto chegar: `python3 src/fotos_lote.py "/pasta" 14256`, build e push. As fotos dos novos são de fundo branco e várias mostram o mesmo item em cores diferentes; se forem cores sortidas, vale colocar "cores sortidas" no campo `x` para aparecer a etiqueta no card.
3. Ajustes de filtros e categorias que a Gerência Comercial ia passar.
4. Banner de cookies: o site não tem. Se entrar, ligar o Consent Mode já preparado no `analytics.js` (`consentDefault` e `consentGrant`).
5. Contato perdido: e-mail e WhatsApp digitados só vão para o Google e para o aparelho do cliente. Se ele preencher e não mandar a mensagem, a equipe não fica sabendo. Opção em aberto: mandar também para o RD Station.
6. Teste do funil no GTM Preview num celular de verdade, pelo gerente de tráfego.
7. Confirmar a política v1.3 (descontos e parcelamento) mostrada na gaveta "Descontos e condições".

## Como conferir os produtos contra o ERP

Conector Teia (banco erp-producao, connection_id 1). Importados próprios: `produto.cd_fabric IN ('ITS IM','FUNFOR')` e `ativo = 1`. Em 06/10/2026 eram 281 ativos: 216 no catálogo e os 65 do item 2 das pendências. Estoque na tabela `estoque` (campo `qtde`).
