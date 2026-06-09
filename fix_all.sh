cd turagua

# 1. Add missing environment variables to .env
cat << 'EOF' >> .env

PROJECT_NAME=turagua
MONGO_PORT=27021
MONGO_EXPRESS_PORT=8081
DB_PORT=5432
TEMPORAL_PORT=7233
TEMPORAL_UI_PORT=8080
OPENWA_PORT=3007
BACKEND_PORT=4005
FRONTEND_PORT=3005
EOF

# 2. Fix OpenWA package.json
sed -i '/"postinstall": "npm run dashboard:install"/d' openwa/package.json

# 3. Add .dockerignore
echo "node_modules" > backend/.dockerignore
echo "node_modules" > frontend/.dockerignore
echo "node_modules" > openwa/.dockerignore

# 4. Fix Next.js and API endpoints
sed -i "s/'\*.ngrok-free.dev', 'localhost:3000'/'\*.ngrok-free.dev', 'localhost:3000', 'turagua.thradex.com'/g" frontend/next.config.mjs
sed -i 's/localhost:4000/backend:4000/g' frontend/next.config.mjs
sed -i 's/localhost:4000/backend:4000/g' frontend/app/layout.js
sed -i 's/localhost:4000/backend:4000/g' frontend/lib/api.js
sed -i 's/localhost:4000/backend:4000/g' frontend/components/dashboard/TabConfiguracion.js

# 5. Fix Backend mongo connection
sed -i 's/localhost:27017/mongo:27017/g' backend/config/database.js 2>/dev/null || true

# 6. Rebuild and Start
sudo docker compose down
sudo docker compose up -d --build
