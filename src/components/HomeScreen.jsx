import { useState, useEffect } from 'react';
import { audioPlayer } from '../services/audio-player';
import './HomeScreen.css';

export function HomeScreen() {
  const [playerState, setPlayerState] = useState(audioPlayer.getState());
  const [recentTracks, setRecentTracks] = useState([]);
  const [topPlaylists, setTopPlaylists] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleStateChange = (state) => {
      setPlayerState(state);
    };

    audioPlayer.addListener(handleStateChange);

    loadUser();
    loadRecentTracks();
    loadPlaylists();

    return () => {
      audioPlayer.removeListener(handleStateChange);
    };
  }, []);

  const loadUser = () => {
    try {
      const savedUser = localStorage.getItem('harmony_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Ошибка чтения пользователя:', error);
      setUser(null);
    }
  };

  const loadRecentTracks = () => {
    const allTracks = audioPlayer.playlist || [];
    const recent = allTracks.slice(-4).reverse();
    setRecentTracks(recent);
  };

  const loadPlaylists = () => {
    try {
      const savedPlaylists = JSON.parse(localStorage.getItem('harmony_playlists') || '[]');

      if (savedPlaylists.length > 0) {
        setTopPlaylists(savedPlaylists.slice(0, 4));
      } else {
        setTopPlaylists([
          { id: 1, name: 'Избранное', count: 0, color: '#7c5cff', tracks: [] },
          { id: 2, name: 'Загруженные', count: audioPlayer.playlist.length, color: '#ff6b6b', tracks: [] },
          { id: 3, name: 'Для работы', count: 0, color: '#22c55e', tracks: [] },
          { id: 4, name: 'Для отдыха', count: 0, color: '#f59e0b', tracks: [] },
        ]);
      }
    } catch (error) {
      console.error('Ошибка чтения плейлистов:', error);
      setTopPlaylists([]);
    }
  };

  const handlePlayTrack = (track) => {
    const index = audioPlayer.playlist.findIndex((t) => t.id === track.id);
    if (index !== -1) {
      audioPlayer.loadTrack(track, index);
      audioPlayer.play();
    }
  };

  const handleMusicUpload = async (e) => {
    const file = e.target.files[0];

    if (file && file.type.startsWith('audio/')) {
      try {
        const track = await audioPlayer.uploadMusic(file);
        alert(`Трек "${track.title}" успешно загружен`);

        loadRecentTracks();
        loadPlaylists();

        if (audioPlayer.playlist.length === 1) {
          audioPlayer.loadTrack(track, 0);
          audioPlayer.play();
        }
      } catch (error) {
        alert('Ошибка при загрузке трека: ' + error.message);
      }
    } else {
      alert('Пожалуйста, выберите аудио файл');
    }

    e.target.value = '';
  };

  const handleCreatePlaylist = () => {
    const name = prompt('Введите название плейлиста:');

    if (name && name.trim()) {
      const newPlaylist = {
        id: Date.now(),
        name: name.trim(),
        count: 0,
        color: getRandomColor(),
        tracks: [],
      };

      const savedPlaylists = JSON.parse(localStorage.getItem('harmony_playlists') || '[]');
      savedPlaylists.push(newPlaylist);
      localStorage.setItem('harmony_playlists', JSON.stringify(savedPlaylists));

      loadPlaylists();
      alert(`Плейлист "${name}" создан`);
    }
  };

  const getRandomColor = () => {
    const colors = ['#7c5cff', '#ff6b6b', '#22c55e', '#f59e0b', '#06b6d4', '#e879f9', '#3b82f6', '#f43f5e'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTrackText = playerState.currentTrack
    ? `${playerState.currentTrack.title} — ${playerState.currentTrack.artist}`
    : 'Выберите трек для воспроизведения';

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="welcome-section">
          <span className="welcome-badge">Главная</span>
          <h1>Добро пожаловать{user?.username ? `, ${user.username}` : ''}</h1>
          <p>Ваша музыкальная вселенная в одном месте</p>
        </div>

        <div className="quick-stats">
          <div className="quick-stat">
            <span className="stat-icon">▶</span>
            <div className="stat-content">
              <span className="stat-value">Сейчас играет</span>
              <span className="stat-label">{currentTrackText}</span>
            </div>
          </div>

          <div className="quick-stat">
            <span className="stat-icon">⏱️</span>
            <div className="stat-content">
              <span className="stat-value">{formatTime(playerState.duration)}</span>
              <span className="stat-label">Длительность текущего трека</span>
            </div>
          </div>

          <div className="quick-stat">
            <span className="stat-icon">🎵</span>
            <div className="stat-content">
              <span className="stat-value">{audioPlayer.playlist.length}</span>
              <span className="stat-label">Треков в вашей библиотеке</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard">
        <div className="recent-section section-card">
          <div className="section-header">
            <h2>Недавно прослушанные</h2>
            {recentTracks.length > 0 && (
              <button
                className="see-all-btn"
                onClick={() => alert('Полный список треков доступен в разделе "Музыка"')}
              >
                Все треки →
              </button>
            )}
          </div>

          {recentTracks.length > 0 ? (
            <div className="recent-tracks">
              {recentTracks.map((track) => (
                <div key={track.id} className="track-card" onClick={() => handlePlayTrack(track)}>
                  <div className="track-cover" style={{ background: track.color || '#7c5cff' }}>
                    {playerState.currentTrack?.id === track.id && playerState.isPlaying ? '🎵' : '♪'}
                  </div>

                  <div className="track-info">
                    <h4>{track.title}</h4>
                    <p>
                      {track.artist}
                      {track.album ? ` • ${track.album}` : ''}
                    </p>
                    {track.duration > 0 && (
                      <span className="track-duration">{formatTime(track.duration)}</span>
                    )}
                  </div>

                  <button
                    className={`play-btn ${playerState.currentTrack?.id === track.id ? 'playing' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (playerState.currentTrack?.id === track.id && playerState.isPlaying) {
                        audioPlayer.pause();
                      } else {
                        handlePlayTrack(track);
                      }
                    }}
                  >
                    {playerState.currentTrack?.id === track.id && playerState.isPlaying ? '⏸' : '▶'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h3>Пока нет прослушанных треков</h3>
              <p>Добавьте музыку в библиотеку или начните воспроизведение первого трека</p>

              <div className="empty-actions">
                <label className="empty-action primary">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleMusicUpload}
                    style={{ display: 'none' }}
                  />
                  Загрузить трек
                </label>

                <button
                  className="empty-action secondary"
                  onClick={() => alert('Поиск музыки доступен в разделе "Search"')}
                >
                  Открыть поиск
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="top-section section-card">
          <div className="section-header">
            <h2>Ваши плейлисты</h2>
            <button
              className="see-all-btn"
              onClick={() => alert('Управление плейлистами доступно в разделе "Музыка"')}
            >
              Все плейлисты →
            </button>
          </div>

          <div className="playlists-grid">
            {topPlaylists.map((playlist) => (
              <div key={playlist.id} className="playlist-card">
                <div className="playlist-color" style={{ background: playlist.color }}></div>

                <div className="playlist-info">
                  <h3>{playlist.name}</h3>
                  <p>{playlist.count > 0 ? `${playlist.count} треков` : 'Плейлист пока пуст'}</p>
                </div>

                <button
                  className="play-btn"
                  onClick={() => alert(`Воспроизведение плейлиста "${playlist.name}"`)}
                >
                  ▶
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="recommendations section-card">
          <div className="section-header">
            <h2>Рекомендуем вам</h2>
          </div>

          <div className="recommendation-cards">
            <div className="recommendation-card">
              <div className="rec-cover" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <span>🎧</span>
              </div>
              <h4>Новинки недели</h4>
              <p>Свежие релизы и новые открытия</p>
            </div>

            <div className="recommendation-card">
              <div className="rec-cover" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                <span>🎶</span>
              </div>
              <h4>Подборка для вас</h4>
              <p>Музыка на основе ваших предпочтений</p>
            </div>

            <div className="recommendation-card">
              <div className="rec-cover" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                <span>🔥</span>
              </div>
              <h4>Тренды</h4>
              <p>То, что слушают прямо сейчас</p>
            </div>
          </div>
        </div>

        <div className="trending-section section-card">
          <div className="section-header">
            <h2>Ваша статистика</h2>
          </div>

          <div className="trending-grid">
            <div className="trending-card">
              <div className="trending-badge">🔥</div>
              <div className="trending-info">
                <h3>Любимый жанр</h3>
                <p>На основе ваших прослушиваний</p>
              </div>
              <div className="trending-stats">
                <span className="trending-count">Поп</span>
                <span className="trending-label">жанр</span>
              </div>
            </div>

            <div className="trending-card">
              <div className="trending-badge">🚀</div>
              <div className="trending-info">
                <h3>Активность</h3>
                <p>За последнюю неделю</p>
              </div>
              <div className="trending-stats">
                <span className="trending-count">12ч</span>
                <span className="trending-label">времени</span>
              </div>
            </div>

            <div className="trending-card">
              <div className="trending-badge">🎯</div>
              <div className="trending-info">
                <h3>Топ-артист</h3>
                <p>Самый прослушиваемый исполнитель</p>
              </div>
              <div className="trending-stats">
                <span className="trending-count">The Weeknd</span>
                <span className="trending-label">артист</span>
              </div>
            </div>
          </div>
        </div>

        <div className="quick-actions section-card">
          <div className="section-header">
            <h2>Быстрые действия</h2>
          </div>

          <div className="actions-grid">
            <label className="action-button">
              <input
                type="file"
                accept="audio/*"
                onChange={handleMusicUpload}
                style={{ display: 'none' }}
              />
              <span className="action-icon">➕</span>
              <span className="action-text">Добавить музыку</span>
            </label>

            <button className="action-button" onClick={handleCreatePlaylist}>
              <span className="action-icon">📁</span>
              <span className="action-text">Создать плейлист</span>
            </button>

            <button
              className="action-button"
              onClick={() => alert('Поиск музыки доступен в разделе "Search"')}
            >
              <span className="action-icon">🔍</span>
              <span className="action-text">Найти музыку</span>
            </button>

            <button
              className="action-button"
              onClick={() => alert('Радиостанции скоро будут доступны')}
            >
              <span className="action-icon">🎧</span>
              <span className="action-text">Радио</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;