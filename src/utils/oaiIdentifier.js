/**
 * Utilidades para generar y parsear identificadores OAI-PMH.
 *
 * Formato: oai:<dominio>:<tipo>/<id>
 * Ejemplos:
 *   oai:rais.unmsm.edu.pe:publicacion/42
 *   oai:rais.unmsm.edu.pe:persona/1234
 *   oai:rais.unmsm.edu.pe:orgunit/facultad-3
 *   oai:rais.unmsm.edu.pe:orgunit/instituto-5
 *   oai:rais.unmsm.edu.pe:orgunit/grupo-10
 */

const OAI_DOMAIN = 'rais.unmsm.edu.pe';

/**
 * Genera un OAI identifier a partir de un tipo y un id.
 * @param {'publicacion'|'proyecto'|'patente'|'persona'|'orgunit'} type
 * @param {number|string} id - Numerico para la mayoria, compuesto para orgunit (e.g. "facultad-3")
 * @returns {string} e.g. "oai:rais.unmsm.edu.pe:publicacion/42"
 */
export function buildOaiIdentifier(type, id) {
  return `oai:${OAI_DOMAIN}:${type}/${id}`;
}

/**
 * Construye un OAI identifier compuesto para unidades organizativas.
 * @param {'facultad'|'instituto'|'grupo'} subtype
 * @param {number} id
 * @returns {string} e.g. "oai:rais.unmsm.edu.pe:orgunit/facultad-3"
 */
export function buildOrgUnitIdentifier(subtype, id) {
  return `oai:${OAI_DOMAIN}:orgunit/${subtype}-${id}`;
}

/**
 * Parsea un OAI identifier y devuelve el tipo y el id.
 * Soporta IDs simples (numericos) y compuestos (orgunit/facultad-3).
 * @param {string} identifier - e.g. "oai:rais.unmsm.edu.pe:publicacion/42"
 * @returns {{ type: string, id: number|string, subtype?: string, numericId?: number } | null}
 */
export function parseOaiIdentifier(identifier) {
  if (!identifier || typeof identifier !== 'string') return null;

  const regex = /^oai:rais\.unmsm\.edu\.pe:(\w+)\/([\w-]+)$/;
  const match = identifier.match(regex);

  if (!match) return null;

  const type = match[1];
  const rawId = match[2];

  // ID compuesto para orgunit: "facultad-3", "instituto-5", "grupo-10"
  if (type === 'orgunit') {
    const compoundMatch = rawId.match(/^(facultad|instituto|grupo)-(\d+)$/);
    if (!compoundMatch) return null;
    return {
      type: 'orgunit',
      id: rawId,
      subtype: compoundMatch[1],
      numericId: Number(compoundMatch[2]),
    };
  }

  // ID numerico simple para el resto de entidades
  if (!/^\d+$/.test(rawId)) return null;

  return {
    type,
    id: Number(rawId),
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
