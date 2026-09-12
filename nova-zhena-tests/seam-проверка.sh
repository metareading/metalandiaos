#!/usr/bin/env bash
# nova-zhena-tests/seam-проверка.sh <email> · v0.1 · 12.09.2026 · доер Б
# Сървърна следа на един submit: n8n execution (поток New-Woman Form) · Yespo контакт по имейл + групи. Само GET. Ключовете от root .env — не се печатат.
set -u; E="${1:?email}"; R="$(cd /Users/user/Metalandia 2>/dev/null && git rev-parse --show-toplevel)"; set -a; . "$R/.env"; set +a
H=https://primary-production-110e3.up.railway.app; WF=0JrVWUkR6YWtv8UMp_8c9
echo "== n8n · последни 3 изпълнения на New-Woman Form =="
curl -s --max-time 25 -H "X-N8N-API-KEY: $N8N_API_KEY" "$H/api/v1/executions?workflowId=$WF&limit=3" | python3 -c "import json,sys; d=json.load(sys.stdin); [print(' ',x.get('id'),x.get('status'),x.get('startedAt'),'→',x.get('stoppedAt')) for x in d.get('data',[])]"
echo "== Yespo · контакт по имейл =="
python3 - "$E" <<'PY'
import json,sys,urllib.parse,subprocess,os
e=sys.argv[1]; key=os.environ['YESPO_API_KEY']
u='https://esputnik.com/api/v1/contacts?email='+urllib.parse.quote(e)
out=subprocess.run(['curl','-s','--max-time','25','-u','any:'+key,'-H','Accept: application/json',u],capture_output=True,text=True).stdout
try: d=json.loads(out)
except Exception: print('  parse fail:',out[:200]); sys.exit(1)
if not d: print('  НЯМА контакт с този имейл'); sys.exit(0)
for c in d:
    print('  id',c.get('id'),'·',c.get('firstName'),'·',[ch.get('type')+':'+ch.get('value','')[:6]+'…' for ch in c.get('channels',[])],'· групи:',[g.get('name') for g in c.get('groups',[])] if c.get('groups') else '(не се връщат в списъка → виж по id)')
    out2=subprocess.run(['curl','-s','--max-time','25','-u','any:'+key,'-H','Accept: application/json','https://esputnik.com/api/v1/contact/%s'%c['id']],capture_output=True,text=True).stdout
    try: c2=json.loads(out2); print('  групи (по id):',[g.get('name') for g in c2.get('groups',[])],'· създаден:',c2.get('createdDate') or c2.get('addressBookId'))
    except Exception: print('  контакт по id: parse fail',out2[:120])
PY
