import express from 'express';
import { register, login, getUser, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', authenticateToken, getUser);
router.post('/logout', authenticateToken, logout);

export default router;
