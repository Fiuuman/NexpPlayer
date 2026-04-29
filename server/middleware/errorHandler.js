import multer from 'multer';

export function errorHandler(err, req, res, next) {
  console.error('❌ Ошибка:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Файл слишком большой' });
    }
    return res.status(400).json({ message: 'Ошибка загрузки файла' });
  }

  if (err.message === 'Только изображения разрешены' || 
      err.message === 'Только аудио файлы разрешены') {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
}
