/**
 * Funções utilitárias para formatação de data e hora
 * Garante que sempre use o timezone de Brasília (America/Sao_Paulo)
 */

/**
 * Retorna a data atual formatada para pt-BR no timezone de Brasília
 * Formato: DD/MM/YYYY
 */
export const getCurrentDateBR = (): string => {
  const now = new Date();

  // Força o timezone de Brasília (UTC-3)
  const brDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

  const day = String(brDate.getDate()).padStart(2, '0');
  const month = String(brDate.getMonth() + 1).padStart(2, '0');
  const year = brDate.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Retorna a hora atual formatada para pt-BR no timezone de Brasília
 * Formato: HH:MM
 */
export const getCurrentTimeBR = (): string => {
  const now = new Date();

  // Força o timezone de Brasília (UTC-3)
  const brDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

  const hours = String(brDate.getHours()).padStart(2, '0');
  const minutes = String(brDate.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

/**
 * Formata uma data ISO para o formato pt-BR
 * @param isoDate Data no formato ISO (ex: 2026-02-02T23:42:00.000Z)
 * @returns Data formatada DD/MM/YYYY
 */
export const formatDateBR = (isoDate: string | Date): string => {
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;

  // Converte para timezone de Brasília
  const brDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

  const day = String(brDate.getDate()).padStart(2, '0');
  const month = String(brDate.getMonth() + 1).padStart(2, '0');
  const year = brDate.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Formata uma data ISO para o formato de hora pt-BR
 * @param isoDate Data no formato ISO (ex: 2026-02-02T23:42:00.000Z)
 * @returns Hora formatada HH:MM
 */
export const formatTimeBR = (isoDate: string | Date): string => {
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;

  // Converte para timezone de Brasília
  const brDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

  const hours = String(brDate.getHours()).padStart(2, '0');
  const minutes = String(brDate.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

/**
 * Converte data DD/MM/YYYY para formato extenso: "3 de fevereiro de 2026"
 */
export const formatDateLong = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parts[2];
  if (isNaN(day) || isNaN(month) || month < 1 || month > 12) return dateStr;
  return `${day} de ${MESES[month - 1]} de ${year}`;
};
