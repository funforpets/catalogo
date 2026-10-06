# Camada de dados (dataLayer) do catálogo de atacado FunForPets

Site: catalogo.funforpets.com.br (hoje também em funforpets.github.io/catalogo)
Todo push no `window.dataLayer` sai do arquivo `analytics.js` (objeto `window.FFPAnalytics`). O `index.html` só chama essas funções nos pontos em que o estado muda.

## Regras atendidas

- `window.dataLayer = window.dataLayer || []` no `<head>`, antes do snippet do GTM.
- `{ ecommerce: null }` empurrado imediatamente antes de todo push que tem `ecommerce`.
- Não existe evento `purchase` no código.
- Nenhum evento tem `price`, `value` ou `currency`.
- CNPJ e nome da loja nunca entram no dataLayer (nem em texto, nem em hash). Eles só vão na mensagem do WhatsApp.
- O `user_data` vai normalizado, sem hash. O SHA-256 fica a cargo do GTM.
- Campo vazio ou inválido: a chave é omitida.

## Como ativar

1. Contêiner GTM-MXBCVCT5 instalado (`var GTM_ID` no `<head>` e o `<noscript>` logo depois do `<body>`). Se um dia precisar desligar, basta deixar `GTM_ID` vazio: o dataLayer continua sendo preenchido.
2. O link da política de privacidade fica em `CONFIG.PRIVACY_URL`. Hoje aponta para `https://funforpets.com.br/politica-de-privacidade/`.
3. O site não tem banner de cookies. Quando tiver, chamar `FFPAnalytics.consentDefault()` antes do GTM e `FFPAnalytics.consentGrant()` no aceite (Consent Mode v2: `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`).

## Objeto item

| parâmetro | tipo | origem | exemplo |
|---|---|---|---|
| item_id | string | código do card ("Cód.") | "13471" |
| item_name | string | nome do produto | "Pelúcia elefante porta-petisco 30 cm" |
| item_brand | string | selo do card | "FunForPets", "Its Pet", "It's Natural", "Mordidinhas" |
| item_category | string | seção | "Importados" ou "Indústria" |
| item_category2 | string | categoria | "Brinquedos" |
| item_category3 | string | pet | "Cães", "Gatos", "Cães e gatos" |
| quantity | number | quantidade (não vai no view_item_list) | 3 |
| index | number | posição base 0 na lista exibida (no drawer: posição na cotação) | 7 |
| item_list_id | string | recorte atual (só em view_item_list e nos adds feitos na grade) | "catalogo_geral" |
| item_list_name | string | nome do recorte | "Catálogo Geral" |

### item_list_id / item_list_name

| situação | item_list_id | item_list_name |
|---|---|---|
| sem filtro | catalogo_geral | Catálogo Geral |
| categoria | brinquedos, its_natural, mordidinhas_naturais... | Brinquedos, It's Natural... |
| só seção | importados / industria | Importados / Indústria |
| pet | caes / gatos | Cães / Gatos |
| marca | its_pet / funforpets | Its Pet / FunForPets |
| busca | busca | Busca |
| combinação | partes unidas por `__` | partes unidas por ` · ` |

Exemplo de combinação: gatos + brinquedos vira `brinquedos__gatos` / `Brinquedos · Gatos`.

## Eventos

| nome do evento | gatilho exato | parâmetros | tipo | exemplo de valor |
|---|---|---|---|---|
| view_item_list | O 1º card do lote fica 30% visível (IntersectionObserver). Uma vez por recorte. Dispara de novo ao trocar filtro, categoria ou busca, e a cada "Ver mais" (lote seguinte). Na busca, espera 1 s sem digitação. | ecommerce.item_list_id | string | "brinquedos" |
| | | ecommerce.item_list_name | string | "Brinquedos" |
| | | ecommerce.items[] (até 30, sem quantity) | array | 24 itens, index 0 a 23 (no "Ver mais", 24 a 47) |
| add_to_cart | Clique em "Adicionar à cotação" no card ou na foto ampliada | ecommerce.items[0] com quantity 1 e a lista atual | array | [{item_id:"13471", quantity:1, index:0, item_list_id:"catalogo_geral", ...}] |
| add_to_cart | "+" do seletor de quantidade, 800 ms depois do último toque, com o saldo líquido positivo | interaction_source | string | "minicheckout_stepper" (drawer), "card_stepper" (card), "zoom_stepper" (foto ampliada) |
| | | ecommerce.items[0].quantity = saldo | number | 2 |
| add_to_cart | Número digitado no campo de quantidade (saldo positivo) | interaction_source | string | "minicheckout_input", "card_input", "zoom_input" |
| remove_from_cart | Igual aos dois acima, com saldo negativo (quantity vai positiva) | interaction_source, ecommerce.items | string, array | "minicheckout_stepper", quantity 1 |
| remove_from_cart | Segundo toque em "Esvaziar lista" (o primeiro pede confirmação) | removal_method | string | "esvaziar_lista" |
| | | ecommerce.items[] com as quantidades atuais | array | todos os itens |
| view_cart | Abertura do drawer "Sua cotação" (toda vez que abre) | quote_items_count | number | 3 |
| | | quote_total_units | number | 12 |
| | | ecommerce.items[] | array | todos os itens |
| begin_checkout | Primeiro foco em um campo de "Dados da loja", ou clique em "Enviar cotação" (para quem volta com o formulário já preenchido), o que vier primeiro. Uma vez por abertura do drawer. | quote_items_count, quote_total_units, ecommerce.items[] | number, number, array | 3, 12, [...] |
| form_error | Clique em "Enviar cotação pelo WhatsApp" barrado pela validação | form_name | string | "solicitacao_orcamento" |
| | | error_fields | array de string | ["cnpj","email"]. Valores possíveis: loja, cnpj, email, whatsapp, vendedora, itens |
| | | error_count | number | 2 |
| copy_list | Clique em "Copiar lista" | quote_items_count, quote_total_units, ecommerce.items[] | number, number, array | 3, 12, [...] |
| close_cart | Fechamento do drawer "Sua cotação" | close_method | string | "continuar_escolhendo", "botao_x", "fundo_escuro" (toque fora), "tecla_esc" |
| | | quote_items_count, quote_total_units | number | 3, 12 |
| | | reached_form | boolean | true se o begin_checkout já disparou nessa abertura |
| generate_lead | Celular: clique válido em "Enviar cotação pelo WhatsApp". Computador: clique numa das opções da janela "Onde você usa o WhatsApp" (WhatsApp Web, aplicativo ou copiar). Push síncrono, antes de abrir o WhatsApp, uma vez por protocolo. | lead_method | string | "whatsapp" |
| | | whatsapp_target | string | "celular", "web", "app_computador", "copiar" |
| | | lead_type | string | "cotacao_atacado" |
| | | quote_id | string | "FFP-8F3A2C" |
| | | quote_items_count, quote_total_units | number | 3, 12 |
| | | store_city (se preenchido) | string | "Curitiba" |
| | | store_state (se preenchido) | string | "PR" |
| | | user_data.email_address | string | "compras@petshop.com.br" |
| | | user_data.phone_number | string (E.164) | "+5541999998888" |
| | | user_data.address.first_name | string | "joao" |
| | | user_data.address.last_name | string | "silva" |
| | | attribution.* (só as chaves que existem) | object | {gclid, gbraid, wbraid, fbclid, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page, referrer, first_visit_at} |
| | | ecommerce.items[] | array | todos os itens |

