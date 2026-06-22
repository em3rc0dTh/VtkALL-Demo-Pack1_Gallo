import subprocess
import json
import time

ssh_key = r"c:\Users\eduar\Downloads\Thradex Downloads\oci-2025.key"
host = "ubuntu@165.1.122.9"

def run_ssh(cmd):
    return subprocess.run(['ssh', '-i', ssh_key, '-o', 'StrictHostKeyChecking=no', host, cmd], capture_output=True, text=True)

print("Fetching sessions list...")
res_list = run_ssh("curl -s -H 'x-api-key: dev-admin-key' http://127.0.0.1:2795/api/sessions")
sessions = json.loads(res_list.stdout)
session_id = None
for s in sessions:
    if s.get("name") == "mecanica-bot":
        session_id = s.get("id")
        break

if not session_id:
    print("Session not found!")
    exit(1)

print(f"Stopping session {session_id} to force refresh...")
run_ssh(f"curl -s -X POST -H 'x-api-key: dev-admin-key' http://127.0.0.1:2795/api/sessions/{session_id}/stop")

time.sleep(3)

print("Starting session...")
run_ssh(f"curl -s -X POST -H 'x-api-key: dev-admin-key' http://127.0.0.1:2795/api/sessions/{session_id}/start")

print("Waiting 12 seconds for fresh QR...")
time.sleep(12)

print("Fetching QR...")
res_qr = run_ssh(f"curl -s -H 'x-api-key: dev-admin-key' http://127.0.0.1:2795/api/sessions/{session_id}/qr")
try:
    qr_data = json.loads(res_qr.stdout).get("qrCode")
    if qr_data:
        html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Escanear QR de WhatsApp</title>
    <style>
        body {{
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #1a1a1a;
            font-family: system-ui, -apple-system, sans-serif;
            color: white;
            text-align: center;
        }}
        .container {{
            background-color: #2a2a2a;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }}
        h1 {{ margin-top: 0; color: #4ade80; }}
        img {{
            background: white;
            padding: 20px;
            border-radius: 12px;
            width: 350px;
            height: 350px;
            display: block;
            margin: 20px auto;
        }}
        p {{ color: #a3a3a3; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>¡Conexión Exitosa!</h1>
        <p>Abre WhatsApp en tu celular y escanea este código QR <br> para enlazar <strong>mecanica-bot</strong> con tu VPS.</p>
        <img src="{qr_data}" alt="QR Code">
    </div>
</body>
</html>"""
        with open(r"c:\Users\eduar\Desktop\ai-integrations\mecanica\qr_code.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("QR updated successfully in qr_code.html!")
    else:
        print("No QR found in response:", res_qr.stdout)
except Exception as e:
    print("Error parsing QR:", e, res_qr.stdout)
