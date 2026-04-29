import { Router } from 'express';
import { musicController } from '../controllers/musicController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMusic } from '../middleware/upload.js';

const router = Router();

router.post('/upload', authenticateToken, uploadMusic.single('music'), musicController.upload);
router.get('/my-tracks', authenticateToken, musicController.getMyTracks);
router.get('/all', authenticateToken, musicController.getAllTracks);
router.get('/stream/:id', authenticateToken, musicController.stream);
router.get('/:id', authenticateToken, musicController.getTrackById);
router.delete('/:id', authenticateToken, musicController.delete);

export default router;
