import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectDatabase } from './config/database.js';
import { initDatabase } from './models/initDatabase.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import musicRoutes from './routes/music.js';
import playlistRoutes from './routes/playlists.js';
import socialRoutes from './routes/social.js';

const __dirname = import.meta.dirname;
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:1420',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/social', socialRoutes);

// Health check
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Сервер работает! 🚀', 
    env: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// Error handler
app.use(errorHandler);

// Start
async function startServer() {
  try {
    console.log('🚀 Запуск сервера...');
    await connectDatabase();
    const dbInitialized = await initDatabase();

    if (!dbInitialized) {
      console.error('❌ Ошибка инициализации БД');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`✅ Сервер на порту ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}`);
      console.log(`🔗 Тест: http://localhost:${PORT}/api/test`);
    });
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

startServer();
