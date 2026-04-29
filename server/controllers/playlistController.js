import { getDb } from '../config/database.js';

export const playlistController = {
  async create(req, res) {
    try {
      const db = getDb();
      const { name, description = '', color = '#1db954', isPublic = true } = req.body;

      if (!name) return res.status(400).json({ message: 'Название обязательно' });

      const result = await db.run(
        'INSERT INTO playlists (user_id, name, description, color, is_public) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, name, description, color, isPublic ? 1 : 0]
      );

      await db.run('UPDATE user_stats SET total_playlists = total_playlists + 1 WHERE user_id = ?', [req.user.id]);

      const playlist = await db.get('SELECT * FROM playlists WHERE id = ?', [result.lastID]);
      res.status(201).json({ message: 'Плейлист создан', playlist });
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async getMyPlaylists(req, res) {
    try {
      const db = getDb();
      const playlists = await db.all(`
        SELECT p.*, COUNT(pt.track_id) as track_count
        FROM playlists p
        LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
        WHERE p.user_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `, [req.user.id]);

      res.json(playlists);
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async getPlaylistById(req, res) {
    try {
      const db = getDb();
      const playlistId = req.params.id;

      const playlist = await db.get(`
        SELECT p.*, u.username as author
        FROM playlists p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `, [playlistId]);

      if (!playlist) return res.status(404).json({ message: 'Плейлист не найден' });

      // Проверяем доступ
      if (!playlist.is_public && playlist.user_id !== req.user?.id) {
        return res.status(403).json({ message: 'Нет доступа' });
      }

      const tracks = await db.all(`
        SELECT m.id, m.title, m.artist, m.album, m.filepath as url,
               m.color, m.duration, m.play_count, m.like_count
        FROM music m
        JOIN playlist_tracks pt ON m.id = pt.track_id
        WHERE pt.playlist_id = ?
        ORDER BY pt.added_at
      `, [playlistId]);

      res.json({ ...playlist, tracks });
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async addTrack(req, res) {
    try {
      const db = getDb();
      const { playlistId } = req.params;
      const { trackId } = req.body;

      if (!trackId) return res.status(400).json({ message: 'ID трека обязателен' });

      const playlist = await db.get(
        'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
        [playlistId, req.user.id]
      );
      if (!playlist) return res.status(404).json({ message: 'Плейлист не найден' });

      const track = await db.get('SELECT * FROM music WHERE id = ?', [trackId]);
      if (!track) return res.status(404).json({ message: 'Трек не найден' });

      const existing = await db.get(
        'SELECT * FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
        [playlistId, trackId]
      );
      if (existing) return res.status(400).json({ message: 'Трек уже в плейлисте' });

      await db.run(
        'INSERT INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)',
        [playlistId, trackId]
      );

      res.json({ message: 'Трек добавлен в плейлист' });
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async removeTrack(req, res) {
    try {
      const db = getDb();
      const { playlistId, trackId } = req.params;

      const playlist = await db.get(
        'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
        [playlistId, req.user.id]
      );
      if (!playlist) return res.status(404).json({ message: 'Плейлист не найден' });

      await db.run(
        'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
        [playlistId, trackId]
      );

      res.json({ message: 'Трек удален из плейлиста' });
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  },

  async delete(req, res) {
    try {
      const db = getDb();
      const playlistId = req.params.id;

      const playlist = await db.get(
        'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
        [playlistId, req.user.id]
      );
      if (!playlist) return res.status(404).json({ message: 'Плейлист не найден' });

      await db.run('DELETE FROM playlists WHERE id = ?', [playlistId]);
      await db.run('UPDATE user_stats SET total_playlists = total_playlists - 1 WHERE user_id = ?', [req.user.id]);

      res.json({ message: 'Плейлист удален' });
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
};
