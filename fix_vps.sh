cd turagua
git checkout backend/package.json
sed -i 's/"npm", "run", "dev"/"node", "index.js"/g' backend/Dockerfile
sudo docker compose up -d --build backend frontend
