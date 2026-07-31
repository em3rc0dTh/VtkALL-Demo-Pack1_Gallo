import assert from 'assert';
import { runHermesSchedulingBridgeTurn } from '../../agent/hermes/scheduling/hermesSchedulingBridge.service';
import { enableH06BTestFlags } from './h06bFixtures';

const noop = async () => null as any;

const run = async () => {
  enableH06BTestFlags();
  const messages = [
    'El viernes por la tarde.',
    '¿Qué horarios tienen mañana?',
    'Quiero el horario de las tres.',
    'Cancela la reserva.',
  ];

  for (const [index, message] of messages.entries()) {
    const result = await runHermesSchedulingBridgeTurn({
      businessSlug: 'demo_test',
      conversationId: `hermes-h06b-no-capacity-${index}`,
      message,
      messageId: `msg-${index}`,
      correlationId: `corr-${index}`,
    }, {
      buildContext: async () => ({
        context: {
          conversation: { conversationId: `hermes-h06b-no-capacity-${index}`, channel: 'web_agent', history: [] },
          permissions: { mode: 'shadow' as const, readOnly: true as const, canExecuteActions: false as const },
          catalog: [],
        },
        history: [],
      }),
      gateway: {
        resolveActiveProcess: async () => undefined,
      } as any,
      findMessageById: noop as any,
    });
    assert(!result.handled, `message must stay outside H06B: ${message}`);
  }

  console.log('h06b-no-capacity: PASS');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
