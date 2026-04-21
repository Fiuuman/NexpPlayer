import './MenuBar.css';

const MenuBar = ({
  activeScreen,
  setActiveScreen,
  isExpanded,
  setIsExpanded,
  playlistCount,
  user
}) => {
  const menuItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'search', icon: '🔍', label: 'Search' },
    { id: 'music', icon: '🎵', label: 'My Music' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];

  const playlistItems = [
    { icon: '❤️', name: 'Liked Songs', count: 89 },
    { icon: '🔥', name: 'Hot Hits', count: 50 },
    { icon: '😴', name: 'Chill Vibes', count: 32 },
    { icon: '🚗', name: 'Road Trip', count: 45 },
  ];

  const statsItems = [
    { number: 245, label: 'Songs' },
    { number: 89, label: 'Favorites' },
    { number: 12, label: 'Playlists' },
    { number: 245, label: 'Hours' },
  ];

  const username = user?.username || 'Guest';
  const email = user?.email || 'guest@nexp.local';
  const avatarLetter = username?.[0]?.toUpperCase() || 'G';

  const handleMenuItemClick = (id) => {
    setActiveScreen(id);
    if (window.innerWidth < 768) {
      setIsExpanded(false);
    }
  };

  return (
    <aside className={`menu-bar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="menu-header">
        <button
          className="toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Свернуть меню' : 'Развернуть меню'}
          aria-label={isExpanded ? 'Свернуть меню' : 'Развернуть меню'}
        >
          {isExpanded ? '◀' : '▶'}
        </button>

        {isExpanded && (
          <div className="app-brand">
            <div className="logo">🎵</div>
            <h1 className="app-name">NexpPlayer</h1>
          </div>
        )}
      </div>

      <div className="user-section">
        <div className="user-avatar-container">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={username}
              className="user-avatar"
              onClick={() => handleMenuItemClick('profile')}
            />
          ) : (
            <div
              className="avatar-placeholder"
              onClick={() => handleMenuItemClick('profile')}
            >
              {avatarLetter}
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="user-info">
            <div className="username">{username}</div>
            <div className="user-email">{email}</div>
            <div className="user-premium-badge">Premium</div>
          </div>
        )}
      </div>

      <nav className="menu-items">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activeScreen === item.id ? 'active' : ''}`}
            onClick={() => handleMenuItemClick(item.id)}
            title={item.label}
          >
            <span className="menu-icon">{item.icon}</span>

            {isExpanded && <span className="menu-label">{item.label}</span>}

            {item.id === 'music' && playlistCount > 0 && (
              <span className="playlist-badge">{playlistCount}</span>
            )}
          </button>
        ))}
      </nav>

      {isExpanded && (
        <div className="playlist-section">
          <div className="section-header">
            <span className="section-title">Playlists</span>
          </div>

          <div className="playlist-items">
            {playlistItems.map((pl, idx) => (
              <button key={idx} className="playlist-item">
                <span className="playlist-icon">{pl.icon}</span>
                <span className="playlist-name">{pl.name}</span>
                <span className="track-count">{pl.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="stats-section">
          <div className="section-header">
            <span className="section-title">Player Stats</span>
          </div>

          <div className="stats-grid">
            {statsItems.map((stat, idx) => (
              <div key={idx} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="menu-footer">
          <div className="premium-info">
            <div className="premium-icon">⭐</div>
            <div className="premium-text">
              <div className="premium-title">Premium User</div>
              <div className="premium-expiry">Active until 26.01.2027</div>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={() => setActiveScreen('profile')}
          >
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default MenuBar;