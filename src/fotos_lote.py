"""Prepara de uma vez as fotos dos produtos que estão no products.json sem foto.

Uso (na raiz do repositório):
    python3 src/fotos_lote.py "/caminho/da/pasta/Fotos"            # todos os que faltam
    python3 src/fotos_lote.py "/caminho/da/pasta/Fotos" 14378 14379 # só esses SKUs

Procura na pasta os arquivos cujo nome começa pelo SKU (14378.png, 14378_1.jpg,
14378 (2).jpg, 14378-3.png...). A foto sem número (14378.png) ou a de número 1 vira
a principal; as seguintes entram na galeria, no máximo 3 por produto. Grava em img/
e img/t/ (mesmo tratamento do fotos.py) e acerta o campo "g" no products.json.
Depois é só rodar python3 src/build.py e publicar.
"""
import sys, re, json, pathlib
from PIL import Image
raiz = pathlib.Path(__file__).resolve().parent.parent
pasta = pathlib.Path(sys.argv[1])
MAX = 3
prods = json.loads((raiz / "src" / "products.json").read_text(encoding="utf-8"))
alvo = sys.argv[2:] or [p["s"] for p in prods if not (raiz / "img" / f"{p['s']}.jpg").exists()]
EXT = {".jpg", ".jpeg", ".png", ".webp"}
arquivos = [f for f in pasta.iterdir() if f.is_file() and f.suffix.lower() in EXT]

def ordem(f, sku):
    resto = f.stem[len(sku):]
    n = re.findall(r"\d+", resto)
    return (int(n[0]) if n else 0, f.suffix.lower() != ".png", f.name)

def quadrado(im, lado):
    if im.mode in ("RGBA", "LA", "P"):  # PNG com fundo transparente vai para fundo branco
        im = im.convert("RGBA"); branco = Image.new("RGBA", im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(branco, im)
    im = im.convert("RGB"); im.thumbnail((lado, lado), Image.LANCZOS)
    fundo = Image.new("RGB", (lado, lado), (255, 255, 255))
    fundo.paste(im, ((lado - im.width) // 2, (lado - im.height) // 2)); return fundo

(raiz / "img" / "t").mkdir(parents=True, exist_ok=True)
achou, sem = 0, []
by = {p["s"]: p for p in prods}
for sku in alvo:
    fs = sorted([f for f in arquivos if re.match(rf"^{sku}(?!\d)", f.name)], key=lambda f: ordem(f, sku))[:MAX]
    if not fs:
        sem.append(sku); continue
    for k, f in enumerate(fs, 1):
        im = Image.open(f)
        nome = f"{sku}.jpg" if k == 1 else f"{sku}-{k}.jpg"
        quadrado(im, 640).save(raiz / "img" / nome, quality=82, optimize=True, progressive=True)
        quadrado(im, 110).save(raiz / "img" / "t" / f"{sku}-{k}.jpg", quality=78, optimize=True)
    if sku in by:
        if len(fs) > 1: by[sku]["g"] = len(fs)
        else: by[sku].pop("g", None)
    achou += 1
    print(f"{sku}: {len(fs)} foto(s) -> " + " | ".join(f.name for f in fs))
(raiz / "src" / "products.json").write_text("[\n" + ",\n".join(json.dumps(p, ensure_ascii=False) for p in prods) + "\n]\n", encoding="utf-8")
print(f"\n{achou} produto(s) com foto preparada.")
if sem: print(f"{len(sem)} sem foto na pasta:", ", ".join(sem))
