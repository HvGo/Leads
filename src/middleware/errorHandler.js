import winston from 'winston';

// Configurar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'crm-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// En desarrollo, también log a consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Clase para errores personalizados
export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de manejo de errores
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Error de validación de Joi
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // Error de PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        error = new AppError('Ya existe un registro con estos datos', 409, 'DUPLICATE_ENTRY');
        break;
      case '23503': // Foreign key violation
        error = new AppError('Referencia inválida a otro registro', 400, 'INVALID_REFERENCE');
        break;
      case '23502': // Not null violation
        error = new AppError('Campo requerido faltante', 400, 'MISSING_REQUIRED_FIELD');
        break;
      case '22P02': // Invalid text representation
        error = new AppError('Formato de datos inválido', 400, 'INVALID_DATA_FORMAT');
        break;
      default:
        error = new AppError('Error de base de datos', 500, 'DATABASE_ERROR');
    }
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token inválido', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expirado', 401, 'EXPIRED_TOKEN');
  }

  // Error por defecto
  if (!error.isOperational) {
    error = new AppError('Error interno del servidor', 500, 'INTERNAL_ERROR');
  }

  // Respuesta de error
  const response = {
    status: 'error',
    message: error.message
  };

  if (error.code) {
    response.code = error.code;
  }

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

// Middleware para capturar errores async
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para rutas no encontradas
export const notFound = (req, res, next) => {
  const error = new AppError(`Ruta ${req.originalUrl} no encontrada`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

export { logger };
