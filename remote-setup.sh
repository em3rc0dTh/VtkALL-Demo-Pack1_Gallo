#!/bin/bash
set -e

# Crear red externa de proxy si no existe
sudo docker network inspect proxy-network >/dev/null 2>&1 || sudo docker network create proxy-network

# ==========================================
# 1. TURAGUA
# ==========================================
mkdir -p /home/ubuntu/turagua/frontend /home/ubuntu/turagua/backend /home/ubuntu/turagua/openwa

# Dockerfile Frontend Turagua
cat << 'EOF' > /home/ubuntu/turagua/frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
EOF

# Dockerfile Backend Turagua
cat << 'EOF' > /home/ubuntu/turagua/backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
EOF

# docker-compose.yml Turagua
cat << 'EOF' > /home/ubuntu/turagua/docker-compose.yml
version: '3.8'

services:
  mongo:
    image: mongo:latest
    container_name: turagua-mongo
    command: mongod --quiet --logpath /dev/null
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin
    ports:
      - "127.0.0.1:27018:27017"
    volumes:
      -
volumes:
  mongodb_data:/data/db
    networks:
      - turagua-net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: turagua-backend
    ports:
      - "127.0.0.1:4002:4000"
    environment:
      - PORT=4000
      - OPENWA_URL=http://openwa:2785
      - MONGODB_URI=mongodb://admin:admin@mongo:27017/turagua?authSource=admin
    depends_on:
      - openwa
      - mongo
    networks:
      - turagua-net
      - proxy-network
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: turagua-frontend
    ports:
      - "127.0.0.1:3002:3000"
    depends_on:
      - backend
    networks:
      - turagua-net
      - proxy-network
    restart: always

  openwa:
    build:
      context: ./openwa
      dockerfile: Dockerfile
    container_name: turagua-openwa
    ports:
      - "127.0.0.1:3005:2785"
    networks:
      - turagua-net
    restart: always

networks:
  turagua-net:
    driver: bridge
  proxy-network:
    external: true  mongodb_data:
    driver: local
EOF


# ==========================================
# 2. GALLO
# ==========================================
mkdir -p /home/ubuntu/gallo/frontend /home/ubuntu/gallo/backend

# Dockerfile Frontend Gallo
cat << 'EOF' > /home/ubuntu/gallo/frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
EOF

# Dockerfile Backend Gallo
cat << 'EOF' > /home/ubuntu/gallo/backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
EOF

# docker-compose.yml Gallo
cat << 'EOF' > /home/ubuntu/gallo/docker-compose.yml
version: '3.8'

services:
  mongo:
    image: mongo:latest
    container_name: gallo-mongo
    command: mongod --quiet --logpath /dev/null
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin
    ports:
      - "127.0.0.1:27019:27017"
    volumes:
      -
volumes:
  mongodb_data:/data/db
    networks:
      - gallo-net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gallo-backend
    ports:
      - "127.0.0.1:4003:4000"
    environment:
      - PORT=4000
      - MONGODB_URI=mongodb://admin:admin@mongo:27017/gallo?authSource=admin
    depends_on:
      - mongo
    networks:
      - gallo-net
      - proxy-network
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: gallo-frontend
    ports:
      - "127.0.0.1:3003:3000"
    depends_on:
      - backend
    networks:
      - gallo-net
      - proxy-network
    restart: always

networks:
  gallo-net:
    driver: bridge
  proxy-network:
    external: true  mongodb_data:
    driver: local
EOF


# ==========================================
# 3. BATE Y LATE
# ==========================================
mkdir -p /home/ubuntu/bateylate/frontend /home/ubuntu/bateylate/backend /home/ubuntu/bateylate/openwa

# Dockerfile Frontend Bateylate
cat << 'EOF' > /home/ubuntu/bateylate/frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
EOF

# Dockerfile Backend Bateylate
cat << 'EOF' > /home/ubuntu/bateylate/backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
EOF

# docker-compose.yml Bateylate
cat << 'EOF' > /home/ubuntu/bateylate/docker-compose.yml
version: '3.8'

services:
  mongo:
    image: mongo:latest
    container_name: bateylate-mongo
    command: mongod --quiet --logpath /dev/null
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin
    ports:
      - "127.0.0.1:27020:27017"
    volumes:
      -
volumes:
  mongodb_data:/data/db
    networks:
      - bateylate-net

  temporal-postgresql:
    image: postgres:13
    container_name: bateylate-postgresql
    environment:
      POSTGRES_USER: temporal
      POSTGRES_PASSWORD: temporal
    ports:
      - "127.0.0.1:5433:5432"
    volumes:
      - temporal-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U temporal"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - bateylate-net
    restart: always

  temporal:
    image: temporalio/auto-setup:latest
    container_name: bateylate-temporal
    depends_on:
      temporal-postgresql:
        condition: service_healthy
    environment:
      - DB=postgres12
      - DB_PORT=5432
      - POSTGRES_USER=temporal
      - POSTGRES_PWD=temporal
      - POSTGRES_SEEDS=temporal-postgresql
    ports:
      - "127.0.0.1:7233:7233"
    networks:
      - bateylate-net
    restart: always

  temporal-ui:
    image: temporalio/ui:latest
    container_name: bateylate-temporal-ui
    depends_on:
      - temporal
    environment:
      - TEMPORAL_ADDRESS=temporal:7233
      - TEMPORAL_CORS_ORIGINS=http://localhost:3004
    ports:
      - "127.0.0.1:8083:8080"
    networks:
      - bateylate-net
    restart: always

  openwa:
    build:
      context: ./openwa
      dockerfile: Dockerfile
    container_name: bateylate-openwa
    ports:
      - "127.0.0.1:3006:2785"
    networks:
      - bateylate-net
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bateylate-backend
    ports:
      - "127.0.0.1:4004:4000"
    environment:
      - PORT=4000
      - TEMPORAL_ADDRESS=temporal:7233
      - OPENWA_URL=http://openwa:2785
      - MONGODB_URI=mongodb://admin:admin@mongo:27017/bateylate?authSource=admin
    depends_on:
      - openwa
      - temporal
      - mongo
    networks:
      - bateylate-net
      - proxy-network
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: bateylate-frontend
    ports:
      - "127.0.0.1:3004:3000"
    depends_on:
      - backend
    networks:
      - bateylate-net
      - proxy-network
    restart: always

networks:
  bateylate-net:
    driver: bridge
  proxy-network:
    external: true
  temporal-db:
    driver: local  mongodb_data:
    driver: local
EOF

echo "All dockerfiles and docker-compose files have been created successfully."
