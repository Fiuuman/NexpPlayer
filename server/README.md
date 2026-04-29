# Music Server API v2.0

## Запуск Docker

```bash
dcker compose up --build
```

## API Endpoints

### Auth
| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий пользователь |
| PUT | `/api/auth/update` | Обновить профиль |
| POST | `/api/auth/upload-avatar` | Загрузить аватар |

### Music
| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | `/api/music/upload` | Загрузить трек |
| GET | `/api/music/my-tracks` | Мои треки |
| GET | `/api/music/all` | Все треки (пагинация + поиск) |
| GET | `/api/music/stream/:id` | Стриминг (Range поддержка) |
| GET | `/api/music/:id` | Инфо о треке |
| DELETE | `/api/music/:id` | Удалить трек |

### Playlists
| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | `/api/playlists` | Создать плейлист |
| GET | `/api/playlists` | Мои плейлисты |
| GET | `/api/playlists/:id` | Плейлист с треками |
| POST | `/api/playlists/:id/tracks` | Добавить трек |
| DELETE | `/api/playlists/:id/tracks/:trackId` | Удалить трек |
| DELETE | `/api/playlists/:id` | Удалить плейлист |

### Social
| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | `/api/social/tracks/:id/like` | Лайк/анлайк |
| GET | `/api/social/liked` | Лайкнутые треки |
| POST | `/api/social/tracks/:id/comments` | Комментарий |
| GET | `/api/social/tracks/:id/comments` | Комментарии трека |
| POST | `/api/social/users/:id/follow` | Подписаться |
| GET | `/api/social/users/:id/followers` | Подписчики |
| GET | `/api/social/users/:id/following` | Подписки |
| GET | `/api/social/popular` | Популярные треки |

## Пагинация

```
GET /api/music/all?page=1&limit=20&search=beat
```

Ответ:
```json
{
  "tracks": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Streaming

```html
<audio src="http://localhost:3000/api/music/stream/1" controls></audio>
```

Поддерживает перемотку через `Range: bytes=0-1024` заголовки.

## Тестовые данные

- Email: `test@example.com`
- Пароль: `123456`
