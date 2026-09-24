# scripts/login.sh — dev helper za JWT tokene
# Upotreba (iz backend/):  source scripts/login.sh
#                          TOKEN=$(login ana@test.com)

login() {
  local res
  res=$(curl -s --max-time 5 -X POST http://127.0.0.1:3000/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"${2:-password123}\"}")

  # Prazan odgovor → server ne sluša ili visi
  if [ -z "$res" ]; then
    echo "❌ Server ne odgovara — proveri terminal A" >&2
    return 1
  fi

  # Odgovor bez tokena → ispiši grešku servera (401, 403, 429...)
  echo "$res" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['token']) if 'token' in d else sys.exit('❌ ' + json.dumps(d))"
}