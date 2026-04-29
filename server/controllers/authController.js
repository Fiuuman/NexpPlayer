import { getDb } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';

const __dirname = import.meta.dirname;

export const authController = {
  async register(req, res) {
    try {
      const db = getDb();
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Все поля обязательны' });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: 'Пароль минимум 6 символов' });
      }

      const existing = await db.get(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [email, username]
      );
      if (existing) {
        return res.status(400).json({ message: 'Пользователь уже существует' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      await db.run('INSERT INTO user_stats (user_id) VALUES (?)', [result.lastID]);

      const token = generateToken({ id: result.lastID, email, username });
      const user = await db.get(
        'SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?',
        [result.lastID]
      );

      res.status(201).json({ message: 'Пользователь создан', token, user });
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async login(req, res) {
    try {
      const db = getDb();
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email и пароль обязательны' });
      }

      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.status(401).json({ message: 'Неверный email или пароль' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Неверный email или пароль' });
      }

      const token = generateToken({ id: user.id, email: user.email, username: user.username });
      const { password: _, ...userWithoutPassword } = user;

      res.json({ message: 'Вход выполнен', token, user: userWithoutPassword });
    } catch (error) {
      console.error('Ошибка входа:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async getMe(req, res) {
    try {
      const db = getDb();
      const user = await db.get(
        'SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?',
        [req.user.id]
      );
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      res.json(user);
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async updateProfile(req, res) {
    try {
      const db = getDb();
      const { username, email, bio } = req.body;

      if (email) {
        const existing = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
        if (existing) return res.status(400).json({ message: 'Email уже используется' });
      }
      if (username) {
        const existing = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
        if (existing) return res.status(400).json({ message: 'Имя уже используется' });
      }

      await db.run(
        'UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email), bio = COALESCE(?, bio) WHERE id = ?',
        [username, email, bio, req.user.id]
      );

      const user = await db.get(
        'SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?',
        [req.user.id]
      );

      res.json({ message: 'Профиль обновлен', user });
    } catch (error) {
      console.error('Ошибка обновления:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async uploadAvatar(req, res) {
    try {
      if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });

      const db = getDb();
      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      const user = await db.get('SELECT avatar FROM users WHERE id = ?', [req.user.id]);
      if (user?.avatar) {
        const oldPath = path.join(__dirname, '..', user.avatar.replace('/', ''));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, req.user.id]);

      const updatedUser = await db.get(
        'SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?',
        [req.user.id]
      );

      res.json({ message: 'Аватар обновлен', user: updatedUser });
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      res.status(500).json({ message: 'Ошибка загрузки файла' });
    }
  }
};
