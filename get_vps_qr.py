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
    print("Session not found. Attempting to create...")
    res_create = run_ssh("curl -s -X POST -H 'x-api-key: dev-admin-key' -H 'Content-Type: application/json' -d '{\"name\":\"mecanica-bot\"}' http://127.0.0.1:2795/api/sessions")
    s = json.loads(res_create.stdout)
    session_id = s.get("id")
    
if session_id:
    print(f"Found session ID: {session_id}")
    print("Starting session...")
    run_ssh(f"curl -s -X POST -H 'x-api-key: dev-admin-key' http://127.0.0.1:2795/api/sessions/{session_id}/start")
    print("Waiting 12 seconds for QR...")
    time.sleep(12)
    print("Fetching QR...")
    res_qr = run_ssh(f"curl -s -H 'x-api-key: dev-admin-key' http://127.0.0.1:2795/api/sessions/{session_id}/qr")
    print(res_qr.stdout)
else:
    print("Failed to get session ID")
