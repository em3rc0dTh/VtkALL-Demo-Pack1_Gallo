const mongoose = require('mongoose');
// Simulamos los modelos y dependencias del backend para poder probar el flujo del cronjob aislado

// 1. Mocks de Base de Datos
const mockCitas = [];

const CitaMock = {
  find: jest.fn().mockReturnThis(),
  populate: jest.fn().mockImplementation(() => Promise.resolve(mockCitas)),
  updateOne: jest.fn().mockImplementation((query, update) => {
    const cita = mockCitas.find(c => c._id === query._id);
    if (cita) {
      Object.assign(cita, update.$set);
    }
    return Promise.resolve({ modifiedCount: 1 });
  })
};

const TallerMock = {
  findOne: jest.fn().mockResolvedValue({
    nombre_taller: 'MecánicaPro',
    telefono: '+51 123456789'
  })
};

// 2. Mock de Twilio API (Outbound Messaging)
const TwilioMock = {
  messages: {
    create: jest.fn().mockResolvedValue({ sid: 'SMXXXXXX' })
  }
};

// 3. Simulación de la función principal del Cronjob
// En la app real esto importaría de backend/services/recordatorios.js
const procesarRecordatoriosYCancelaciones = async () => {
  const taller = await TallerMock.findOne();
  
  // Buscar citas que ocurren dentro de las proximas 24 horas y no tienen recordatorio enviado
  const ahora = new Date();
  const limite24h = new Date(ahora.getTime() + (24 * 60 * 60 * 1000));
  
  // Filtramos mockCitas para simular la query de Mongoose:
  // fecha_cita <= limite24h && fecha_cita > ahora && !recordatorio_enviado
  const citasAProcesar = mockCitas.filter(c => 
    c.fecha_cita <= limite24h && 
    c.fecha_cita > ahora && 
    c.estado === 'confirmada' && 
    !c.recordatorio_enviado
  );

  for (const cita of citasAProcesar) {
    try {
      // Intentar enviar mensaje de WhatsApp
      await TwilioMock.messages.create({
        body: `Hola ${cita.cliente.nombre}, te recordamos tu cita en ${taller.nombre_taller} para mañana.`,
        from: 'whatsapp:+14155238886',
        to: `whatsapp:+${cita.numero_telefono}`
      });
      
      // Marcar como enviado en DB para no hacer spam
      await CitaMock.updateOne({ _id: cita._id }, { $set: { recordatorio_enviado: true } });
    } catch (error) {
      console.error(`Error enviando recordatorio a ${cita.numero_telefono}:`, error);
      // Falla silente para continuar con otras citas
    }
  }
};


// ==========================================
// CASOS DE PRUEBA (TEST SUITE)
// ==========================================

describe('Flujo de Cronjob: Recordatorios de WhatsApp (24h)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockCitas.length = 0; // Limpiar array
  });

  test('HP01: Debe enviar un mensaje a una cita programada para dentro de 24 horas y marcarla como enviada', async () => {
    const citaFutura = {
      _id: 'cita_123',
      numero_telefono: '51933075200',
      fecha_cita: new Date(Date.now() + (23 * 60 * 60 * 1000)), // Dentro de 23 horas
      estado: 'confirmada',
      recordatorio_enviado: false,
      cliente: { nombre: 'Eduardo' }
    };
    mockCitas.push(citaFutura);

    await procesarRecordatoriosYCancelaciones();

    expect(TwilioMock.messages.create).toHaveBeenCalledTimes(1);
    expect(TwilioMock.messages.create).toHaveBeenCalledWith(expect.objectContaining({
      to: 'whatsapp:+51933075200'
    }));
    expect(citaFutura.recordatorio_enviado).toBe(true);
  });

  test('NEG01: No debe enviar mensaje (Spam) si la cita ya tiene recordatorio_enviado = true', async () => {
    const citaYaNotificada = {
      _id: 'cita_124',
      numero_telefono: '51933075200',
      fecha_cita: new Date(Date.now() + (23 * 60 * 60 * 1000)),
      estado: 'confirmada',
      recordatorio_enviado: true, // Ya enviado!
      cliente: { nombre: 'Eduardo' }
    };
    mockCitas.push(citaYaNotificada);

    await procesarRecordatoriosYCancelaciones();

    expect(TwilioMock.messages.create).not.toHaveBeenCalled();
  });

  test('NEG02: No debe enviar mensajes a citas canceladas o completadas', async () => {
    const citaCancelada = {
      _id: 'cita_125',
      numero_telefono: '51933075200',
      fecha_cita: new Date(Date.now() + (23 * 60 * 60 * 1000)),
      estado: 'cancelada', // Cancelada
      recordatorio_enviado: false,
      cliente: { nombre: 'Eduardo' }
    };
    mockCitas.push(citaCancelada);

    await procesarRecordatoriosYCancelaciones();

    expect(TwilioMock.messages.create).not.toHaveBeenCalled();
  });

  test('NEG03: El fallo en el envío a un cliente no debe bloquear el envío a los demás clientes', async () => {
    const citaFalla = {
      _id: 'cita_126',
      numero_telefono: 'INVALID_NUMBER',
      fecha_cita: new Date(Date.now() + (23 * 60 * 60 * 1000)),
      estado: 'confirmada',
      recordatorio_enviado: false,
      cliente: { nombre: 'Cliente Inválido' }
    };
    const citaExito = {
      _id: 'cita_127',
      numero_telefono: '51999888777',
      fecha_cita: new Date(Date.now() + (23 * 60 * 60 * 1000)),
      estado: 'confirmada',
      recordatorio_enviado: false,
      cliente: { nombre: 'Cliente Válido' }
    };
    mockCitas.push(citaFalla, citaExito);

    // Hacemos que Twilio falle SOLO para la primera cita
    TwilioMock.messages.create.mockRejectedValueOnce(new Error('Twilio Network Error'))
                              .mockResolvedValueOnce({ sid: 'SMXXXXXX' });

    await procesarRecordatoriosYCancelaciones();

    // Twilio se intentó llamar dos veces
    expect(TwilioMock.messages.create).toHaveBeenCalledTimes(2);
    
    // La primera cita falló, no se actualizó el recordatorio
    expect(citaFalla.recordatorio_enviado).toBe(false);
    
    // La segunda cita tuvo éxito, se actualizó
    expect(citaExito.recordatorio_enviado).toBe(true);
  });
});
