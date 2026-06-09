#!/bin/bash
set -e

echo "=== 1. CREANDO RED GLOBAL ==="
sudo docker network inspect proxy-network >/dev/null 2>&1 || sudo docker network create proxy-network

echo "=== 2. ACTUALIZANDO NGINX CONF EN BOOKCARS ==="
cp /home/ubuntu/bookcars/nginx/nginx.conf /home/ubuntu/bookcars/nginx/nginx.conf.bak

# Reemplazamos localhost por los nombres de contenedor en los bloques de turagua, galloautos y bateylate
sed -i 's/http:\/\/localhost:3002/http:\/\/turagua-frontend:3000/g' /home/ubuntu/bookcars/nginx/nginx.conf
sed -i 's/http:\/\/localhost:4002\//http:\/\/turagua-backend:4000\//g' /home/ubuntu/bookcars/nginx/nginx.conf

sed -i 's/http:\/\/localhost:3003/http:\/\/gallo-frontend:3000/g' /home/ubuntu/bookcars/nginx/nginx.conf
sed -i 's/http:\/\/localhost:4003\//http:\/\/gallo-backend:4000\//g' /home/ubuntu/bookcars/nginx/nginx.conf

sed -i 's/http:\/\/localhost:3004/http:\/\/bateylate-frontend:3000/g' /home/ubuntu/bookcars/nginx/nginx.conf
sed -i 's/http:\/\/localhost:4004\//http:\/\/bateylate-backend:4000\//g' /home/ubuntu/bookcars/nginx/nginx.conf

echo "=== 3. AÑADIENDO PROXY-NETWORK AL DOCKER-COMPOSE DE BOOKCARS ==="
# Haremos una inyección segura usando awk o simplemente añadiremos la red al final y al servicio proxy
cp /home/ubuntu/bookcars/docker-compose.yml /home/ubuntu/bookcars/docker-compose.yml.bak

# Python script to safely patch bookcars/docker-compose.yml
python3 -c '
import yaml
with open("/home/ubuntu/bookcars/docker-compose.yml", "r") as f:
    compose = yaml.safe_load(f)

# Ensure networks section exists
if "networks" not in compose:
    compose["networks"] = {}

# Ensure default network exists so we don"t break other services
if "default" not in compose["networks"]:
    compose["networks"]["default"] = None

# Add proxy-network
compose["networks"]["proxy-network"] = {"external": True}

# Add proxy-network to proxy service
proxy_svc = compose["services"]["proxy"]
if "networks" not in proxy_svc:
    proxy_svc["networks"] = ["default", "proxy-network"]
else:
    if "proxy-network" not in proxy_svc["networks"]:
        proxy_svc["networks"].append("proxy-network")

with open("/home/ubuntu/bookcars/docker-compose.yml", "w") as f:
    yaml.dump(compose, f, default_flow_style=False, sort_keys=False)
'

echo "=== 4. APLICANDO CAMBIOS EN BOOKCARS ==="
cd /home/ubuntu/bookcars
sudo docker compose up -d

echo "Bookcars actualizado exitosamente."
