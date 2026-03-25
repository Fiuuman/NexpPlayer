![NexpPlayer Banner](./assets/banner.png)

&lt;h1 align="center"&gt;NexpPlayer 🎵&lt;/h1&gt;

&lt;p align="center"&gt;

  &lt;!-- 🔹 Platform --&gt;
  &lt;img alt="Platform" src="https://img.shields.io/badge/Platform-Desktop-000000?logo=tauri&logoColor=white"&gt;
  
  &lt;!-- 🔹 Stack --&gt;
  &lt;img alt="Frontend" src="https://img.shields.io/badge/Frontend-Preact-673AB8?logo=preact&logoColor=white"&gt;
  &lt;img alt="Backend" src="https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white"&gt;
  &lt;img alt="Build" src="https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white"&gt;
  
  &lt;!-- 🔹 License & Status --&gt;
  &lt;img alt="License" src="https://img.shields.io/badge/License-MIT-blue"&gt;
  &lt;img alt="Status" src="https://img.shields.io/badge/Status-In%20Development-yellow"&gt;

&lt;/p&gt;

**NexpPlayer** — легковесный десктопный музыкальный плеер с социальными функциями. Потоковое воспроизведение, персональные плейлисты, подписки на артистов и глобальный поиск — всё в нативном приложении без рекламы.

Построен на **Tauri** (Rust + WebView) для максимальной производительности и минимального потребления ресурсов. 🚀

## 🔗 Репозиторий

👉 **GitHub:** https://github.com/Fiuuman/NexpPlayer

---

## ✨ Возможности

### 🎧 Проигрывание
- **Потоковое воспроизведение** — мгновенный старт без полной загрузки
- **Прогресс-бар с перемоткой** — точная навигация по треку
- **Очередь воспроизведения** — управление списком upcoming треков
- **Глобальные хоткеи** — управление из любого окна системы

### 👤 Социальные функции
- **Профили пользователей** — кастомные аватарки, био, статистика
- **Подписки** — следите за новыми релизами любимых артистов
- **Лайки** — отмечайте любимые треки и плейлисты
- **Публичные плейлисты** — делитесь подборками с сообществом

### 🔍 Поиск и контент
- **Глобальный поиск** — треки, пользователи, плейлисты
- **Теги** — категоризация контента
- **История прослушиваний** — персональные рекомендации

---

## 🛠️ Технологический стек

### Frontend
| Технология | Назначение |
|------------|-----------|
| **Tauri** | Нативная оболочка, доступ к ОС |
| **Preact** | UI-фреймворк (React-совместимый) |
| **Vite** | Сборка, HMR, оптимизация |
| **Zustand** | Управление состоянием |

### Backend
| Технология | Назначение |
|------------|-----------|
| **Node.js** | Runtime, API сервер |
| **Express / Fastify** | HTTP фреймворк |
| **PostgreSQL** | Основная база данных |
| **Redis** | Кеш, сессии, очереди |
| **MeiliSearch** | Полнотекстовый поиск |

### Инфраструктура
| Технология | Назначение |
|------------|-----------|
| **MinIO / S3** | Хранилище аудио-файлов |
| **FFmpeg** | Транскодирование, метаданные |
| **Docker** | Контейнеризация |

---

## 🚀 Быстрый старт

### Требования
- **Node.js** 20.x или выше
- **Rust** (для сборки Tauri)
- **PostgreSQL** 15+
- **FFmpeg** в PATH

### Установка

```bash
# Клонирование
git clone https://github.com/Fiuuman/NexpPlayer.git
cd NexpPlayer

# Frontend
cd frontend
npm install
npm run dev

# Backend (в отдельном терминале)
cd ../backend
npm install
npm run dev
