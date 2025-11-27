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

router.get('/', getInvestments);
router.post('/', createInvestment);
router.put('/:id', updateInvestment);
router.patch('/ticker/:ticker', updateInvestmentByTicker);
router.delete('/:id', deleteInvestment);

// Investment transactions
router.get('/transactions', getInvestmentTransactions);
router.post('/transactions', createInvestmentTransaction);

export default router;
