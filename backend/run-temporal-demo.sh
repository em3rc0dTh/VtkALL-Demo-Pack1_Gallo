#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Stopping previous stack..."
sudo docker compose down

echo "Rebuilding API and Temporal worker without cache..."
sudo docker compose build --no-cache api temporal-worker

echo "Starting full stack..."
sudo docker compose up -d

echo "Current containers:"
sudo docker compose ps

echo "Waiting for API health..."
for i in {1..60}; do
  if curl -fsS http://localhost:4000/api/v1/admin/health >/dev/null; then
    echo "API is healthy."
    break
  fi
  sleep 2
  if [[ "$i" == "60" ]]; then
    echo "API did not become healthy in time."
    sudo docker compose logs --tail=120 api
    exit 1
  fi
done

echo "Waiting for Temporal worker to start..."
for i in {1..60}; do
  if sudo docker compose logs temporal-worker 2>/dev/null | grep -q "Temporal worker listening"; then
    echo "Temporal worker is listening."
    break
  fi
  sleep 2
  if [[ "$i" == "60" ]]; then
    echo "Temporal worker did not start in time."
    sudo docker compose logs --tail=160 temporal temporal-worker
    exit 1
  fi
done

echo "Resetting seed data..."
sudo docker compose exec api npm run seed:reset

echo "Starting manual agent demo..."
sudo docker compose exec api npm run agent:demo
