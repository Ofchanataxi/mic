export function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatScore(value) {
  if (value === null || value === undefined) return 'Pendiente';
  return `${Math.round(Number(value))}/100`;
}

const statusLabels = {
  CREATED: 'Creada',
  IN_PROGRESS: 'En curso',
  FINISHED: 'Finalizada',
  DISPATCHED: 'Enviada',
  DISPATCH_FAILED: 'No se pudo enviar',
  PENDING: 'Pendiente',
  WAITING: 'En espera',
  PROCESSING: 'En análisis',
  GENERATING: 'Generando reporte',
  COMPLETED: 'Completada',
  PARTIAL: 'Completada parcialmente',
  READY: 'Lista',
  FAILED: 'No completada',
  CANCELLED: 'Cerrada',
  FEEDBACK_PENDING: 'Reporte pendiente',
  TECHNICAL: 'Técnica',
  SOFT: 'Blanda',
  SOFT_SKILL: 'Blanda',
  SOFTSKILL: 'Blanda',
  CODE: 'Código',
  CODING: 'Código',
  CODING_EXERCISE: 'Código',
  CODINGEXERCISE: 'Código',
};

export function normalizeStatusKey(value) {
  return String(value || '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

export function formatStatus(value, fallback = 'PENDING') {
  const status = normalizeStatusKey(value || fallback);
  return statusLabels[status] || status;
}

export function formatSkillType(value) {
  const normalized = normalizeStatusKey(value);
  return statusLabels[normalized] || 'Pregunta';
}

export function getApiErrorMessage(error) {
  const code = error?.response?.data?.error?.code;
  const messagesByCode = {
    EMAIL_NOT_VERIFIED: 'Debes verificar tu correo antes de ingresar.',
    INVALID_VERIFICATION_TOKEN: 'El enlace de verificación no es válido o ya venció.',
    INVALID_PASSWORD_RESET_TOKEN: 'El enlace de recuperación no es válido o ya venció.',
    EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta registrada con este correo.',
  };
  if (messagesByCode[code]) return messagesByCode[code];

  const message = error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || 'No se pudo completar la acción';

  if (/media.*READY|not READY|Current status:\s*PROCESSING|status:\s*PROCESSING/i.test(message)) {
    return 'El video todavía se está preparando. El análisis continuará automáticamente.';
  }

  if (/too many requests/i.test(message)) {
    return 'Se hicieron demasiadas solicitudes en poco tiempo. Intenta nuevamente en unos minutos.';
  }

  if (/authorization bearer token is required|unauthorized|jwt/i.test(message)) {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }

  return message;
}
