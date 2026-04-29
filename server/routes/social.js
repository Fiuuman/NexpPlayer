import { Router } from 'express';
import { socialController } from '../controllers/socialController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/tracks/:id/like', authenticateToken, socialController.likeTrack);
router.get('/liked', authenticateToken, socialController.getLikedTracks);
router.post('/tracks/:id/comments', authenticateToken, socialController.addComment);
router.get('/tracks/:id/comments', authenticateToken, socialController.getComments);
router.post('/users/:id/follow', authenticateToken, socialController.follow);
router.get('/users/:id/followers', authenticateToken, socialController.getFollowers);
router.get('/users/:id/following', authenticateToken, socialController.getFollowing);
router.get('/popular', authenticateToken, socialController.getPopular);

export default router;
