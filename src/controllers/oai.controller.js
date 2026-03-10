import { dispatch } from '../services/oai.service.js';
import { OaiError } from '../utils/errors.js';

/**
 * Controller OAI-PMH.
 * Recibe la peticion validada, delega al dispatcher y construye la respuesta JSON.
 */
export async function handleOaiRequest(req, res) {
  const oaiParams = req.oaiParams;

  try {
    const data = await dispatch(oaiParams);

    // Envelope estandar OAI-PMH (version JSON)
    return res.json({
      responseDate: new Date().toISOString(),
      request: {
        baseURL: process.env.BASE_URL,
        ...oaiParams,
      },
      ...data,
    });
  } catch (err) {
    // Errores OAI-PMH se devuelven con status 200 (segun el protocolo)
    if (err instanceof OaiError) {
      return res.status(200).json({
        responseDate: new Date().toISOString(),
        request: {
          baseURL: process.env.BASE_URL,
          ...oaiParams,
        },
        error: {
          code: err.oaiCode,
          message: err.message,
        },
      });
    }

    // Errores inesperados
    console.error('[OAI Controller Error]', err);
    return res.status(500).json({
      responseDate: new Date().toISOString(),
      request: {
        baseURL: process.env.BASE_URL,
        ...oaiParams,
      },
      error: {
        code: 'internalError',
        message: 'An unexpected error occurred',
      },
    });
  }
}
