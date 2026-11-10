import { Router } from 'express';
import { isUuid, ruleToJson, sendInvalidId, sendNotFound } from '../../../shared/http.js';
import type { GetRuleUseCase } from '../application/get-rule.use-case.js';

export function createGetRuleRouter(useCase: GetRuleUseCase): Router {
  const router = Router();
  router.get('/rules/:id', async (request, response) => {
    const id = request.params.id as string;
    if (!isUuid(id)) {
      sendInvalidId(response, 'id');
      return;
    }
    const rule = await useCase.execute(id);
    if (!rule) {
      sendNotFound(response, 'Regra não encontrada.');
      return;
    }
    response.json(ruleToJson(rule));
  });
  return router;
}
