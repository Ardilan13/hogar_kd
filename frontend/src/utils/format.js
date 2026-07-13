// Cambia CURRENCY y LOCALE aqui si quieres otra moneda/formato de fecha.
export const CURRENCY = 'COP';
export const LOCALE = 'es-CO';

export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return value.toLocaleString(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0
  });
}

export function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' });
}
