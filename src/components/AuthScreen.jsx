import { useState } from 'react';
import './AuthScreen.css';

export function AuthScreen({ onLogin }) { // Принимаем проп onLogin
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Очищаем ошибку при изменении
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Простая валидация
      if (!formData.username.trim() || !formData.password.trim()) {
        throw new Error('Пожалуйста, заполните все поля');
      }

      if (!isLogin && !formData.email.trim()) {
        throw new Error('Пожалуйста, введите email');
      }

      // URL для запроса
      const url = isLogin 
        ? 'http://localhost:3001/api/auth/login'
        : 'http://localhost:3001/api/auth/register';

      const payload = isLogin
        ? { email: formData.email || formData.username, password: formData.password }
        : formData;

      // Отправляем запрос на сервер
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка авторизации');
      }

      // Если успешно, вызываем onLogin с данными
      if (onLogin) {
        onLogin(data.token, data.user);
      }

    } catch (error) {
      console.error('Ошибка авторизации:', error);
      setError(error.message);
      
      // Если сервер недоступен, используем локальную авторизацию
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        // Локальная авторизация для демо
        const demoUser = {
          id: 1,
          username: formData.username || 'DemoUser',
          email: formData.email || 'demo@example.com',
          avatar: null,
          created_at: new Date().toISOString()
        };
        
        const demoToken = 'demo-token-' + Date.now();
        
        if (onLogin) {
          onLogin(demoToken, demoUser);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Демо вход для тестирования
    const demoUser = {
      id: 1,
      username: 'TestUser',
      email: 'test@example.com',
      avatar: null,
      created_at: new Date().toISOString()
    };
    
    const demoToken = 'demo-token-' + Date.now();
    
    if (onLogin) {
      onLogin(demoToken, demoUser);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Harmony</h1>
          <p>Ваша музыкальная вселенная</p>
        </div>

        <div className="auth-form-container">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
              disabled={isLoading}
            >
              Вход
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
              disabled={isLoading}
            >
              Регистрация
            </button>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Введите имя пользователя"
                required
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Введите email"
                  required={!isLogin}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Введите пароль"
                required
                minLength="6"
                disabled={isLoading}
              />
            </div>

            {isLogin && (
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" disabled={isLoading} />
                  <span>Запомнить меня</span>
                </label>
                <button 
                  type="button" 
                  className="forgot-link"
                  onClick={() => alert('Функция восстановления пароля временно недоступна')}
                >
                  Забыли пароль?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Обработка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
            </button>

            <div className="demo-login">
              <p>Или попробуйте демо-версию:</p>
              <button 
                type="button" 
                className="demo-btn"
                onClick={handleDemoLogin}
                disabled={isLoading}
              >
                🚀 Демо вход
              </button>
            </div>

            <p className="auth-footer">
              {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
              <button
                type="button"
                className="switch-mode"
                onClick={() => setIsLogin(!isLogin)}
                disabled={isLoading}
              >
                {isLogin ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </form>
        </div>

        <div className="auth-footer-info">
          <p>© 2024 Harmony. Все права защищены.</p>
          <p>Версия 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;