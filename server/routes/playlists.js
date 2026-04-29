import { Router } from 'express';
import { playlistController } from '../controllers/playlistController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateToken, playlistController.create);
router.get('/', authenticateToken, playlistController.getMyPlaylists);
router.get('/:id', authenticateToken, playlistController.getPlaylistById);
router.post('/:playlistId/tracks', authenticateToken, playlistController.addTrack);
router.delete('/:playlistId/tracks/:trackId', authenticateToken, playlistController.removeTrack);
router.delete('/:id', authenticateToken, playlistController.delete);

export default router;
