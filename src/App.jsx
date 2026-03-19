import { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { MusicScreen } from './components/MusicScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SearchScreen } from './components/SearchScreen';
import MenuBar from './components/MenuBar';
import { PlayerBar } from './components/PlayerBar';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMenuExpanded, setIsMenuExpanded] = useState(true); // Состояние для раскрытия меню

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Проверка авторизации...');
      
      const token = localStorage.getItem('harmony_token');
      const savedUser = localStorage.getItem('harmony_user');
      
      console.log('Токен в localStorage:', token ? 'Есть' : 'Нет');
      console.log('Пользователь в localStorage:', savedUser ? JSON.parse(savedUser).username : 'Нет');
      
      if (token && savedUser) {
        try {
          console.log('🔄 Проверка токена на сервере...');
          const response = await fetch('http://localhost:3001/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Токен валиден, пользователь:', userData.username);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.log('❌ Токен не валиден');
            clearAuthData();
          }
        } catch (error) {
          // Сервер недоступен, используем сохраненные данные
          console.log('⚠️ Сервер недоступен, используем локальные данные');
          const parsedUser = JSON.parse(savedUser);
          console.log('Локальный пользователь:', parsedUser.username);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } else {
        console.log('❌ Нет данных для авторизации');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      clearAuthData();
    } finally {
      console.log('✅ Проверка авторизации завершена');
      setIsLoading(false);
    }
  };

  const handleLogin = (token, userData) => {
    console.log('🚀 Вызван handleLogin');
    console.log('Получен пользователь:', userData);
    
    // Сохраняем в localStorage
    localStorage.setItem('harmony_token', token);
    localStorage.setItem('harmony_user', JSON.stringify(userData));
    
    // Обновляем состояние
    setUser(userData);
    setIsAuthenticated(true);
    
    console.log('✅ Логин успешен');
  };

  const handleLogout = () => {
    console.log('🚪 Выход из системы');
    clearAuthData();
    setIsAuthenticated(false);
    setUser(null);
    setCurrentScreen('home');
  };

  const clearAuthData = () => {
    localStorage.removeItem('harmony_token');
    localStorage.removeItem('harmony_user');
    localStorage.removeItem('harmony_tracks');
    localStorage.removeItem('harmony_playlists');
    console.log('🧹 Очищены данные авторизации');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'music':
        return <MusicScreen />;
      case 'search':
        return <SearchScreen />;
      case 'profile':
        return <ProfileScreen onLogout={handleLogout} user={user} />;
      default:
        return <HomeScreen />;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка Harmony...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <div className="app-container">
        {/* ВАЖНО: Передаем все нужные пропсы */}
        <MenuBar 
          activeScreen={currentScreen} 
          setActiveScreen={setCurrentScreen} 
          isExpanded={isMenuExpanded}
          setIsExpanded={setIsMenuExpanded} 
          playlistCount={12}
          user={user}
        />
        <main className={`main-content ${isMenuExpanded ? 'expanded' : 'collapsed'}`}>
          {renderScreen()}
        </main>
      </div>
      <PlayerBar />
    </div>
  );
}

export default App;