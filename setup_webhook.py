import subprocess
import json

ssh_key = r"c:\Users\eduar\Downloads\Thradex Downloads\oci-2025.key"
host = "ubuntu@165.1.122.9"

def run_ssh(cmd):
    return subprocess.run(['ssh', '-i', ssh_key, '-o', 'StrictHostKeyChecking=no', host, cmd], capture_output=True, text=True)

# get session ID
res_list = run_ssh("curl -s -H 'x-api-key: dev-admin-key' http://127.0.0.1:2795/api/sessions")
sessions = json.loads(res_list.stdout)
session_id = None
for s in sessions:
    if s.get("name") == "mecanica-bot":
        session_id = s.get("id")
        break

if not session_id:
    print("Session not found")
    exit(1)

payload = {
    "url": "http://backend:4000/api/webhook/whatsapp",
    "events": ["message.received"]
}

# write payload to file on VPS
json_str = json.dumps(payload)
run_ssh(f"echo '{json_str}' > /tmp/webhook.json")

# execute curl using the file
res_hook = run_ssh(f"curl -s -X POST -H 'x-api-key: dev-admin-key' -H 'Content-Type: application/json' -d @/tmp/webhook.json http://127.0.0.1:2795/api/sessions/{session_id}/webhooks")
print("Webhook response:", res_hook.stdout)
