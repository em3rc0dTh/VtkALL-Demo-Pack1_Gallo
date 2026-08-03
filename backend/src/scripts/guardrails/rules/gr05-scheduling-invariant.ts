import { GuardrailRule, result, GuardrailViolation } from '../ruleTypes';
import { violation } from './shared';

export const gr05SchedulingInvariant: GuardrailRule = {
  id: 'GR-05',
  name: 'Scheduling invariant',
  run: (context) => {
    const violations: GuardrailViolation[] = [];
    const appointment = context.getFile('backend/src/models/Appointment.model.ts');
    const reservation = context.getFile('backend/src/models/ResourceReservation.model.ts');
    const availability = context.getFile('backend/src/services/demoTest/availability.service.ts');
    const schedule = context.getFile('backend/src/services/demoTest/scheduleConsultation.service.ts');

    if (!appointment?.content.includes('resourceReservationId')) violations.push(violation('backend/src/models/Appointment.model.ts', 'GR-05 violation: Appointment must support resourceReservationId.'));
    if (!reservation?.content.includes('teamId')) violations.push(violation('backend/src/models/ResourceReservation.model.ts', 'GR-05 violation: ResourceReservation must include teamId.'));
    for (const status of ['held', 'booked']) {
      if (!reservation?.content.includes(`'${status}'`)) violations.push(violation('backend/src/models/ResourceReservation.model.ts', `GR-05 violation: ResourceReservation must support ${status}.`));
    }
    for (const dependency of ['WorkTeamScheduleRule', 'WorkTeamScheduleOverride', 'ResourceReservation']) {
      if (!availability?.content.includes(dependency)) violations.push(violation('backend/src/services/demoTest/availability.service.ts', `GR-05 violation: availability must read ${dependency}.`));
    }
    if (!schedule?.content.includes('holdResourceReservation') || !schedule.content.includes('createAppointment')) {
      violations.push(violation('backend/src/services/demoTest/scheduleConsultation.service.ts', 'GR-05 violation: scheduled appointment creation must go through reservation-backed scheduling.'));
    }

    return result('GR-05', 'Scheduling invariant', 'Appointment is customer-facing; ResourceReservation blocks operational capacity.', violations);
  },
};
