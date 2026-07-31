import { HermesApiClient } from '../clients/hermesApi.client';
import { ExecutionContext } from '../contracts/executionContext.contract';
import { HermesCompletionInput } from '../contracts/hermesChatRequest.contract';
import { HermesCompletionResult } from '../contracts/hermesChatResponse.contract';

export class StaticHermesClient implements HermesApiClient {
  calls = 0;

  constructor(private readonly reply: string) {}

  async getHealth() {
    return { ok: true, version: 'h05-test' } as any;
  }

  async complete(_input: HermesCompletionInput, _context: ExecutionContext): Promise<HermesCompletionResult> {
    this.calls += 1;
    return {
      reply: this.reply,
      model: 'h05-test',
      durationMs: 1,
      runtime: { agent: 'demo-test-agent', version: 'h05-test', mode: 'qa_primary' },
    };
  }
}

export class GroundedHermesClient implements HermesApiClient {
  calls = 0;

  async getHealth() {
    return { ok: true, version: 'h05-test' } as any;
  }

  async complete(input: HermesCompletionInput, _context: ExecutionContext): Promise<HermesCompletionResult> {
    this.calls += 1;
    const text = input.messages.map((message) => message.content).join('\n').toLowerCase();
    let reply = 'Hola, soy Hermes. Puedo ayudarte con informacion general del negocio y sus servicios.';
    if (text.includes('quien eres') || text.includes('quién eres')) reply = 'Soy Hermes, el asistente de demo_test para responder preguntas informativas y orientar sin ejecutar reservas.';
    if (text.includes('servicios tienen')) reply = 'Tienen consulta basica y otros servicios publicos del catalogo disponible.';
    if (text.includes('cuanto dura') || text.includes('cuánto dura')) reply = 'La consulta basica dura 60 minutos.';
    if (text.includes('cuesta') || text.includes('costo')) reply = 'El precio no esta publicado; conviene confirmarlo antes de tomarlo como definitivo.';
    if (text.includes('diferencia')) reply = 'La diferencia principal esta en el alcance y la duracion publicada de cada opcion.';
    if (text.includes('ricardo')) reply = `Ricardo, ${reply.charAt(0).toLowerCase()}${reply.slice(1)}`;
    return {
      reply,
      model: 'h05-test',
      durationMs: 1,
      runtime: { agent: 'demo-test-agent', version: 'h05-test', mode: 'qa_primary' },
    };
  }
}

export class FailingHermesClient implements HermesApiClient {
  calls = 0;

  async getHealth() {
    return { ok: false } as any;
  }

  async complete(): Promise<HermesCompletionResult> {
    this.calls += 1;
    throw new Error('Hermes unavailable');
  }
}

