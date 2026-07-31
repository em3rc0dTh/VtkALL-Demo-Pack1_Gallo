# Architecture Boundaries

Hermes is the conversation layer.

Backend validates and persists.

Temporal orchestrates durable process state.

MongoDB is the source of truth for operational records.

HERMES-02 boundaries:

- no backend reads or writes;
- no Temporal signals, queries, or workflow starts;
- no MongoDB reads or writes;
- no customer creation;
- no case creation;
- no appointment confirmation;
- no real catalog query;
- no availability validation;
- no filesystem access outside authorized Hermes files.

Customer-facing language should not expose implementation details unless the user explicitly asks for architecture.
