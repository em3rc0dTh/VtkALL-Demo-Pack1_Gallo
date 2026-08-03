# demoTest Service Boundary

This folder is the PR-002 service boundary for Pack 0 backend stabilization.

## Guardrails

- Do not mount `/api/demo-test` in PR-002.
- Do not change existing `/api/v1` behavior.
- Do not modify Temporal or seed behavior.
- Do not create new Mongoose models or demo-only canonical entities.
- Do not return fake persisted entities from skeleton methods.
- Unimplemented service methods throw `DemoTestDomainError` with `statusCode: 501`.

## Import Boundary

Future controllers and route handlers should import from:

```ts
import { DemoTestDomainError, ScheduleConsultationInput } from '../services/demoTest';
```

Do not import from internal split files unless extending this service boundary itself.

## Reservation Vocabulary

`ResourceReservation.status` may only use:

- `held`
- `booked`
- `cancelled`
- `released`
- `expired`

`confirmResourceReservation` means `held -> booked`. The reservation status `confirmed` must not be introduced.

## Capacity Note

The service layer counts consumed capacity per `slotKey`, but the current `ResourceReservation` unique partial index can still limit true capacity > 1 reservations at the database layer. Do not change indexes in PR-004/005; treat multi-capacity index support as later schema hardening.
