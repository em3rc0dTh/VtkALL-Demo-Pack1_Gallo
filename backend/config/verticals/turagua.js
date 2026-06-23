export const turaguaConfig = {
  businessSlug: 'turagua',
  businessName: 'Turagua',
  vertical: 'vehicle_service',

  labels: {
    customer: 'Cliente',
    customers: 'Clientes',
    case: 'Orden',
    cases: 'Órdenes',
    appointment: 'Cita',
    appointments: 'Citas',
    managedEntity: 'Vehículo',
    managedEntities: 'Vehículos',
    expert: 'Técnico',
    experts: 'Técnicos',
    quote: 'Presupuesto',
    quotes: 'Presupuestos',
    service: 'Servicio',
    services: 'Servicios',
    evidence: 'Evidencia',
    diagnosis: 'Diagnóstico'
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
    caseReceived: 'Hemos recibido tu solicitud.',
    expertReviewStarted: 'Tu solicitud está siendo revisada por nuestro equipo técnico.',
    quoteSent: 'Te enviamos el presupuesto para tu aprobación.',
    approved: 'Tu orden fue aprobada.',
    completed: 'Tu orden fue completada.'
  },

  features: {
    managedEntityRequired: true,
    supportsQuotes: true,
    supportsExpertReview: true,
    supportsDeliveryDate: false,
    supportsVehicleData: true,
    supportsReferenceImages: true,
    supportsMedicalData: false
  },

  promptKey: 'turagua'
};
