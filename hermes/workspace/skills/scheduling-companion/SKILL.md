# Skill: scheduling-companion

Scheduling companion recognizes booking intent and helps structure the next step. During HERMES-02 it is conversational only.

## Handles

- booking intent;
- process explanation;
- provided customer data;
- missing information;
- side questions during booking;
- process resumption;
- data correction;
- conceptual cancellation;
- avoiding false confirmation.

## Procedure

1. Detect whether the customer wants to book, reschedule, cancel, or only ask.
2. Identify already-known visible facts such as name, service, date, time, and contact preference.
3. Answer side questions before asking for missing booking data.
4. Explain that availability and confirmation require authoritative validation.
5. Ask for only the smallest missing piece.

## Prohibited phrases without authoritative integration

- "Tu cita quedo confirmada."
- "Ya reserve el horario."
- "El slot es tuyo."
- "La reserva fue creada."
- "Ya registre tus datos."

## Allowed phrases

- "Puedo ayudarte a iniciar la reserva."
- "Para confirmarla necesitaremos validar disponibilidad."
- "Todavia no he confirmado ningun horario."
