const API_URL = typeof window !== 'undefined' 
  ? '/api' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

// Mock data generator helper
const mockRequest = async (mockData) => {
  return new Promise(resolve => setTimeout(() => resolve(mockData), 300));
};

export const api = {
  // Autenticación
  login: async (email, password) => {
    return mockRequest({ ok: true, usuario: { id: 1, nombre: 'Admin Mock', rol: 'admin', email } });
  },
  logout: async () => mockRequest({ ok: true }),
  getMe: async () => mockRequest({ ok: true, usuario: { id: 1, nombre: 'Admin Mock', rol: 'admin', email: 'admin@demo.com' } }),

  // Settings y configuración pública
  getConfiguracion: async () => mockRequest({
    nombre_taller: "VtkALL Mock",
    slogan: "Sistema Operacional",
    tema_global: { color: "#00aeef" }
  }),
  
  // Servicios
  getServicios: async () => mockRequest([
    { id: 1, nombre: "Diagnóstico Computarizado", descripcion: "Diagnóstico general", precio_base: 50 },
    { id: 2, nombre: "Mantenimiento Preventivo", descripcion: "Cambio de aceite y filtros", precio_base: 150 },
    { id: 3, nombre: "Revisión de Frenos", descripcion: "Pastillas y discos", precio_base: 80 }
  ]),

  // Citas
  getCitas: () => mockRequest({
    citas: [
      { _id: '1', fecha_cita: new Date().toISOString(), estado: 'confirmada', precio_final: 150, cliente: { nombre: 'Juan Pérez' }, vehiculo: 'Toyota Corolla' },
      { _id: '2', fecha_cita: new Date().toISOString(), estado: 'pendiente', precio_final: 80, cliente: { nombre: 'María Gómez' }, vehiculo: 'Kia Rio' },
      { _id: '3', fecha_cita: new Date(Date.now() + 86400000).toISOString(), estado: 'en_proceso', precio_final: 300, cliente: { nombre: 'Carlos Ruiz' }, vehiculo: 'Nissan Sentra' }
    ]
  }),
  crearCita: () => mockRequest({ ok: true, _id: 'new_cita' }),
  actualizarCita: () => mockRequest({ ok: true }),
  eliminarCita: () => mockRequest({ ok: true }),
  enviarFeedbackMaestro: () => mockRequest({ ok: true }),
  
  // Temporal Workflow
  temporalStart: () => mockRequest({ ok: true }),
  temporalBakerQuote: () => mockRequest({ ok: true }),

  // Clientes
  getClientes: () => mockRequest({
    clientes: [
      { _id: '1', nombre: 'Juan Pérez', telefono: '999888777', email: 'juan@test.com' },
      { _id: '2', nombre: 'María Gómez', telefono: '999888666', email: 'maria@test.com' },
      { _id: '3', nombre: 'Carlos Ruiz', telefono: '999888555', email: 'carlos@test.com' }
    ],
    total: 3,
    paginas: 1
  }),
  getClienteDetalle: () => mockRequest({ _id: '1', nombre: 'Juan Pérez', telefono: '999888777', email: 'juan@test.com', vehiculos: [{ patente: 'ABC-123', modelo: 'Corolla' }] }),
  crearCliente: () => mockRequest({ ok: true }),
  actualizarCliente: () => mockRequest({ ok: true }),
  eliminarCliente: () => mockRequest({ ok: true }),

  // Mensajes y chat
  getConversaciones: () => mockRequest([]),
  getMensajes: () => mockRequest({ mensajes: [], cliente: null }),
  enviarMensajeManual: () => mockRequest({ ok: true }),
  
  // Simulador de WhatsApp webhook
  enviarMensajeSimulado: () => mockRequest({ ok: true }),
  getHistorialPublico: () => mockRequest({ ok: true, mensajes: [], cliente: null }),
  identificarConversacion: () => mockRequest({ ok: true }),
  getDisponibilidadPublica: () => mockRequest({ disponibles: [] }),
  agendarCitaPublica: () => mockRequest({ ok: true }),

  // Productos
  getProductos: () => mockRequest([
    { _id: 'p1', nombre: 'Aceite Sintético', stock: 10, precio: 50 },
    { _id: 'p2', nombre: 'Filtro de Aceite', stock: 5, precio: 15 }
  ]),
  crearProducto: () => mockRequest({ ok: true }),
  actualizarProducto: () => mockRequest({ ok: true }),
  eliminarProducto: () => mockRequest({ ok: true }),

  // Teams y Trabajadores
  getTeams: () => mockRequest([
    { _id: 't1', nombre: 'Bahía 1', capacidad: 1 },
    { _id: 't2', nombre: 'Bahía 2', capacidad: 1 }
  ]),
  crearTeam: () => mockRequest({ ok: true }),
  actualizarTeam: () => mockRequest({ ok: true }),
  eliminarTeam: () => mockRequest({ ok: true }),

  getTrabajadores: () => mockRequest([
    { _id: 'w1', nombre: 'Luis', rol: 'Mecánico Principal' },
    { _id: 'w2', nombre: 'Carlos', rol: 'Mecánico Jr' }
  ]),
  crearTrabajador: () => mockRequest({ ok: true }),
  actualizarTrabajador: () => mockRequest({ ok: true }),
  eliminarTrabajador: () => mockRequest({ ok: true }),

  // Disponibilidad
  getDisponibilidad: () => mockRequest([]),
  guardarDisponibilidad: () => mockRequest({ ok: true }),

  // Configuración del taller
  actualizarConfiguracion: () => mockRequest({ ok: true }),
  obtenerVerticalConfig: () => mockRequest({ type: 'automotive' }),

  // Cases / Operaciones
  obtenerCases: () => mockRequest({
    data: [
      { id: 'TUR-2026-0001', customerName: 'Carlos Ramírez', placa: 'ABC-123', status: 'intake', serviceRequested: 'Frenos', finalPrice: 850 },
      { id: 'TUR-2026-0002', customerName: 'María Torres', placa: 'XYZ-789', status: 'expert_review', serviceRequested: 'Diagnóstico', finalPrice: 0 }
    ],
    meta: { total: 2, page: 1, limit: 10 }
  }),
  obtenerCasePorId: () => mockRequest({ data: { id: 'TUR-2026-0001', customerName: 'Carlos Ramírez', placa: 'ABC-123', status: 'intake', serviceRequested: 'Frenos', finalPrice: 850, estimatedDeliveryDate: new Date().toISOString() } }),
  crearCase: () => mockRequest({ ok: true }),
  actualizarCaseStatus: () => mockRequest({ ok: true }),
  aplicarExpertReview: () => mockRequest({ ok: true }),
  prepararCaseQuote: () => mockRequest({ ok: true }),
  obtenerCaseQuote: () => mockRequest({ data: null }),
  aprobarCase: () => mockRequest({ ok: true }),
  rechazarCase: () => mockRequest({ ok: true }),

  // Historial Clínico y Mantenimiento de Vehículos
  agregarReparacion: () => mockRequest({ ok: true }),
  actualizarMantenimiento: () => mockRequest({ ok: true }),
  mergeClientes: () => mockRequest({ ok: true }),
  subirImagenGeneral: () => mockRequest({ url: 'https://via.placeholder.com/150' }),
};
