Perfecto. El alcance queda así:

> **CODEX implementará una Mongo Engine local con Docker, un script TypeScript/Node para inyectar la mock data de VTKALL_DEMO_PACK_1, y una REST API con CRUD completo por entidad ingestada, más documentación tipo Swagger/OpenAPI.**

Nota operativa: algunos archivos antiguos cargados en el entorno aparecen expirados. Para este plan usaré como fuente vigente el modelo consolidado **`Data_MDATA_MODEL_VTKALL_DataModel-0_v2`** y la mock data entregada en el mensaje anterior.

---

# Plan de implementación — Mongo Engine + Data Injection + REST CRUD API

## 1. Objetivo técnico

Construir una capa local para validar el modelo de datos de **VTKALL_DEMO_PACK_1 / Turagua** usando:

```text
Docker
MongoDB local
Node.js
TypeScript
Express o Fastify
Mongoose o MongoDB Native Driver
OpenAPI / Swagger UI
Script de seed/injection
Endpoints REST CRUD por entidad
```

El resultado esperado será:

```text
Mongo Engine local
→ Ingesta de mock data
→ Colecciones creadas
→ API REST CRUD
→ Documentación Swagger-like
→ Endpoints consultables por Postman/cURL/browser
```

---

# 2. Entidades a soportar

La mock data entregada contiene estas entidades/colecciones:

```text
businessProfiles
catalogOfferings
customers
managedEntities
cases
customerInteractions
appointments
decisionRecords
notifications
timelineEvents
attachments
```

Por tanto, el primer alcance de la API CRUD debe cubrir exactamente esas colecciones.

No incluir todavía:

```text
assessments
assessmentReports
quotes
quoteLines
workOrders
workOrderTasks
```

Esas entidades pertenecen a fases posteriores del flujo, pero no están dentro de los casos de uso subrayados de la matriz actual.

---

# 3. Estructura sugerida del proyecto

CODEX debe organizar el backend de forma modular.

```text
backend/
  src/
    app.ts
    server.ts

    config/
      env.ts
      mongo.ts
      openapi.ts

    db/
      connect.ts
      seed.ts
      reset.ts

    data/
      vtkall-demo-pack-1.mock.json

    models/
      BusinessProfile.model.ts
      CatalogOffering.model.ts
      Customer.model.ts
      ManagedEntity.model.ts
      Case.model.ts
      CustomerInteraction.model.ts
      Appointment.model.ts
      DecisionRecord.model.ts
      Notification.model.ts
      TimelineEvent.model.ts
      Attachment.model.ts

    repositories/
      base.repository.ts

    services/
      baseCrud.service.ts
      seed.service.ts

    controllers/
      businessProfiles.controller.ts
      catalogOfferings.controller.ts
      customers.controller.ts
      managedEntities.controller.ts
      cases.controller.ts
      customerInteractions.controller.ts
      appointments.controller.ts
      decisionRecords.controller.ts
      notifications.controller.ts
      timelineEvents.controller.ts
      attachments.controller.ts

    routes/
      index.ts
      businessProfiles.routes.ts
      catalogOfferings.routes.ts
      customers.routes.ts
      managedEntities.routes.ts
      cases.routes.ts
      customerInteractions.routes.ts
      appointments.routes.ts
      decisionRecords.routes.ts
      notifications.routes.ts
      timelineEvents.routes.ts
      attachments.routes.ts

    docs/
      openapi.ts

    middlewares/
      errorHandler.ts
      requestLogger.ts
      validateObjectId.ts

    utils/
      pagination.ts
      queryParser.ts
      response.ts

  docker-compose.yml
  Dockerfile
  package.json
  tsconfig.json
  .env.example
  README.md
```

---

# 4. Docker / Mongo Engine local

## 4.1. Docker Compose

CODEX debe crear un `docker-compose.yml` con al menos:

```text
mongo
mongo-express opcional
api
```

Servicios esperados:

```text
mongodb://mongo:27017/vtkall_demo_pack_1
```

Variables recomendadas:

```env
MONGO_INITDB_ROOT_USERNAME=vtkall
MONGO_INITDB_ROOT_PASSWORD=vtkall_password
MONGO_DATABASE=vtkall_demo_pack_1
MONGO_URI=mongodb://vtkall:vtkall_password@mongo:27017/vtkall_demo_pack_1?authSource=admin
API_PORT=4000
NODE_ENV=development
```

## 4.2. Comandos esperados

El proyecto debe permitir:

```bash
docker compose up -d
docker compose down
docker compose down -v
npm run dev
npm run seed
npm run seed:reset
npm run build
npm run start
```

---

# 5. Script de inyección de datos

## 5.1. Archivo fuente

CODEX debe tomar la mock data entregada y guardarla como:

