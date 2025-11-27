import axios from 'axios';
import { query } from '../config/database.js';

// Serviço para sincronizar dividendos (substituindo a Edge Function sync-dividends)
export const syncDividends = async (ticker, userId) => {
  try {
    // Buscar dados de dividendos de uma API pública
    // Nota: Você precisará integrar com uma API real de dividendos brasileiros
    // Esta é uma estrutura de exemplo

    const dividends = await fetchDividendsFromAPI(ticker);

    // Salvar no banco de dados
    for (const dividend of dividends) {
      await query(
        `INSERT INTO dividends (user_id, ticker, payment_date, amount, type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (user_id, ticker, payment_date) DO UPDATE
         SET amount = EXCLUDED.amount, type = EXCLUDED.type, updated_at = NOW()`,
        [userId, ticker, dividend.payment_date, dividend.amount, dividend.type]
      );
    }

    return { success: true, count: dividends.length };
  } catch (error) {
    console.error(`Erro ao sincronizar dividendos para ${ticker}:`, error);
    throw error;
  }
};

const fetchDividendsFromAPI = async (ticker) => {
  // Implementar integração com API de dividendos
  // Por exemplo: Status Invest, B3, ou outra fonte
  // Este é um exemplo mockado

  try {
    // Exemplo: você pode usar a API do Status Invest ou outra fonte
    // const response = await axios.get(`https://api.statusinvest.com.br/dividends/${ticker}`);
    // return response.data;

    // Por enquanto, retorna array vazio
    return [];
  } catch (error) {
    console.error('Erro ao buscar dividendos da API:', error);
    return [];
  }
};

export const getHistoricalDividends = async (ticker, startDate, endDate) => {
  try {
    const result = await query(
      `SELECT * FROM dividends
       WHERE ticker = $1 AND payment_date BETWEEN $2 AND $3
       ORDER BY payment_date DESC`,
      [ticker, startDate, endDate]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar histórico de dividendos:', error);
    throw error;
  }
};
