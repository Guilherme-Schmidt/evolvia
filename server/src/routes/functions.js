import express from 'express';
import { getQuote, getMultipleQuotes } from '../services/quoteService.js';
import { syncDividends, getHistoricalDividends } from '../services/dividendsService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rota para buscar cotação (substitui supabase.functions.invoke('get-quote'))
router.post('/get-quote', authenticateToken, async (req, res) => {
  try {
    const { ticker } = req.body;

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker é obrigatório' });
    }

    const quote = await getQuote(ticker);
    res.json({ results: [quote] });
  } catch (error) {
    console.error('Erro ao buscar cotação:', error);
    res.status(500).json({ error: 'Erro ao buscar cotação' });
  }
});

// Rota para buscar múltiplas cotações
router.post('/get-multiple-quotes', authenticateToken, async (req, res) => {
  try {
    const { tickers } = req.body;

    if (!Array.isArray(tickers)) {
      return res.status(400).json({ error: 'Tickers deve ser um array' });
    }

    const quotes = await getMultipleQuotes(tickers);
    res.json({ results: quotes });
  } catch (error) {
    console.error('Erro ao buscar cotações:', error);
    res.status(500).json({ error: 'Erro ao buscar cotações' });
  }
});

// Rota para sincronizar dividendos
router.post('/sync-dividends', authenticateToken, async (req, res) => {
  try {
    const { ticker } = req.body;

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker é obrigatório' });
    }

    const result = await syncDividends(ticker, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao sincronizar dividendos:', error);
    res.status(500).json({ error: 'Erro ao sincronizar dividendos' });
  }
});

// Rota para buscar histórico de dividendos
router.post('/get-historical-dividends', authenticateToken, async (req, res) => {
  try {
    const { ticker, startDate, endDate } = req.body;

    if (!ticker || !startDate || !endDate) {
      return res.status(400).json({ error: 'Ticker, startDate e endDate são obrigatórios' });
    }

    const dividends = await getHistoricalDividends(ticker, startDate, endDate);
    res.json({ results: dividends });
  } catch (error) {
    console.error('Erro ao buscar histórico de dividendos:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de dividendos' });
  }
});

export default router;
