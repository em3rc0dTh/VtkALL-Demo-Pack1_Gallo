cd /home/ubuntu/bookcars/nginx
sed -i '/proxy_pass http:\/\/.*-frontend:3000;/a \        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";' nginx.conf
sudo docker exec bookcars-proxy-1 nginx -s reload
