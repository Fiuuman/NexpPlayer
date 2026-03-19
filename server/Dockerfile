# Используем стабильную версию Node.js
FROM node:20

# Устанавливаем инструменты для сборки sqlite3 (нужны для компиляции нативного модуля)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем только файлы зависимостей для кэширования слоев
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальной код сервера
COPY . .

# Создаем папки для БД и загрузок, чтобы Docker не ругался на права доступа
RUN mkdir -p /app/data /app/uploads

# Пробрасываем порт вашего Express (измените, если в index.js другой)
EXPOSE 3000

CMD ["node", "server.js"]
