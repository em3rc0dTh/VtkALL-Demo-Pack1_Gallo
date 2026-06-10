# -*- coding: utf-8 -*-
import base64
import re
import sys

LOG_PATH = r"C:\Users\eduar\.gemini\antigravity\brain\72ed4a0f-a63b-4825-83f2-bde2dd0f7c67\.system_generated\tasks\task-42.log"
PNG_OUT  = r"c:\Users\eduar\Desktop\ai-integrations\mecanica\qr_mecanica.png"
HTML_OUT = r"c:\Users\eduar\Desktop\ai-integrations\mecanica\qr_mecanica.html"

SESSION_ID = "3109e55c-1bca-4111-88c6-c107916f571f"

log = open(LOG_PATH, encoding="utf-8", errors="replace").read()

# Buscar el campo qrCode (data URI)
m = re.search(r"'qrCode': '(data:image/png;base64,[^']+)'", log)
if not m:
    print("ERROR: No se encontro qrCode en el log")
    sys.exit(1)

data_uri = m.group(1)
b64 = data_uri.split(",", 1)[1]

# Guardar PNG
img_bytes = base64.b64decode(b64)
with open(PNG_OUT, "wb") as f:
    f.write(img_bytes)
print(f"PNG guardado: {PNG_OUT} ({len(img_bytes)} bytes)")

# Generar HTML
html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="30">
<title>QR WhatsApp - mecanica-bot</title>
<style>
  body {{
    font-family: 'Segoe UI', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
    background: #0d1117;
    color: #f0f6fc;
  }}
  h1 {{ color: #58a6ff; margin-bottom: 8px; font-size: 1.6rem; }}
  p {{ color: #8b949e; margin-bottom: 28px; font-size: 14px; text-align: center; }}
  .qr-wrapper {{
    padding: 20px;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 0 60px rgba(88,166,255,0.25);
  }}
  img {{ width: 280px; height: 280px; display: block; }}
  .badge {{
    margin-top: 20px;
    background: #1c2128;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 12px;
    color: #8b949e;
    text-align: center;
  }}
  .session-id {{ font-size: 10px; color: #484f58; margin-top: 4px; }}
</style>
</head>
<body>
  <h1>&#128241; Escanea con WhatsApp</h1>
  <p>
    Abre WhatsApp &rarr; Dispositivos vinculados &rarr; Vincular un dispositivo<br>
    <small>El QR se recarga automaticamente cada 30 segundos</small>
  </p>
  <div class="qr-wrapper">
    <img src="{data_uri}" alt="QR WhatsApp mecanica-bot"/>
  </div>
  <div class="badge">
    Sesion: <strong>mecanica-bot</strong>
    <div class="session-id">ID: {SESSION_ID}</div>
  </div>
</body>
</html>"""

with open(HTML_OUT, "w", encoding="utf-8") as f:
    f.write(html)
print(f"HTML guardado: {HTML_OUT}")
print(f"\nAbre en el navegador:")
print(f"  {HTML_OUT}")
