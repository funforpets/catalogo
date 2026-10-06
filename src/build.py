"""Monta o index.html do catálogo.

Uso (na raiz do repositório):  python3 src/build.py
Lê src/template.html e src/products.json, troca o marcador __DATA__ pela lista
de produtos e grava index.html na raiz. Depois é só fazer commit e push.

Campos de cada produto em products.json:
  s    SKU (texto)                       "13471"
  n    nome exibido no card              "Pelúcia elefante porta-petisco 30 cm"
  l    linha: its | ffp | nat | mor      (Its Pet, FunForPets, It's Natural, Mordidinhas)
  p    pet: cao | gato | ambos
  c    categoria (tem que existir em GROUPS no template)
  x    texto extra usado na busca; se tiver "sortid" ou "acompanha", vira etiqueta no card
  g    quantas fotos tem a galeria (1 a 4). Sem g = 1 foto
  grp  imp (Importados) | ind (Indústria)
  cx   unidades por caixa (só Mordidinhas; mostra "Caixa com N")
"""
import json, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
t = (raiz / "src" / "template.html").read_text(encoding="utf-8")
d = json.loads((raiz / "src" / "products.json").read_text(encoding="utf-8"))
skus = [p["s"] for p in d]
assert len(skus) == len(set(skus)), "SKU repetido em products.json"
falta = [s for s in skus if not (raiz / "img" / f"{s}.jpg").exists()]
if falta:
    print("ATENÇÃO, produtos sem foto em img/:", ", ".join(falta))
(raiz / "index.html").write_text(t.replace("__DATA__", json.dumps(d, ensure_ascii=False, separators=(",", ":"))), encoding="utf-8")
print(f"index.html gerado com {len(d)} produtos")
