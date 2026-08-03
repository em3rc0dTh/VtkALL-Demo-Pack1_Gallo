import assert from 'assert';
import { deterministicFallback } from '../../fallback/deterministicFallback';
import { AgentContext } from '../../context/agentContext';

const context: AgentContext = {
  conversation: {
    conversationId: 'fallback-catalog-test',
    businessSlug: 'demo_test',
    channel: 'web_agent',
    recentMessages: [],
  },
  business: {
    businessSlug: 'demo_test',
    business: {
      name: 'Turagua Racing Peru',
      timezone: 'America/Lima',
    },
    agent: {
      name: 'Iris',
      role: 'asistente de reservas',
    },
    capabilities: [],
    catalogSummary: [
      {
        id: 'off_sandblasting_undercoating',
        name: 'Arenado + Undercoating',
        description: 'Proteccion inferior y tratamiento anticorrosivo',
        durationMinutes: 180,
      },
    ],
  },
};

const run = async () => {
  const decision = await deterministicFallback(context, 'Necesito hacerle undercoating a mi carro');
  assert.equal(decision.intent?.name, 'start_booking');
  assert(decision.actions?.some((action) =>
    action.capability === 'start_schedule_consultation'
    && (action.arguments as any)?.offeringId === 'off_sandblasting_undercoating'
  ), 'fallback should start booking with the composite offering matched by distinctive token');
  assert(!/no ofrezco|no encuentro/i.test(String(decision.reply || '')), 'fallback should not reject a catalog token that exists');
  console.log('fallback-catalog: PASS');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
