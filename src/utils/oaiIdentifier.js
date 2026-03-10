/**
 * Utilidades para generar y parsear identificadores OAI-PMH.
 *
 * Formato: oai:<dominio>:<tipo>/<id>
 * Ejemplo: oai:rais.unmsm.edu.pe:publicacion/42
 */

const OAI_DOMAIN = 'rais.unmsm.edu.pe';

/**
 * Genera un OAI identifier a partir de un tipo y un id numerico.
 * @param {'publicacion'|'proyecto'|'patente'} type
 * @param {number|string} id
 * @returns {string} e.g. "oai:rais.unmsm.edu.pe:publicacion/42"
 */
export function buildOaiIdentifier(type, id) {
  return `oai:${OAI_DOMAIN}:${type}/${id}`;
}

/**
 * Parsea un OAI identifier y devuelve el tipo y el id.
 * @param {string} identifier - e.g. "oai:rais.unmsm.edu.pe:publicacion/42"
 * @returns {{ type: string, id: number } | null}
 */
export function parseOaiIdentifier(identifier) {
  if (!identifier || typeof identifier !== 'string') return null;

  const regex = /^oai:rais\.unmsm\.edu\.pe:(\w+)\/(\d+)$/;
  const match = identifier.match(regex);

  if (!match) return null;

  return {
    type: match[1],
    id: Number(match[2]),
  };
}

/**
 * Convierte un Date o string de fecha a formato OAI datestamp (UTC).
 * Soporta formatos MySQL: "YYYY-MM-DD HH:mm:ss" y "YYYY-MM-DD".
 * @param {Date|string|null} date
 * @returns {string} e.g. "2025-03-06T12:00:00Z"
 */
export function toDatestamp(date) {
  if (!date) return '';

  if (typeof date === 'string') {
    // MySQL "0000-00-00" o "0000-00-00 00:00:00" son fechas nulas
    if (date.startsWith('0000-00-00')) return '';
    // MySQL dateStrings devuelve "YYYY-MM-DD HH:mm:ss" - convertir a ISO
    const normalized = date.includes('T') ? date : date.replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return date; // fallback: devolver tal cual
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  if (date instanceof Date) {
    if (isNaN(date.getTime())) return '';
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  return '';
}
