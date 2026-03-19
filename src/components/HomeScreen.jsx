import { useState, useEffect } from 'react';
import { audioPlayer } from '../services/audio-player';
import './HomeScreen.css';

export function HomeScreen() {
  const [playerState, setPlayerState] = useState(audioPlayer.getState());
  const [recentTracks, setRecentTracks] = useState([]);
  const [topPlaylists, setTopPlaylists] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Подписываемся на обновления плеера
    const handleStateChange = (state) => {
      setPlayerState(state);
    };

    audioPlayer.addListener(handleStateChange);
    
    // Загружаем данные пользователя
    const savedUser = localStorage.getItem('harmony_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    }
    
    // Загружаем последние прослушанные треки из истории
    loadRecentTracks();
    loadPlaylists();
    
    return () => {
      audioPlayer.removeListener(handleStateChange);
    };
  }, []);

  const loadRecentTracks = () => {
    // Получаем последние прослушанные треки из плеера
    const allTracks = audioPlayer.playlist;
    const recent = allTracks.slice(-4).reverse(); // Последние 4 трека
    setRecentTracks(recent);
  };

  const loadPlaylists = () => {
    // Загружаем плейлисты из localStorage
    const savedPlaylists = JSON.parse(localStorage.getItem('harmony_playlists') || '[]');
    if (savedPlaylists.length > 0) {
      setTopPlaylists(savedPlaylists.slice(0, 4));
    } else {
      // Если нет сохраненных, показываем дефолтные
      setTopPlaylists([
        { id: 1, name: 'Избранное', count: 0, color: '#1db954', tracks: [] },
        { id: 2, name: 'Загруженные', count: audioPlayer.playlist.length, color: '#ff6b6b', tracks: [] },
        { id: 3, name: 'Для работы', count: 0, color: '#6c5ce7', tracks: [] },
        { id: 4, name: 'Для отдыха', count: 0, color: '#fdcb6e', tracks: [] },
      ]);
    }
  };

  const handlePlayTrack = (track) => {
    // Ищем трек в плейлисте плеера
    const index = audioPlayer.playlist.findIndex(t => t.id === track.id);
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
        alert(`Трек "${track.title}" успешно загружен!`);
        
        // Обновляем список последних треков
        loadRecentTracks();
        // Обновляем плейлист "Загруженные"
        loadPlaylists();
        
        // Если это первый трек, начинаем воспроизведение
        if (audioPlayer.playlist.length === 1) {
          audioPlayer.loadTrack(track, 0);
          audioPlayer.play();
        }
      } catch (error) {
        alert('Ошибка при загрузке трека: ' + error.message);
      }
    } else {
      alert('Пожалуйста, выберите аудио файл (MP3, WAV, etc.)');
    }
    e.target.value = ''; // Сбрасываем input
  };

  const handleCreatePlaylist = () => {
    const name = prompt('Введите название плейлиста:');
    if (name && name.trim()) {
      const newPlaylist = {
        id: Date.now(),
        name: name.trim(),
        count: 0,
        color: getRandomColor(),
        tracks: []
      };
      
      const savedPlaylists = JSON.parse(localStorage.getItem('harmony_playlists') || '[]');
      savedPlaylists.push(newPlaylist);
      localStorage.setItem('harmony_playlists', JSON.stringify(savedPlaylists));
      
      loadPlaylists();
      alert(`Плейлист "${name}" создан!`);
    }
  };

  const getRandomColor = () => {
    const colors = ['#1db954', '#ff6b6b', '#6c5ce7', '#fdcb6e', '#4ecdc4', '#45b7d1', '#a29bfe', '#fd79a8'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="welcome-section">
          <h1>Добро пожаловать{user?.username ? `, ${user.username}` : ''}!</h1>
          <p>Ваша музыкальная вселенная</p>
        </div>
        
        <div className="quick-stats">
          <div className="quick-stat">
            <span className="stat-icon">▶</span>
            <div>
              <span className="stat-value">Сейчас играет</span>
              <span className="stat-label">
                {playerState.currentTrack 
                  ? `${playerState.currentTrack.title} - ${playerState.currentTrack.artist}`
                  : 'Выберите трек для воспроизведения'}
              </span>
            </div>
          </div>
          <div className="quick-stat">
            <span className="stat-icon">⏱️</span>
            <div>
              <span className="stat-value">{formatTime(playerState.duration)}</span>
              <span className="stat-label">Длительность трека</span>
            </div>
          </div>
          <div className="quick-stat">
            <span className="stat-icon">🎵</span>
            <div>
              <span className="stat-value">{audioPlayer.playlist.length}</span>
              <span className="stat-label">Треков в библиотеке</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard">
        {/* Секция последних треков */}
        <div className="recent-section">
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
              {recentTracks.map(track => (
                <div key={track.id} className="track-card" onClick={() => handlePlayTrack(track)}>
                  <div className="track-cover" style={{ background: track.color }}>
                    {playerState.currentTrack?.id === track.id && playerState.isPlaying ? '🎵' : '♪'}
                  </div>
                  <div className="track-info">
                    <h4>{track.title}</h4>
                    <p>{track.artist} • {track.album}</p>
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
                    {playerState.currentTrack?.id === track.id && playerState.isPlaying ? '⏸️' : '▶'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h3>Пока нет прослушанных треков</h3>
              <p>Начните воспроизведение или загрузите музыку</p>
            </div>
          )}
        </div>

        {/* Секция плейлистов */}
        <div className="top-section">
          <div className="section-header">
            <h2>Ваши плейлисты</h2>
            <button className="see-all-btn" onClick={() => alert('Управление плейлистами доступно в разделе "Музыка"')}>
              Все плейлисты →
            </button>
          </div>
          
          <div className="playlists-grid">
            {topPlaylists.map(playlist => (
              <div key={playlist.id} className="playlist-card">
                <div className="playlist-color" style={{ background: playlist.color }}></div>
                <div className="playlist-info">
                  <h3>{playlist.name}</h3>
                  <p>{playlist.count} {playlist.count === 1 ? 'трек' : 'треков'}</p>
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

        {/* Рекомендации */}
        <div className="recommendations">
          <h2>Рекомендуем вам</h2>
          <div className="recommendation-cards">
            <div className="recommendation-card">
              <div className="rec-cover" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <span>🎧</span>
              </div>
              <h4>Новинки недели</h4>
              <p>Свежие релизы</p>
            </div>
            <div className="recommendation-card">
              <div className="rec-cover" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                <span>🎶</span>
              </div>
              <h4>Подборка для вас</h4>
              <p>На основе вашего вкуса</p>
            </div>
            <div className="recommendation-card">
              <div className="rec-cover" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                <span>🔥</span>
              </div>
              <h4>Тренды</h4>
              <p>Что слушают прямо сейчас</p>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="trending-section">
          <h2>Ваша статистика</h2>
          <div className="trending-grid">
            <div className="trending-card">
              <div className="trending-badge">🔥</div>
              <div className="trending-info">
                <h3>Любимый жанр</h3>
                <p>На основе прослушиваний</p>
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
                <p>Самый прослушиваемый</p>
              </div>
              <div className="trending-stats">
                <span className="trending-count">The Weeknd</span>
                <span className="trending-label">артист</span>
              </div>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="quick-actions">
          <h2>Быстрые действия</h2>
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
            <button className="action-button" onClick={() => window.location.href = '/search'}>
              <span className="action-icon">🔍</span>
              <span className="action-text">Найти музыку</span>
            </button>
            <button className="action-button" onClick={() => alert('Радиостанции скоро будут доступны')}>
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