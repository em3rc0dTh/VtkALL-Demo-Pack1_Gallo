# VTKALL Demo Pack 1 Backend + Temporal

This backend runs MongoDB, the REST API, Temporal Server, Temporal UI, and a Temporal TypeScript worker through Docker Compose.

For the full project stack, including the frontend in API mode, prefer the root `../docker-compose.yml`.

## Run

```bash
docker compose up --build
```

Useful URLs:

- API: http://localhost:4000/api/v1/admin/health
- OpenAPI UI: http://localhost:4000/api-docs
- Temporal UI: http://localhost:8080
- Mongo Express: http://localhost:8081

## Seed

```bash
docker compose exec api npm run seed:reset
```

The seed inserts the original Demo Pack 1 mock data plus:

- legacy Friday/Saturday `availabilitySlots`
- `workTeams` for front desk, mechanics, and detailing
- base schedule rules for Friday/Saturday
- schedule overrides for reduced front desk time and blocked detailing time
- empty `resourceReservations` ready for Temporal bookings

## Manual Agent Demo

```bash
docker compose exec api npm run agent:demo
```

You play both roles:

- Agent: reads Temporal instructions and presents them.
- Customer: selects service, provides data, and chooses a slot.

Temporal owns the workflow state and calls the API through activities.

The scheduling flow now calculates availability from team capacity instead of treating legacy slots as the source of truth. The manual menu can inspect appointments, customers, vehicles, cases, timeline events, legacy slots, resource reservations, work teams, and schedule rules/overrides.
