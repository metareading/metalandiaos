#!/usr/bin/env python3
"""Nano-Banana-Pro (gemini-3-pro-image) generator · Нова Жена · V2 (nz2) → V2.1 (nz3 · класическо изкуство + тънък слой приказност).
usage: NZ_OUT=img/nz3 NZ_STYLE=A python3 nova-zhena-gen-images.py <name> <aspect 3:4|4:3|16:9|1:1|9:16> <size 1K|2K> "<prompt>" [reference.webp]
→ writes $NZ_OUT/<name>.webp (crop of paper margins + webp q82). Key: GEMINI_API_KEY from root .env.
NZ_STYLE: V2 (default · класическа красота + съвременен дизайн · nz2) | A (Vermeer · тиха светлина) | B (Sorolla · слънце и вятър) | C (Waterhouse · приказна композиция)
Думата на Митрандир 12.09 (след V2): „класическо изкуство и тънък слой приказност … отвъд времето" — не фото/product image (V2), не средновековно/folk (V1)."""
import sys, os, json, base64, io, time, urllib.request, pathlib, re
root = pathlib.Path('/Users/user/Metalandia'); home = pathlib.Path('/Users/user/metalandiaos')
out = home / os.environ.get('NZ_OUT', 'img/nz2')
env = (root/'.env').read_text()
key = re.search(r'^GEMINI_API_KEY=["\']?([^"\'\n]+)', env, re.M).group(1)
name, aspect, size, prompt = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
ref = sys.argv[5] if len(sys.argv) > 5 else None
PALETTE = ("Warm palette of ochre-amber #E8C77E, emerald spark #6FB59A, warm fire #D4895E, soft ivory #F0EBE0, deep shadow violet #5A4A6B. ")
NEG = ("No text, no letters, no watermark, no signature. No period costume, no medieval interiors, no folk costume, no embroidery, "
       "no religious symbols, no halo, no candles as ritual. Not photographic, not a photo, not cartoon, not storybook, not fantasy armor, not anime. ")
STYLES = {
  'V2': ("Fine-art realism with classical beauty in the light of old masters (Vermeer, Sorolla): soft timeless light, elegant, calm, dignified, quietly luminous. "
         "Contemporary editorial composition, modern natural clothing (linen, wool, simple silhouettes), Pirin mountains of Bulgaria in September. "
         + PALETTE + "Subtle golden particle light. " + NEG + "Photographic realism of faces with painterly light."),
  'A':  ("Classical fine-art OIL PAINTING in the manner of the old masters — Vermeer's quiet north light and Hammershøi's stillness: "
         "timeless, restrained, luminous glazes, fine visible brushwork, soft edges, deep calm shadows. Contemporary natural clothing (plain linen, wool, simple silhouettes) rendered as painting, "
         "no period dress. A THIN layer of fairy-tale: one single golden thread of light and one small spark, nothing more. Pirin mountains of Bulgaria in September when outdoors. "
         + PALETTE + NEG + "Museum oil painting on canvas, timeless."),
  'B':  ("Classical fine-art OIL PAINTING in the manner of Sorolla and Sargent — plein-air sunlight, confident loose brushstrokes, wind in linen, "
         "luminous air, warm September light of the Pirin mountains of Bulgaria. Contemporary natural clothing rendered as painting, no period dress. "
         "A THIN layer of fairy-tale: golden dust motes drifting in the light and soft mist in the valley, one small spark. "
         + PALETTE + NEG + "Museum oil painting on canvas, timeless."),
  'C':  ("Classical fine-art OIL PAINTING with the narrative composition of Waterhouse and Leighton — poised figure, rich but warm tones, "
         "water, forest and mountain of Pirin (Bulgaria) as the stage, soft mist, painterly glazes, dignified timeless mood. "
         "IMPORTANT: contemporary natural clothing (linen dress, wool cardigan, simple modern silhouette) rendered as painting — no period costume, no medieval gowns, no draperies of antiquity. "
         "A THIN layer of fairy-tale: one golden thread of light, one spark, soft mist. "
         + PALETTE + NEG + "Museum oil painting on canvas, timeless."),
}
STYLE = STYLES[os.environ.get('NZ_STYLE', 'V2')]
parts = []
if ref:
    rb = pathlib.Path(ref).read_bytes(); parts.append({"inlineData":{"mimeType":"image/webp","data":base64.b64encode(rb).decode()}})
    prompt = "Use the woman in the reference image as the SAME heroine (same face, chestnut hair, natural, mid-30s) — but render her in the painting style described. " + prompt
parts.append({"text": prompt + " " + STYLE})
body = {"contents":[{"parts":parts}],
        "generationConfig":{"responseModalities":["IMAGE"],"imageConfig":{"aspectRatio":aspect,"imageSize":size}}}
url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent"
req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type":"application/json","x-goog-api-key":key})
t0 = time.time()
for attempt in range(3):
    try:
        r = json.load(urllib.request.urlopen(req, timeout=180)); break
    except Exception as e:
        print("retry", attempt, e); time.sleep(4)
else:
    sys.exit("FAILED " + name)
parts = r["candidates"][0]["content"]["parts"]
b64 = next(p["inlineData"]["data"] for p in parts if "inlineData" in p)
from PIL import Image, ImageChops
im = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
def trim(im):
    bg = Image.new("RGB", im.size, im.getpixel((2,2)))
    diff = ImageChops.difference(im, bg).convert("L").point(lambda v: 255 if v > 28 else 0)
    bbox = diff.getbbox()
    if bbox and (bbox[2]-bbox[0]) > im.width*0.6 and (bbox[3]-bbox[1]) > im.height*0.6: return im.crop(bbox)
    return im
im = trim(im)
maxw = 1600 if size == "2K" else 1200
if im.width > maxw: im = im.resize((maxw, round(im.height*maxw/im.width)), Image.LANCZOS)
out.mkdir(parents=True, exist_ok=True)
p = out/f"{name}.webp"; im.save(p, "WEBP", quality=82, method=6)
print(f"{p.name} {im.width}x{im.height} {p.stat().st_size//1024}KB {time.time()-t0:.1f}s")
