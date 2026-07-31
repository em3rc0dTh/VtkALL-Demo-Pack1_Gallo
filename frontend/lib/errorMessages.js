export const errorMessages = {
  VALIDATION_ERROR: {
    title: "Validación rechazada",
    action: "Revisa los campos enviados."
  },
  CUSTOMER_NOT_FOUND: {
    title: "Cliente no encontrado",
    action: "Vuelve a crear o seleccionar un cliente."
  },
  MANAGED_ENTITY_NOT_FOUND: {
    title: "Entidad gestionada no encontrada",
    action: "Verifica que el vehículo pertenezca al cliente."
  },
  CASE_NOT_FOUND: {
    title: "Caso no encontrado",
    action: "Crea el caso nuevamente."
  },
  WORK_TEAM_NOT_FOUND: {
    title: "Equipo no encontrado",
    action: "Cambia el equipo o revisa el seed backend."
  },
  NO_AVAILABILITY: {
    title: "Sin disponibilidad",
    action: "Prueba otra fecha, equipo o duración."
  },
  DOUBLE_BOOKING_CONFLICT: {
    title: "Slot ya reservado",
    action: "Vuelve a consultar disponibilidad antes de agendar."
  },
  RESERVATION_FAILED: {
    title: "No se pudo reservar capacidad",
    action: "Reintenta o selecciona otro slot."
  },
  APPOINTMENT_CREATION_FAILED: {
    title: "No se pudo crear la cita",
    action: "Revisa el raw response y reintenta."
  },
  TIMELINE_WRITE_FAILED: {
    title: "Timeline no registrado",
    action: "La operación pudo ocurrir, pero falló el registro histórico."
  },
  INTERNAL_ERROR: {
    title: "Error interno",
    action: "Revisa raw response y logs backend."
  }
};
