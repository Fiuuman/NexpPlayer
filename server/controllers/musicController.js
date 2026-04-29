import { getDb } from '../config/database.js';
import path from 'path';
import fs from 'fs';

const __dirname = import.meta.dirname;

export const musicController = {
  async upload(req, res) {
    try {
      if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });

      const db = getDb();
      const { title, artist = 'Неизвестный исполнитель', album = 'Без альбома', description = '' } = req.body;
      const trackTitle = title || req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9 ]/g, ' ');

      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd166', '#1db954', '#6c5ce7', '#a29bfe'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const result = await db.run(
        `INSERT INTO music (user_id, title, artist, album, description, filename, filepath, filetype, filesize, color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, trackTitle, artist, album, description, req.file.filename, `/uploads/music/${req.file.filename}`, req.file.mimetype, req.file.size, randomColor]
      );

      await db.run('UPDATE user_stats SET total_tracks = total_tracks + 1 WHERE user_id = ?', [req.user.id]);

      const track = await db.get(
        `SELECT id, title, artist, album, description, filepath as url, color, filesize, duration, play_count, like_count, uploaded_at
         FROM music WHERE id = ?`, [result.lastID]
      );

      res.status(201).json({ message: 'Трек загружен', track });
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      res.status(500).json({ message: 'Ошибка загрузки файла' });
    }
  },

  async getMyTracks(req, res) {
    try {
      const db = getDb();
      const tracks = await db.all(
        `SELECT id, title, artist, album, description, filepath as url, color, filesize, duration, play_count, like_count, uploaded_at
         FROM music WHERE user_id = ? ORDER BY uploaded_at DESC`,
        [req.user.id]
      );
      res.json(tracks);
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async getAllTracks(req, res) {
    try {
      const db = getDb();
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;
      const search = req.query.search || '';

      let whereClause = 'WHERE m.visibility = "public"';
      const params = [];

      if (search) {
        whereClause += ' AND (m.title LIKE ? OR m.artist LIKE ? OR m.album LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      const [tracks, countResult] = await Promise.all([
        db.all(`
          SELECT m.id, m.title, m.artist, m.album, m.description, m.filepath as url,
                 m.color, m.duration, m.play_count, m.like_count,
                 u.username as uploader, u.avatar as uploader_avatar, m.uploaded_at
          FROM music m
          JOIN users u ON m.user_id = u.id
          ${whereClause}
          ORDER BY m.uploaded_at DESC
          LIMIT ? OFFSET ?
        `, [...params, limit, offset]),

        db.get(`SELECT COUNT(*) as total FROM music m ${whereClause}`, params)
      ]);

      res.json({
        tracks,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async stream(req, res) {
    try {
      const db = getDb();
      const track = await db.get('SELECT * FROM music WHERE id = ?', [req.params.id]);

      if (!track) return res.status(404).json({ message: 'Трек не найден' });

      const filePath = path.join(__dirname, '..', track.filepath.replace('/', ''));

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Файл не найден' });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': track.filetype,
        });
        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': track.filetype,
        });
        fs.createReadStream(filePath).pipe(res);
      }

      // Асинхронно записываем прослушивание (не блокируем ответ)
      db.run('UPDATE music SET play_count = play_count + 1 WHERE id = ?', [track.id]).catch(() => {});
      if (req.user?.id) {
        db.run('INSERT INTO track_plays (track_id, user_id) VALUES (?, ?)', [track.id, req.user.id]).catch(() => {});
      }
    } catch (error) {
      console.error('Ошибка стриминга:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Ошибка сервера' });
      }
    }
  },

  async getTrackById(req, res) {
    try {
      const db = getDb();
      const track = await db.get(`
        SELECT m.id, m.title, m.artist, m.album, m.description, m.filepath as url,
               m.color, m.duration, m.waveform, m.play_count, m.like_count,
               m.visibility, u.username as uploader, u.avatar as uploader_avatar,
               m.uploaded_at
        FROM music m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = ?
      `, [req.params.id]);

      if (!track) return res.status(404).json({ message: 'Трек не найден' });

      // Проверяем лайкнул ли текущий пользователь
      let isLiked = false;
      if (req.user?.id) {
        const like = await db.get('SELECT * FROM track_likes WHERE user_id = ? AND track_id = ?', [req.user.id, track.id]);
        isLiked = !!like;
      }

      res.json({ ...track, isLiked });
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async delete(req, res) {
    try {
      const db = getDb();
      const trackId = req.params.id;

      const track = await db.get('SELECT * FROM music WHERE id = ? AND user_id = ?', [trackId, req.user.id]);
      if (!track) return res.status(404).json({ message: 'Трек не найден' });

      const filePath = path.join(__dirname, '..', track.filepath.replace('/', ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      await db.run('DELETE FROM music WHERE id = ?', [trackId]);
      await db.run('UPDATE user_stats SET total_tracks = total_tracks - 1 WHERE user_id = ?', [req.user.id]);

      res.json({ message: 'Трек удален' });
    } catch (error) {
      console.error('Ошибка удаления:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
};
