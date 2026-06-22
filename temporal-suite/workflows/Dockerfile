FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Comando por defecto (sobreescribible por docker-compose)
CMD ["npm", "run", "worker"]
