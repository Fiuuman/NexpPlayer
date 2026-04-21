import { useState, useEffect } from 'react';
import './ProfileScreen.css';

export function ProfileScreen() {
  const [user, setUser] = useState({
    username: 'Guest',
    email: 'guest@nexp.local',
    avatar: null,
  });

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('harmony_user');

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);

        const normalizedUser = {
          username: parsedUser.username || 'Guest',
          email: parsedUser.email || 'guest@nexp.local',
          avatar: parsedUser.avatar || null,
        };

        setUser(normalizedUser);

        if (normalizedUser.avatar) {
          setPreview(normalizedUser.avatar);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error);
    }
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result;

      setPreview(base64String);

      const updatedUser = {
        ...user,
        avatar: base64String,
      };

      setUser(updatedUser);
      localStorage.setItem('harmony_user', JSON.stringify(updatedUser));
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLogout = () => {
    localStorage.removeItem('harmony_user');
    localStorage.removeItem('harmony_token');
    window.location.href = '/auth';
  };

  const userInitial = user.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <span className="profile-badge">Account</span>
        <h1>Профиль</h1>
        <p>Управляйте личными данными, аватаром и настройками аккаунта</p>
      </div>

      <div className="profile-content">
        <div className="avatar-section">
          <div className="avatar-container">
            <div className="avatar-preview">
              {preview ? (
                <img src={preview} alt="Аватар" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {userInitial}
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
            <span className="user-role">Premium User</span>
            <h2>{user.username || 'Guest'}</h2>
            <p>{user.email || 'guest@nexp.local'}</p>

            <div className="user-meta">
              <div className="meta-pill">Music Lover</div>
              <div className="meta-pill">Desktop Client</div>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <span className="stat-icon">🎵</span>
            <div className="stat-copy">
              <h3>245</h3>
              <p>Треков в библиотеке</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">⏱️</span>
            <div className="stat-copy">
              <h3>245ч</h3>
              <p>Время прослушивания</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">📁</span>
            <div className="stat-copy">
              <h3>12</h3>
              <p>Создано плейлистов</p>
            </div>
          </div>
        </div>

        <div className="profile-panel">
          <div className="panel-card">
            <h3>О профиле</h3>
            <p>
              Здесь вы можете обновить аватар, просмотреть базовую статистику и
              управлять аккаунтом в приложении.
            </p>
          </div>

          <div className="panel-card">
            <h3>Статус подписки</h3>
            <p>Премиум-подписка активна. Все основные функции доступны.</p>
          </div>
        </div>

        <div className="profile-actions">
          <button
            className="action-btn"
            onClick={() => alert('Настройки будут доступны позже')}
          >
            Настройки
          </button>

          <button
            className="action-btn secondary"
            onClick={() => alert('Редактирование профиля будет доступно позже')}
          >
            Редактировать
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