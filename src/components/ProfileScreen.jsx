import { useState, useEffect } from 'react';
import './ProfileScreen.css';

export function ProfileScreen() {
  const [user, setUser] = useState({
    username: 'TestUser',
    email: 'test@example.com',
    avatar: null,
  });
  const [preview, setPreview] = useState(null);

  // Загружаем данные пользователя при монтировании
  useEffect(() => {
    const savedUser = localStorage.getItem('harmony_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.avatar) {
        setPreview(parsedUser.avatar);
      }
    }
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setPreview(base64String);
        
        // Обновляем пользователя
        const updatedUser = {
          ...user,
          avatar: base64String
        };
        setUser(updatedUser);
        
        // Сохраняем в localStorage
        localStorage.setItem('harmony_user', JSON.stringify(updatedUser));
      };
      reader.readAsDataURL(file);
    } else {
      alert('Пожалуйста, выберите изображение');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('harmony_user');
    window.location.href = '/auth';
  };

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <h1>Профиль</h1>
      </div>

      <div className="profile-content">
        <div className="avatar-section">
          <div className="avatar-container">
            <div className="avatar-preview">
              {preview ? (
                <img src={preview} alt="Аватар" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            
            <label className="avatar-upload-btn">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              Изменить фото
            </label>
          </div>
          
          <div className="user-info">
            <h2>{user.username}</h2>
            <p>{user.email}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <span className="stat-icon">🎵</span>
            <div>
              <h3>245</h3>
              <p>Треков</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏱️</span>
            <div>
              <h3>245ч</h3>
              <p>Время прослушивания</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📁</span>
            <div>
              <h3>12</h3>
              <p>Плейлистов</p>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="action-btn" onClick={() => alert('Настройки будут доступны позже')}>
            Настройки
          </button>
          <button className="action-btn logout-btn" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileScreen;