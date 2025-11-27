import express from 'express';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  deleteMultipleTransactions
} from '../controllers/transactionsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);
router.post('/delete-multiple', deleteMultipleTransactions);

export default router;
