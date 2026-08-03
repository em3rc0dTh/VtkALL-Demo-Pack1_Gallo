import { DEFAULT_PUBLIC_BUSINESS_SLUG } from '@/lib/config/businessSlug';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export const mockApi = {
  createCustomer: async (payload) => {
    await delay(600);
    if (!payload.name || !payload.contact?.phones?.[0]?.number) {
      return { ok: false, error: { code: "VALIDATION_ERROR", message: "Faltan campos requeridos." } };
    }
    return {
      ok: true,
      customer: {
        _id: "cus_" + Math.random().toString(36).substr(2, 9),
        businessSlug: payload.businessSlug || DEFAULT_PUBLIC_BUSINESS_SLUG,
        name: payload.name,
        status: "active"
      },
      reused: false
    };
  },

  createManagedEntity: async (payload) => {
    await delay(600);
    if (!payload.customerId) {
      return { ok: false, error: { code: "CUSTOMER_NOT_FOUND", message: "Customer ID is required." } };
    }
    return {
      ok: true,
      managedEntity: {
        _id: "me_" + Math.random().toString(36).substr(2, 9),
        businessSlug: payload.businessSlug || DEFAULT_PUBLIC_BUSINESS_SLUG,
        customerId: payload.customerId,
        type: payload.type || "vehicle",
        displayName: payload.displayName || "Vehículo de prueba"
      }
    };
  },

  createCase: async (payload) => {
    await delay(800);
    if (!payload.customerId || !payload.managedEntityId) {
      return { ok: false, error: { code: "VALIDATION_ERROR", message: "Faltan entidades." } };
    }
    return {
      ok: true,
      case: {
        _id: "case_" + Math.random().toString(36).substr(2, 9),
        businessSlug: payload.businessSlug || DEFAULT_PUBLIC_BUSINESS_SLUG,
        caseNumber: "DEMO-2026-" + Math.floor(Math.random() * 10000),
        customerId: payload.customerId,
        managedEntityId: payload.managedEntityId,
        status: "lead"
      }
    };
  },

  getAvailability: async (query) => {
    await delay(1000);
    
    // Simulate NO_AVAILABILITY for testing if date ends in '07'
    if (query.date && query.date.endsWith('07')) {
      return {
        ok: false,
        error: {
          code: "NO_AVAILABILITY",
          message: "No hay disponibilidad para esta fecha."
        }
      };
    }

    return {
      ok: true,
      businessSlug: query.businessSlug || DEFAULT_PUBLIC_BUSINESS_SLUG,
      teamId: query.teamId || "team_frontdesk",
      date: query.date || "2026-07-06",
      durationMinutes: query.durationMinutes || 60,
      timezone: query.timezone || "America/Lima",
      slots: [
        {
          startAt: `${query.date}T09:00:00.000-05:00`,
          endAt: `${query.date}T10:00:00.000-05:00`,
          capacityRemaining: 1
        },
        {
          startAt: `${query.date}T10:00:00.000-05:00`,
          endAt: `${query.date}T11:00:00.000-05:00`,
          capacityRemaining: 1
        }
      ]
    };
  },

  scheduleConsultation: async (payload) => {
    await delay(1200);

    // Simulate DOUBLE_BOOKING_CONFLICT for testing if the 10:00 AM slot is chosen
    if (payload.startAt && payload.startAt.includes("T10:00:00")) {
      return {
        ok: false,
        error: {
          code: "DOUBLE_BOOKING_CONFLICT",
          message: "The selected slot is no longer available.",
          details: {
            teamId: payload.teamId,
            startAt: payload.startAt
          }
        }
      };
    }

    const endAt = new Date(new Date(payload.startAt).getTime() + (payload.durationMinutes || 60) * 60000).toISOString();

    return {
      ok: true,
      appointment: {
        _id: "appt_" + Math.random().toString(36).substr(2, 9),
        businessSlug: payload.businessSlug || DEFAULT_PUBLIC_BUSINESS_SLUG,
        caseId: payload.caseId,
        customerId: payload.customerId,
        managedEntityId: payload.managedEntityId,
        status: "scheduled",
        scheduledStart: payload.startAt,
        scheduledEnd: endAt,
        resourceReservationId: "res_" + Math.random().toString(36).substr(2, 9)
      },
      resourceReservation: {
        _id: "res_" + Math.random().toString(36).substr(2, 9),
        businessSlug: payload.businessSlug || DEFAULT_PUBLIC_BUSINESS_SLUG,
        teamId: payload.teamId || "team_frontdesk",
        status: "booked",
        startAt: payload.startAt,
        endAt: endAt
      }
    };
  },

  getTimeline: async (caseId) => {
    await delay(500);
    return {
      ok: true,
      caseId: caseId,
      events: [
        {
          _id: "evt_1",
          eventType: "customer.created",
          title: "Cliente creado",
          description: "Se creó el cliente desde la consola manual.",
          visibility: "internal",
          actor: { type: "system", name: DEFAULT_PUBLIC_BUSINESS_SLUG },
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          _id: "evt_2",
          eventType: "appointment.scheduled",
          title: "Consulta agendada",
          description: "Se agendó la consulta exitosamente.",
          visibility: "internal",
          actor: { type: "system", name: DEFAULT_PUBLIC_BUSINESS_SLUG },
          createdAt: new Date().toISOString()
        }
      ]
    };
  }
};
