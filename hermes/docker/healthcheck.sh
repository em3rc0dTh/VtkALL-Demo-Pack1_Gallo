#!/bin/sh
set -eu

node -e "fetch('http://localhost:' + (process.env.HERMES_PORT || 8642) + '/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
