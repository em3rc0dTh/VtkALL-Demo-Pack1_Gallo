export class ApiError extends Error {
  constructor({ code, message, details, status, kind, cause }) {
    super(message);
    this.name = 'ApiError';
    this.code = code || 'UNKNOWN_ERROR';
    this.details = details || null;
    this.status = status || 500;
    this.kind = kind || 'backend_semantic';
    this.cause = cause;
  }

  static fromResponse(response, payload) {
    const semanticError = payload?.error || (payload?.code ? payload : null);
    if (semanticError) {
      return new ApiError({
        code: semanticError.code,
        message: semanticError.message || 'Error en la operacion',
        details: {
          ...(semanticError.details ? { details: semanticError.details } : {}),
          ...(payload?.context ? { context: payload.context } : {}),
        },
        status: response.status,
        kind: 'backend_semantic'
      });
    }
    
    return new ApiError({
      code: 'HTTP_ERROR',
      message: `HTTP Error ${response.status}`,
      status: response.status,
      kind: 'http'
    });
  }

  static fromNetworkError(error) {
    if (error.name === 'AbortError') {
      return new ApiError({
        code: 'REQUEST_ABORTED',
        message: 'La peticion fue cancelada',
        kind: 'aborted',
        cause: error
      });
    }
    return new ApiError({
      code: 'NETWORK_ERROR',
      message: 'Error de conexion con el servidor',
      kind: 'network',
      cause: error
    });
  }
}
