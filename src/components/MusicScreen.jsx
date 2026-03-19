import { useState } from 'preact/hooks';

export function MusicScreen() {
  const [songs] = useState([
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

  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const toggleLike = (songId) => {
    console.log('Toggling like for song:', songId);
    // Здесь будет логика обновления лайков
  };

  return (
    <div class="screen">
      <div class="screen-header">
        <h1>My Music</h1>
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

      <div class="music-content">
        <div class="playlists-section">
          <h2>Playlists</h2>
          <div class={`playlists-${viewMode}`}>
            {playlists.map(playlist => (
              <div 
                key={playlist.id} 
                class={`playlist-item ${selectedPlaylist === playlist.id ? 'selected' : ''}`}
                onClick={() => setSelectedPlaylist(playlist.id)}
              >
                <div class="playlist-color" style={{ background: playlist.color }}>
                  <span class="playlist-icon">📁</span>
                </div>
                <div class="playlist-info">
                  <h3>{playlist.name}</h3>
                  <p>{playlist.count} songs</p>
                </div>
                <button class="play-btn">▶</button>
              </div>
            ))}
          </div>
        </div>

        <div class="songs-section">
          <div class="section-header">
            <h2>All Songs</h2>
            <div class="search-box">
              <input type="text" placeholder="Search songs..." class="search-input" />
              <button class="search-btn">🔍</button>
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
            
            {songs.map((song, index) => (
              <div key={song.id} class="table-row">
                <div class="cell cell-index">
                  {index + 1}
                </div>
                <div class="cell cell-title">
                  <div class="song-info">
                    <div class="song-cover" style={{ background: `hsl(${index * 60}, 70%, 50%)` }}>
                      ♪
                    </div>
                    <div>
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
                    title={song.liked ? "Remove from favorites" : "Add to favorites"}
                  >
                    {song.liked ? '❤️' : '🤍'}
                  </button>
                  <button class="menu-btn" title="More options">⋯</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MusicScreen;