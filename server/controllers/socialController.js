import { getDb } from '../config/database.js';

export const socialController = {
  // Лайк трека
  async likeTrack(req, res) {
    try {
      const db = getDb();
      const trackId = req.params.id;
      const userId = req.user.id;

      const track = await db.get('SELECT * FROM music WHERE id = ?', [trackId]);
      if (!track) return res.status(404).json({ message: 'Трек не найден' });

      const existing = await db.get(
        'SELECT * FROM track_likes WHERE user_id = ? AND track_id = ?',
        [userId, trackId]
      );

      if (existing) {
        // Удаляем лайк
        await db.run('DELETE FROM track_likes WHERE user_id = ? AND track_id = ?', [userId, trackId]);
        await db.run('UPDATE music SET like_count = like_count - 1 WHERE id = ?', [trackId]);
        await db.run('UPDATE user_stats SET total_likes_given = total_likes_given - 1 WHERE user_id = ?', [userId]);
        return res.json({ message: 'Лайк удален', liked: false });
      }

      // Добавляем лайк
      await db.run('INSERT INTO track_likes (user_id, track_id) VALUES (?, ?)', [userId, trackId]);
      await db.run('UPDATE music SET like_count = like_count + 1 WHERE id = ?', [trackId]);
      await db.run('UPDATE user_stats SET total_likes_given = total_likes_given + 1 WHERE user_id = ?', [userId]);

      res.json({ message: 'Лайк добавлен', liked: true });
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  // Получить лайкнутые треки
  async getLikedTracks(req, res) {
    try {
      const db = getDb();
      const tracks = await db.all(`
        SELECT m.id, m.title, m.artist, m.album, m.filepath as url,
               m.color, m.duration, m.play_count, m.like_count,
               u.username as uploader, tl.created_at as liked_at
        FROM track_likes tl
        JOIN music m ON tl.track_id = m.id
        JOIN users u ON m.user_id = u.id
        WHERE tl.user_id = ?
        ORDER BY tl.created_at DESC
      `, [req.user.id]);

      res.json(tracks);
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  // Добавить комментарий
  async addComment(req, res) {
    try {
      const db = getDb();
      const trackId = req.params.id;
      const { text, timestamp = 0 } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: 'Текст комментария обязателен' });
      }

      const track = await db.get('SELECT * FROM music WHERE id = ?', [trackId]);
      if (!track) return res.status(404).json({ message: 'Трек не найден' });

      const result = await db.run(
        'INSERT INTO track_comments (track_id, user_id, timestamp, text) VALUES (?, ?, ?, ?)',
        [trackId, req.user.id, timestamp, text.trim()]
      );

      const comment = await db.get(`
        SELECT tc.*, u.username, u.avatar
        FROM track_comments tc
        JOIN users u ON tc.user_id = u.id
        WHERE tc.id = ?
      `, [result.lastID]);

      res.status(201).json({ message: 'Комментарий добавлен', comment });
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  // Получить комментарии трека
  async getComments(req, res) {
    try {
      const db = getDb();
      const trackId = req.params.id;

      const comments = await db.all(`
        SELECT tc.*, u.username, u.avatar
        FROM track_comments tc
        JOIN users u ON tc.user_id = u.id
        WHERE tc.track_id = ?
        ORDER BY tc.timestamp ASC, tc.created_at ASC
      `, [trackId]);

      res.json(comments);
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  // Подписаться/отписаться
  async follow(req, res) {
    try {
      const db = getDb();
      const userIdToFollow = req.params.id;
      const followerId = req.user.id;

      if (userIdToFollow == followerId) {
        return res.status(400).json({ message: 'Нельзя подписаться на себя' });
      }

      const user = await db.get('SELECT * FROM users WHERE id = ?', [userIdToFollow]);
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

      const existing = await db.get(
        'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, userIdToFollow]
      );

      if (existing) {
        // Отписаться
        await db.run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, userIdToFollow]);
        await db.run('UPDATE user_stats SET following_count = following_count - 1 WHERE user_id = ?', [followerId]);
        await db.run('UPDATE user_stats SET followers_count = followers_count - 1 WHERE user_id = ?', [userIdToFollow]);
        return res.json({ message: 'Отписка выполнена', following: false });
      }

      // Подписаться
      await db.run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [followerId, userIdToFollow]);
      await db.run('UPDATE user_stats SET following_count = following_count + 1 WHERE user_id = ?', [followerId]);
      await db.run('UPDATE user_stats SET followers_count = followers_count + 1 WHERE user_id = ?', [userIdToFollow]);

      res.json({ message: 'Подписка выполнена', following: true });
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  // Получить подписчиков
  async getFollowers(req, res) {
    try {
      const db = getDb();
      const userId = req.params.id;

      const followers = await db.all(`
        SELECT u.id, u.username, u.avatar
        FROM follows f
        JOIN users u ON f.follower_id = u.id
        WHERE f.following_id = ?
      `, [userId]);

      res.json(followers);
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  // Получить подписки
  async getFollowing(req, res) {
    try {
      const db = getDb();
      const userId = req.params.id;

      const following = await db.all(`
        SELECT u.id, u.username, u.avatar
        FROM follows f
        JOIN users u ON f.following_id = u.id
        WHERE f.follower_id = ?
      `, [userId]);

      res.json(following);
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  // Получить популярные треки
  async getPopular(req, res) {
    try {
      const db = getDb();
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);

      const tracks = await db.all(`
        SELECT m.id, m.title, m.artist, m.album, m.filepath as url,
               m.color, m.duration, m.play_count, m.like_count,
               u.username as uploader, m.uploaded_at
        FROM music m
        JOIN users u ON m.user_id = u.id
        WHERE m.visibility = 'public'
        ORDER BY m.play_count DESC
        LIMIT ?
      `, [limit]);

      res.json(tracks);
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
};
