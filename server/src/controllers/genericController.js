import { query } from '../config/database.js';

// Controller genérico para operações CRUD em tabelas simples
export const createGenericController = (tableName, userIdField = 'user_id') => {
  return {
    getAll: async (req, res) => {
      try {
        // Construir query dinamicamente baseado nos parâmetros
        let queryText = `SELECT * FROM ${tableName} WHERE ${userIdField} = $1`;
        const queryParams = [req.user.id];
        let paramCounter = 2;

        // Processar filtros da query string
        Object.keys(req.query).forEach(key => {
          const value = req.query[key];

          // Ignorar parâmetros especiais
          if (['order', 'ascending', 'limit', 'offset', 'single'].includes(key)) {
            return;
          }

          // Processar operadores
          if (key.endsWith('_neq')) {
            const field = key.replace('_neq', '');
            queryText += ` AND ${field} != $${paramCounter}`;
            queryParams.push(value);
            paramCounter++;
          } else if (key.endsWith('_gt')) {
            const field = key.replace('_gt', '');
            queryText += ` AND ${field} > $${paramCounter}`;
            queryParams.push(value);
            paramCounter++;
          } else if (key.endsWith('_gte')) {
            const field = key.replace('_gte', '');
            queryText += ` AND ${field} >= $${paramCounter}`;
            queryParams.push(value);
            paramCounter++;
          } else if (key.endsWith('_lt')) {
            const field = key.replace('_lt', '');
            queryText += ` AND ${field} < $${paramCounter}`;
            queryParams.push(value);
            paramCounter++;
          } else if (key.endsWith('_lte')) {
            const field = key.replace('_lte', '');
            queryText += ` AND ${field} <= $${paramCounter}`;
            queryParams.push(value);
            paramCounter++;
          } else if (key.endsWith('_in')) {
            const field = key.replace('_in', '');
            const values = value.split(',');
            const placeholders = values.map((_, i) => `$${paramCounter + i}`).join(', ');
            queryText += ` AND ${field} IN (${placeholders})`;
            queryParams.push(...values);
            paramCounter += values.length;
          } else if (key.endsWith('_is')) {
            const field = key.replace('_is', '');
            if (value === 'null') {
              queryText += ` AND ${field} IS NULL`;
            } else {
              queryText += ` AND ${field} IS NOT NULL`;
            }
          } else if (key.endsWith('_ilike')) {
            const field = key.replace('_ilike', '');
            queryText += ` AND ${field} ILIKE $${paramCounter}`;
            queryParams.push(value);
            paramCounter++;
          } else if (key.includes('_not_')) {
            const parts = key.split('_not_');
            const field = parts[0];
            const operator = parts[1];
            if (operator === 'eq') {
              queryText += ` AND ${field} != $${paramCounter}`;
            } else if (operator === 'is') {
              if (value === 'null') {
                queryText += ` AND ${field} IS NOT NULL`;
              }
            }
            queryParams.push(value);
            paramCounter++;
          } else {
            // Filtro simples de igualdade
            queryText += ` AND ${key} = $${paramCounter}`;
            queryParams.push(value);
            paramCounter++;
          }
        });

        // Ordenação
        if (req.query.order) {
          const ascending = req.query.ascending === 'true';
          queryText += ` ORDER BY ${req.query.order} ${ascending ? 'ASC' : 'DESC'}`;
        } else {
          queryText += ` ORDER BY created_at DESC`;
        }

        // Limit e Offset
        if (req.query.limit) {
          queryText += ` LIMIT $${paramCounter}`;
          queryParams.push(parseInt(req.query.limit));
          paramCounter++;
        }

        if (req.query.offset) {
          queryText += ` OFFSET $${paramCounter}`;
          queryParams.push(parseInt(req.query.offset));
          paramCounter++;
        }

        const result = await query(queryText, queryParams);

        // Se single mode, retornar apenas o primeiro resultado
        if (req.query.single === 'true') {
          res.json({ data: result.rows.length > 0 ? result.rows[0] : null });
        } else {
          res.json({ data: result.rows });
        }
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
