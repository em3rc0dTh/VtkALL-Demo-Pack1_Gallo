cd turagua/frontend
sed -i "s/'\*.ngrok-free.dev', 'localhost:3000'/'\*.ngrok-free.dev', 'localhost:3000', 'turagua.thradex.com'/g" next.config.mjs
cd ..
sudo docker compose restart frontend
