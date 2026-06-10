import json
import urllib.request

SESSION_ID = "3109e55c-1bca-4111-88c6-c107916f571f"
BASE = "http://127.0.0.1:2795/api"
KEY = "dev-admin-key"

def get(path):
    req = urllib.request.Request(BASE + path, headers={"x-api-key": KEY})
    return json.loads(urllib.request.urlopen(req, timeout=10).read().decode())

def post(path, data=None):
    body = json.dumps(data or {}).encode()
    req = urllib.request.Request(
        BASE + path,
        data=body,
        headers={"x-api-key": KEY, "Content-Type": "application/json"},
        method="POST"
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        raw = resp.read().decode()
        return json.loads(raw) if raw else {"ok": True}
    except urllib.error.HTTPError as e:
        return {"error": e.code, "msg": e.read().decode()}

# 1. Crear webhook - eventos completos
print("=== Creando webhook (todos los eventos) ===")
webhook_data = {
    "url": "http://mecanica-backend:4000/webhook/whatsapp",
    "events": ["message", "message.any", "session.status", "message.ack"]
}
r = post(f"/sessions/{SESSION_ID}/webhooks", webhook_data)
print(json.dumps(r, indent=2))

# 2. Verificar webhooks registrados
print("\n=== Webhooks registrados ===")
wh = get(f"/sessions/{SESSION_ID}/webhooks")
print(json.dumps(wh, indent=2))

# 3. Status final
print("\n=== Status final ===")
s = get(f"/sessions/{SESSION_ID}")
print("name:", s.get("name"), "| status:", s.get("status"))
