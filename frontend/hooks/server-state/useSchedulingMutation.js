import { useMutation, useQueryClient } from '@tanstack/react-query';
import { demoTestRepository } from '@/lib/api/demoTestRepository';
import { demoTestQueryKeys } from '@/lib/query/queryKeys';

export const buildScheduleConsultationIdempotencyKey = ({
  businessSlug,
  caseId,
  catalogOfferingId,
  teamId,
  startAt,
  durationMinutes,
  appointmentType,
}) => {
  if (!businessSlug || !caseId || !catalogOfferingId || !teamId || !startAt || !durationMinutes || !appointmentType) {
    return '';
  }

  const semanticParts = [
    businessSlug,
    caseId,
    catalogOfferingId,
    teamId,
    new Date(startAt).toISOString(),
    String(durationMinutes),
    appointmentType,
  ];

  return `schedule-consultation:${semanticParts.map((part) => encodeURIComponent(part)).join(':')}`;
};

export function useScheduleConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => {
      const idempotencyKey = payload.idempotencyKey || buildScheduleConsultationIdempotencyKey(payload);
      return demoTestRepository.scheduleConsultation({
        ...payload,
        idempotencyKey,
      });
    },
    retry: false,
    onSuccess: (_data, variables) => {
      const date = variables.date || (variables.startAt ? new Date(variables.startAt).toISOString().slice(0, 10) : undefined);

      queryClient.invalidateQueries({
        queryKey: demoTestQueryKeys.availability({
          businessSlug: variables.businessSlug,
          teamId: variables.teamId,
          date,
          durationMinutes: variables.durationMinutes,
          timezone: variables.timezone,
          catalogOfferingId: variables.catalogOfferingId,
          caseId: variables.caseId,
        }),
      });

      queryClient.invalidateQueries({
        queryKey: demoTestQueryKeys.timeline({
          businessSlug: variables.businessSlug,
          caseId: variables.caseId,
        }),
      });
    },
  });
}