## Detalhes de comportamento

- **Debounce do stepper:** cada produto e origem tem seu próprio relógio de 800 ms. "+ + + −" vira um `add_to_cart` com quantity 2. "+ −" não dispara nada. Se o cliente abrir o drawer, copiar, enviar ou esvaziar antes dos 800 ms, o saldo pendente é enviado antes.
- **Computador:** o link wa.me no computador passa por uma página do WhatsApp e, em alguns casos, o aplicativo abre "encaminhar para" em vez da conversa. Por isso, no computador o botão de envio abre uma janela com três opções: WhatsApp Web (web.whatsapp.com/send), aplicativo (whatsapp://send) ou copiar a mensagem com o número da vendedora à vista. O `generate_lead` sai na primeira opção escolhida. Quem clica em "Voltar" não gera lead.
- **Toque duplo no envio:** um segundo clique com a mesma lista em menos de 2 s é ignorado (não abre o WhatsApp de novo, não gera outro lead).
- **Reenvio:** se o cliente enviar de novo a mesma lista com os mesmos dados (ex.: voltou porque não mandou a mensagem), sai outro `generate_lead` com o mesmo `quote_id`. Para não contar conversão em dobro, mapeie `quote_id` como ID de transação/deduplicação na tag de conversão do Google Ads.
- **Telefone:** aceita (51) 99764-8812, 51997648812, 051 99764-8812, +55 51 99764-8812, 5551997648812. Todos viram +5551997648812. Fixo com 10 dígitos também vale (+555137121234).
- **Nome:** "Seu nome" não é obrigatório. Sem nome, `address` é omitido.

## Protocolo (quote_id)

- Formato `FFP-` + 6 caracteres maiúsculos (letras e números, sem 0/O/1/I para não confundir na leitura).
- Vai no `generate_lead`, na primeira linha da mensagem do WhatsApp (`Protocolo: FFP-8F3A2C`) e no localStorage.

## localStorage

| chave | conteúdo |
|---|---|
| ffp_attribution | atribuição da primeira visita. Não é sobrescrita por 90 dias. |
| ffp_quotes | últimas 20 cotações enviadas: quote_id, data, itens (código e quantidade) e atribuição. Sem CNPJ. |
| ffp-cot | lista atual (código: quantidade) |
| ffp-loja | campos do formulário, para pré-preencher na próxima visita |
| ffp-vend | vendedora que veio pelo link (#ionara / #camila) |

## Ordem esperada no GTM Preview

view_item_list > add_to_cart > view_cart > begin_checkout > generate_lead

## Validação feita (Chrome headless, tela de celular 375 px)

- [x] Funil na ordem acima
- [x] "+ + + −" rápido gera 1 evento; "+ −" não gera nada
- [x] `ecommerce: null` antes de cada push com ecommerce
- [x] `generate_lead` já está no dataLayer no momento em que o link do WhatsApp é aberto
- [x] quote_items_count e quote_total_units iguais ao texto do drawer
- [x] Telefone em E.164 em todos os formatos acima
- [x] Nenhum CNPJ nem nome da loja no dataLayer
- [x] Nenhum `purchase`, `price`, `value` ou `currency`
- [ ] Teste em celular real com GTM Preview (precisa do ID do contêiner)

## Observação sobre o "listener genérico de clique"

Os botões do catálogo são criados dinamicamente, então a página usa um único listener de clique para a interface (abrir, somar, filtrar). A medição não depende dele: cada evento é uma chamada explícita ao `FFPAnalytics` dentro da função que muda o estado, e nenhum push é feito a partir de clique genérico ou de `onclick` inline.
