"""Real-ESRGAN x4plus (ONNX, entrada fixa 128x128) em blocos sobrepostos com costura suave.
Mesmo método da Panifran (ver CLAUDE.md, "Imagens melhoradas com IA").

Modelo: Qualcomm AI Hub real_esrgan_x4plus-onnx-float, fora do Git, em
E:/Clientes/Barra Boat Floripa/Site/ferramentas/esrgan/ (ou na variável BB_ESRGAN).
"""
import glob
import os

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps

PASTA = os.environ.get('BB_ESRGAN', r'E:/Clientes/Barra Boat Floripa/Site/ferramentas/esrgan')
T, SOBRA = 128, 12               # bloco de entrada e sobreposição (px na entrada)
PASSO = T - 2 * SOBRA
_s = None


def modelo():
    achados = glob.glob(os.path.join(PASTA, '**', '*.onnx'), recursive=True)
    if not achados:
        raise SystemExit(f'Modelo não encontrado em {PASTA}. Baixe real_esrgan_x4plus-onnx-float do Qualcomm AI Hub.')
    return achados[0]


def sessao():
    global _s
    if _s is None:
        o = ort.SessionOptions()
        o.intra_op_num_threads = os.cpu_count() or 4
        _s = ort.InferenceSession(modelo(), o, providers=['CPUExecutionProvider'])
    return _s


def _rampa(n, s):
    w = np.ones(n, np.float32)
    r = np.linspace(0.05, 1, s, dtype=np.float32)
    w[:s] = r
    w[-s:] = r[::-1]
    return w


def melhora(im: Image.Image) -> Image.Image:
    """Devolve a imagem 4x maior."""
    im = ImageOps.exif_transpose(im).convert('RGB')
    a = np.asarray(im, np.float32) / 255.0
    h, w, _ = a.shape
    # borda espelhada para os blocos das pontas terem contexto
    ph = max(T, ((h - 2 * SOBRA + PASSO - 1) // PASSO) * PASSO + 2 * SOBRA)
    pw = max(T, ((w - 2 * SOBRA + PASSO - 1) // PASSO) * PASSO + 2 * SOBRA)
    a = np.pad(a, ((SOBRA, ph - h + SOBRA), (SOBRA, pw - w + SOBRA), (0, 0)), mode='reflect')
    H, W = a.shape[:2]
    out = np.zeros((H * 4, W * 4, 3), np.float32)
    peso = np.zeros((H * 4, W * 4, 1), np.float32)
    m = np.outer(_rampa(T * 4, SOBRA * 4), _rampa(T * 4, SOBRA * 4))[..., None]
    s = sessao()
    nome = s.get_inputs()[0].name
    for y in range(0, H - T + 1, PASSO):
        for x in range(0, W - T + 1, PASSO):
            bloco = a[y:y + T, x:x + T].transpose(2, 0, 1)[None]
            r = s.run(None, {nome: bloco})[0][0].transpose(1, 2, 0)
            out[y * 4:(y + T) * 4, x * 4:(x + T) * 4] += r * m
            peso[y * 4:(y + T) * 4, x * 4:(x + T) * 4] += m
    out = out / np.maximum(peso, 1e-6)
    S = SOBRA * 4
    out = out[S:S + h * 4, S:S + w * 4]
    return Image.fromarray((np.clip(out, 0, 1) * 255 + .5).astype(np.uint8))


def reduz(im: Image.Image, lado: int) -> Image.Image:
    if max(im.size) <= lado:
        return im
    f = lado / max(im.size)
    return im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
