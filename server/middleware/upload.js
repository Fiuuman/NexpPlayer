import multer from 'multer';
import path from 'path';
import fs from 'fs';

const __dirname = import.meta.dirname;
const uploadsDir = path.join(__dirname, '..', 'uploads');

['avatars', 'music'].forEach(dir => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(uploadsDir, 'avatars')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(uploadsDir, 'music')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueSuffix + '-' + safeFilename);
  }
});

const imageFilter = (req, file, cb) => {
  file.mimetype.startsWith('image/') 
    ? cb(null, true) 
    : cb(new Error('Только изображения разрешены'));
};

const audioFilter = (req, file, cb) => {
  file.mimetype.startsWith('audio/') 
    ? cb(null, true) 
    : cb(new Error('Только аудио файлы разрешены'));
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: parseInt(process.env.MAX_AVATAR_SIZE) || 5 * 1024 * 1024 },
  fileFilter: imageFilter
});

export const uploadMusic = multer({
  storage: musicStorage,
  limits: { fileSize: parseInt(process.env.MAX_MUSIC_SIZE) || 50 * 1024 * 1024 },
  fileFilter: audioFilter
});