```text
src/data/vtkall-demo-pack-1.mock.json
```

## 5.2. Script principal

Crear:

```text
src/db/seed.ts
```

Este script debe:

```text
1. Conectarse a MongoDB.
2. Leer el JSON de mock data.
3. Validar que existe datasetName.
4. Validar businessSlug = turagua.
5. Insertar datos en orden correcto.
6. Evitar duplicados por _id.
7. Permitir modo reset.
8. Cerrar conexión al finalizar.
```

## 5.3. Orden de inserción

El orden debe respetar dependencias:

```text
1. businessProfiles
2. catalogOfferings
3. customers
4. managedEntities
5. cases
6. customerInteractions
7. appointments
8. decisionRecords
9. notifications
10. timelineEvents
11. attachments
```

## 5.4. Modo idempotente

El seed debe poder ejecutarse más de una vez sin duplicar datos.

Opciones aceptadas:

```text
upsert por _id
deleteMany + insertMany en modo reset
```

Recomendación:

```text
npm run seed       → upsert idempotente
npm run seed:reset → limpia colecciones e inserta desde cero
```

## 5.5. Resultado esperado

Al finalizar, debe imprimir algo similar a:

```text
VTKALL DEMO PACK 1 seed completed.
businessProfiles: 1
catalogOfferings: 3
customers: 3
managedEntities: 3
cases: 3
customerInteractions: 5
appointments: 3
decisionRecords: 2
notifications: 3
timelineEvents: 8
attachments: 0
```

---

# 6. Modelos Mongo / TypeScript

CODEX debe crear modelos TypeScript para cada colección.

## 6.1. Regla general

Todos los modelos deben tener:

```text
_id: string
businessSlug: string
createdAt?: Date | string
updatedAt?: Date | string
```

## 6.2. Colecciones requeridas

```text
BusinessProfile
CatalogOffering
Customer
ManagedEntity
Case
CustomerInteraction
Appointment
DecisionRecord
Notification
TimelineEvent
Attachment
```

## 6.3. Validación mínima

No se necesita validación enterprise todavía, pero sí validación básica:

```text
businessSlug requerido
_id requerido
caseId requerido cuando aplique
customerId requerido cuando aplique
managedEntityId requerido cuando aplique
status requerido en entidades operativas
```

## 6.4. Índices mínimos

Crear índices básicos:

```text
businessSlug
caseId
customerId
managedEntityId
status
createdAt
```

Por colección:

```text
customers:
  businessSlug + contact.phones.normalized

managedEntities:
  businessSlug + customerId
  businessSlug + type
  businessSlug + data.plate

cases:
  businessSlug + caseNumber
  businessSlug + customerId
  businessSlug + managedEntityId
  businessSlug + status

appointments:
  businessSlug + caseId
  businessSlug + scheduledStart
  businessSlug + status

decisionRecords:
  businessSlug + caseId
  businessSlug + entity.type + entity.id
  businessSlug + decisionType

timelineEvents:
  businessSlug + caseId + createdAt

notifications:
  businessSlug + caseId
  businessSlug + status

attachments:
  businessSlug + caseId
  businessSlug + entity.type + entity.id
```

---

# 7. REST API CRUD completa

## 7.1. Base path

Usar:

```text
/api/v1
```

## 7.2. Endpoints por entidad

Para cada entidad, crear CRUD completo:

```text
GET    /api/v1/{collection}
GET    /api/v1/{collection}/:id
POST   /api/v1/{collection}
PUT    /api/v1/{collection}/:id
PATCH  /api/v1/{collection}/:id
DELETE /api/v1/{collection}/:id
```

Colecciones:

```text
/api/v1/business-profiles
/api/v1/catalog-offerings
/api/v1/customers
/api/v1/managed-entities
/api/v1/cases
/api/v1/customer-interactions
/api/v1/appointments
/api/v1/decision-records
/api/v1/notifications
/api/v1/timeline-events
/api/v1/attachments
```

---

# 8. Query endpoints

Además del CRUD básico, CODEX debe soportar consultas útiles desde el inicio.

## 8.1. Filtros comunes

Todos los `GET list` deben soportar:

```text
businessSlug
status
caseId
customerId
managedEntityId
limit
page
sort
```

Ejemplo:

```text
GET /api/v1/cases?businessSlug=turagua&status=appointment_confirmed
GET /api/v1/appointments?businessSlug=turagua&status=confirmed
GET /api/v1/timeline-events?caseId=case_tur_001
```

## 8.2. Endpoints relacionales recomendados

Crear también:

```text
GET /api/v1/customers/:id/cases
GET /api/v1/customers/:id/managed-entities
GET /api/v1/cases/:id/timeline
GET /api/v1/cases/:id/interactions
GET /api/v1/cases/:id/appointments
GET /api/v1/cases/:id/notifications
GET /api/v1/cases/:id/decisions
GET /api/v1/managed-entities/:id/cases
```

