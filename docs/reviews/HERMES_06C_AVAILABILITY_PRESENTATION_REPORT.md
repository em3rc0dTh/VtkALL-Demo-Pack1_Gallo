# HERMES-06C Availability Presentation Report

## Scope completed

H06C was implemented on top of the existing H06B bridge without extending into slot selection or booking commit.

Reused as-is:

- Hermes runtime and context readers
- H06B semantic bridge and idempotency flow
- `agentCapabilityGateway -> temporalMcpClient -> temporalAgentBridge`
- real `ScheduleConsultationWorkflow`
- real Temporal worker and task queue
- real availability computation through workflow activities

## Date normalization

Date understanding remains conversational, but backend normalization is now authoritative through `hermesSchedulingDateNormalization.service.ts`.

Implemented cases:

- `mañana`
- `este viernes`
- `el 24 de julio`
- `mañana por la tarde`
- `después de las 3`

Behavior:

- timezone authority: `America/Lima`
- ambiguous dates request clarification
- past dates are rejected
- horizon-limited dates are rejected

## Real availability path

H06C keeps the existing execution boundary:

`Hermes -> backend validator -> agentCapabilityGateway -> temporalMcpClient -> temporalAgentBridge -> ScheduleConsultationWorkflow -> fetchAvailabilityActivity -> getAvailability`

Hermes does not call domain availability services directly.

## Public slot presentation

Workflow slots are transformed into a reduced public shape with:

- normalized date
- timezone
- capped public slots
- opaque verifiable token
- no workflow ids
- no Mongo ids
- no team internals
- no capacity internals

Natural responses now present only real authoritative slots and explicitly state that they are not reserved yet.

## Out of scope preserved

Still not implemented in H06C:

- slot selection
- `SUBMIT_SLOT_SELECTION`
- `ResourceReservation`
- `Appointment`
- final `scheduleConsultation`
- confirmation
- cancellation
- rescheduling

Slot-choice utterances remain out of scope and are declined back to the legacy boundary.

## Minimal checks executed

- Temporal readiness: PASS
- Temporal worker status: PASS
- `npm run hermes:h06c:availability`: PASS
- `npm run hermes:h06c:no-booking`: PASS
- `npm run hermes:h06c:residue`: PASS
- `npm run test:demo-test:guardrails`: PASS
- `npm run build`: PASS

Runtime note:

- From this Codex session, Temporal connectivity succeeded with `TEMPORAL_ADDRESS=127.0.0.1:7233` for test execution.
- Repository `.env` remains `TEMPORAL_ADDRESS=localhost:7233` as required.

## Evidence summary

- normalized tomorrow request resolved to `2026-07-21`
- timezone used: `America/Lima`
- real slots were presented from the workflow result
- side question after slots preserved availability context without requery
- no-availability case used future Saturday `2026-07-25`
- `selectSlot` signals: `0`
- `ResourceReservation` created: `0`
- `Appointment` created: `0`
- `scheduleConsultation` final calls: `0`
- fixture residue after cleanup: `0`

## Next step

Authorized next unit:

`HERMES-06D - Slot Selection and Authoritative Booking`
