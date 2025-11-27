import { query } from '../config/database.js';

export const getTransactions = async (req, res) => {
  try {
    const { limit, offset, type, category } = req.query;

    let queryText = `
      SELECT t.*, cc.name as credit_card_name
      FROM transactions t
      LEFT JOIN credit_cards cc ON t.credit_card_id = cc.id
      WHERE t.user_id = $1
    `;

    const params = [req.user.id];
    let paramIndex = 2;

    if (type) {
      queryText += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (category) {
      queryText += ` AND t.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    queryText += ' ORDER BY t.date DESC, t.created_at DESC';

    if (limit) {
      queryText += ` LIMIT $${paramIndex}`;
      params.push(limit);
      paramIndex++;
    }

    if (offset) {
      queryText += ` OFFSET $${paramIndex}`;
      params.push(offset);
    }

    const result = await query(queryText, params);

    const transactions = result.rows.map(row => ({
      ...row,
      credit_cards: row.credit_card_name ? { name: row.credit_card_name } : null
    }));

    res.json({ data: transactions });
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const {
      title,
      amount,
      type,
      category,
      date,
      description,
      credit_card_id,
      installments,
      current_installment
    } = req.body;

    const result = await query(
      `INSERT INTO transactions
        (user_id, title, amount, type, category, date, description, credit_card_id, installments, current_installment, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [req.user.id, title, amount, type, category, date, description, credit_card_id, installments, current_installment]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a transação pertence ao usuário
    const checkResult = await query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    await query('DELETE FROM transactions WHERE id = $1', [id]);

    res.json({ message: 'Transação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
};

export const deleteMultipleTransactions = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    // Verificar se todas as transações pertencem ao usuário
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(',');
    const checkResult = await query(
      `SELECT id FROM transactions WHERE id IN (${placeholders}) AND user_id = $1`,
      [req.user.id, ...ids]
    );

    if (checkResult.rows.length !== ids.length) {
      return res.status(404).json({ error: 'Uma ou mais transações não encontradas' });
    }

    await query(
      `DELETE FROM transactions WHERE id IN (${placeholders}) AND user_id = $1`,
      [req.user.id, ...ids]
    );

    res.json({ message: 'Transações removidas com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar transações:', error);
    res.status(500).json({ error: 'Erro ao deletar transações' });
  }
};
