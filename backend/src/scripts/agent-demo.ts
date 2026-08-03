import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { signalWorkflow, startScheduleConsultation, waitForWorkflowReady } from '../services/agentSim.service';
import { ScheduleConsultationState } from '../temporal/types';
import { connectDB, disconnectDB } from '../db/connect';
import { Appointment } from '../models/Appointment.model';
import { AvailabilitySlot } from '../models/AvailabilitySlot.model';
import { Case } from '../models/Case.model';
import { Customer } from '../models/Customer.model';
import { ManagedEntity } from '../models/ManagedEntity.model';
import { ResourceReservation } from '../models/ResourceReservation.model';
import { TimelineEvent } from '../models/TimelineEvent.model';
import { WorkTeam } from '../models/WorkTeam.model';
import { WorkTeamScheduleOverride } from '../models/WorkTeamScheduleOverride.model';
import { WorkTeamScheduleRule } from '../models/WorkTeamScheduleRule.model';
import { seedDatabase } from '../services/seed.service';

const rl = readline.createInterface({ input, output });
const demoBusinessSlug = process.env.DEMO_TEST_BUSINESS_SLUG || process.env.SEED_BUSINESS_SLUG || 'demo_test';

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'short',
    timeStyle: 'short',
  });

const parsePreferredDate = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }
  return null;
};

const printState = (state: ScheduleConsultationState) => {
  console.log('\n=== Temporal dice ===');
  console.log(`Workflow: ${state.workflowId}`);
  console.log(`Estado: ${state.status}`);
  console.log(`Accion siguiente: ${state.nextAction}`);
  console.log(`Instruccion para agente: ${state.agentInstruction}`);

  if (state.catalog.length) {
    console.log('\nCatalogo disponible:');
    state.catalog.forEach((offering: any, index) => {
      console.log(`${index + 1}. ${offering.name} (${offering._id}) - ${offering.description}`);
    });
  }

  if (state.requiredFields.length && state.status === 'WAITING_FOR_CUSTOMER_DATA') {
    console.log('\nServicio seleccionado:');
    console.log(`- Equipo requerido: ${state.selectedTeamId || 'sin equipo'}`);
    console.log(`- Duracion estimada: ${state.durationMinutes || 'sin duracion'} minutos`);

    console.log('\nDatos requeridos:');
    state.requiredFields.forEach((field: any) => {
      console.log(`- ${field.label}${field.required ? ' *' : ' (opcional)'}`);
    });
  }

  if (state.availableSlots.length) {
    console.log('\nHorarios disponibles:');
    state.availableSlots.forEach((slot: any, index) => {
      console.log(`${index + 1}. ${slot._id} | equipo=${slot.teamId} | duracion=${slot.durationMinutes}m | ${formatDate(slot.startAt)} - ${formatDate(slot.endAt)}`);
    });
  }

  if (state.appointment) {
    console.log('\nReserva creada:');
    console.log(`Cita: ${state.appointment.appointment?._id}`);
    console.log(`Caso: ${state.appointment.case?._id}`);
    console.log(`Reserva recurso: ${state.appointment.reservation?._id || state.reservationId}`);
    console.log(`Equipo: ${state.appointment.reservation?.teamId || state.selectedTeamId}`);
    console.log(`Slot: ${state.appointment.slot?._id}`);
  }

  if (state.errors.length) {
    console.log('\nExcepciones / pendientes:');
    state.errors.forEach((error) => console.log(`- ${error}`));
  }
};

