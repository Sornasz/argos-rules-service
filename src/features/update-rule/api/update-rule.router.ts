import { Router } from 'express';
import {
  isUuid,
  ruleToJson,
  sendDuplicateName,
  sendInvalidId,
  sendInvalidRequest,
  sendNotFound,
} from '../../../shared/http.js';
import type { UpdateRuleUseCase } from '../application/update-rule.use-case.js';

export function createUpdateRuleRouter(useCase: UpdateRuleUseCase): Router {
  const router = Router();
  router.put('/rules/:id', async (request, response) => {
    const id = request.params.id as string;
    if (!isUuid(id)) {
      sendInvalidId(response, 'id');
      return;
    }
    const outcome = await useCase.execute(id, request.body);
    switch (outcome.kind) {
      case 'invalid':
        sendInvalidRequest(response, outcome.invalidFields);
        return;
      case 'not_found':
        sendNotFound(response, 'Regra não encontrada.');
        return;
      case 'duplicate_name':
        sendDuplicateName(response);
        return;
      case 'updated':
        response.status(200).json(ruleToJson(outcome.rule));
    }
  });
  return router;
}
