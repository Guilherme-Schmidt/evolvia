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

// Rota para buscar títulos do tesouro
router.post('/get-treasury-bonds', authenticateToken, async (req, res) => {
  try {
    // Retorna lista simulada de títulos do tesouro
    // TODO: Integrar com API real do Tesouro Direto
    const bonds = [
      {
        name: 'Tesouro Selic 2029',
        type: 'Tesouro Selic',
        maturity_date: '2029-03-01',
        annual_rate: 0.1375,
        min_investment: 100.00
      },
      {
        name: 'Tesouro IPCA+ 2029',
        type: 'Tesouro IPCA+',
        maturity_date: '2029-05-15',
        annual_rate: 0.0650,
        min_investment: 50.00
      },
      {
        name: 'Tesouro Prefixado 2027',
        type: 'Tesouro Prefixado',
        maturity_date: '2027-01-01',
        annual_rate: 0.1150,
        min_investment: 30.00
      }
    ];

    res.json({ results: bonds });
  } catch (error) {
    console.error('Erro ao buscar títulos do tesouro:', error);
    res.status(500).json({ error: 'Erro ao buscar títulos do tesouro' });
  }
});

// Rota para buscar tickers (autocomplete)
router.post('/search-tickers', authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    // Lista de tickers comuns brasileiros para autocomplete
    const commonTickers = [
      { ticker: 'PETR4', name: 'Petrobras PN', type: 'Ação' },
      { ticker: 'VALE3', name: 'Vale ON', type: 'Ação' },
      { ticker: 'ITUB4', name: 'Itaú Unibanco PN', type: 'Ação' },
      { ticker: 'BBDC4', name: 'Bradesco PN', type: 'Ação' },
      { ticker: 'ABEV3', name: 'Ambev ON', type: 'Ação' },
      { ticker: 'WEGE3', name: 'WEG ON', type: 'Ação' },
      { ticker: 'B3SA3', name: 'B3 ON', type: 'Ação' },
      { ticker: 'RENT3', name: 'Localiza ON', type: 'Ação' },
      { ticker: 'MGLU3', name: 'Magazine Luiza ON', type: 'Ação' },
      { ticker: 'BBAS3', name: 'Banco do Brasil ON', type: 'Ação' },
      { ticker: 'ELET3', name: 'Eletrobras ON', type: 'Ação' },
      { ticker: 'SUZB3', name: 'Suzano ON', type: 'Ação' },
      { ticker: 'VIVT3', name: 'Telefônica Brasil ON', type: 'Ação' },
      { ticker: 'HAPV3', name: 'Hapvida ON', type: 'Ação' },
      { ticker: 'RADL3', name: 'Raia Drogasil ON', type: 'Ação' },
      { ticker: 'KLBN11', name: 'Klabin Units', type: 'Ação' },
      { ticker: 'HYPE3', name: 'Hypera ON', type: 'Ação' },
      { ticker: 'CIEL3', name: 'Cielo ON', type: 'Ação' },
      { ticker: 'BRKM5', name: 'Braskem PNA', type: 'Ação' },
      { ticker: 'EMBR3', name: 'Embraer ON', type: 'Ação' },
      // FIIs
      { ticker: 'HGLG11', name: 'CSHG Logística FII', type: 'FII' },
      { ticker: 'MXRF11', name: 'Maxi Renda FII', type: 'FII' },
      { ticker: 'KNRI11', name: 'Kinea Renda Imobiliária FII', type: 'FII' },
      { ticker: 'VISC11', name: 'Vinci Shopping Centers FII', type: 'FII' },
      { ticker: 'XPML11', name: 'XP Malls FII', type: 'FII' },
      { ticker: 'BTLG11', name: 'BTG Pactual Logística FII', type: 'FII' },
      { ticker: 'KNCR11', name: 'Kinea Rendimentos Imobiliários FII', type: 'FII' },
      // ETFs
      { ticker: 'BOVA11', name: 'iShares Ibovespa ETF', type: 'ETF' },
      { ticker: 'SMAL11', name: 'iShares Small Cap ETF', type: 'ETF' },
      { ticker: 'IVVB11', name: 'iShares S&P 500 ETF', type: 'ETF' },
    ];

    // Filtrar tickers que correspondem à busca
    const searchQuery = query.toUpperCase();
    const results = commonTickers.filter(item =>
      item.ticker.includes(searchQuery) ||
      item.name.toUpperCase().includes(searchQuery)
    ).slice(0, 10); // Limitar a 10 resultados

    res.json({ results });
  } catch (error) {
    console.error('Erro ao buscar tickers:', error);
    res.status(500).json({ error: 'Erro ao buscar tickers' });
  }
});

export default router;
