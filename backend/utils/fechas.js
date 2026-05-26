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

export const calcularSlots = (fechaStr, citasExistentes, taller = null) => {
  // Parsear la fecha de forma segura sin problemas de zona horaria local
  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  let startHour = 11;
  let endHour = 13;
  let diasPermitidos = [1, 2, 3, 4, 5, 6]; // 1=Lunes, 6=Sábado

  if (taller && taller.config_citas) {
    const config = taller.config_citas;
    if (config.hora_inicio) {
      startHour = parseInt(config.hora_inicio.split(':')[0]);
    }
    if (config.hora_fin) {
      endHour = parseInt(config.hora_fin.split(':')[0]);
    }
    if (config.dias_permitidos && config.dias_permitidos.length > 0) {
      diasPermitidos = config.dias_permitidos;
    }
  }

  let slotsBase = [];
  if (diasPermitidos.includes(diaSemana)) {
    for (let h = startHour; h < endHour; h++) {
      slotsBase.push(`${String(h).padStart(2, '0')}:00`);
    }
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
