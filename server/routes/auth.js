import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.put('/update', authenticateToken, authController.updateProfile);
router.post('/upload-avatar', authenticateToken, uploadAvatar.single('avatar'), authController.uploadAvatar);

export default router;
