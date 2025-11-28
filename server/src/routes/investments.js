import express from 'express';
import {
  getInvestments,
  createInvestment,
  updateInvestment,
  updateInvestmentByTicker,
  deleteInvestment,
  getInvestmentTransactions,
  createInvestmentTransaction
} from '../controllers/investmentsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Investment transactions (rotas específicas primeiro)
router.get('/transactions', getInvestmentTransactions);
router.post('/transactions', createInvestmentTransaction);

// Rotas específicas antes das rotas com parâmetros dinâmicos
router.patch('/ticker/:ticker', updateInvestmentByTicker);

// Rotas gerais de CRUD
router.get('/', getInvestments);
router.post('/', createInvestment);
router.put('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);

export default router;