Estos endpoints son necesarios para validar el modelo de datos como grafo operativo, no solo como colecciones aisladas.

---

# 9. Endpoints administrativos de seed

Crear endpoints solo para entorno local/dev.

```text
POST /api/v1/admin/seed
POST /api/v1/admin/seed/reset
GET  /api/v1/admin/seed/status
GET  /api/v1/admin/health
```

## 9.1. Health check

Debe devolver:

```json
{
  "status": "ok",
  "database": "connected",
  "databaseName": "vtkall_demo_pack_1",
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

## 9.2. Seed status

Debe devolver conteos:

```json
{
  "businessProfiles": 1,
  "catalogOfferings": 3,
  "customers": 3,
  "managedEntities": 3,
  "cases": 3,
  "customerInteractions": 5,
  "appointments": 3,
  "decisionRecords": 2,
  "notifications": 3,
  "timelineEvents": 8,
  "attachments": 0
}
```

---

# 10. Documentación tipo Swagger / OpenAPI

## 10.1. Ruta Swagger

Exponer:

```text
/api-docs
```

Y el JSON OpenAPI en:

```text
/openapi.json
```

## 10.2. Documentar entidades

Cada schema debe aparecer en OpenAPI:

```text
BusinessProfile
CatalogOffering
Customer
ManagedEntity
Case
CustomerInteraction
Appointment
DecisionRecord
Notification
TimelineEvent
Attachment
```

## 10.3. Documentar endpoints CRUD

Cada endpoint debe incluir:

```text
summary
description
tags
query params
path params
requestBody
responses
example response
```

## 10.4. Tags Swagger

Usar tags:

```text
Health
Admin Seed
Business Profiles
Catalog Offerings
Customers
Managed Entities
Cases
Customer Interactions
Appointments
Decision Records
Notifications
Timeline Events
Attachments
```

## 10.5. Ejemplo esperado en documentación

Para `GET /api/v1/cases`:

```text
Summary:
List operational cases.

Description:
Returns VTKALL operational cases filtered by businessSlug, status, customerId or managedEntityId.

Query params:
businessSlug
status
customerId
managedEntityId
page
limit
sort
```

Para `GET /api/v1/cases/{id}/timeline`:

```text
Summary:
Get case timeline.

Description:
Returns all timeline events associated with a specific operational case.
```

---

# 11. Respuestas estándar de API

Todas las respuestas deben tener formato consistente.

## 11.1. List response

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

## 11.2. Single response

```json
{
  "data": {
    "_id": "case_tur_001"
  }
}
```

## 11.3. Error response

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {}
  }
}
```

---

# 12. Reglas de validación funcional

CODEX debe implementar validaciones mínimas en servicios.

## 12.1. Crear `Case`

Al crear un caso:

```text
businessSlug requerido
customerId debe existir
managedEntityId debe existir si se envía
caseNumber único por businessSlug
```

## 12.2. Crear `Appointment`

Al crear una cita:

```text
caseId debe existir
customerId debe existir
managedEntityId debe existir si aplica
scheduledStart requerido
status inicial permitido: scheduled | confirmed
```

## 12.3. Crear `DecisionRecord`

Al crear una decisión:

```text
caseId debe existir
entity.type requerido
entity.id requerido
decisionType requerido
decision requerido
```

Si:

```text
decisionType = appointment_confirmation
decision = confirmed
```

Entonces debe actualizar opcionalmente el appointment relacionado a:

```text
status = confirmed
confirmation.status = confirmed_by_customer
```

Y registrar un `TimelineEvent`.

Para esta primera versión, esa actualización puede implementarse como servicio simple, no como workflow.

---

# 13. Testing mínimo

CODEX debe crear pruebas o al menos scripts de verificación.

## 13.1. Smoke test

Debe validar:

```text
Mongo conecta
Seed corre
Colecciones tienen conteo esperado
GET /health responde ok
GET /cases devuelve data
GET /cases/case_tur_001 devuelve caso
GET /cases/case_tur_001/timeline devuelve eventos
```

## 13.2. Post-seed checks

Comandos esperados:

```bash
npm run seed:reset
npm run test:smoke
```

Resultado esperado:

```text
✓ Mongo connected
✓ Seed completed
✓ cases count = 3
✓ customers count = 3
✓ appointments count = 3
✓ API health ok
✓ Case timeline ok
```

---

# 14. Acceptance criteria

El trabajo se considera completo cuando:

