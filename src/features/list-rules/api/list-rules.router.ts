import { Router } from 'express';
import { ruleToJson, sendInvalidRequest } from '../../../shared/http.js';
import type { ListRulesUseCase } from '../application/list-rules.use-case.js';

export function createListRulesRouter(useCase: ListRulesUseCase): Router {
  const router = Router();
  router.get('/rules', async (request, response) => {
    const outcome = await useCase.execute(request.query);
    if (outcome.kind === 'invalid') {
      sendInvalidRequest(response, outcome.invalidFields);
      return;
    }
    const { items, page, pageSize, total } = outcome.page;
    response.json({ items: items.map(ruleToJson), page, pageSize, total });
  });
  return router;
}
