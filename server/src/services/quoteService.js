import axios from 'axios';

// Serviço para buscar cotações de ativos (substituindo a Edge Function get-quote)
export const getQuote = async (ticker) => {
  try {
    // Usando Yahoo Finance API alternativa
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.SA`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    if (response.data?.chart?.result?.[0]) {
      const result = response.data.chart.result[0];
      const meta = result.meta;

      return {
        ticker,
        regularMarketPrice: meta.regularMarketPrice || 0,
        regularMarketChange: meta.regularMarketChange || 0,
        regularMarketChangePercent: meta.regularMarketChangePercent || 0,
        currency: meta.currency || 'BRL'
      };
    }

    throw new Error('Cotação não encontrada');
  } catch (error) {
    console.error(`Erro ao buscar cotação para ${ticker}:`, error.message);
    throw error;
  }
};

export const getMultipleQuotes = async (tickers) => {
  try {
    const quotes = await Promise.allSettled(
      tickers.map(ticker => getQuote(ticker))
    );

    return quotes.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          ticker: tickers[index],
          regularMarketPrice: 0,
          error: result.reason.message
        };
      }
    });
  } catch (error) {
    console.error('Erro ao buscar múltiplas cotações:', error);
    throw error;
  }
};