```text
1. docker compose up levanta MongoDB y API.
2. npm run seed:reset inserta la mock data.
3. Mongo contiene todas las colecciones esperadas.
4. Cada colección tiene CRUD completo.
5. Los endpoints relacionales de Case funcionan.
6. /api-docs muestra documentación tipo Swagger.
7. /openapi.json expone el contrato OpenAPI.
8. /api/v1/admin/seed/status devuelve conteos correctos.
9. GET /api/v1/cases?businessSlug=turagua devuelve casos.
10. GET /api/v1/cases/case_tur_001/timeline devuelve timeline.
```

---

# 15. Orden de implementación para CODEX

## Step 1 — Bootstrap backend TypeScript

Crear base Node/TypeScript:

```text
package.json
tsconfig.json
src/app.ts
src/server.ts
.env.example
```

Dependencias sugeridas:

```text
express
mongoose
dotenv
cors
helmet
morgan
zod
swagger-ui-express
swagger-jsdoc o openapi-types
tsx
typescript
```

---

## Step 2 — Docker Mongo Engine

Crear:

```text
docker-compose.yml
Dockerfile
```

Levantar:

```text
mongo
mongo-express opcional
api
```

---

## Step 3 — Mongo connection

Crear:

```text
src/config/env.ts
src/db/connect.ts
```

Validar conexión con:

```text
GET /api/v1/admin/health
```

---

## Step 4 — Modelos Mongoose

Crear modelos para:

```text
BusinessProfile
CatalogOffering
Customer
ManagedEntity
Case
CustomerInteraction
Appointment
DecisionRecord
Notification
TimelineEvent
Attachment
```

---

## Step 5 — Mock data file

Guardar el JSON entregado como:

```text
src/data/vtkall-demo-pack-1.mock.json
```

---

## Step 6 — Seed service

Crear:

```text
src/services/seed.service.ts
src/db/seed.ts
src/db/reset.ts
```

Implementar:

```text
seed idempotente
seed reset
conteo por colección
logs finales
```

---

## Step 7 — Base CRUD layer

Crear:

```text
src/repositories/base.repository.ts
src/services/baseCrud.service.ts
```

Objetivo:

```text
Evitar duplicar lógica CRUD en cada entidad.
```

---

## Step 8 — Controllers y routes

Crear controller y route por entidad.

Cada route debe soportar:

```text
list
getById
create
replace
patch
delete
```

---

## Step 9 — Query parser y pagination

Crear:

```text
src/utils/queryParser.ts
src/utils/pagination.ts
```

Soportar:

```text
page
limit
sort
businessSlug
status
caseId
customerId
managedEntityId
```

---

## Step 10 — Endpoints relacionales

Crear endpoints:

```text
GET /customers/:id/cases
GET /customers/:id/managed-entities
GET /cases/:id/timeline
GET /cases/:id/interactions
GET /cases/:id/appointments
GET /cases/:id/notifications
GET /cases/:id/decisions
GET /managed-entities/:id/cases
```

---

## Step 11 — Swagger/OpenAPI

Crear:

```text
src/docs/openapi.ts
src/config/openapi.ts
```

Exponer:

```text
/api-docs
/openapi.json
```

---

## Step 12 — Smoke tests

Crear:

```text
src/tests/smoke.ts
```

O script equivalente.

Validar:

```text
health
seed status
cases
case timeline
appointments
customers
```

---

# 16. Entregables esperados de CODEX

CODEX debe entregar:

```text
1. Docker Compose funcional.
2. Backend TypeScript ejecutable.
3. Mongo connection.
4. Modelos Mongoose.
5. Mock data JSON integrada.
6. Seed script idempotente.
7. Seed reset script.
8. CRUD completo por colección.
9. Endpoints relacionales.
10. Swagger/OpenAPI.
11. README con comandos.
12. Smoke test o checklist ejecutable.
```

---

# 17. Nombre sugerido del PR

```text
PR-DATA-ENGINE-01 — Mongo Mock Data Engine + REST CRUD API
```

## Descripción del PR

```text
Implements a local MongoDB data engine for VTKALL_DEMO_PACK_1, including Docker-based MongoDB setup, TypeScript seed scripts for Turagua mock data, CRUD REST endpoints for all ingested entities, relational query endpoints, and Swagger/OpenAPI documentation.
```

## Scope

```text
- Local MongoDB via Docker
- Mock data injection
- CRUD API for ingested entities
- Case relational endpoints
- Swagger-like documentation
- Seed status and health endpoints
```

## Out of scope

```text
- Authentication
- Authorization
- Production deployment
- Temporal workflows
- Quote/WorkOrder advanced lifecycle
- Pack 2 mock data
- Real file upload
- Payment handling
```

---

Este plan deja a CODEX con una ruta clara: primero montar la engine local, luego inyectar el dataset, después exponer CRUD completo y finalmente documentar todo con Swagger/OpenAPI.
