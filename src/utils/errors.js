/**
 * Errores estandar del protocolo OAI-PMH 2.0
 * Cada error tiene un codigo OAI y un mensaje descriptivo.
 */

export class OaiError extends Error {
  /**
   * @param {string} oaiCode - Codigo de error OAI-PMH
   * @param {string} message - Mensaje descriptivo
   * @param {number} [statusCode=200] - HTTP status (OAI-PMH siempre responde 200, pero se puede cambiar)
   */
  constructor(oaiCode, message, statusCode = 200) {
    super(message);
    this.name = 'OaiError';
    this.oaiCode = oaiCode;
    this.statusCode = statusCode;
  }
}

/** Verbo no reconocido */
export const badVerb = (msg = 'Illegal OAI verb') =>
  new OaiError('badVerb', msg);

/** Argumento invalido, faltante o repetido */
export const badArgument = (msg = 'Invalid or missing argument') =>
  new OaiError('badArgument', msg);

/** No existen registros que cumplan los criterios */
export const noRecordsMatch = (msg = 'No records match the given criteria') =>
  new OaiError('noRecordsMatch', msg);

/** El identifier solicitado no existe en el repositorio */
export const idDoesNotExist = (msg = 'The identifier does not exist in this repository') =>
  new OaiError('idDoesNotExist', msg);

/** El resumptionToken es invalido o ha expirado */
export const badResumptionToken = (msg = 'Invalid or expired resumptionToken') =>
  new OaiError('badResumptionToken', msg);

/** El metadataPrefix solicitado no esta soportado */
export const cannotDisseminateFormat = (msg = 'The metadata format is not supported by this repository') =>
  new OaiError('cannotDisseminateFormat', msg);

/** No existen sets en el repositorio */
export const noSetHierarchy = (msg = 'This repository does not support sets') =>
  new OaiError('noSetHierarchy', msg);
