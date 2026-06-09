import urllib.request
import json
import time
import os

base_url = 'http://127.0.0.1:3005/api'
headers = {'x-api-key': 'dev-admin-key', 'Content-Type': 'application/json'}

def req(path, method='GET', data=None):
    req_obj = urllib.request.Request(base_url + path, headers=headers, method=method)
    if data:
        req_obj.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req_obj) as response:
            return json.loads(response.read().decode())
    except Exception:
        return None

# Delete existing turagua-bot if exists
sessions = req('/sessions')
if sessions:
    for s in sessions:
        if s['name'] == 'turagua-bot':
            req(f'/sessions/{s["id"]}', method='DELETE')
            print('Deleted old session:', s["id"])
            time.sleep(2)

print('Creating fresh session...')
res = req('/sessions', method='POST', data={'name': 'turagua-bot'})
if not res or 'id' not in res:
    print('Failed to create session')
    exit(1)
session_id = res['id']
print('Starting fresh session...')
req(f'/sessions/{session_id}/start', method='POST')

while True:
    time.sleep(5)
    res = req(f'/sessions/{session_id}/qr')
    if res and 'qrCode' in res and res['qrCode']:
        qr = res['qrCode']
        html = f'<html><head><meta http-equiv="refresh" content="5"></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:sans-serif;"><h1>Escanea este QR con WhatsApp</h1><p>Esta pagina se actualiza sola cada 5 segundos para mantener el QR fresco.</p><img src="{qr}" style="width:400px;height:400px;" /></body></html>'
        with open('/home/ubuntu/turagua/frontend/public/qr.html', 'w') as f:
            f.write(html)
        os.system('sudo cp /home/ubuntu/turagua/frontend/public/qr.html /var/lib/docker/volumes/bookcars_cdn/_data/qr.html')
        print('Updated QR!')
    
    # If status becomes connected, break loop
    status = req(f'/sessions/{session_id}/status')
    if status and status.get('status') == 'connected':
        print('CONNECTED!')
        html = '<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:sans-serif;background-color:#d4edda;color:#155724;"><h1>¡Conectado exitosamente!</h1><p>El bot de Turagua ya esta vinculado a WhatsApp.</p></body></html>'
        with open('/home/ubuntu/turagua/frontend/public/qr.html', 'w') as f:
            f.write(html)
        os.system('sudo cp /home/ubuntu/turagua/frontend/public/qr.html /var/lib/docker/volumes/bookcars_cdn/_data/qr.html')
        break