const printDbMenu = async () => {
  await connectDB();
  try {
    let keepGoing = true;
    while (keepGoing) {
      console.log(`\n=== Menu BD ${demoBusinessSlug} ===`);
      console.log('1. Ver citas');
      console.log('2. Ver clientes');
      console.log('3. Ver entidades gestionadas');
      console.log('4. Ver casos');
      console.log('5. Ver timeline');
      console.log('6. Ver slots legacy');
      console.log('7. Resumen de conteos');
      console.log('8. Ver reservas por equipo');
      console.log('9. Ver equipos');
      console.log('10. Ver reglas y overrides');
      console.log('0. Salir');

      const choice = await rl.question('Elige una opcion: ');
      switch (choice.trim()) {
        case '1': {
          const rows = await Appointment.find({ businessSlug: demoBusinessSlug }).sort({ createdAt: -1 }).limit(10).lean().exec();
          console.log('\nCitas:');
          rows.forEach((row: any) => {
            console.log(`- ${row._id} | ${row.status} | cliente=${row.customerId} | caso=${row.caseId} | ${formatDate(row.scheduledStart)} - ${formatDate(row.scheduledEnd || row.scheduledStart)}`);
          });
          break;
        }
        case '2': {
          const rows = await Customer.find({ businessSlug: demoBusinessSlug }).sort({ createdAt: -1 }).limit(10).lean().exec();
          console.log('\nClientes:');
          rows.forEach((row: any) => {
            const phone = row.contact?.phones?.[0]?.normalized || row.contact?.phones?.[0]?.number || 'sin telefono';
            console.log(`- ${row._id} | ${row.name} | ${phone} | ${row.status || 'sin estado'}`);
          });
          break;
        }
        case '3': {
          const rows = await ManagedEntity.find({ businessSlug: demoBusinessSlug }).sort({ createdAt: -1 }).limit(10).lean().exec();
          console.log('\nEntidades gestionadas:');
          rows.forEach((row: any) => {
            console.log(`- ${row._id} | tipo=${row.type} | cliente=${row.customerId} | ${row.displayName || row.summary}`);
          });
          break;
        }
        case '4': {
          const rows = await Case.find({ businessSlug: demoBusinessSlug }).sort({ createdAt: -1 }).limit(10).lean().exec();
          console.log('\nCasos:');
          rows.forEach((row: any) => {
            console.log(`- ${row._id} | ${row.caseNumber} | ${row.status} | cliente=${row.customerId} | entidad=${row.managedEntityId}`);
          });
          break;
        }
        case '5': {
          const rows = await TimelineEvent.find({ businessSlug: demoBusinessSlug }).sort({ createdAt: -1 }).limit(12).lean().exec();
          console.log('\nTimeline:');
          rows.forEach((row: any) => {
            console.log(`- ${row._id} | ${row.eventType} | caso=${row.caseId} | ${row.title} | ${formatDate(row.createdAt)}`);
          });
          break;
        }
        case '6': {
          const rows = await AvailabilitySlot.find({ businessSlug: demoBusinessSlug }).sort({ startAt: 1 }).lean().exec();
          console.log('\nSlots:');
          rows.forEach((row: any) => {
            console.log(`- ${row._id} | ${row.status} | offering=${row.catalogOfferingId} | ${formatDate(row.startAt)} - ${formatDate(row.endAt)} | cita=${row.appointmentId || '-'}`);
          });
          break;
        }
        case '7': {
          const [appointments, customers, managedEntities, cases, events, slots, reservations, teams] = await Promise.all([
            Appointment.countDocuments({ businessSlug: demoBusinessSlug }).exec(),
            Customer.countDocuments({ businessSlug: demoBusinessSlug }).exec(),
            ManagedEntity.countDocuments({ businessSlug: demoBusinessSlug }).exec(),
            Case.countDocuments({ businessSlug: demoBusinessSlug }).exec(),
            TimelineEvent.countDocuments({ businessSlug: demoBusinessSlug }).exec(),
            AvailabilitySlot.countDocuments({ businessSlug: demoBusinessSlug }).exec(),
            ResourceReservation.countDocuments({ businessSlug: demoBusinessSlug }).exec(),
            WorkTeam.countDocuments({ businessSlug: demoBusinessSlug }).exec(),
          ]);
          console.log('\nConteos:');
          console.log(`- citas: ${appointments}`);
          console.log(`- clientes: ${customers}`);
          console.log(`- entidades gestionadas: ${managedEntities}`);
          console.log(`- casos: ${cases}`);
          console.log(`- timeline events: ${events}`);
          console.log(`- slots legacy: ${slots}`);
          console.log(`- reservas por equipo: ${reservations}`);
          console.log(`- equipos: ${teams}`);
          break;
        }
        case '8': {
          const rows = await ResourceReservation.find({ businessSlug: demoBusinessSlug }).sort({ startAt: 1 }).lean().exec();
          console.log('\nReservas por equipo:');
          rows.forEach((row: any) => {
            console.log(`- ${row._id} | ${row.status} | equipo=${row.teamId} | offering=${row.catalogOfferingId} | ${formatDate(row.startAt)} - ${formatDate(row.endAt)} | cita=${row.appointmentId || '-'}`);
          });
          break;
        }
        case '9': {
          const rows = await WorkTeam.find({ businessSlug: demoBusinessSlug }).sort({ _id: 1 }).lean().exec();
          console.log('\nEquipos:');
          rows.forEach((row: any) => {
            console.log(`- ${row._id} | ${row.name} | tipo=${row.type} | capacidad=${row.capacity} | slot=${row.slotGranularityMinutes}m | activo=${row.active}`);
          });
          break;
        }
        case '10': {
          const [rules, overrides] = await Promise.all([
            WorkTeamScheduleRule.find({ businessSlug: demoBusinessSlug }).sort({ teamId: 1, weekday: 1, startTime: 1 }).lean().exec(),
            WorkTeamScheduleOverride.find({ businessSlug: demoBusinessSlug }).sort({ teamId: 1, date: 1 }).lean().exec(),
          ]);
          console.log('\nReglas base:');
          rules.forEach((row: any) => {
            console.log(`- ${row._id} | equipo=${row.teamId} | weekday=${row.weekday} | ${row.startTime}-${row.endTime} | capacidad=${row.capacity}`);
          });
          console.log('\nOverrides:');
          overrides.forEach((row: any) => {
            const windows = (row.windows || []).map((window: any) => `${window.startTime}-${window.endTime}`).join(', ') || 'sin ventanas';
            console.log(`- ${row._id} | equipo=${row.teamId} | fecha=${row.date} | modo=${row.mode} | ${windows} | ${row.reason || ''}`);
          });
          break;
        }
        case '0':
          keepGoing = false;
          break;
        default:
          console.log('Opcion no valida.');
      }
    }
  } finally {
    await disconnectDB();
  }
};

