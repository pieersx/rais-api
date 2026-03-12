import { dispatch } from '../services/oai.service.js';
import { OaiError } from '../utils/errors.js';

/**
 * Controller OAI-PMH.
 * Recibe la peticion validada, delega al dispatcher y construye la respuesta JSON.
 * 
 * Respuesta oficial OAI-PMH 2.0 con envelope XML-to-JSON:
 * {
 *   "OAI-PMH": {
 *     "@xmlns": "http://www.openarchives.org/OAI/2.0/",
 *     "responseDate": "...",
 *     "request": { "@verb": "...", "#text": "baseURL" },
 *     "<verb>": { ... },
 *     "error": { "@code": "...", "#text": "..." }  // si hay error
 *   }
 * }
 */
/**
 * Construye el objeto "request" del envelope OAI-PMH, incluyendo todos
 * los query params como atributos @-prefixed segun la especificacion.
 */
function buildRequestElement(oaiParams) {
  const baseURL = process.env.BASE_URL;
  const req = { "#text": baseURL };

  if (oaiParams?.verb) req["@verb"] = oaiParams.verb;

  // Atributos opcionales — solo incluir si estan presentes
  const optionalAttrs = ['metadataPrefix', 'set', 'from', 'until', 'identifier', 'resumptionToken'];
  for (const attr of optionalAttrs) {
    if (oaiParams?.[attr]) {
      req[`@${attr}`] = oaiParams[attr];
    }
  }

  return req;
}

export async function handleOaiRequest(req, res) {
  const oaiParams = req.oaiParams;
  const responseDate = new Date().toISOString();

  try {
    const data = await dispatch(oaiParams);

    // El servicio retorna { verb: 'VerbName', ...payload }.
    // Extraemos verb y anidamos el payload bajo la clave del verbo.
    const { verb, ...payload } = data;

    const oaipmhResponse = {
      "OAI-PMH": {
        "@xmlns": "http://www.openarchives.org/OAI/2.0/",
        responseDate,
        request: buildRequestElement(oaiParams),
        [verb]: payload,
      },
    };

    return res.json(oaipmhResponse);
  } catch (err) {
    // Errores OAI-PMH se devuelven con status 200 (segun el protocolo)
    if (err instanceof OaiError) {
      return res.status(200).json({
        "OAI-PMH": {
          "@xmlns": "http://www.openarchives.org/OAI/2.0/",
          responseDate,
          request: buildRequestElement(oaiParams),
          error: {
            "@code": err.oaiCode,
            "#text": err.message,
          },
        },
      });
    }

    // Errores inesperados
    console.error('[OAI Controller Error]', err);
    return res.status(200).json({
      "OAI-PMH": {
        "@xmlns": "http://www.openarchives.org/OAI/2.0/",
        responseDate,
        request: buildRequestElement(oaiParams),
        error: {
          "@code": "internalError",
          "#text": "An unexpected error occurred",
        },
      },
    });
  }
}
