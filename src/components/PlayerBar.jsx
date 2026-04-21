import { useState, useEffect, useMemo, useRef } from 'react';
import { audioPlayer } from '../services/audio-player';
import './PlayerBar.css';

export function PlayerBar() {
  const [playerState, setPlayerState] = useState(audioPlayer.getState());
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [lastVolume, setLastVolume] = useState(1);

  const seekRef = useRef(null);

  useEffect(() => {
    const handleStateChange = (state) => {
      setPlayerState(state);

      if (!isSeeking) {
        setSeekValue(state.currentTime || 0);
      }
    };

    audioPlayer.addListener(handleStateChange);
    audioPlayer.loadFromLocalStorage();

    const initialState = audioPlayer.getState();
    setSeekValue(initialState.currentTime || 0);

    if ((initialState.volume ?? 1) > 0) {
      setLastVolume(initialState.volume);
    }

    return () => {
      audioPlayer.removeListener(handleStateChange);
    };
  }, [isSeeking]);

  const handlePlayPause = () => audioPlayer.togglePlay();
  const handleNext = () => audioPlayer.next();
  const handlePrev = () => audioPlayer.prev();

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);

    if (!Number.isNaN(newVolume)) {
      audioPlayer.setVolume(newVolume);

      if (newVolume > 0) {
        setLastVolume(newVolume);
      }
    }
  };

  const handleToggleMute = () => {
    const currentVolume = playerState.volume ?? 1;

    if (currentVolume > 0) {
      setLastVolume(currentVolume);
      audioPlayer.setVolume(0);
    } else {
      audioPlayer.setVolume(lastVolume > 0 ? lastVolume : 1);
    }
  };

  const handleSeekChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!Number.isNaN(value)) {
      setSeekValue(value);
    }
  };

  const commitSeek = (value) => {
    if (!Number.isNaN(value)) {
      audioPlayer.seek(value);
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    commitSeek(seekValue);
  };

  const handleSeekClick = (e) => {
    const value = parseFloat(e.target.value);
    if (!Number.isNaN(value)) {
      setSeekValue(value);
      commitSeek(value);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const duration = playerState.duration || 0;
  const displayedCurrentTime = isSeeking ? seekValue : playerState.currentTime || 0;

  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return Math.min((displayedCurrentTime / duration) * 100, 100);
  }, [displayedCurrentTime, duration]);

  const volumePercent = Math.round((playerState.volume || 0) * 100);

  const getVolumeIcon = () => {
    if (volumePercent === 0) return '🔇';
    if (volumePercent <= 35) return '🔉';
    return '🔊';
  };

  const hasTrack = Boolean(playerState.currentTrack);

  return (
    <div className="player-bar">
      <div className="player-glow"></div>

      <div className="now-playing">
        {hasTrack ? (
          <>
            <div
              className="track-cover"
              style={{
                background: `linear-gradient(135deg, ${playerState.currentTrack.color || '#7c5cff'} 0%, #151922 100%)`,
              }}
              title={playerState.currentTrack.title}
            >
              🎵
            </div>

            <div className="track-info">
              <span className="track-status">
                {playerState.isPlaying ? 'Now Playing' : 'Paused'}
              </span>
              <h4>{playerState.currentTrack.title}</h4>
              <p>{playerState.currentTrack.artist}</p>
            </div>
          </>
        ) : (
          <div className="track-info empty-track-info">
            <span className="track-status">Idle</span>
            <h4>Нет активного трека</h4>
            <p>Выберите музыку, чтобы начать воспроизведение</p>
          </div>
        )}
      </div>

      <div className="player-controls">
        <div className="control-buttons">
          <button
            className="control-btn subtle"
            onClick={handlePrev}
            title="Предыдущий"
            disabled={!hasTrack}
          >
            ⏮
          </button>

          <button
            className={`control-btn play-btn ${playerState.isPlaying ? 'playing' : ''}`}
            onClick={handlePlayPause}
            title={playerState.isPlaying ? 'Пауза' : 'Воспроизвести'}
            disabled={!hasTrack}
          >
            {playerState.isPlaying ? '⏸' : '▶'}
          </button>

          <button
            className="control-btn subtle"
            onClick={handleNext}
            title="Следующий"
            disabled={!hasTrack}
          >
            ⏭
          </button>
        </div>

        <div className={`progress-container ${!hasTrack ? 'disabled' : ''}`}>
          <span className="time-current">{formatTime(displayedCurrentTime)}</span>

          <div className="progress-track">
            <div
              className="progress-fill-visual"
              style={{ width: `${progressPercent}%` }}
            ></div>

            <input
              ref={seekRef}
              type="range"
              className="progress-bar"
              min="0"
              max={duration || 100}
              step="0.1"
              value={displayedCurrentTime}
              onInput={handleSeekChange}
              onChange={handleSeekClick}
              onMouseDown={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onTouchStart={handleSeekStart}
              onTouchEnd={handleSeekEnd}
              disabled={!hasTrack}
            />
          </div>

          <span className="time-total">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="volume-control">
        <button
          className="volume-toggle-btn"
          onClick={handleToggleMute}
          title={volumePercent === 0 ? 'Включить звук' : 'Выключить звук'}
        >
          {getVolumeIcon()}
        </button>

        <div className="volume-track">
          <div
            className="volume-fill-visual"
            style={{ width: `${volumePercent}%` }}
          ></div>

          <input
            type="range"
            className="volume-slider"
            min="0"
            max="1"
            step="0.01"
            value={playerState.volume}
            onInput={handleVolumeChange}
            onChange={handleVolumeChange}
          />
        </div>

        <span className="volume-percent">{volumePercent}%</span>
      </div>
    </div>
  );
}

export default PlayerBar;