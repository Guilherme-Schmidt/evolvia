import { Router } from 'express';
import { login, register } from '../controllers/authController';

const router = Router();

router.post('/register', register); // 👈 Corrigido aqui
router.post('/login', login);

export default router;
