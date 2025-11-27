import { query } from '../config/database.js';

// Controller genérico para operações CRUD em tabelas simples
export const createGenericController = (tableName, userIdField = 'user_id') => {
  return {
    getAll: async (req, res) => {
      try {
        const result = await query(
          `SELECT * FROM ${tableName} WHERE ${userIdField} = $1 ORDER BY created_at DESC`,
          [req.user.id]
        );

        res.json({ data: result.rows });
      } catch (error) {
        console.error(`Erro ao buscar ${tableName}:`, error);
        res.status(500).json({ error: `Erro ao buscar ${tableName}` });
      }
    },

    getById: async (req, res) => {
      try {
        const { id } = req.params;

        const result = await query(
          `SELECT * FROM ${tableName} WHERE id = $1 AND ${userIdField} = $2`,
          [id, req.user.id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json({ data: result.rows[0] });
      } catch (error) {
        console.error(`Erro ao buscar ${tableName}:`, error);
        res.status(500).json({ error: `Erro ao buscar ${tableName}` });
      }
    },

    create: async (req, res) => {
      try {
        const data = req.body;
        const fields = Object.keys(data);
        const values = Object.values(data);

        const placeholders = values.map((_, i) => `$${i + 2}`).join(', ');
        const fieldNames = fields.join(', ');

        const result = await query(
          `INSERT INTO ${tableName} (${userIdField}, ${fieldNames}, created_at, updated_at)
           VALUES ($1, ${placeholders}, NOW(), NOW())
           RETURNING *`,
          [req.user.id, ...values]
        );

        res.status(201).json({ data: result.rows[0] });
      } catch (error) {
        console.error(`Erro ao criar ${tableName}:`, error);
        res.status(500).json({ error: `Erro ao criar ${tableName}` });
      }
    },

    update: async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        const setClause = Object.keys(updates)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');

        const values = [req.user.id, ...Object.values(updates), id];

        const result = await query(
          `UPDATE ${tableName} SET ${setClause}, updated_at = NOW()
           WHERE id = $${values.length} AND ${userIdField} = $1
           RETURNING *`,
          values
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json({ data: result.rows[0] });
      } catch (error) {
        console.error(`Erro ao atualizar ${tableName}:`, error);
        res.status(500).json({ error: `Erro ao atualizar ${tableName}` });
      }
    },

    delete: async (req, res) => {
      try {
        const { id } = req.params;

        const result = await query(
          `DELETE FROM ${tableName} WHERE id = $1 AND ${userIdField} = $2 RETURNING id`,
          [id, req.user.id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json({ message: 'Registro removido com sucesso' });
      } catch (error) {
        console.error(`Erro ao deletar ${tableName}:`, error);
        res.status(500).json({ error: `Erro ao deletar ${tableName}` });
      }
    }
  };
};
