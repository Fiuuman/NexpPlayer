import { useState, useEffect } from 'react';
import { audioPlayer } from '../services/audio-player';
import './SearchScreen.css';

export function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userTracks, setUserTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [searchError, setSearchError] = useState('');

  const getToken = () => {
    return localStorage.getItem('harmony_token');
  };

  useEffect(() => {
    loadUserTracks();
  }, []);

  const loadUserTracks = async () => {
    try {
      setIsLoading(true);
      const token = getToken();

      const response = await fetch('http://localhost:3001/api/music/my-tracks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки треков');
      }

      const tracks = await response.json();
      setUserTracks(tracks);
    } catch (error) {
      console.error('Ошибка загрузки треков:', error);

      setUserTracks(
        audioPlayer.playlist.map((track) => ({
          ...track,
          id: track.id.toString(),
          uploaded_at: new Date().toISOString(),
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const token = getToken();

      const response = await fetch(
        `http://localhost:3001/api/music/all?search=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка поиска');
      }

      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setSearchError('Сервер недоступен. Показаны результаты из локальной библиотеки.');

      const localResults = audioPlayer.playlist.filter(
        (track) =>
          track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (track.album || '').toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(
        localResults.map((track) => ({
          ...track,
          id: track.id.toString(),
          uploader: 'Локальная библиотека',
        }))
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setUploadError('Пожалуйста, выберите аудио файл');
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Файл слишком большой (максимум 50MB)');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadError('');
    setUploadSuccess('');
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

    const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
    const title = fileName.split(' - ').length > 1 ? fileName.split(' - ')[1] : fileName;
    const artist = fileName.split(' - ').length > 1 ? fileName.split(' - ')[0] : 'Неизвестный исполнитель';

    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('album', 'Загруженные треки');

    let progressInterval;

    try {
      const token = getToken();

      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 100);

      const response = await fetch('http://localhost:3001/api/music/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
        throw new Error(errorData.message || 'Ошибка загрузки');
      }

      const data = await response.json();
      setUploadSuccess(`Трек "${data.track.title}" успешно загружен`);
      setSelectedFile(null);

      await loadUserTracks();
      await audioPlayer.uploadMusic(selectedFile);

      const fileInput = document.getElementById('music-upload');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setUploadError(error.message || 'Ошибка загрузки файла');
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);

      setTimeout(() => {
        setUploadProgress(0);
        setUploadError('');
        setUploadSuccess('');
      }, 3000);
    }
  };

  const handlePlayTrack = (track) => {
    const localTrack = audioPlayer.playlist.find(
      (t) => t.id === parseInt(track.id) || t.title === track.title
    );

    if (localTrack) {
      audioPlayer.loadTrack(localTrack);
      audioPlayer.play();
    } else if (track.url && track.url.startsWith('http')) {
      const serverTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        url: `http://localhost:3001${track.url}`,
        color: track.color || '#7c5cff',
        duration: track.duration || 0,
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
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления');
      }

      setUserTracks((prev) => prev.filter((track) => track.id !== trackId));

      const trackIndex = audioPlayer.playlist.findIndex((t) => t.id === parseInt(trackId));
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
        <span className="search-badge">Search & Upload</span>
        <h1>Поиск и загрузка музыки</h1>
        <p>Найдите новые треки, управляйте своей библиотекой и загружайте музыку</p>
      </div>

      <div className="search-container">
        <div className="search-panel">
          <div className="search-box">
            <input
              type="text"
              placeholder="Искать треки, артистов, альбомы..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Поиск...' : 'Найти'}
            </button>
          </div>

          {searchError && (
            <div className="info-message">ℹ️ {searchError}</div>
          )}
        </div>

        <div className="upload-section">
          <div className="section-top">
            <div>
              <h3>Загрузить музыку</h3>
              <p>Поддерживаются MP3, WAV, FLAC до 50MB</p>
            </div>
          </div>

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
                  <span className="upload-icon">🎵</span>
                  <span className="upload-text">Выберите аудио файл</span>
                  <span className="upload-hint">Перетащите файл или выберите его вручную</span>
                </>
              )}
            </label>

            {selectedFile && (
              <button
                onClick={handleFileUpload}
                disabled={isLoading}
                className="upload-submit"
              >
                {isLoading ? 'Загрузка...' : 'Загрузить трек'}
              </button>
            )}

            {uploadProgress > 0 && (
              <div className="progress-wrap">
                <div className="progress-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}

            {uploadError && <div className="error-message">❌ {uploadError}</div>}
            {uploadSuccess && <div className="success-message">✅ {uploadSuccess}</div>}
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            <div className="section-header">
              <h3>Результаты поиска</h3>
              <span className="section-count">{searchResults.length}</span>
            </div>

            <div className="tracks-grid">
              {searchResults.map((track) => (
                <div key={track.id} className="track-card">
                  <div
                    className="track-cover"
                    style={{ background: track.color || '#7c5cff' }}
                  >
                    ♪
                  </div>

                  <div className="track-info">
                    <h4>{track.title}</h4>
                    <p>{track.artist} • {track.album}</p>
                    {track.uploader && (
                      <span className="uploader">Источник: {track.uploader}</span>
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

        <div className="my-tracks">
          <div className="section-header">
            <h3>Мои треки</h3>
            <div className="section-actions">
              <span className="section-count">{userTracks.length}</span>
              <button
                className="refresh-btn"
                onClick={loadUserTracks}
                disabled={isLoading}
              >
                {isLoading ? 'Обновление...' : 'Обновить'}
              </button>
            </div>
          </div>

          {userTracks.length > 0 ? (
            <div className="tracks-list">
              {userTracks.map((track) => (
                <div key={track.id} className="track-item">
                  <div className="track-main">
                    <div
                      className="track-color"
                      style={{ background: track.color || '#7c5cff' }}
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
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h4>У вас пока нет загруженных треков</h4>
              <p>Загрузите музыку, чтобы начать собирать свою библиотеку</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchScreen;