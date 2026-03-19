import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Получаем __dirname в ES6 модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: 'http://localhost:1420', // адрес вашего фронтенда
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Настройка загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'));
    }
  }
});

// SQLite база данных
let db;

// Функция для инициализации таблиц музыки
async function initMusicDatabase() {
  try {
    // Таблица для музыки
    await db.exec(`
      CREATE TABLE IF NOT EXISTS music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        artist TEXT DEFAULT 'Неизвестный исполнитель',
        album TEXT DEFAULT 'Без альбома',
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        filetype TEXT NOT NULL,
        filesize INTEGER NOT NULL,
        duration REAL DEFAULT 0,
        color TEXT DEFAULT '#1db954',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Таблица music создана');
    
    // Таблица для плейлистов
    await db.exec(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#1db954',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Таблица playlists создана');
    
    // Таблица связей музыки и плейлистов
    await db.exec(`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id INTEGER NOT NULL,
        track_id INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (playlist_id, track_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES music(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Таблица playlist_tracks создана');
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка инициализации таблиц музыки:', error);
    return false;
  }
}

// Инициализация базы данных
async function initDatabase() {
  try {
    console.log('🔧 Инициализация базы данных SQLite...');
    
    // Открываем или создаем базу данных
    db = await open({
      filename: path.join(__dirname, 'music.db'),
      driver: sqlite3.Database
    });
    
    console.log('✅ База данных SQLite подключена');
    
    // Создаем таблицу пользователей
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        avatar TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Таблица users создана');
    
    // Создаем таблицу статистики
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total_tracks INTEGER DEFAULT 0,
        total_favorites INTEGER DEFAULT 0,
        total_playlists INTEGER DEFAULT 0,
        total_hours REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Таблица user_stats создана');
    
    // Инициализируем таблицы музыки
    await initMusicDatabase();
    
    // Проверяем, есть ли тестовый пользователь
    const testUser = await db.get('SELECT * FROM users WHERE email = ?', ['test@example.com']);
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const result = await db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        ['TestUser', 'test@example.com', hashedPassword]
      );
      
      // Создаем статистику для тестового пользователя
      await db.run(
        'INSERT INTO user_stats (user_id) VALUES (?)',
        [result.lastID]
      );
      
      console.log('✅ Тестовый пользователь создан');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
    return false;
  }
}

// Middleware проверки JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-123', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Валидация
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть минимум 6 символов' });
    }

    // Проверка существующего пользователя
    const existingUser = await db.get(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email или именем уже существует' });
    }

    // Хэширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const result = await db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // Создание статистики пользователя
    await db.run(
      'INSERT INTO user_stats (user_id) VALUES (?)',
      [result.lastID]
    );

    // Генерация токена
    const token = jwt.sign(
      { id: result.lastID, email, username },
      process.env.JWT_SECRET || 'your-secret-key-123',
      { expiresIn: '7d' }
    );

    const user = await db.get(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({
      message: 'Пользователь создан успешно',
      token,
      user
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    // Поиск пользователя
    const user = await db.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Проверка пароля
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Генерация токена
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key-123',
      { expiresIn: '7d' }
    );

    // Убираем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение данных пользователя
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление профиля
app.put('/api/auth/update', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;

    // Проверка на уникальность email
    if (email) {
      const existingEmail = await db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.id]
      );

      if (existingEmail) {
        return res.status(400).json({ message: 'Email уже используется' });
      }
    }

    // Проверка на уникальность имени
    if (username) {
      const existingUsername = await db.get(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, req.user.id]
      );

      if (existingUsername) {
        return res.status(400).json({ message: 'Имя пользователя уже используется' });
      }
    }

    // Обновление пользователя
    await db.run(
      `UPDATE users 
       SET username = COALESCE(?, username), 
           email = COALESCE(?, email) 
       WHERE id = ?`,
      [username, email, req.user.id]
    );

    // Получение обновленных данных
    const user = await db.get(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ 
      message: 'Профиль обновлен', 
      user
    });

  } catch (error) {
    console.error('Ошибка обновления:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Загрузка аватара
app.post('/api/auth/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // Удаление старого аватара если есть
    const user = await db.get(
      'SELECT avatar FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user && user.avatar) {
      const oldAvatarPath = path.join(__dirname, user.avatar.replace('/', ''));
      if (fs.existsSync(oldAvatarPath)) {
        try {
          fs.unlinkSync(oldAvatarPath);
        } catch (err) {
          console.log('Не удалось удалить старый аватар:', err.message);
        }
      }
    }

    // Обновление в БД
    await db.run(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarPath, req.user.id]
    );

    const updatedUser = await db.get(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ 
      message: 'Аватар обновлен', 
      user: updatedUser
    });

  } catch (error) {
    console.error('Ошибка загрузки аватара:', error);
    res.status(500).json({ message: 'Ошибка загрузки файла' });
  }
});

// Настройка загрузки музыки
const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'music');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueSuffix + '-' + safeFilename);
  }
});

const musicUpload = multer({
  storage: musicStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB лимит
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Только аудио файлы разрешены'));
    }
  }
});

