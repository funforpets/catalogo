"""Prepara as fotos de um produto para o catálogo.

Uso:  python3 src/fotos.py 14410 "Fotos/14410 (1).jpg" "Fotos/14410 (2).jpg" ...
A primeira foto vira a principal (img/14410.jpg); as seguintes viram 14410-2.jpg,
14410-3.jpg e 14410-4.jpg (máximo 4). Cada foto é centralizada num quadrado
branco de 640 px, e as miniaturas de 110 px vão para img/t/14410-1.jpg etc.
Depois ajuste "g" (número de fotos) do produto em src/products.json.
Preferência: foto ilustrada (feita para a Shopee) como principal nos importados;
fundo branco na indústria.
"""
import sys, pathlib
from PIL import Image
raiz = pathlib.Path(__file__).resolve().parent.parent
sku, fontes = sys.argv[1], sys.argv[2:6]
(raiz / "img" / "t").mkdir(parents=True, exist_ok=True)
def quadrado(im, lado):
    im = im.convert("RGB"); im.thumbnail((lado, lado), Image.LANCZOS)
    fundo = Image.new("RGB", (lado, lado), (255, 255, 255))
    fundo.paste(im, ((lado - im.width) // 2, (lado - im.height) // 2)); return fundo
for k, f in enumerate(fontes, 1):
    im = Image.open(f)
    nome = f"{sku}.jpg" if k == 1 else f"{sku}-{k}.jpg"
    quadrado(im, 640).save(raiz / "img" / nome, quality=82, optimize=True, progressive=True)
    quadrado(im, 110).save(raiz / "img" / "t" / f"{sku}-{k}.jpg", quality=78, optimize=True)
print(f"{sku}: {len(fontes)} foto(s). Coloque \"g\": {len(fontes)} no products.json se for mais de 1.")
