import { useState, useEffect } from 'react';
import { audioPlayer } from '../services/audio-player';
import './PlayerBar.css';

export function PlayerBar() {
  const [playerState, setPlayerState] = useState(audioPlayer.getState());
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    const handleStateChange = (state) => {
      setPlayerState(state);
    };

    audioPlayer.addListener(handleStateChange);
    
    // Загружаем сохраненные треки
    audioPlayer.loadFromLocalStorage();

    return () => {
      audioPlayer.removeListener(handleStateChange);
    };
  }, []);

  const handlePlayPause = () => {
    audioPlayer.togglePlay();
  };

  const handleNext = () => {
    audioPlayer.next();
  };

  const handlePrev = () => {
    audioPlayer.prev();
  };

  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    audioPlayer.setVolume(volume);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioPlayer.seek(time);
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="player-bar">
      {/* Текущий трек */}
      <div className="now-playing">
        {playerState.currentTrack ? (
          <>
            <div 
              className="track-cover" 
              style={{ background: playerState.currentTrack.color }}
            >
              ♪
            </div>
            <div className="track-info">
              <h4>{playerState.currentTrack.title}</h4>
              <p>{playerState.currentTrack.artist}</p>
            </div>
          </>
        ) : (
          <div className="track-info">
            <h4>Выберите трек для воспроизведения</h4>
            <p>Нет активного трека</p>
          </div>
        )}
      </div>

      {/* Основные контролы */}
      <div className="player-controls">
        <div className="control-buttons">
          <button className="control-btn" onClick={handlePrev} title="Предыдущий">
            ⏮
          </button>
          <button className="control-btn play-btn" onClick={handlePlayPause} title={playerState.isPlaying ? 'Пауза' : 'Воспроизвести'}>
            {playerState.isPlaying ? '⏸️' : '▶️'}
          </button>
          <button className="control-btn" onClick={handleNext} title="Следующий">
            ⏭
          </button>
        </div>

        <div className="progress-container">
          <span className="time-current">{formatTime(playerState.currentTime)}</span>
          <input
            type="range"
            className="progress-bar"
            min="0"
            max={playerState.duration || 100}
            value={playerState.currentTime || 0}
            onChange={handleSeek}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchStart={handleSeekStart}
            onTouchEnd={handleSeekEnd}
          />
          <span className="time-total">{formatTime(playerState.duration)}</span>
        </div>
      </div>

      {/* Громкость */}
      <div className="volume-control">
        <span className="volume-icon">🔊</span>
        <input
          type="range"
          className="volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={playerState.volume}
          onChange={handleVolumeChange}
        />
        <span className="volume-percent">{Math.round(playerState.volume * 100)}%</span>
      </div>
    </div>
  );
}


export default PlayerBar;