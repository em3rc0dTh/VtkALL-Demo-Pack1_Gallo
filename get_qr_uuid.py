import urllib.request
import json
import time

base_url = 'http://127.0.0.1:3005/api'
headers = {'x-api-key': 'dev-admin-key', 'Content-Type': 'application/json'}

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

session_id = '5cb721fa-f06e-484a-a363-d5e152800902'

print('Starting session...')
res = req(f'/sessions/{session_id}/start', method='POST')
print(res)

time.sleep(15)

print('Getting QR...')
res = req(f'/sessions/{session_id}/qr')
if res and 'qr' in res:
    print('GOT QR!')
    with open('/home/ubuntu/turagua/frontend/public/qr.html', 'w') as f:
        qr = res['qr']
        if not qr.startswith('data:image'):
            qr = 'data:image/png;base64,' + qr
        html = f'<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:sans-serif;"><h1>Escanea este QR con WhatsApp</h1><img src="{qr}" style="width:300px;height:300px;" /></body></html>'
        f.write(html)
else:
    print('No QR found', res)
