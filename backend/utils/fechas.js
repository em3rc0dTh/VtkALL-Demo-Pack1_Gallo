import Cita from '../models/Cita.js';

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
  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  const diaSemana = fecha.getDay(); 

  let startHour = 11;
  let endHour = 13;
  let diasPermitidos = [1, 2, 3, 4, 5, 6]; 

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

export const recalcularAgendaEquipo = async (teamId, baseCitaId) => {
  try {
    const citas = await Cita.find({
      team_asignado: teamId,
      estado_trabajo: { $in: ['pendiente', 'en_curso'] },
      estado: { $ne: 'cancelada' }
    }).sort({ fecha_cita: 1 });

    if (!citas || citas.length === 0) return;

    const defaultStartHour = 8;
    const defaultEndHour = 18;
    const diasLaborablesJS = [1, 2, 3, 4, 5, 6]; 

    const obtenerSiguienteDiaLaboral = (fecha) => {
      const next = new Date(fecha);
      let attempts = 0;
      while (attempts < 14) {
        next.setDate(next.getDate() + 1);
        if (diasLaborablesJS.includes(next.getDay())) {
          return next;
        }
        attempts++;
      }
      return next;
    };

    let currentEnd = null;
    let startModifying = false;

    for (const c of citas) {
      if (baseCitaId && c._id.toString() === baseCitaId.toString()) {
        startModifying = true;
      }
      
      // Si enviamos baseCitaId y aún no llegamos a esa cita en la cola cronológica, la ignoramos.
      // (Se queda en su fecha original y no empuja a la baseCitaId)
      if (baseCitaId && !startModifying) {
        continue;
      }

      if (isNaN(c.duracion_estimada_minutos) || c.duracion_estimada_minutos == null) {
        c.duracion_estimada_minutos = 60;
      }

      let startTime = new Date(c.fecha_cita);

      if (currentEnd) {
        // Empujar la cita para que inicie inmediatamente despues de la anterior
        startTime = new Date(currentEnd);
      } else {
        // Para la primera cita en la cola de modificación (la actual), no la movemos.
        // Se queda anclada en su fecha planificada.
      }

      // Asegurarse de que el startTime cae en dia laboral
      if (!diasLaborablesJS.includes(startTime.getDay())) {
        let attempts = 0;
        while (!diasLaborablesJS.includes(startTime.getDay()) && attempts < 14) {
          startTime.setDate(startTime.getDate() + 1);
          attempts++;
        }
        startTime.setHours(defaultStartHour, 0, 0, 0);
      }

      // Validar hora dentro del rango 08:00 - 18:00
      let startHourFloat = startTime.getHours() + startTime.getMinutes() / 60;
      if (startHourFloat < defaultStartHour) {
        startTime.setHours(defaultStartHour, 0, 0, 0);
        startHourFloat = defaultStartHour;
      }
      if (startHourFloat >= defaultEndHour) {
        startTime = obtenerSiguienteDiaLaboral(startTime);
        startTime.setHours(defaultStartHour, 0, 0, 0);
        startHourFloat = defaultStartHour;
      }

      // Guardar el nuevo inicio en DB si cambio o si se corrigio el NaN
      if (c.fecha_cita.getTime() !== startTime.getTime() || c.isModified('duracion_estimada_minutos')) {
        c.fecha_cita = startTime;
        await c.save();
      }

      // Calcular el final de esta cita
      let duracionTotalMinutos = c.duracion_estimada_minutos || 60;
      let horasRestantes = duracionTotalMinutos / 60;

      let simDateTime = new Date(startTime);
      let simStartHour = startHourFloat;

      while (horasRestantes > 0) {
        let horasDisponiblesHoy = defaultEndHour - simStartHour;
        
        if (horasDisponiblesHoy <= 0) {
          simDateTime = obtenerSiguienteDiaLaboral(simDateTime);
          simDateTime.setHours(defaultStartHour, 0, 0, 0);
          simStartHour = defaultStartHour;
          horasDisponiblesHoy = defaultEndHour - defaultStartHour;
        }
        
        let horasTrabajoHoy = Math.min(horasRestantes, horasDisponiblesHoy);
        horasRestantes -= horasTrabajoHoy;
        
        if (horasRestantes > 0) {
          simDateTime = obtenerSiguienteDiaLaboral(simDateTime);
          simDateTime.setHours(defaultStartHour, 0, 0, 0);
          simStartHour = defaultStartHour;
        } else {
          simStartHour += horasTrabajoHoy;
          simDateTime.setHours(Math.floor(simStartHour), Math.round((simStartHour % 1) * 60), 0, 0);
        }
      }

      currentEnd = new Date(simDateTime);
    }
  } catch (err) {
    console.error('Error al recalcular agenda del equipo:', err);
  }
};
