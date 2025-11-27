import { query } from '../config/database.js';

export const getInvestments = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM investments WHERE user_id = $1 ORDER BY ticker ASC',
      [req.user.id]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar investimentos:', error);
    res.status(500).json({ error: 'Erro ao buscar investimentos' });
  }
};

export const createInvestment = async (req, res) => {
  try {
    const {
      ticker,
      type,
      quantity,
      average_price,
      target_quantity,
      total_value
    } = req.body;

    const result = await query(
      `INSERT INTO investments
        (user_id, ticker, type, quantity, average_price, target_quantity, total_value, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [req.user.id, ticker, type, quantity, average_price, target_quantity || 0, total_value]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar investimento:', error);
    res.status(500).json({ error: 'Erro ao criar investimento' });
  }
};

export const updateInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Construir query dinâmica
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [req.user.id, ...Object.values(updates), id];

    const result = await query(
      `UPDATE investments SET ${setClause}, updated_at = NOW()
       WHERE id = $${values.length} AND user_id = $1
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investimento não encontrado' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar investimento:', error);
    res.status(500).json({ error: 'Erro ao atualizar investimento' });
  }
};

export const updateInvestmentByTicker = async (req, res) => {
  try {
    const { ticker } = req.params;
    const updates = req.body;

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [req.user.id, ...Object.values(updates), ticker];

    const result = await query(
      `UPDATE investments SET ${setClause}, updated_at = NOW()
       WHERE ticker = $${values.length} AND user_id = $1
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investimento não encontrado' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar investimento:', error);
    res.status(500).json({ error: 'Erro ao atualizar investimento' });
  }
};

export const deleteInvestment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM investments WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investimento não encontrado' });
    }

    res.json({ message: 'Investimento removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar investimento:', error);
    res.status(500).json({ error: 'Erro ao deletar investimento' });
  }
};

export const getInvestmentTransactions = async (req, res) => {
  try {
    const { type } = req.query;

    let queryText = `
      SELECT it.*, i.ticker
      FROM investment_transactions it
      JOIN investments i ON it.investment_id = i.id
      WHERE i.user_id = $1
    `;

    const params = [req.user.id];

    if (type) {
      queryText += ' AND it.type = $2';
      params.push(type);
    }

    queryText += ' ORDER BY it.transaction_date DESC';

    const result = await query(queryText, params);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erro ao buscar transações de investimento:', error);
    res.status(500).json({ error: 'Erro ao buscar transações de investimento' });
  }
};

export const createInvestmentTransaction = async (req, res) => {
  try {
    const {
      investment_id,
      type,
      quantity,
      price_per_unit,
      total_amount,
      transaction_date,
      broker_account_id
    } = req.body;

    const result = await query(
      `INSERT INTO investment_transactions
        (investment_id, type, quantity, price_per_unit, total_amount, transaction_date, broker_account_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [investment_id, type, quantity, price_per_unit, total_amount, transaction_date, broker_account_id]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar transação de investimento:', error);
    res.status(500).json({ error: 'Erro ao criar transação de investimento' });
  }
};
