import { useState, useEffect } from 'react';
import { audioPlayer } from '../services/audio-player';
import './SearchScreen.css';

export function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userTracks, setUserTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Функция для получения токена
  const getToken = () => {
    return localStorage.getItem('harmony_token');
  };

  // Загружаем треки пользователя при монтировании
  useEffect(() => {
    loadUserTracks();
  }, []);

  const loadUserTracks = async () => {
    try {
      setIsLoading(true);
      const token = getToken();
      
      const response = await fetch('http://localhost:3001/api/music/my-tracks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки треков');
      }
      
      const tracks = await response.json();
      setUserTracks(tracks);
    } catch (error) {
      console.error('Ошибка загрузки треков:', error);
      // Если нет доступа к серверу, используем локальные треки
      setUserTracks(audioPlayer.playlist.map(track => ({
        ...track,
        id: track.id.toString(),
        uploaded_at: new Date().toISOString()
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setSearchError('');

    try {
      const token = getToken();
      
      const response = await fetch(`http://localhost:3001/api/music/all?search=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Ошибка поиска');
      }
      
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Ошибка поиска:', error);
      // Локальный поиск если сервер недоступен
      const localResults = audioPlayer.playlist.filter(track =>
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(localResults.map(track => ({
        ...track,
        id: track.id.toString(),
        uploader: 'Локальная библиотека'
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setUploadError('Пожалуйста, выберите аудио файл');
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        setUploadError('Файл слишком большой (максимум 50MB)');
        return;
      }
      
      setSelectedFile(file);
      setUploadError('');
      setUploadSuccess('');
      console.log(`Выбран файл: ${file.name} Размер: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadError('Пожалуйста, выберите файл');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('music', selectedFile);
    
    // Извлекаем информацию из имени файла
    const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
    const title = fileName.split(' - ').length > 1 ? fileName.split(' - ')[1] : fileName;
    const artist = fileName.split(' - ').length > 1 ? fileName.split(' - ')[0] : 'Неизвестный исполнитель';
    
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('album', 'Загруженные треки');

    try {
      const token = getToken();
      
      // Имитация прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('http://localhost:3001/api/music/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
        throw new Error(errorData.message || 'Ошибка загрузки');
      }

      const data = await response.json();
      setUploadSuccess(`Трек "${data.track.title}" успешно загружен!`);
      setSelectedFile(null);
      
      // Обновляем список треков
      loadUserTracks();
      
      // Также добавляем в локальный плеер
      await audioPlayer.uploadMusic(selectedFile);
      
      // Сбрасываем input файла
      document.querySelector('input[type="file"]').value = '';
      
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setUploadError(error.message || 'Ошибка загрузки файла');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadError('');
        setUploadSuccess('');
      }, 3000);
    }
  };

  const handlePlayTrack = (track) => {
    // Проверяем, есть ли трек в локальном плеере
    const localTrack = audioPlayer.playlist.find(t => 
      t.id === parseInt(track.id) || t.title === track.title
    );
    
    if (localTrack) {
      audioPlayer.loadTrack(localTrack);
      audioPlayer.play();
    } else if (track.url && track.url.startsWith('http')) {
      // Если трек с сервера, создаем временный объект
      const serverTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        url: `http://localhost:3001${track.url}`,
        color: track.color || '#1db954',
        duration: track.duration || 0
      };
      
      audioPlayer.addTrack(serverTrack);
      audioPlayer.loadTrack(serverTrack);
      audioPlayer.play();
    }
  };

  const handleDeleteTrack = async (trackId) => {
    if (!confirm('Удалить этот трек?')) return;

    try {
      const token = getToken();
      
      const response = await fetch(`http://localhost:3001/api/music/${trackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления');
      }

      // Удаляем из локального списка
      setUserTracks(prev => prev.filter(track => track.id !== trackId));
      
      // Удаляем из локального плеера если есть
      const trackIndex = audioPlayer.playlist.findIndex(t => t.id === parseInt(trackId));
      if (trackIndex !== -1) {
        audioPlayer.playlist.splice(trackIndex, 1);
      }
      
      alert('Трек успешно удален');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка при удалении трека');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="search-screen">
      <div className="search-header">
        <h1>Поиск и загрузка музыки</h1>
        <p>Найдите музыку или загрузите свою</p>
      </div>

      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Искать треки, артистов, альбомы..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? '🔍 Поиск...' : '🔍 Поиск'}
          </button>
        </div>

        {/* Блок загрузки музыки */}
        <div className="upload-section">
          <h3>Загрузить музыку</h3>
          <div className="upload-area">
            <input
              type="file"
              id="music-upload"
              accept="audio/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <label htmlFor="music-upload" className="upload-button">
              {selectedFile ? (
                <div className="file-info">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                </div>
              ) : (
                <>
                  <span className="upload-icon">📁</span>
                  <span className="upload-text">Выберите аудио файл</span>
                  <span className="upload-hint">MP3, WAV, FLAC до 50MB</span>
                </>
              )}
            </label>
            
            {selectedFile && (
              <button 
                onClick={handleFileUpload} 
                disabled={isLoading}
                className="upload-submit"
              >
                {isLoading ? '⏳ Загрузка...' : '📤 Загрузить'}
              </button>
            )}
            
            {uploadProgress > 0 && (
              <div className="progress-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}
            
            {uploadError && (
              <div className="error-message">❌ {uploadError}</div>
            )}
            
            {uploadSuccess && (
              <div className="success-message">✅ {uploadSuccess}</div>
            )}
          </div>
        </div>

        {/* Результаты поиска */}
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Результаты поиска ({searchResults.length})</h3>
            <div className="tracks-grid">
              {searchResults.map(track => (
                <div key={track.id} className="track-card">
                  <div 
                    className="track-cover" 
                    style={{ background: track.color || '#1db954' }}
                  >
                    ♪
                  </div>
                  <div className="track-info">
                    <h4>{track.title}</h4>
                    <p>{track.artist} • {track.album}</p>
                    {track.uploader && (
                      <span className="uploader">Загрузил: {track.uploader}</span>
                    )}
                  </div>
                  <div className="track-actions">
                    <button 
                      className="play-btn"
                      onClick={() => handlePlayTrack(track)}
                      title="Воспроизвести"
                    >
                      ▶
                    </button>
                    <button 
                      className="add-btn"
                      onClick={() => alert('Добавить в плейлист')}
                      title="Добавить в плейлист"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Мои треки */}
        <div className="my-tracks">
          <div className="section-header">
            <h3>Мои треки ({userTracks.length})</h3>
            <button 
              className="refresh-btn" 
              onClick={loadUserTracks}
              disabled={isLoading}
            >
              {isLoading ? '🔄' : '🔄 Обновить'}
            </button>
          </div>
          
          {userTracks.length > 0 ? (
            <div className="tracks-list">
              {userTracks.map(track => (
                <div key={track.id} className="track-item">
                  <div className="track-main">
                    <div 
                      className="track-color" 
                      style={{ background: track.color || '#1db954' }}
                    ></div>
                    <div className="track-details">
                      <h4>{track.title}</h4>
                      <p>{track.artist} • {track.album}</p>
                      {track.uploaded_at && (
                        <span className="upload-date">
                          Загружен: {formatDate(track.uploaded_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="track-actions">
                    <button 
                      className="play-btn"
                      onClick={() => handlePlayTrack(track)}
                      title="Воспроизвести"
                    >
                      ▶
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteTrack(track.id)}
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h4>У вас пока нет загруженных треков</h4>
              <p>Загрузите музыку чтобы начать слушать</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchScreen;