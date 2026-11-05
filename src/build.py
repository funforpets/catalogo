"""Monta o index.html do catálogo.

Uso (na raiz do repositório):  python3 src/build.py
Lê src/template.html e src/products.json, troca o marcador __DATA__ pela lista
de produtos e grava index.html na raiz. Também grava cotacao.html (página
interna da vendedora) a partir de src/cotacao-template.html. Depois é só fazer commit e push.

Campos de cada produto em products.json:
  s    SKU (texto)                       "13471"
  n    nome exibido no card              "Pelúcia elefante porta-petisco 30 cm"
  l    linha: its | ffp | nat | mor      (Its Pet, FunForPets, It's Natural, Mordidinhas)
  p    pet: cao | gato | ambos | roedor
  c    categoria (tem que existir em GROUPS no template)
  x    texto extra usado na busca; se tiver "sortid" ou "acompanha", vira etiqueta no card
  g    quantas fotos tem a galeria (1 a 4). Sem g = 1 foto
  grp  imp (Importados) | ind (Indústria)
  cx   unidades por caixa (só Mordidinhas; mostra "Caixa com N")
  mv   posição no ranking dos 50 mais vendidos (1 a 50). Filtro "Mais vendidos"
  nov  1 = novidade (cadastro recente no ERP). Filtro "Novidades"
  pr   preço de tabela exibido no card (TBRPF; no It's Natural, TBRFP2 sem ST)
  pt   só It's Natural: preço da TBRPF (com ST), usado no valor de tabela da
       mensagem quando a loja não é de SC nem de RO
  ipi  alíquota de IPI do produto em % (ex.: 9.75), do cadastro do ERP (produto.aliq_ipi).
       Só nos importados que pagam IPI; sem o campo = sem IPI. Desde nov/2026 o IPI
       sai destacado na nota, por cima do preço de tabela, calculado sobre o preço de
       tabela (sem o desconto), linha a linha, arredondado em 2 casas.

Produto sem foto principal em img/ (img/SKU.jpg) fica FORA do index.html até a
foto chegar. Assim dá para deixar o produto cadastrado no json antes das fotos.
"""
import json, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
t = (raiz / "src" / "template.html").read_text(encoding="utf-8")
d = json.loads((raiz / "src" / "products.json").read_text(encoding="utf-8"))
skus = [p["s"] for p in d]
assert len(skus) == len(set(skus)), "SKU repetido em products.json"
falta = [s for s in skus if not (raiz / "img" / f"{s}.jpg").exists()]
if falta:
    print(f"ATENÇÃO, {len(falta)} produto(s) sem foto em img/ ficaram fora do site:", ", ".join(falta))
d = [p for p in d if p["s"] not in falta]
(raiz / "index.html").write_text(t.replace("__DATA__", json.dumps(d, ensure_ascii=False, separators=(",", ":"))), encoding="utf-8")
print(f"index.html gerado com {len(d)} produtos ({sum(1 for p in d if p.get('mv'))} mais vendidos, {sum(1 for p in d if p.get('nov'))} novidades)")

# Página interna de cotação (cotacao.html): todos os produtos do json, com ou sem foto,
# só com os campos que a conta usa. Ver src/cotacao-template.html.
tc = (raiz / "src" / "cotacao-template.html").read_text(encoding="utf-8")
dc = [{k: p[k] for k in ("s", "n", "l", "grp", "pr", "pt", "ipi") if k in p} for p in json.loads((raiz / "src" / "products.json").read_text(encoding="utf-8"))]
(raiz / "cotacao.html").write_text(tc.replace("__DATA__", json.dumps(dc, ensure_ascii=False, separators=(",", ":"))), encoding="utf-8")
print(f"cotacao.html gerado com {len(dc)} produtos")
