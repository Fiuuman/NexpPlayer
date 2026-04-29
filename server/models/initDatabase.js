import { getDb } from '../config/database.js';
import bcrypt from 'bcryptjs';

export async function initDatabase() {
  const db = getDb();

  try {
    // Таблица пользователей
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        avatar TEXT DEFAULT NULL,
        bio TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица users создана');

    // Таблица статистики
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        total_tracks INTEGER DEFAULT 0,
        total_playlists INTEGER DEFAULT 0,
        total_plays INTEGER DEFAULT 0,
        total_likes_given INTEGER DEFAULT 0,
        followers_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Таблица user_stats создана');

    // Таблица музыки
    await db.exec(`
      CREATE TABLE IF NOT EXISTS music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        artist TEXT DEFAULT 'Неизвестный исполнитель',
        album TEXT DEFAULT 'Без альбома',
        description TEXT DEFAULT '',
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        filetype TEXT NOT NULL,
        filesize INTEGER NOT NULL,
        duration REAL DEFAULT 0,
        color TEXT DEFAULT '#1db954',
        waveform TEXT DEFAULT NULL,
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        repost_count INTEGER DEFAULT 0,
        visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'private')),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Таблица music создана');

    // Таблица плейлистов
    await db.exec(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#1db954',
        is_public INTEGER DEFAULT 1,
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

    // Таблица лайков
    await db.exec(`
      CREATE TABLE IF NOT EXISTS track_likes (
        user_id INTEGER NOT NULL,
        track_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, track_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES music(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Таблица track_likes создана');

    // Таблица прослушиваний
    await db.exec(`
      CREATE TABLE IF NOT EXISTS track_plays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER NOT NULL,
        user_id INTEGER,
        duration INTEGER DEFAULT 0,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (track_id) REFERENCES music(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Таблица track_plays создана');

    // Таблица комментариев
    await db.exec(`
      CREATE TABLE IF NOT EXISTS track_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        timestamp REAL DEFAULT 0,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (track_id) REFERENCES music(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Таблица track_comments создана');

    // Таблица подписок
    await db.exec(`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id INTEGER NOT NULL,
        following_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Таблица follows создана');

    // Создаем тестового пользователя
    await createTestUser(db);

    return true;
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
    return false;
  }
}

async function createTestUser(db) {
  const testUser = await db.get('SELECT * FROM users WHERE email = ?', ['test@example.com']);
  if (!testUser) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const result = await db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      ['TestUser', 'test@example.com', hashedPassword]
    );

    await db.run('INSERT INTO user_stats (user_id) VALUES (?)', [result.lastID]);

    console.log('✅ Тестовый пользователь создан');
    console.log('   📧 Email: test@example.com');
    console.log('   🔑 Пароль: 123456');
  }
}
