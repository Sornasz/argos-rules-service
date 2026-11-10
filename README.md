# argos-rules-service

Microsserviço de **regras de fraude configuráveis** do projeto Argos, com persistência em MongoDB Atlas. Projeto PJBL de Arquitetura de Software com Cloud (PUCPR).

## Domínio escolhido

O domínio deste microsserviço é o cadastro das regras de fraude que o analista gerencia: valor máximo por transação (`MAX_AMOUNT`) e categorias de estabelecimento bloqueadas (`BLOCKED_MCC`). O serviço oferece o CRUD completo dessas regras.

> **Importante:** hoje as regras ficam apenas cadastradas. Elas **não alteram o score** calculado pela Function: o serviço não é consultado por ela e não existe integração entre os dois.

## Tecnologias

- Node 22 e TypeScript (ESM, `NodeNext`)
- Express 5
- MongoDB (driver oficial `mongodb`), MongoDB Atlas no free tier
- Swagger UI (`swagger-ui-express`) com documento OpenAPI 3.0
- Vitest (testes unitários e de API) e dependency-cruiser (testes de arquitetura)
- Docker (build em múltiplos estágios)

## Arquitetura

Clean Architecture combinada com Vertical Slice: cada feature é uma pasta com as quatro camadas.

```
src/
  main.ts                     composição: configuração, persistência, features, servidor
  bootstrap/                  config.ts, server.ts, openapi.ts, seed.ts
  shared/                     núcleo comum: conexão Mongo, armazenamento em memória, helpers HTTP
  features/
    create-rule/              POST   /rules
    list-rules/               GET    /rules
    get-rule/                 GET    /rules/:id
    update-rule/              PUT    /rules/:id
    delete-rule/              DELETE /rules/:id
    health-check/             GET    /health
      domain/                 entidades e regras de negócio, sem dependências
      application/            casos de uso e portas (ports/)
      infrastructure/         adapters: Mongo e memória
      api/                    router Express e documentação OpenAPI
      feature.ts              monta os adapters concretos
      index.ts                única porta de entrada pública da feature
tests/                        espelha src/; tests/architecture valida as regras de dependência
```

### Regras de dependência

Verificadas por `npm run check:arch` (`.dependency-cruiser.cjs`):

- `domain` só importa o próprio `domain`.
- `application` só importa `domain` e `application` da mesma feature; SDKs ficam na `infrastructure`.
- `api` não importa `infrastructure`; a montagem com adapters concretos fica no `feature.ts`.
- Uma feature só enxerga outra pelo `index.ts`; `bootstrap` e `main.ts` também.
- `src/shared` não importa features.
- Sem ciclos e sem imports não resolvidos.

### Persistência

Cada feature declara a porta de que precisa (por exemplo `RuleCreator`) e tem dois adapters: MongoDB e memória. O nome da regra é único sem diferenciar maiúsculas, garantido por um índice único com collation (`locale: pt`, `strength: 2`), criado na inicialização. Nome repetido vira `409` pelo código de erro `11000` do MongoDB. A memória só é usada com `RULES_STORE=memory`, avisa no log e é recusada com `NODE_ENV=production`; nunca há fallback silencioso.

## Endpoints

| Método | Rota | Descrição | Respostas |
| --- | --- | --- | --- |
| GET | `/rules?enabled=&type=&page=` | Lista, 20 por página, mais recentes primeiro | 200, 400 |
| GET | `/rules/:id` | Consulta uma regra | 200, 400, 404 |
| POST | `/rules` | Cria uma regra (header `Location`) | 201, 400, 409 |
| PUT | `/rules/:id` | Substitui a regra | 200, 400, 404, 409 |
| DELETE | `/rules/:id` | Exclui a regra | 204, 400, 404 |
| GET | `/health` | Estado do serviço e do banco | 200, 503 |

Swagger UI em `/docs` e JSON em `/docs/openapi.json`.

Regra: `{ id, name (3 a 80), description (null ou até 500), type, params, enabled, createdAt, updatedAt }`.

- `MAX_AMOUNT`: `params: { "limit": número maior que zero }`
- `BLOCKED_MCC`: `params: { "mcc": "4 dígitos" }`

Erros de validação: `400 { "error": "invalid_request", "invalid_fields": [{ "field", "reason" }] }`. Também há `400` para JSON inválido e para `id` que não é UUID, `413` para corpo grande e `500` sem detalhes internos.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3001` | Porta HTTP |
| `MONGODB_URI` | sem padrão | String de conexão do Atlas; obrigatória, salvo com `RULES_STORE=memory` |
| `MONGODB_DB` | `argos_rules` | Nome do banco |
| `RULES_STORE` | `mongo` | `mongo` ou `memory` (só desenvolvimento) |

Use o `.env.example` como modelo. Não versione o `.env`.

## Como rodar

Requer Node 22.12 ou superior.

```bash
npm ci
```

**Em memória (desenvolvimento, sem banco):**

```bash
RULES_STORE=memory npm run dev
```

**Com MongoDB Atlas:** crie um cluster gratuito, um usuário de banco e libere o seu IP em Network Access. Copie `.env.example` para `.env` e preencha `MONGODB_URI`.

```bash
npm run dev
npm run seed   # opcional: cria 3 regras de exemplo; idempotente, exige MONGODB_URI
```

**Com Docker:**

```bash
docker build -t argos-rules-service .
docker run --rm -p 3001:3001 -e MONGODB_URI="mongodb+srv://..." argos-rules-service
```

Depois acesse http://localhost:3001/docs.

## Testes

```bash
npm test             # unitários, API e arquitetura
npm run check:arch   # regras de dependência no código
npm run typecheck
npm run verify       # os três acima
```

Os testes de API sobem o Express real em porta efêmera sobre o adapter em memória. O teste de integração dos adapters Mongo é pulado a menos que `MONGO_TEST_URI` aponte para um MongoDB (ele cria e remove um banco temporário):

```bash
MONGO_TEST_URI="mongodb+srv://..." npm test
```

## Equipe

- Arthur Sornas
- Eduardo Martins
- Guilherme Marafon
- Victor Ribeiro
