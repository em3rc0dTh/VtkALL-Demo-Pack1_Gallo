# Demo Test Idempotency Contract MK1

Date: 2026-07-10
Scope: demoTest write commands, with `consultation.schedule` as the first required-key command.

## Purpose

Persistent command idempotency prevents duplicate side effects when the same logical command is retried with the same `Idempotency-Key` and same semantic request fingerprint.

The guarantee is:

```text
same businessSlug + scope + idempotencyKey
+ same request fingerprint
= stored result replay or stored semantic failure
```

This is backed by MongoDB. It is not an in-memory cache.

## Identity

The unique command identity is:

```text
businessSlug
scope
idempotencyKey
```

Current scopes:

- `consultation.schedule`
- `customer.create_or_reuse`
- `managed_entity.create`
- `case.create`

`consultation.schedule` requires an `Idempotency-Key` immediately for HTTP and service/Temporal execution. The other scopes use persistent idempotency when a key is supplied and remain compatible when no key is supplied.

## Request Fingerprint

`requestFingerprint` is a SHA-256 hash over canonical command input:

- object keys are sorted;
- dates are normalized to ISO strings;
- execution metadata such as `correlationId`, `causationId`, `workflowId`, `workflowRunId`, `activityId`, `attempt`, and `idempotencyKey` is excluded.

Same key with a different fingerprint returns `IDEMPOTENCY_CONFLICT`.

## Record States

`IdempotencyRecord.status` values:

- `processing`: one owner is executing the command.
- `succeeded`: safe replay payload is available.
- `failed_retryable`: retry may acquire a new lease and execute again.
- `failed_final`: semantic failure is replayed.

The record also stores `ownerToken`, `leaseExpiresAt`, `attempts`, `result`, `failure`, and execution metadata from the original context.

## Lease Behavior

```text
processing + active lease
  -> duplicate caller receives COMMAND_IN_PROGRESS.

processing + expired lease
  -> duplicate caller may acquire ownership.

succeeded / failed_final
  -> immutable replay.
```

No Redis lock, distributed transaction framework, or message bus is introduced.

## Success Replay

Successful scheduling stores a safe replay payload with the appointment, resource reservation, and case status. Replay returns the stored payload without creating another `ResourceReservation`, `Appointment`, business `TimelineEvent`, or case status transition.

Initial timeline events keep the original `execution.idempotencyKey`, `correlationId`, and `causationId`.

## Failure Replay

Final semantic failures are stored as `failed_final` and replayed:

- `VALIDATION_ERROR`
- `CUSTOMER_NOT_FOUND`
- `MANAGED_ENTITY_NOT_FOUND`
- `CASE_NOT_FOUND`
- `WORK_TEAM_NOT_FOUND`
- `CATALOG_OFFERING_NOT_FOUND`
- `NO_AVAILABILITY`
- `DOUBLE_BOOKING_CONFLICT`
- `IDEMPOTENCY_CONFLICT`
- `INVALID_STATE_TRANSITION`

Retryable or ambiguous failures remain protected by the processing record, lease takeover, and scheduling reconciliation.

## Scheduling Guarantees

```text
same key + same schedule request
  -> same Appointment and ResourceReservation returned.

same key + modified schedule request
  -> IDEMPOTENCY_CONFLICT.

different key + same occupied slot
  -> DOUBLE_BOOKING_CONFLICT.
```

The existing scheduling consistency boundary remains unchanged:

```text
validate
-> reserve capacity
-> create Appointment
-> book reservation
-> update Case
-> record TimelineEvent
```

## Ambiguous Completion Recovery

If side effects completed but the idempotency success update failed, scheduling reconciliation searches by `businessSlug`, `caseId`, `Appointment.workflow.idempotencyKey`, and linked `ResourceReservation`.

TimelineEvent is not the source of reconciliation because timeline writes may be the failed operation.

## HTTP Contract

`POST /api/demo-test/schedule-consultation` requires:

```text
Idempotency-Key: <client-generated-key>
```

Do not silently generate a random key for public writes.

## Temporal Strategy

Temporal Activities use stable command keys. The consolidated scheduling command uses:

```text
schedule-consultation:<caseId>:<slotStartIso>
```

It does not use timestamps generated per attempt, random UUIDs, activity attempt numbers, or workflow run ID alone.

## Retention

`expiresAt` exists for future retention policy, but no destructive TTL behavior is required by MK1.

## Verification

```bash
npm run test:demo-test:idempotency
```

The test writes only to the configured Mongo database and prints manual cleanup filters. Use an isolated database for mutation verification.
