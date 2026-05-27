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
  CANCELLED: 'Cancelada',
  FEEDBACK_PENDING: 'Reporte pendiente',
  TECHNICAL: 'Técnica',
  SOFT: 'Comunicación',
  CODE: 'Código',
  CODING: 'Código',
};

export function formatStatus(value, fallback = 'PENDING') {
  const status = value || fallback;
  return statusLabels[status] || status;
}

export function formatSkillType(value) {
  return statusLabels[value] || value;
}

export function getApiErrorMessage(error) {
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
