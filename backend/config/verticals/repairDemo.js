export const repairDemoConfig = {
  businessSlug: 'repair-demo',
  businessName: 'Repair Demo',
  vertical: 'technical_repair',

  labels: {
    customer: 'Cliente',
    customers: 'Clientes',
    case: 'Caso técnico',
    cases: 'Casos técnicos',
    appointment: 'Cita',
    appointments: 'Citas',
    managedEntity: 'Equipo',
    managedEntities: 'Equipos',
    expert: 'Técnico',
    experts: 'Técnicos',
    quote: 'Presupuesto',
    quotes: 'Presupuestos',
    service: 'Servicio técnico',
    services: 'Servicios técnicos',
    evidence: 'Evidencia',
    diagnosis: 'Diagnóstico técnico'
  },

  legacy: {
    citaEntityName: 'Cita',
    managedEntityField: 'vehiculo',
    expertNotesField: 'notas_mecanico'
  },

  statuses: {
    canonical: {
      intake: 'intake',
      expertReview: 'expert_review',
      waitingCustomer: 'waiting_customer',
      approved: 'approved',
      inProgress: 'in_progress',
      completed: 'completed',
      cancelled: 'cancelled'
    },

    toLegacyCita: {
      intake: 'pendiente',
      expertReview: 'revision_maestro',
      waitingCustomer: 'esperando_cliente',
      approved: 'confirmada',
      inProgress: 'evaluacion_en_curso',
      completed: 'completada',
      cancelled: 'cancelada'
    },

    fromLegacyCita: {
      pendiente: 'intake',
      revision_maestro: 'expertReview',
      esperando_cliente: 'waitingCustomer',
      validada: 'approved',
      pendiente_confirmacion: 'waitingCustomer',
      confirmada: 'approved',
      evaluacion_en_curso: 'inProgress',
      completada: 'completed',
      cancelada: 'cancelled'
    }
  },

  copy: {
    caseReceived: 'Hemos recibido tu caso técnico.',
    expertReviewStarted: 'Tu equipo está siendo revisado por nuestro equipo técnico.',
    quoteSent: 'Te enviamos el presupuesto para tu aprobación.',
    approved: 'Tu caso técnico fue aprobado.',
    completed: 'Tu caso técnico fue completado.'
  },

  features: {
    managedEntityRequired: true,
    supportsQuotes: true,
    supportsExpertReview: true,
    supportsDeliveryDate: true,
    supportsVehicleData: false,
    supportsReferenceImages: true,
    supportsMedicalData: false
  },

  promptKey: 'repair-demo'
};
