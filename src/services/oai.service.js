import { handleIdentify } from './identify.service.js';
import { handleListMetadataFormats } from './listMetadataFormats.service.js';
import { handleListSets } from './listSets.service.js';
import { handleGetRecord } from './getRecord.service.js';
import { handleListIdentifiers } from './listIdentifiers.service.js';
import { handleListRecords } from './listRecords.service.js';
import { badVerb } from '../utils/errors.js';

/**
 * Dispatcher central OAI-PMH.
 * Recibe los parametros validados y delega al servicio correspondiente.
 *
 * @param {object} oaiParams - Query params validados por el middleware Zod
 * @returns {Promise<object>} - Respuesta del verbo correspondiente
 */
export async function dispatch(oaiParams) {
  const { verb } = oaiParams;

  switch (verb) {
    case 'Identify':
      return handleIdentify();

    case 'ListMetadataFormats':
      return handleListMetadataFormats(oaiParams);

    case 'ListSets':
      return handleListSets(oaiParams);

    case 'GetRecord':
      return handleGetRecord(oaiParams);

    case 'ListIdentifiers':
      return handleListIdentifiers(oaiParams);

    case 'ListRecords':
      return handleListRecords(oaiParams);

    default:
      throw badVerb(`Verb "${verb}" is not supported`);
  }
}
