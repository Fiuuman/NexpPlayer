import { useState } from 'react';
import './AuthScreen.css';

const API_BASE = 'http://localhost:3001';

export function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetError = () => {
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetError();

    if (mode === 'register') {
      if (!form.username.trim()) {
        setError('Введите имя пользователя');
        return;
      }

      if (!form.email.trim()) {
        setError('Введите email');
        return;
      }

      if (!form.password.trim()) {
        setError('Введите пароль');
        return;
      }

      if (form.password.length < 6) {
        setError('Пароль должен быть не короче 6 символов');
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
    } else {
      if (!form.email.trim()) {
        setError('Введите email');
        return;
      }

      if (!form.password.trim()) {
        setError('Введите пароль');
        return;
      }
    }

    try {
      setLoading(true);

      const endpoint =
        mode === 'login'
          ? `${API_BASE}/api/auth/login`
          : `${API_BASE}/api/auth/register`;

      const payload =
        mode === 'login'
          ? {
              email: form.email.trim(),
              password: form.password,
            }
          : {
              username: form.username.trim(),
              email: form.email.trim(),
              password: form.password,
            };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Ошибка авторизации');
      }

      const token = data?.token;
      const user = data?.user;

      if (!token || !user) {
        throw new Error('Сервер вернул некорректный ответ');
      }

      localStorage.setItem('harmony_token', token);
      localStorage.setItem('harmony_user', JSON.stringify(user));

      if (typeof onLogin === 'function') {
        onLogin(token, user);
      }
    } catch (err) {
      setError(err.message || 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    resetError();

    const demoUser = {
      id: 'demo-user',
      username: 'DemoUser',
      email: 'demo@nexp.local',
    };

    const demoToken = 'demo-token';

    localStorage.setItem('harmony_token', demoToken);
    localStorage.setItem('harmony_user', JSON.stringify(demoUser));

    if (typeof onLogin === 'function') {
      onLogin(demoToken, demoUser);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-header">
          <h1>NexpPlayer</h1>
          <p>
            {mode === 'login'
              ? 'Войдите в аккаунт, чтобы продолжить'
              : 'Создайте аккаунт и начните слушать музыку'}
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                resetError();
              }}
              disabled={loading}
            >
              Вход
            </button>

            <button
              type="button"
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setMode('register');
                resetError();
              }}
              disabled={loading}
            >
              Регистрация
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="username">Имя пользователя</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Введите имя пользователя"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Введите email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                disabled={loading}
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Подтвердите пароль</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Повторите пароль"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateField('confirmPassword', e.target.value)
                  }
                  disabled={loading}
                />
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? mode === 'login'
                  ? 'Входим...'
                  : 'Создаем аккаунт...'
                : mode === 'login'
                ? 'Войти'
                : 'Создать аккаунт'}
            </button>
          </form>

          <div className="auth-footer">
            {mode === 'login' ? (
              <>
                Нет аккаунта?
                <button
                  type="button"
                  className="switch-btn"
                  onClick={() => {
                    setMode('register');
                    resetError();
                  }}
                  disabled={loading}
                >
                  Зарегистрироваться
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?
                <button
                  type="button"
                  className="switch-btn"
                  onClick={() => {
                    setMode('login');
                    resetError();
                  }}
                  disabled={loading}
                >
                  Войти
                </button>
              </>
            )}
          </div>

          <div className="demo-login">
            <p>Для быстрого входа в режиме разработки</p>
            <button
              type="button"
              className="demo-btn"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              Войти как демо-пользователь
            </button>
          </div>
        </div>

        <div className="auth-features">
          <h3>Что доступно в приложении</h3>
          <ul>
            <li>🎵 Удобное воспроизведение музыки</li>
            <li>📁 Управление плейлистами</li>
            <li>🔍 Поиск треков</li>
            <li>💜 Персональная музыкальная библиотека</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;