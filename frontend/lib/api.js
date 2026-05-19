const API_URL = typeof window !== 'undefined' 
  ? '/api' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

const request = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  // Habilitar envío de cookies HttpOnly
  options.credentials = 'include';
  
  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  try {
    const response = await fetch(url, options);
    
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/me')) {
      // Limpiar cookies de sesión en el cliente si es no autorizado
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || `Error del servidor (status: ${response.status})`;
      const error = new Error(errorMsg);
      error.status = response.status;
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    // Evitar inundar la consola con errores 401 (no autorizado) al verificar sesión o login
    if (error.status !== 401 || (endpoint !== '/auth/me' && endpoint !== '/auth/login')) {
      console.error(`Error en API Request [${endpoint}]:`, error);
    }
    throw error;
  }
};

export const api = {
  // Autenticación
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Citas
  getCitas: (fecha = '', estado = '', pagina = 1, limite = 20) => {
    let query = `?pagina=${pagina}&limite=${limite}`;
    if (fecha) query += `&fecha=${fecha}`;
    if (estado) query += `&estado=${estado}`;
    return request(`/citas${query}`);
  },
  crearCita: (data) => request('/citas', { method: 'POST', body: data }),
  actualizarCita: (id, data) => request(`/citas/${id}`, { method: 'PUT', body: data }),
  eliminarCita: (id) => request(`/citas/${id}`, { method: 'DELETE' }),

  // Clientes
  getClientes: (busqueda = '', pagina = 1, limite = 20) => {
    let query = `?pagina=${pagina}&limite=${limite}`;
    if (busqueda) query += `&busqueda=${encodeURIComponent(busqueda)}`;
    return request(`/clientes${query}`);
  },
  getClienteDetalle: (id) => request(`/clientes/${id}`),
  crearCliente: (data) => request('/clientes', { method: 'POST', body: data }),
  actualizarCliente: (id, data) => request(`/clientes/${id}`, { method: 'PUT', body: data }),
  eliminarCliente: (id) => request(`/clientes/${id}`, { method: 'DELETE' }),

  // Mensajes y chat
  getConversaciones: () => request('/mensajes/conversaciones'),
  getMensajes: (numeroTelefono) => request(`/mensajes/${numeroTelefono}`),
  enviarMensajeManual: (numero_telefono, contenido) => request('/mensajes/enviar-manual', { method: 'POST', body: { numero_telefono, contenido } }),
  
  // Simulador de WhatsApp webhook
  enviarMensajeSimulado: (numeroTelefono, contenido) => {
    return request('/webhook/whatsapp', {
      method: 'POST',
      body: {
        from: `whatsapp:${numeroTelefono}`,
        body: contenido
      }
    });
  },

  // Servicios
  getServicios: () => request('/servicios'),
  crearServicio: (data) => request('/servicios', { method: 'POST', body: data }),
  actualizarServicio: (id, data) => request(`/servicios/${id}`, { method: 'PUT', body: data }),
  eliminarServicio: (id) => request(`/servicios/${id}`, { method: 'DELETE' }),

  // Configuración del taller
  getConfiguracion: () => request('/configuracion'),
  actualizarConfiguracion: (data) => request('/configuracion', { method: 'PUT', body: data }),
};
