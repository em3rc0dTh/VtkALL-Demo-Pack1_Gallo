import { getMockState } from '../mockDemoTestStore';
import { getMockScenario } from '../mockScenarioController';
import { ApiError } from '../../api/apiError';
import { assertAvailabilityResponse } from '../../contracts/availability.contract';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export async function mockGetAvailability(params) {
  await delay();

  const scenario = getMockScenario();
  if (scenario === 'no_availability') {
    return assertAvailabilityResponse({ ok: true, slots: [] });
  }
  if (scenario === 'work_team_not_found') {
    throw new ApiError(404, 'WORK_TEAM_NOT_FOUND', 'Equipo no encontrado');
  }

  const baseDate = params.date || '2026-07-10';
  const duration = parseInt(params.durationMinutes, 10) || 60;
  
  const allSlots = [];
  const startHour = 9;
  const endHour = 17;
  const granularity = 30; // 30 min por defecto

  // Parseamos las reservas activas como intervalos de minutos desde las 00:00
  const state = getMockState();
  const activeReservations = state.resourceReservations
    .filter(res => res.status === 'held' || res.status === 'booked' || res.status === 'confirmed')
    .map(res => {
      // asumimos formato "YYYY-MM-DDTHH:mm:ssZ"
      const resStartHour = parseInt(res.startAt.substring(11, 13), 10);
      const resStartMin = parseInt(res.startAt.substring(14, 16), 10);
      const resEndHour = parseInt(res.endAt.substring(11, 13), 10);
      const resEndMin = parseInt(res.endAt.substring(14, 16), 10);
      return {
        startMin: resStartHour * 60 + resStartMin,
        endMin: resEndHour * 60 + resEndMin
      };
    });

  for(let h = startHour; h < endHour; h++) {
    for(let m = 0; m < 60; m += granularity) {
       const startMin = h * 60 + m;
       const endMin = startMin + duration;
       
       if (endMin <= endHour * 60) {
          // Chequear solapamiento
          const overlaps = activeReservations.some(res => {
            return startMin < res.endMin && endMin > res.startMin;
          });

          if (!overlaps) {
            const sh = String(Math.floor(startMin / 60)).padStart(2, '0');
            const sm = String(startMin % 60).padStart(2, '0');
            const eh = String(Math.floor(endMin / 60)).padStart(2, '0');
            const em = String(endMin % 60).padStart(2, '0');

            allSlots.push({
               startAt: `${baseDate}T${sh}:${sm}:00Z`,
               endAt: `${baseDate}T${eh}:${em}:00Z`,
               capacityRemaining: 1,
               availableCapacity: 1,
               durationMinutes: duration,
               teamId: params.teamId,
               catalogOfferingId: params.catalogOfferingId,
            });
          }
       }
    }
  }

  return assertAvailabilityResponse({
    ok: true,
    slots: allSlots
  });
}
