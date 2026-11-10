import { Router } from 'express';
import { isUuid, sendInvalidId, sendNotFound } from '../../../shared/http.js';
import type { DeleteRuleUseCase } from '../application/delete-rule.use-case.js';

export function createDeleteRuleRouter(useCase: DeleteRuleUseCase): Router {
  const router = Router();
  router.delete('/rules/:id', async (request, response) => {
    const id = request.params.id as string;
    if (!isUuid(id)) {
      sendInvalidId(response, 'id');
      return;
    }
    const removal = await useCase.execute(id);
    if (removal === 'not_found') {
      sendNotFound(response, 'Regra não encontrada.');
      return;
    }
    response.status(204).end();
  });
  return router;
}
