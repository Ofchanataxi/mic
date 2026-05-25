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

export function getApiErrorMessage(error) {
  return error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || 'No se pudo completar la accion';
}
