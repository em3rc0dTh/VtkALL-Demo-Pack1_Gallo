import urllib.request
import json
import time
import os

base_url = 'http://127.0.0.1:2785/api'
headers = {'x-api-key': 'dev-admin-key', 'Content-Type': 'application/json'}
session_name = 'mecanica-bot'

def req(path, method='GET', data=None):
    req_obj = urllib.request.Request(base_url + path, headers=headers, method=method)
    if data:
        req_obj.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req_obj) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f'Error {e.code}: {e.read().decode()}')
        return None
    except Exception as e:
        print('Exception:', str(e))
        return None

print('Starting session...')
res = req(f'/sessions/{session_name}/start', method='POST')
print(res)

time.sleep(8)

print('Getting QR...')
res = req(f'/sessions/{session_name}/qr')
if res and 'qr' in res:
    print('GOT QR!')
    # Save relatively to the script location
    public_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'public')
    os.makedirs(public_dir, exist_ok=True)
    qr_path = os.path.join(public_dir, 'qr.html')
    with open(qr_path, 'w') as f:
        qr = res['qr']
        if not qr.startswith('data:image'):
            qr = 'data:image/png;base64,' + qr
        html = f'<html><body style="display:flex;flex-direction:column;align-items:center;margin-top:50px;font-family:sans-serif;"><h1>Escanea este QR con WhatsApp</h1><img src="{qr}" style="width:300px;height:300px;border:2px solid #ccc;border-radius:10px;"/></body></html>'
        f.write(html)
    print(f'QR saved to {qr_path}. You can view it at /qr.html in your frontend.')
else:
    print('No QR found. The session might be already connected or it failed to start.', res)
