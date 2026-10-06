# Catálogo de cotação FunForPets: contexto para continuar o trabalho

Atualizado em 06/10/2026. Este arquivo existe para que uma conversa nova com o Claude retome o catálogo sem precisar reconstruir o histórico. Ele também fica no projeto Expansão Indústria (claude/Catalogo-Cotacao-Contexto.md) e na pasta Comunicacao/Catalogo Cotacao.

## O que é

Site de catálogo de atacado, feito para o celular, com os importados (Its Pet e FunForPets) e a indústria (It's Natural e Mordidinhas Naturais). Não mostra preço. O lojista busca e filtra, adiciona produtos "à cotação", preenche os dados da loja e envia a lista pronta para o WhatsApp da vendedora. Substitui o flipbook do FlipHTML5 e foi pensado para tirar atrito do pedido. O visual segue a landing page de atacado (euamo.funforpets.com.br/revenda-atacado-produtos-pets-funforpets).

- No ar: funforpets.github.io/catalogo
- Domínio definitivo (pendente, ver abaixo): catalogo.funforpets.com.br
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
- `src/products.json`: os 237 produtos (216 importados, 11 It's Natural, 10 Mordidinhas). Os campos estão explicados no topo de `src/build.py`.
- `python3 src/build.py` gera o `index.html` da raiz. Nunca editar o `index.html` direto, sempre o template ou o json e rodar o build.
- `analytics.js`: único arquivo que escreve no dataLayer (GTM/GA4). Documentação dos eventos em `TRACKING.md`.
- `img/SKU.jpg` é a foto principal (640x640), `img/SKU-2.jpg` a `-4.jpg` são a galeria e `img/t/SKU-k.jpg` as miniaturas (110x110). `python3 src/fotos.py SKU foto1 foto2...` prepara tudo a partir das fotos originais.
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

## Medição (GTM/GA4)

- Contêiner GTM-MXBCVCT5 instalado.
- Eventos: view_item_list, add_to_cart, remove_from_cart, view_cart, begin_checkout, form_error, copy_list, close_cart e generate_lead (a conversão). Nunca purchase, nunca preço, nunca CNPJ ou nome da loja no dataLayer.
- O protocolo (quote_id) liga a conversa da vendedora à origem do tráfego. A origem da primeira visita (gclid, utm etc.) fica guardada 90 dias no aparelho.
- Tudo detalhado em `TRACKING.md`, que foi feito para o gerente de tráfego configurar o GTM.
- Política de privacidade apontando para funforpets.com.br/politica-de-privacidade/.

## Pendências

1. **Domínio próprio.** Falta criar no Cloudflare um CNAME `catalogo` apontando para `funforpets.github.io`, com a nuvem cinza (DNS only). Depois disso o Claude coloca o domínio no repositório (arquivo CNAME ou Settings > Pages) e confere o https. Não configurar o domínio no GitHub antes do DNS existir, senão o site cai. Fazer isso antes de as vendedoras espalharem os links: o endereço antigo redireciona sozinho, mas a lista salva no aparelho do cliente não passa de um endereço para o outro.
2. **65 produtos novos da Its Pet sem foto.** Cadastrados no ERP entre 01/07 e 31/08/2026, ativos e quase todos com estoque (o 14256 está com estoque zero). A lista com categoria e pet sugeridos está em `src/produtos-faltando-2026-10-06.csv`. Não há fotos deles na pasta Fotos. Assim que as fotos chegarem: rodar `src/fotos.py` para cada SKU, incluir os produtos no `src/products.json` com nome amigável, rodar o build e publicar. Três são bebedouros para roedores, e o filtro de pet hoje só tem cães e gatos.
3. Ajustes de filtros e categorias que a Gerência Comercial ia passar.
4. Banner de cookies: o site não tem. Se entrar, ligar o Consent Mode já preparado no `analytics.js` (`consentDefault` e `consentGrant`).
5. Contato perdido: e-mail e WhatsApp digitados só vão para o Google e para o aparelho do cliente. Se ele preencher e não mandar a mensagem, a equipe não fica sabendo. Opção em aberto: mandar também para o RD Station.
6. Teste do funil no GTM Preview num celular de verdade, pelo gerente de tráfego.
7. Confirmar a política v1.3 (descontos e parcelamento) mostrada na gaveta "Descontos e condições".

## Como conferir os produtos contra o ERP

Conector Teia (banco erp-producao, connection_id 1). Importados próprios: `produto.cd_fabric IN ('ITS IM','FUNFOR')` e `ativo = 1`. Em 06/10/2026 eram 281 ativos: 216 no catálogo e os 65 do item 2 das pendências. Estoque na tabela `estoque` (campo `qtde`).
