export const turaguaBusinessProfile = {
  businessSlug: "turagua",
  verticalType: "vehicle_service",
  timezone: "America/Lima",

  branding: {
    name: "Turagua Racing Peru",
    displayName: "Turagua Racing Peru",
  },

  agent: {
    name: "Iris",
    role: "Asesora virtual de atencion y reservas automotrices",
  },

  labels: {
    customer: "Cliente",
    case: "Orden",
    managedEntity: "Vehiculo",
    appointment: "Cita de evaluacion",
    assessment: "Evaluacion",
    assessmentReport: "Diagnostico",
    assessmentReports: "Diagnosticos",
    quote: "Cotizacion",
    workOrder: "Orden de Taller",
    workOrders: "Ordenes de Taller",
    workOrderTask: "Trabajo",
    workshop: "Taller",
  },

  features: {
    supportsChat: true,
    supportsAppointments: true,
    supportsPhotoAssessment: true,
    supportsPhoneAssessment: true,
    supportsQuotes: true,
    supportsWorkOrders: true,
    supportsVehicleData: true,
    supportsFeasibility: false,
  },

  landing: {
    hero: {
      eyebrow: "Proteccion y restauracion automotriz",
      title: "Turagua Racing Peru",
      subtitle:
        "Especialistas en undercoating, arenado, detailing, planchado y pintura, con atencion clara para evaluar y agendar sin friccion.",
      primaryCta: "Hablar con Iris",
      secondaryCta: "Ver servicios",
    },
    sections: {
      servicesTitle: "Servicios Turagua",
      servicesDescription:
        "Explora nuestras especialidades o cuentanos que necesita tu vehiculo para orientarte mejor.",
      aboutTitle: "Sobre nosotros",
      aboutBody:
        "Trabajamos con procesos tecnicos, materiales de calidad y atencion personalizada para proteger, restaurar y mejorar la apariencia de tu vehiculo.",
      galleryTitle: "Galeria",
      galleryItems: ["Ingreso", "Diagnostico", "Equipo", "Entrega"],
      contactTitle: "Quieres agendar una cita?",
      contactBody:
        "Iris te ayuda a resolver dudas, ubicar el servicio correcto y dejar lista tu evaluacion.",
    },
  },
};
