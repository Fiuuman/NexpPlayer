FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN mkdir -p /app/data/uploads/avatars /app/data/uploads/music

EXPOSE 3000

CMD ["node", "server.js"]
