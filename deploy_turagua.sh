cd turagua

# Asegurar .dockerignore para que no arrastre node_modules
echo "node_modules" > backend/.dockerignore
echo "node_modules" > frontend/.dockerignore

# Forzar Next.js a usar el proxy y permitir host
sed -i "s/'\*.ngrok-free.dev', 'localhost:3000'/'\*.ngrok-free.dev', 'localhost:3000', 'turagua.thradex.com'/g" frontend/next.config.mjs
sed -i 's/localhost:4000/backend:4000/g' frontend/next.config.mjs

# Forzar SSR a usar el DNS interno de Docker (backend:4000)
sed -i 's/localhost:4000/backend:4000/g' frontend/app/layout.js
sed -i 's/localhost:4000/backend:4000/g' frontend/lib/api.js
sed -i 's/localhost:4000/backend:4000/g' frontend/components/dashboard/TabConfiguracion.js

# Asegurar puerto correcto de Mongo en backend
sed -i 's/localhost:27017/mongo:27017/g' backend/config/database.js 2>/dev/null || true

# Levantar todo limpiamente
sudo docker compose -f docker-compose.prod.yml down
sudo docker compose -f docker-compose.prod.yml up -d --build
