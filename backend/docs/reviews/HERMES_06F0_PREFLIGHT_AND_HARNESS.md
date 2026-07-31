# HERMES-06F.0 Preflight And Harness

## Estado

H06F.0 deja dos cosas listas:

1. Preflight integral H05-H06E en un solo comando.
2. Definicion del harness E2E que seguira la ruta real del frontend.

## Comando unico

Desde `backend/`:

```bash
npm run hermes:h06f:preflight
```

Este comando ejecuta, en orden:

1. `backend build`
2. `hermes:h06d:specialist`
3. `hermes:h06d:specialist-residue`
4. `hermes:h06e:synth`
5. `hermes:h06e:synth-residue`
6. `hermes:h06c:dispatch`
7. `hermes:h06b:orchestrator`
8. `hermes:h05:visible`
9. `hermes:h05:fallback`
10. `hermes:h06a:dry-run`
11. `frontend build`

## Ruta real del frontend

El harness de H06F.1 debe usar la misma ruta que usa el chat actual:

- Pantalla: `/agendar`
- Componente: `frontend/components/landing/DemoTestAgentChat.jsx`
- Repositorio frontend: `frontend/lib/api/agentSimRepository.js`
- Endpoint inicial: `POST /api/demo-test/agent/message`
- Endpoint de continuidad: `POST /api/demo-test/agent/workflows/:workflowId/message`

El frontend no selecciona skills ni decide la ruta interna.

## Modos del harness

### 1. `SHADOW_ONLY`

- Hermes ejecuta H06B-H06E.
- Legacy sigue siendo el outbound visible.
- Se persisten artefactos internos.

### 2. `CANDIDATE_ELIGIBLE`

- Hermes genera candidato.
- H05 decide visibilidad.
- El candidato sigue sin autoridad propia.

### 3. `CONTROLLED_VISIBLE`

- Solo para casos elegibles por H05 y flags internos.
- No se habilita globalmente en H06F.0.

## Artefactos por turno

Cada turno debe poder auditarse por `correlationId`:

```text
InboundMessage
TurnAssessment
HermesDispatchPlan
SkillInvocation
SkillResult
ResponseCandidate
VisibilityDecision
VisibleOutbound (0 o 1)
```

## Casos obligatorios de H06F.1

1. Cortesia
2. Solicitud incompleta
3. Preferencia temporal relativa
4. Continuidad breve
5. Pregunta lateral
6. Correccion
7. Action proposal
8. Intento de forzar confirmacion
9. Skill timeout
10. Skill desconocido
11. Prompt injection
12. Reenvio duplicado
13. Dos conversaciones simultaneas
14. Dos negocios

## Criterios previos a H06F.1

- `npm run hermes:h06f:preflight` en verde
- frontend build en verde
- backend build en verde
- sin acciones reales
- sin Temporal en la ruta Hermes H06B-H06E
