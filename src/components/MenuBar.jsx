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

  const handleMenuItemClick = (screenId) => {
    setActiveScreen(screenId);
    if (window.innerWidth < 768) {
      setIsExpanded(false);
    }
  };

  return (
    <div className={`menu-bar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="menu-header">
        <button 
          className="toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Свернуть меню' : 'Развернуть меню'}
        >
          {isExpanded ? '◀' : '▶'}
        </button>
        
        {isExpanded && (
          <div className="app-brand">
            <div className="logo">🎵</div>
            <h1 className="app-name">Harmony</h1>
          </div>
        )}
      </div>

      {/* Информация о пользователе */}
      <div className="user-section">
        <div className="user-avatar-container">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.username} 
              className="user-avatar"
              onClick={() => handleMenuItemClick('profile')}
              style={{ cursor: 'pointer' }}
            />
          ) : (
            <div 
              className="avatar-placeholder"
              onClick={() => handleMenuItemClick('profile')}
              style={{ cursor: 'pointer' }}
            >
              {user?.username?.[0]?.toUpperCase() || '👤'}
            </div>
          )}
        </div>
        
        {isExpanded && user && (
          <div className="user-info">
            <div className="username">{user.username || 'Гость'}</div>
            <div className="user-email">{user.email || ''}</div>
            <div className="user-premium-badge">Premium</div>
          </div>
        )}
      </div>

      {/* Основное меню */}
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
              <span className="playlist-badge">
                {playlistCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Плейлист */}
      {isExpanded && (
        <div className="playlist-section">
          <div className="section-header">
            <span className="section-title">PLAYLISTS</span>
          </div>
          <div className="playlist-items">
            <button className="playlist-item">
              <span className="playlist-icon">❤️</span>
              <span className="playlist-name">Liked Songs</span>
              <span className="track-count">89</span>
            </button>
            <button className="playlist-item">
              <span className="playlist-icon">🔥</span>
              <span className="playlist-name">Hot Hits</span>
              <span className="track-count">50</span>
            </button>
            <button className="playlist-item">
              <span className="playlist-icon">😴</span>
              <span className="playlist-name">Chill Vibes</span>
              <span className="track-count">32</span>
            </button>
            <button className="playlist-item">
              <span className="playlist-icon">🚗</span>
              <span className="playlist-name">Road Trip</span>
              <span className="track-count">45</span>
            </button>
          </div>
        </div>
      )}

      {/* Статистика */}
      {isExpanded && (
        <div className="stats-section">
          <div className="section-header">
            <span className="section-title">PLAYER STATS</span>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">245</div>
              <div className="stat-label">Songs</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">89</div>
              <div className="stat-label">Favorites</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">12</div>
              <div className="stat-label">Playlists</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">245</div>
              <div className="stat-label">Hours</div>
            </div>
          </div>
        </div>
      )}

      {/* Футер меню */}
      <div className="menu-footer">
        {isExpanded && (
          <>
            <div className="premium-info">
              <div className="premium-icon">⭐</div>
              <div className="premium-text">
                <div className="premium-title">Premium User</div>
                <div className="premium-expiry">Active until 26.01.2027</div>
              </div>
            </div>
            <button className="logout-btn" onClick={() => setActiveScreen('profile')}>
              <span className="logout-icon">🚪</span>
              {isExpanded && <span className="logout-text">Logout</span>}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MenuBar;