// Эндпоинт для загрузки музыки
app.post('/api/music/upload', authenticateToken, musicUpload.single('music'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const { title, artist = 'Неизвестный исполнитель', album = 'Без альбома' } = req.body;
    
    // Извлекаем название из имени файла если не передано
    const trackTitle = title || req.file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9 ]/g, ' ');
    
    // Генерируем случайный цвет
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd166', '#1db954', '#6c5ce7', '#a29bfe'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Сохраняем информацию о треке в БД
    const result = await db.run(
      `INSERT INTO music (
        user_id, title, artist, album, 
        filename, filepath, filetype, filesize, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        trackTitle,
        artist,
        album,
        req.file.filename,
        `/uploads/music/${req.file.filename}`,
        req.file.mimetype,
        req.file.size,
        randomColor
      ]
    );

    // Обновляем статистику пользователя
    await db.run(
      'UPDATE user_stats SET total_tracks = total_tracks + 1 WHERE user_id = ?',
      [req.user.id]
    );

    // Получаем добавленный трек
    const track = await db.get(
      `SELECT id, title, artist, album, filepath as url, 
              color, filesize, duration, uploaded_at 
       FROM music WHERE id = ?`,
      [result.lastID]
    );

    res.status(201).json({
      message: 'Трек успешно загружен',
      track
    });

  } catch (error) {
    console.error('Ошибка загрузки музыки:', error);
    res.status(500).json({ message: 'Ошибка загрузки файла' });
  }
});

// Получение музыки пользователя
app.get('/api/music/my-tracks', authenticateToken, async (req, res) => {
  try {
    const tracks = await db.all(
      `SELECT id, title, artist, album, filepath as url, 
              color, filesize, duration, uploaded_at 
       FROM music 
       WHERE user_id = ?
       ORDER BY uploaded_at DESC`,
      [req.user.id]
    );

    res.json(tracks);
  } catch (error) {
    console.error('Ошибка получения треков:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение всех треков (для поиска)
app.get('/api/music/all', authenticateToken, async (req, res) => {
  try {
    const search = req.query.search || '';
    
    let query = `
      SELECT m.id, m.title, m.artist, m.album, m.filepath as url, 
             m.color, m.duration, u.username as uploader,
             m.uploaded_at
      FROM music m
      JOIN users u ON m.user_id = u.id
    `;
    
    const params = [];
    
    if (search) {
      query += ` WHERE m.title LIKE ? OR m.artist LIKE ? OR m.album LIKE ?`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ` ORDER BY m.uploaded_at DESC`;
    
    const tracks = await db.all(query, params);
    
    res.json(tracks);
  } catch (error) {
    console.error('Ошибка получения всех треков:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление трека
app.delete('/api/music/:id', authenticateToken, async (req, res) => {
  try {
    const trackId = req.params.id;
    
    // Проверяем принадлежность трека пользователю
    const track = await db.get(
      'SELECT * FROM music WHERE id = ? AND user_id = ?',
      [trackId, req.user.id]
    );
    
    if (!track) {
      return res.status(404).json({ message: 'Трек не найден или нет прав для удаления' });
    }
    
    // Удаляем файл
    const filePath = path.join(__dirname, track.filepath.replace('/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Удаляем из БД
    await db.run('DELETE FROM music WHERE id = ?', [trackId]);
    
    // Обновляем статистику
    await db.run(
      'UPDATE user_stats SET total_tracks = total_tracks - 1 WHERE user_id = ?',
      [req.user.id]
    );
    
    res.json({ message: 'Трек успешно удален' });
  } catch (error) {
    console.error('Ошибка удаления трека:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание плейлиста
app.post('/api/playlists', authenticateToken, async (req, res) => {
  try {
    const { name, description = '', color = '#1db954' } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название плейлиста обязательно' });
    }
    
    const result = await db.run(
      'INSERT INTO playlists (user_id, name, description, color) VALUES (?, ?, ?, ?)',
      [req.user.id, name, description, color]
    );
    
    // Обновляем статистику
    await db.run(
      'UPDATE user_stats SET total_playlists = total_playlists + 1 WHERE user_id = ?',
      [req.user.id]
    );
    
    const playlist = await db.get(
      'SELECT * FROM playlists WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      message: 'Плейлист создан',
      playlist
    });
  } catch (error) {
    console.error('Ошибка создания плейлиста:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение плейлистов пользователя
app.get('/api/playlists', authenticateToken, async (req, res) => {
  try {
    const playlists = await db.all(`
      SELECT p.*, 
             COUNT(pt.track_id) as track_count
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    
    res.json(playlists);
  } catch (error) {
    console.error('Ошибка получения плейлистов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Добавление трека в плейлист
app.post('/api/playlists/:playlistId/tracks', authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { trackId } = req.body;
    
    if (!trackId) {
      return res.status(400).json({ message: 'ID трека обязателен' });
    }
    
    // Проверяем права на плейлист
    const playlist = await db.get(
      'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, req.user.id]
    );
    
    if (!playlist) {
      return res.status(404).json({ message: 'Плейлист не найден' });
    }
    
    // Проверяем существование трека
    const track = await db.get('SELECT * FROM music WHERE id = ?', [trackId]);
    if (!track) {
      return res.status(404).json({ message: 'Трек не найден' });
    }
    
    // Проверяем, не добавлен ли уже трек
    const existing = await db.get(
      'SELECT * FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
      [playlistId, trackId]
    );
    
    if (existing) {
      return res.status(400).json({ message: 'Трек уже в плейлисте' });
    }
    
    // Добавляем трек
    await db.run(
      'INSERT INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)',
      [playlistId, trackId]
    );
    
    res.json({ message: 'Трек добавлен в плейлист' });
  } catch (error) {
    console.error('Ошибка добавления трека:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Тестовый эндпоинт
app.get('/api/test', (req, res) => {
  res.json({ message: 'Сервер работает! 🚀' });
});

// Старт сервера
app.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 API доступен по адресу: http://localhost:${PORT}`);
  console.log(`🔗 Тестовый эндпоинт: http://localhost:${PORT}/api/test`);
  
  const dbInitialized = await initDatabase();
  if (dbInitialized) {
    console.log('✅ Приложение готово к работе!');
    console.log('\n📝 Тестовые данные:');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Пароль: 123456');
  } else {
    console.log('⚠️ Возникли проблемы с базой данных');
  }
});