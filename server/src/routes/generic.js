import express from 'express';
import { createGenericController } from '../controllers/genericController.js';
import { authenticateToken } from '../middleware/auth.js';

// Função para criar rotas genéricas para tabelas simples
export const createGenericRoutes = (tableName, userIdField = 'user_id') => {
  const router = express.Router();
  const controller = createGenericController(tableName, userIdField);

  router.use(authenticateToken);

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
};
