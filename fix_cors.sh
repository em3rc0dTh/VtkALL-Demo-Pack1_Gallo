cd turagua/backend
sed -i "s/origin: 'http:\/\/localhost:3000'/origin: ['http:\/\/localhost:3000', 'http:\/\/turagua.thradex.com', 'https:\/\/turagua.thradex.com']/g" index.js
sudo docker compose restart backend
