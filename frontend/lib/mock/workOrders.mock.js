export const queueMock = [
  {
    time: '09:00 cita / 09:12 real',
    client: 'Carlos Ramirez',
    plate: 'ABC-123',
    service: 'Frenos',
    signal: 'URGENTE',
    wait: 'Espera hace 45 min',
    owner: 'sin asignar',
    variant: 'danger',
  },
  {
    time: '10:00 cita / -- real',
    client: 'Maria Torres',
    plate: 'XYZ-789',
    service: 'Diagnostico general',
    signal: 'En diagnostico',
    wait: 'SLA normal',
    owner: 'Ana',
    variant: 'info',
  },
  {
    time: 'Sin cita / llego 11:05',
    client: 'Jose Medina',
    plate: 'KIA-456',
    service: 'No enciende',
    signal: 'VARADO',
    wait: 'Espera hace 20 min',
    owner: 'Frontdesk',
    variant: 'danger',
  },
];

export const admissionChecksMock = [
  ['Kilometraje registrado', true, '85,000 km'],
  ['Nivel combustible', true, '1/2 tanque'],
  ['Fotos minimas', false, '2/4'],
  ['Nivel de aceite visible', true, 'OK'],
  ['Luces testigo registradas', false, 'Pendiente'],
  ['Danos previos / rayones', true, 'Frontal menor'],
  ['Objetos de valor registrados', false, 'Pendiente'],
  ['Documentos / llave extra', true, 'Recibido'],
  ['Firma / aceptacion cliente', false, 'Falta firma'],
];
