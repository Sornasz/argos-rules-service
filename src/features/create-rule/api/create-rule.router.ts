import { Router } from 'express';
import { ruleToJson, sendDuplicateName, sendInvalidRequest } from '../../../shared/http.js';
import type { CreateRuleUseCase } from '../application/create-rule.use-case.js';

export function createCreateRuleRouter(useCase: CreateRuleUseCase): Router {
  const router = Router();
  router.post('/rules', async (request, response) => {
    const outcome = await useCase.execute(request.body);
    switch (outcome.kind) {
      case 'invalid':
        sendInvalidRequest(response, outcome.invalidFields);
        return;
      case 'duplicate_name':
        sendDuplicateName(response);
        return;
      case 'created':
        response.status(201).location(`/rules/${outcome.rule.id}`).json(ruleToJson(outcome.rule));
    }
  });
  return router;
}
