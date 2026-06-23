export const bateylateConfig = {
  businessSlug: 'bateylate',
  businessName: 'BateYLate',
  vertical: 'custom_orders',

  labels: {
    customer: 'Cliente',
    customers: 'Clientes',
    case: 'Pedido',
    cases: 'Pedidos',
    appointment: 'Reserva',
    appointments: 'Reservas',
    managedEntity: 'Pedido personalizado',
    managedEntities: 'Pedidos personalizados',
    expert: 'Maestro pastelero',
    experts: 'Maestros pasteleros',
    quote: 'Cotización',
    quotes: 'Cotizaciones',
    service: 'Producto',
    services: 'Productos',
    evidence: 'Referencia',
    diagnosis: 'Detalle del pedido'
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
    caseReceived: 'Hemos recibido tu pedido personalizado.',
    expertReviewStarted: 'Tu pedido está siendo revisado por nuestro equipo de pastelería.',
    quoteSent: 'Te enviamos la cotización para tu aprobación.',
    approved: 'Tu pedido fue aprobado.',
    completed: 'Tu pedido fue completado.'
  },

  features: {
    managedEntityRequired: false,
    supportsQuotes: true,
    supportsExpertReview: true,
    supportsDeliveryDate: true,
    supportsVehicleData: false,
    supportsReferenceImages: true,
    supportsMedicalData: false
  },

  promptKey: 'bateylate'
};
