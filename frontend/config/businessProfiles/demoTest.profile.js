export const demoTestBusinessProfile = {
  businessSlug: "demo_test",
  verticalType: "generic_service",
  timezone: "America/Lima",

  branding: {
    name: "Demo Test Laboratory",
    displayName: "Demo Test Laboratory",
  },

  agent: {
    name: "Demo Agent",
    role: "Asesora virtual de atencion y reservas",
  },

  labels: {
    customer: "Cliente",
    case: "Caso",
    managedEntity: "Entidad gestionada",
    appointment: "Consulta",
    assessment: "Evaluacion",
    assessmentReport: "Informe",
    assessmentReports: "Informes",
    quote: "Propuesta",
    workOrder: "Orden operativa",
    workOrders: "Ordenes operativas",
    workOrderTask: "Tarea",
    workshop: "Equipo",
  },

  features: {
    supportsChat: true,
    supportsAppointments: true,
    supportsPhotoAssessment: false,
    supportsPhoneAssessment: false,
    supportsQuotes: false,
    supportsWorkOrders: false,
    supportsVehicleData: false,
    supportsFeasibility: false,
  },

  landing: {
    hero: {
      eyebrow: "Plantilla madre neutral",
      title: "Demo Test Laboratory",
      subtitle:
        "Base reusable para probar catalogo, captura de datos, disponibilidad, reserva de capacidad y citas sin depender de una vertical.",
      primaryCta: "Hablar con Demo Agent",
      secondaryCta: "Ver catalogo",
    },
    sections: {
      servicesTitle: "Catalogo neutral",
      servicesDescription:
        "Usa servicios genericos para validar el flujo base antes de especializar una vertical.",
      aboutTitle: "Sobre el pack",
      aboutBody:
        "Pack 0 define contratos, entidades, idempotencia, Temporal, runtime Hermes y frontera frontend/backend para que las verticales configuren sin duplicar core.",
      galleryTitle: "Flujo base",
      galleryItems: ["Interaccion", "Caso", "Disponibilidad", "Cita"],
      contactTitle: "Quieres agendar una consulta?",
      contactBody:
        "Demo Agent te ayuda a escoger una oferta, completar datos y reservar un horario.",
    },
  },
};
