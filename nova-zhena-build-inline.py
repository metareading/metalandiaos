#!/usr/bin/env python3
"""Build self-contained (data-URI) variants of the Нова Жена pages (V1 · V2 · V2.1 · img/nz + img/nz2 + img/nz3).
usage: python3 nova-zhena-build-inline.py nova-zhena-v1a.html [nova-zhena-v1b.html ...]
→ writes <name>.inline.html next to the source (all img/nz/* refs embedded as base64)."""
import re,base64,pathlib,sys,mimetypes
root=pathlib.Path(__file__).parent
for src in sys.argv[1:]:
    p=root/src; s=p.read_text(encoding="utf-8"); n=0; size=0
    def rep(m):
        global n,size
        f=root/m.group(2)
        if not f.exists(): print("MISSING",m.group(2)); return m.group(0)
        b=f.read_bytes(); size+=len(b); n+=1
        mime=mimetypes.guess_type(f.name)[0] or "image/webp"
        return f'{m.group(1)}data:{mime};base64,{base64.b64encode(b).decode()}{m.group(3)}'
    out=re.sub(r'(src=\"|srcset=\"|url\()(img/nz[0-9]?/[^\"\)]+)(\"|\))',rep,s)
    o=p.with_suffix(".inline.html"); o.write_text(out,encoding="utf-8")
    print(f"{o.name}: {n} images embedded ({size//1024}KB raw) → {o.stat().st_size//1024}KB")
