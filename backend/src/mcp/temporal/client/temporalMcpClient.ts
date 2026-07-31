import { vtkallTemporalMcpServer } from '../server/vtkallTemporalMcpServer';
import {
  AgentProcessContext,
  ContinueScheduleConsultationInput,
  GetScheduleConsultationContextInput,
  StartScheduleConsultationInput,
} from '../schemas/agentProcessContext';

export class TemporalMcpClient {
  async startScheduleConsultation(input: StartScheduleConsultationInput): Promise<AgentProcessContext> {
    return vtkallTemporalMcpServer.execute('start_schedule_consultation', input) as Promise<AgentProcessContext>;
  }

  async continueScheduleConsultation(input: ContinueScheduleConsultationInput): Promise<AgentProcessContext> {
    return vtkallTemporalMcpServer.execute('continue_schedule_consultation', input) as Promise<AgentProcessContext>;
  }

  async getScheduleConsultationContext(input: GetScheduleConsultationContextInput): Promise<AgentProcessContext> {
    return vtkallTemporalMcpServer.execute('get_schedule_consultation_context', input) as Promise<AgentProcessContext>;
  }
}

export const temporalMcpClient = new TemporalMcpClient();