const askCustomerData = async () => {
  const firstName = await rl.question('\nCLIENTE: Nombre: ');
  const lastName = await rl.question('CLIENTE: Apellido: ');
  const phone = await rl.question('CLIENTE: Telefono: ');
  const managedEntityDisplayName = await rl.question('CLIENTE: Entidad gestionada / solicitud: ');
  const managedEntityType = await rl.question('CLIENTE: Tipo de entidad (opcional, default managed_entity): ');
  const managedEntitySummary = await rl.question('CLIENTE: Resumen (opcional): ');

  return {
    firstName,
    lastName,
    phone,
    managedEntityDisplayName,
    managedEntityType: managedEntityType || undefined,
    managedEntitySummary: managedEntitySummary || undefined,
  };
};

const run = async () => {
  console.log('Demo manual agente/cliente con Temporal');
  console.log('Tu haces ambos roles; Temporal decide cada paso.\n');

  await connectDB();
  try {
    await seedDatabase(false, demoBusinessSlug as any);
  } finally {
    await disconnectDB();
  }

  let state = await startScheduleConsultation(demoBusinessSlug);
  state = await waitForWorkflowReady(state.workflowId as string);
  printState(state);
  const workflowId = state.workflowId as string;

  if (!state.catalog.length) {
    console.log('\nTemporal aun no devolvio catalogo. Revisa logs de api/temporal-worker antes de continuar.');
    rl.close();
    process.exit(1);
  }

  let selectedIndex = Number(await rl.question('\nCLIENTE: Elige numero de servicio del catalogo: ')) - 1;
  while (!state.catalog[selectedIndex]) {
    selectedIndex = Number(await rl.question('Ese numero no existe. Elige un numero visible del catalogo: ')) - 1;
  }
  const selectedOffering = state.catalog[selectedIndex];
  state = await signalWorkflow(workflowId, 'selectCatalogOffering', { catalogOfferingId: selectedOffering._id });
  printState(state);

  while (state.status === 'WAITING_FOR_CUSTOMER_DATA') {
    state = await signalWorkflow(workflowId, 'submitCustomerData', await askCustomerData());
    printState(state);
    if (state.status === 'WAITING_FOR_CUSTOMER_DATA') {
      console.log('\nTemporal pidio corregir datos. Intentemos nuevamente.');
    }
  }

  let preferredDate: string | undefined | null = null;
  while (preferredDate === null) {
    const preferredDateRaw = await rl.question('\nAGENTE: Filtrar por dia? escribe YYYY-MM-DD, o vacio para todos: ');
    preferredDate = parsePreferredDate(preferredDateRaw);
    if (preferredDate === null) {
      console.log('No entendi ese dia. Usa una fecha YYYY-MM-DD, o deja vacio.');
    }
  }

  state = await signalWorkflow(workflowId, 'requestSlots', preferredDate ? { preferredDate } : {});
  printState(state);

  while (!state.availableSlots.length) {
    const preferredDateRaw = await rl.question('\nNo hay horarios visibles para ese filtro. Prueba YYYY-MM-DD, o vacio: ');
    preferredDate = parsePreferredDate(preferredDateRaw);
    if (preferredDate === null) {
      console.log('No entendi ese dia.');
      continue;
    }
    state = await signalWorkflow(workflowId, 'requestSlots', preferredDate ? { preferredDate } : {});
    printState(state);
  }

  while (state.status !== 'APPOINTMENT_BOOKED') {
    let slotIndex = Number(await rl.question('\nCLIENTE: Elige numero de horario: ')) - 1;
    while (!state.availableSlots[slotIndex]) {
      slotIndex = Number(await rl.question('Ese horario no existe. Elige un numero visible: ')) - 1;
    }
    const selectedSlot = state.availableSlots[slotIndex];
    state = await signalWorkflow(workflowId, 'selectSlot', { slotId: selectedSlot._id });
    printState(state);

    if (state.status !== 'APPOINTMENT_BOOKED') {
      console.log('\nNo se pudo reservar ese horario. Volvamos a consultar disponibilidad.');
      state = await signalWorkflow(workflowId, 'requestSlots', preferredDate ? { preferredDate } : {});
      printState(state);
      while (!state.availableSlots.length) {
        const preferredDateRaw = await rl.question('\nNo hay horarios visibles. Prueba YYYY-MM-DD, o vacio: ');
        preferredDate = parsePreferredDate(preferredDateRaw);
        if (preferredDate === null) {
          console.log('No entendi ese dia.');
          continue;
        }
        state = await signalWorkflow(workflowId, 'requestSlots', preferredDate ? { preferredDate } : {});
        printState(state);
      }
    }
  }

  if (state.status !== 'APPOINTMENT_BOOKED') {
    console.log('\nTemporal no termino con cita reservada. Revisa el estado y los logs antes de inspeccionar.');
  }

  await printDbMenu();

  console.log('\nDemo terminada.');
  rl.close();
};

run().catch((error) => {
  console.error(error);
  rl.close();
  process.exit(1);
});
