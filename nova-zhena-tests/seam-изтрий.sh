#!/usr/bin/env bash
# nova-zhena-tests/seam-изтрий.sh <yespo_contact_id> · v0.1 · 12.09.2026 · доер Б · трие ТЕСТ-контакта в Yespo (DELETE · без тяло). Ключът от root .env — не се печата.
set -u; ID="${1:?yespo contact id}"; R="$(cd /Users/user/Metalandia 2>/dev/null && git rev-parse --show-toplevel)"; set -a; . "$R/.env"; set +a
curl -s --max-time 25 -X DELETE -u "any:$YESPO_API_KEY" "https://esputnik.com/api/v1/contact/$ID" -o /dev/null -w "DELETE contact $ID → http=%{http_code}\n"
curl -s --max-time 25 -u "any:$YESPO_API_KEY" -H 'Accept: application/json' "https://esputnik.com/api/v1/contact/$ID" -o /dev/null -w "GET след изтриване → http=%{http_code} (404 = изтрит)\n"
