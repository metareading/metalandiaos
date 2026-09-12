#!/usr/bin/env bash
# nova-zhena-tests/static-checks.sh · v0.1 · 12.09.2026 · доер Б · пуска се от където и да е
set -u; cd "$(dirname "$0")/.." || exit 1
echo "== оферта (0 = ок) =="; grep -c 'оферта' nova-zhena-v2.html nova-zhena-seam.js nova-zhena-цени.json nova-zhena-seam-патч.md nova-zhena-видео-карта.md 2>/dev/null
echo "== v2: SEAM-маркер $(grep -c 'SEAM v2: Yespo segment' nova-zhena-v2.html) · iframe $(grep -c '<iframe' nova-zhena-v2.html) · shell-хендлър $(grep -c 'V2 shell · SEAM v2 Yespo' nova-zhena-v2.html) =="
node -e "new Function(require('fs').readFileSync('nova-zhena-seam.js','utf8'));console.log('== seam.js parse OK')"
python3 -c "import json;d=json.load(open('nova-zhena-цени.json'));print('== цени.json valid ·',d['препоръка']['пълна_цена'],'€ · капаро',d['препоръка']['капаро'])"
python3 nova-zhena-seam-патч.py nova-zhena-v2.html nova-zhena-tests/_seam-preview.html --img-prefix ../
echo "== preview: seam $(grep -c 'nova-zhena-seam.js v0.1' nova-zhena-tests/_seam-preview.html) · shell махнат $(grep -c 'form shell премахнат' nova-zhena-tests/_seam-preview.html) · стар shell $(grep -c 'V2 shell · SEAM v2 Yespo' nova-zhena-tests/_seam-preview.html) =="
echo "== размери =="; ls -la nova-zhena-v2.html nova-zhena-seam.js nova-zhena-цени.json nova-zhena-tests/_seam-preview.html 2>/dev/null | awk '{printf "%9d %s\n",$5,$9}'
echo "== v2 непипнат от доер Б: $(git status --short nova-zhena-v2.html | wc -l | tr -d ' ') променени реда в git status (0 = ок) =="
