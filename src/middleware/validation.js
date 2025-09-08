import Joi from 'joi';

// Esquemas de validación
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es requerido'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es requerida'
  })
});

export const userSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 255 caracteres',
    'any.required': 'El nombre es requerido'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es requerido'
  }),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().messages({
    'string.pattern.base': 'Formato de teléfono inválido'
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'string.pattern.base': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
    'any.required': 'La contraseña es requerida'
  }),
  roleId: Joi.string().uuid().optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').default('ACTIVE'),
  department: Joi.string().max(100).optional(),
  position: Joi.string().max(100).optional(),
  bio: Joi.string().max(500).optional()
});

export const leadSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 255 caracteres',
    'any.required': 'El nombre es requerido'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Debe ser un email válido'
  }),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().messages({
    'string.pattern.base': 'Formato de teléfono inválido'
  }),
  company: Joi.string().max(255).optional(),
  position: Joi.string().max(255).optional(),
  status: Joi.string().valid('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD').default('NEW'),
  source: Joi.string().valid('WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'PHONE_CALL', 'TRADE_SHOW', 'OTHER').default('OTHER'),
  segment: Joi.string().max(100).optional(),
  potentialValue: Joi.number().min(0).max(999999999.99).optional(),
  notes: Joi.string().max(2000).optional(),
  responsibleId: Joi.string().uuid().optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional()
});

export const interactionSchema = Joi.object({
  leadId: Joi.string().uuid().required().messages({
    'any.required': 'El ID del lead es requerido'
  }),
  type: Joi.string().valid('CALL', 'EMAIL', 'MEETING', 'DEMO', 'FOLLOW_UP', 'OTHER').required().messages({
    'any.required': 'El tipo de interacción es requerido'
  }),
  channel: Joi.string().valid('PHONE', 'MOBILE', 'EMAIL', 'VIDEO_CALL', 'IN_PERSON', 'CHAT', 'OTHER').required().messages({
    'any.required': 'El canal de interacción es requerido'
  }),
  phoneUsed: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().messages({
    'string.pattern.base': 'Formato de teléfono inválido'
  }),
  result: Joi.string().valid('SUCCESSFUL', 'NO_ANSWER', 'BUSY', 'VOICEMAIL', 'CALLBACK_REQUESTED', 'NOT_INTERESTED', 'FOLLOW_UP_NEEDED', 'CLOSED').required().messages({
    'any.required': 'El resultado de la interacción es requerido'
  }),
  duration: Joi.number().min(0).max(480).optional().messages({
    'number.min': 'La duración no puede ser negativa',
    'number.max': 'La duración no puede exceder 8 horas'
  }),
  notes: Joi.string().max(2000).optional(),
  scheduledAt: Joi.date().iso().optional(),
  completedAt: Joi.date().iso().optional()
});

// Middleware de validación
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors
      });
    }

    req.body = value;
    next();
  };
};

// Validación de parámetros UUID
export const validateUUID = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];
    const { error } = Joi.string().uuid().validate(value);

    if (error) {
      return res.status(400).json({
        error: `Parámetro ${paramName} debe ser un UUID válido`
      });
    }

    next();
  };
};
