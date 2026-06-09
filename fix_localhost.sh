cd turagua/frontend
sed -i 's/localhost:4000/backend:4000/g' app/layout.js
sed -i 's/localhost:4000/backend:4000/g' lib/api.js
cd ..
sudo docker compose up -d --build frontend
