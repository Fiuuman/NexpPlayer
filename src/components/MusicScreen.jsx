import { useMemo, useState } from 'preact/hooks';

export function MusicScreen() {
  const [songs, setSongs] = useState([
    { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', liked: true },
    { id: 2, title: 'Stay', artist: 'Kid LAROI, Bieber', album: 'F*CK LOVE', duration: '2:21', liked: false },
    { id: 3, title: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland', duration: '3:58', liked: true },
    { id: 4, title: 'As It Was', artist: 'Harry Styles', album: "Harry's House", duration: '2:47', liked: true },
    { id: 5, title: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer', duration: '3:20', liked: false },
    { id: 6, title: 'Bad Habit', artist: 'Steve Lacy', album: 'Gemini Rights', duration: '3:52', liked: true },
  ]);

  const [playlists] = useState([
    { id: 1, name: 'Chill Vibes', count: 24, color: '#1db954' },
    { id: 2, name: 'Workout', count: 18, color: '#ff6b6b' },
    { id: 3, name: 'Study Focus', count: 32, color: '#4ecdc4' },
    { id: 4, name: 'Party Mix', count: 28, color: '#45b7d1' },
    { id: 5, name: 'Road Trip', count: 22, color: '#fdcb6e' },
    { id: 6, name: 'Sleep', count: 19, color: '#a29bfe' },
  ]);

  const [viewMode, setViewMode] = useState('grid');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedPlaylistData = useMemo(() => {
    return playlists.find((playlist) => playlist.id === selectedPlaylist) || null;
  }, [playlists, selectedPlaylist]);

  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let result = songs;

    if (query) {
      result = result.filter((song) =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.album.toLowerCase().includes(query)
      );
    }

    return result;
  }, [songs, searchQuery]);

  const likedSongsCount = useMemo(() => {
    return songs.filter((song) => song.liked).length;
  }, [songs]);

  const toggleLike = (songId) => {
    setSongs((prevSongs) =>
      prevSongs.map((song) =>
        song.id === songId ? { ...song, liked: !song.liked } : song
      )
    );
  };

  const handlePlaylistClick = (playlistId) => {
    setSelectedPlaylist((prev) => (prev === playlistId ? null : playlistId));
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div class="screen music-screen">
      <div class="screen-header music-header">
        <div class="header-copy">
          <span class="screen-badge">Library</span>
          <h1>My Music</h1>
          <p class="screen-subtitle">
            Управляйте любимыми треками, плейлистами и музыкальной коллекцией
          </p>
        </div>

        <div class="header-actions">
          <div class="view-toggle">
            <button
              class={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              ▦
            </button>
            <button
              class={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ≡
            </button>
          </div>

          <button class="action-btn">Add Music</button>
          <button class="action-btn primary">Create Playlist</button>
        </div>
      </div>

      <div class="music-overview">
        <div class="overview-card">
          <span class="overview-label">Всего треков</span>
          <strong class="overview-value">{songs.length}</strong>
        </div>

        <div class="overview-card">
          <span class="overview-label">Избранное</span>
          <strong class="overview-value">{likedSongsCount}</strong>
        </div>

        <div class="overview-card">
          <span class="overview-label">Плейлисты</span>
          <strong class="overview-value">{playlists.length}</strong>
        </div>

        <div class="overview-card">
          <span class="overview-label">Активный фильтр</span>
          <strong class="overview-value small">
            {selectedPlaylistData ? selectedPlaylistData.name : 'Все треки'}
          </strong>
        </div>
      </div>

      <div class="music-content">
        <div class="playlists-section">
          <div class="section-header">
            <h2>Playlists</h2>
            {selectedPlaylistData && (
              <button class="clear-filter-btn" onClick={() => setSelectedPlaylist(null)}>
                Сбросить выбор
              </button>
            )}
          </div>

          <div class={`playlists-${viewMode}`}>
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                class={`playlist-item ${selectedPlaylist === playlist.id ? 'selected' : ''}`}
                onClick={() => handlePlaylistClick(playlist.id)}
              >
                <div class="playlist-color" style={{ background: playlist.color }}>
                  <span class="playlist-icon">📁</span>
                </div>

                <div class="playlist-info">
                  <h3>{playlist.name}</h3>
                  <p>{playlist.count} songs</p>
                </div>

                <button class="play-btn" onClick={(e) => e.stopPropagation()}>
                  ▶
                </button>
              </div>
            ))}
          </div>
        </div>

        <div class="songs-section">
          <div class="section-header songs-header">
            <div>
              <h2>{selectedPlaylistData ? selectedPlaylistData.name : 'All Songs'}</h2>
              <p class="songs-subtitle">
                {filteredSongs.length} {filteredSongs.length === 1 ? 'track' : 'tracks'}
              </p>
            </div>

            <div class="search-box">
              <input
                type="text"
                placeholder="Search songs, artists, albums..."
                class="search-input"
                value={searchQuery}
                onInput={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button class="search-btn clear" onClick={clearSearch} title="Clear search">
                  ✕
                </button>
              ) : (
                <button class="search-btn" title="Search">
                  🔍
                </button>
              )}
            </div>
          </div>

          <div class="songs-table">
            <div class="table-header">
              <div class="cell-index">#</div>
              <div class="cell-title">Title</div>
              <div class="cell-album">Album</div>
              <div class="cell-duration">Duration</div>
              <div class="cell-actions"></div>
            </div>

            {filteredSongs.length > 0 ? (
              filteredSongs.map((song, index) => (
                <div key={song.id} class="table-row">
                  <div class="cell cell-index">{index + 1}</div>

                  <div class="cell cell-title">
                    <div class="song-info">
                      <div
                        class="song-cover"
                        style={{ background: `linear-gradient(135deg, hsl(${(index * 57) % 360}, 70%, 55%), hsl(${((index * 57) + 40) % 360}, 70%, 45%))` }}
                      >
                        ♪
                      </div>

                      <div class="song-meta">
                        <h4>{song.title}</h4>
                        <p>{song.artist}</p>
                      </div>
                    </div>
                  </div>

                  <div class="cell cell-album">{song.album}</div>
                  <div class="cell cell-duration">{song.duration}</div>

                  <div class="cell cell-actions">
                    <button
                      class={`like-btn ${song.liked ? 'liked' : ''}`}
                      onClick={() => toggleLike(song.id)}
                      title={song.liked ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {song.liked ? '❤️' : '🤍'}
                    </button>

                    <button class="menu-btn" title="More options">
                      ⋯
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div class="songs-empty-state">
                <div class="songs-empty-icon">🎵</div>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить поисковый запрос или очистить фильтр</p>
                <button class="empty-reset-btn" onClick={clearSearch}>
                  Очистить поиск
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MusicScreen;