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

print('Creating session...')
res = req('/sessions', method='POST', data={'name': 'turagua-bot'})
print(res)

print('Starting session...')
res = req('/sessions/turagua-bot/start', method='POST')
print(res)

time.sleep(8)

print('Getting QR...')
res = req('/sessions/turagua-bot/qr')
if res and 'qr' in res:
    print('GOT QR!')
    with open('/home/ubuntu/turagua/frontend/public/qr.html', 'w') as f:
        qr = res['qr']
        if not qr.startswith('data:image'):
            qr = 'data:image/png;base64,' + qr
        html = f'<html><body><h1>Escanea este QR con WhatsApp</h1><img src="{qr}" /></body></html>'
        f.write(html)
else:
    print('No QR found', res)
