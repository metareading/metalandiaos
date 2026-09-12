#!/usr/bin/env python3
"""Nano-Banana-Pro (gemini-3-pro-image) generator · Нова Жена V2 · класическа красота + съвременен дизайн.
usage: python3 gen.py <name> <aspect 3:4|4:3|16:9|1:1|9:16> <size 1K|2K> "<prompt>"
→ writes img/nz2/<name>.webp (crop of paper margins + webp q82). Key: GEMINI_API_KEY from root .env."""
import sys, os, json, base64, io, time, urllib.request, pathlib, re
root = pathlib.Path('/Users/user/Metalandia'); out = pathlib.Path('/Users/user/metalandiaos/img/nz2')
env = (root/'.env').read_text()
key = re.search(r'^GEMINI_API_KEY=["\']?([^"\'\n]+)', env, re.M).group(1)
name, aspect, size, prompt = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
ref = sys.argv[5] if len(sys.argv) > 5 else None
STYLE = ("Fine-art realism with classical beauty in the light of old masters (Vermeer, Sorolla): soft timeless light, elegant, calm, dignified, quietly luminous. "
         "Contemporary editorial composition, modern natural clothing (linen, wool, simple silhouettes), "
         "Pirin mountains of Bulgaria in September. Warm palette of ochre-amber #E8C77E, emerald spark #6FB59A, "
         "warm fire #D4895E, soft ivory #F0EBE0, deep shadow violet #5A4A6B. Subtle golden particle light. "
         "No text, no letters, no watermark, no folk costume, no medieval interiors, no religious symbols, "
         "not cartoon, not storybook, not fantasy armor. Photographic realism of faces with painterly light.")
parts = []
if ref:
    rb = pathlib.Path(ref).read_bytes(); parts.append({"inlineData":{"mimeType":"image/webp","data":base64.b64encode(rb).decode()}})
    prompt = "Use the woman in the reference image as the SAME heroine (same face, chestnut hair, natural, mid-30s). " + prompt
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
# crop paper margins: trim near-uniform border rows/cols (tolerance)
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
