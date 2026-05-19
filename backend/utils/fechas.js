export const formatearFechaEsp = (fecha) => {
  const d = new Date(fecha);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatearFechaHoraEsp = (fecha) => {
  const d = new Date(fecha);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const calcularSlots = (fechaStr, citasExistentes) => {
  // fechaStr es YYYY-MM-DD
  // Horarios de lunes a viernes: 08:00 - 18:00 (turnos de 1 hora, último turno 17:00)
  // Sábado: 09:00 - 13:00 (turnos de 1 hora, último turno 12:00)
  // Domingo: Cerrado
  
  // Parsear la fecha de forma segura sin problemas de zona horaria local
  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  let slotsBase = [];
  if (diaSemana >= 1 && diaSemana <= 5) {
    // Lunes a Viernes: de 08:00 a 17:00
    slotsBase = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  } else if (diaSemana === 6) {
    // Sábado: de 09:00 a 12:00
    slotsBase = ['09:00', '10:00', '11:00', '12:00'];
  }

  // Extraer las horas de las citas existentes en formato HH:MM
  const ocupados = citasExistentes
    .filter(cita => cita.estado !== 'cancelada')
    .map(cita => {
      const f = new Date(cita.fecha_cita);
      const horas = String(f.getHours()).padStart(2, '0');
      const minutos = String(f.getMinutes()).padStart(2, '0');
      return `${horas}:${minutos}`;
    });

  const disponibles = slotsBase.filter(slot => !ocupados.includes(slot));

  return {
    fecha: fechaStr,
    horarios_disponibles: disponibles,
    horarios_ocupados: ocupados
  };
};
