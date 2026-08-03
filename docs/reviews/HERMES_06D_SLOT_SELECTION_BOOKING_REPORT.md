# HERMES-06D Slot Selection and Authoritative Booking Report

## Scope completed

H06D extends the existing H06B and H06C bridge so Hermes can resolve an authoritative slot selection and commit a real booking through:

`Hermes -> agentCapabilityGateway -> Temporal MCP bridge -> ScheduleConsultationWorkflow -> reserveAppointmentActivity -> scheduleConsultation`

Implemented:

- public slot tokens are now signed and scoped to `businessSlug`, `conversationId`, `workflowId`, `offeringId`, `slotId`, `date`, and expiry
- conversational slot references now resolve against authoritative `availableSlots`
- `SUBMIT_SLOT_SELECTION` is enabled only behind dedicated H06D booking flags
- booking confirmation is emitted only after authoritative `ResourceReservation` and `Appointment` success
- stale slot replay keeps the process in `WAITING_FOR_SLOT_SELECTION`
- same `messageId` plus same slot replays safely
- same `messageId` plus different slot is rejected as `IDEMPOTENCY_CONFLICT`

## Token validation

Accepted resolution paths:

- signed public token
- first/second visible option
- explicit visible start time such as `El de las 12.`
- explicit visible range such as `12:00 a 13:00`
- single remaining visible slot with a deictic message

Rejected paths:

- malformed or tampered token
- expired token
- token from another conversation or workflow
- token whose slot no longer matches the current authoritative slot list
- invented slot ids and times outside the current authoritative window

## Capacity recheck and booking commit

Real booking stays inside the existing Temporal workflow.

When slot selection succeeds:

- the workflow transitions to `APPOINTMENT_BOOKED`
- the final ProcessContext contains both:
  - `appointment.reservation`
  - `appointment.appointment`
- the visible Hermes reply confirms the real scheduled window

When a stale slot loses capacity between presentation and confirmation:

- the workflow returns to `WAITING_FOR_SLOT_SELECTION`
- Hermes does not auto-pick another slot
- the visible reply asks for reselection or a fresh availability check

## Evidence

Successful booking check:

- `bridgeOutcome: EXECUTED`
- `processStatus: APPOINTMENT_BOOKED`
- `selectSlotSignals: 2`
- `ResourceReservation: 1`
- `Appointment: 1`

Conflict and replay check:

- first booking: `EXECUTED`
- same `messageId` and same slot: `REPLAYED`
- stale slot after another booking: `SEMANTIC_ERROR`
- same `messageId` and different slot: `IDEMPOTENCY_CONFLICT`
- losing conversation residue:
  - `ResourceReservation: 0`
  - `Appointment: 0`

## Minimal checks executed

- Temporal readiness: PASS
- Temporal worker status: PASS
- `npm run hermes:h06d:booking`: PASS
- `npm run hermes:h06d:conflict`: PASS
- `npm run hermes:h06d:residue`: PASS
- `npm run test:demo-test:guardrails`: PASS
- `npm run build`: PASS

## Notes

- H06D verification intentionally uses the real seeded booking catalog exposed by the active runtime stack.
- Appointment and reservation persistence were verified through the live backend API that shares the worker's database, while conversation interaction counts were verified through the local Hermes-side Mongo connection used by the bridge.
