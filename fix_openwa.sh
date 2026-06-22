cd turagua/openwa
sed -i '/"postinstall": "npm run dashboard:install"/d' package.json
cd ..
sudo docker compose up -d --build
