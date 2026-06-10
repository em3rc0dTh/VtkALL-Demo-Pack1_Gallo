#!/usr/bin/env python3
"""
connect_openwa.py
Conecta la sesión OpenWA en el VPS, configura webhooks y obtiene el QR.
"""
import subprocess
import json
import time
import base64
import os
import sys

SSH_KEY  = r"c:\Users\eduar\Downloads\Thradex Downloads\oci-2025.key"
HOST     = "ubuntu@165.1.122.9"
API_PORT = 2795
API_KEY  = "dev-admin-key"
SESSION  = "mecanica-bot"
# URL interna del backend (dentro de Docker)
WEBHOOK_URL = "http://mecanica-backend:4000/webhook/whatsapp"

BASE_URL = f"http://127.0.0.1:{API_PORT}/api"

def ssh(cmd):
    r = subprocess.run(
        ["ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, cmd],
        capture_output=True, text=True, timeout=30
    )
    return r.stdout.strip(), r.stderr.strip()

def api_get(path):
    out, err = ssh(f"curl -sf -H 'x-api-key: {API_KEY}' {BASE_URL}{path}")
    try:
        return json.loads(out)
    except:
        return out

def api_post(path, payload=None):
    """POST usando un here-doc para evitar problemas de escape de comillas."""
    json_str = json.dumps(payload) if payload else '{}'
    cmd = f"""curl -sf -X POST -H 'x-api-key: {API_KEY}' -H 'Content-Type: application/json' \
-d '{json_str}' {BASE_URL}{path}"""
    # Escapamos las comillas dobles dentro del JSON para el shell
    safe_cmd = cmd.replace('"', '\\"').replace("'", "'\\''")
    # Mejor: escribir a un archivo temporal en el VPS
    json_escaped = json_str.replace("'", "'\\''")
    full_cmd = f"echo '{json_escaped}' | curl -sf -X POST -H 'x-api-key: {API_KEY}' -H 'Content-Type: application/json' -d @- {BASE_URL}{path}"
    out, err = ssh(full_cmd)
    try:
        return json.loads(out)
    except:
        return {"raw": out, "err": err}

def api_post_file(path, payload):
    """POST escribiendo el JSON a un archivo temporal en el VPS para evitar escape."""
    json_str = json.dumps(payload)
    # Escribir JSON a archivo temporal en VPS, luego hacer POST
    cmd = f"""python3 -c "import json,urllib.request; \
req=urllib.request.Request('{BASE_URL}{path}', \
data=json.dumps({repr(payload)}).encode(), \
headers={{'x-api-key':'{API_KEY}','Content-Type':'application/json'}}, \
method='POST'); \
resp=urllib.request.urlopen(req); \
print(resp.read().decode())" """
    out, err = ssh(cmd)
    try:
        return json.loads(out)
    except:
        return {"raw": out, "err": err}

def main():
    print("=" * 60)
    print("  OpenWA Session Connect — mecanica-bot")
    print("=" * 60)

    # 1. Listar sesiones existentes
    print("\n[1/5] Listando sesiones existentes...")
    sessions = api_get("/sessions")
    if isinstance(sessions, list):
        print(f"  Sesiones encontradas: {len(sessions)}")
        for s in sessions:
            print(f"    - {s.get('name')} [{s.get('status')}] id={s.get('id')}")
    else:
        print(f"  Respuesta: {sessions}")
        sessions = []

    # 2. Buscar o crear la sesión
    session_id = None
    session_status = None
    if isinstance(sessions, list):
        for s in sessions:
            if s.get("name") == SESSION:
                session_id = s.get("id")
                session_status = s.get("status")
                break

    if not session_id:
        print(f"\n[2/5] Sesión '{SESSION}' no encontrada. Creando...")
        payload = {"name": SESSION}
        r = api_post_file("/sessions", payload)
        print(f"  Respuesta: {r}")
        session_id = r.get("id") if isinstance(r, dict) else None
        session_status = r.get("status") if isinstance(r, dict) else None
    else:
        print(f"\n[2/5] Sesión encontrada: id={session_id} status={session_status}")

    if not session_id:
        print("❌ No se pudo obtener el ID de la sesión. Abortando.")
        sys.exit(1)

    # 3. Iniciar la sesión si no está activa
    if session_status not in ("WORKING", "QR"):
        print(f"\n[3/5] Iniciando sesión (status actual: {session_status})...")
        r = api_post_file(f"/sessions/{session_id}/start", {})
        print(f"  Respuesta: {r}")
        print("  Esperando 12 segundos para que el QR esté listo...")
        time.sleep(12)
    else:
        print(f"\n[3/5] Sesión ya está en status '{session_status}', no es necesario iniciar.")

    # 4. Configurar webhook
    print(f"\n[4/5] Configurando webhook -> {WEBHOOK_URL}...")
    webhook_payload = {
        "url": WEBHOOK_URL,
        "events": ["message", "message.any", "session.status", "message.ack", "group.join", "group.leave"],
        "retries": {"delaySeconds": 2, "attempts": 5}
    }
    r = api_post_file(f"/sessions/{session_id}/webhooks", webhook_payload)
    print(f"  Respuesta: {r}")

    # 5. Obtener QR
    print(f"\n[5/5] Obteniendo QR de la sesión...")
    for attempt in range(5):
        qr_data = api_get(f"/sessions/{session_id}/qr")
        if isinstance(qr_data, dict) and "qr" in qr_data:
            qr = qr_data["qr"]
            print(f"\n✅ QR obtenido!")
            # Guardar QR como imagen PNG
            if qr.startswith("data:image"):
                # extraer la parte base64
                b64 = qr.split(",", 1)[1]
            else:
                b64 = qr
            try:
                img_bytes = base64.b64decode(b64)
                out_path = os.path.join(os.path.dirname(__file__), "qr_mecanica.png")
                with open(out_path, "wb") as f:
                    f.write(img_bytes)
                print(f"  📁 QR guardado en: {out_path}")
            except Exception as e:
                print(f"  ⚠️  No se pudo decodificar como imagen: {e}")
                print(f"  Base64 (primeros 100 chars): {qr[:100]}")
            # Generar HTML con el QR
            html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="30">
<title>QR WhatsApp — mecanica-bot</title>
<style>
  body {{ font-family: sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#0d1117; color:#f0f6fc; }}
  h1 {{ color:#58a6ff; margin-bottom:8px; }}
  p {{ color:#8b949e; margin-bottom:24px; font-size:14px; }}
  img {{ width:280px; height:280px; border-radius:16px; border:3px solid #21262d; box-shadow:0 0 40px rgba(88,166,255,0.2); }}
  .badge {{ margin-top:16px; background:#1c2128; border:1px solid #30363d; border-radius:8px; padding:8px 16px; font-size:13px; color:#8b949e; }}
</style>
</head>
<body>
<h1>📱 Escanea con WhatsApp</h1>
<p>Abre WhatsApp → Dispositivos vinculados → Vincular un dispositivo</p>
<img src="{qr if qr.startswith('data:image') else 'data:image/png;base64,' + qr}" alt="QR WhatsApp"/>
<div class="badge">Sesión: mecanica-bot · Se recarga automáticamente cada 30s</div>
</body>
</html>"""
            html_path = os.path.join(os.path.dirname(__file__), "qr_mecanica.html")
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"  🌐 HTML guardado en: {html_path}")
            print(f"\n  Abre el archivo en tu navegador:")
            print(f"  file:///{html_path.replace(chr(92), '/')}")
            break
        else:
            print(f"  Intento {attempt+1}/5: QR aún no disponible ({qr_data}). Esperando 8s...")
            time.sleep(8)
    else:
        print("\n❌ No se pudo obtener el QR después de 5 intentos.")
        print("   Verifica que el contenedor mecanica-openwa esté corriendo:")
        print("   ssh VPS 'docker ps | grep openwa'")

    # Estado final
    print(f"\n[✔] Status final de la sesión:")
    final = api_get(f"/sessions/{session_id}")
    if isinstance(final, dict):
        print(f"  name={final.get('name')} status={final.get('status')} engine={final.get('engine')}")
    else:
        print(f"  {final}")

if __name__ == "__main__":
    main()
