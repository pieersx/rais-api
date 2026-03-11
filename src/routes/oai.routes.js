import { Router } from 'express';
import { validateVerb } from '../middlewares/validateVerb.js';
import { handleOaiRequest } from '../controllers/oai.controller.js';

const oaiRouter = Router();

/**
 * GET /api/oai
 *
 * Endpoint unico OAI-PMH.
 * Todos los verbos se manejan a traves de query params:
 *   ?verb=Identify
 *   ?verb=ListMetadataFormats
 *   ?verb=ListSets
 *   ?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:publicacion/1&metadataPrefix=oai_cerif
 *   ?verb=ListIdentifiers&metadataPrefix=oai_cerif
 *   ?verb=ListRecords&metadataPrefix=oai_cerif
 */
oaiRouter.get('/', validateVerb, handleOaiRequest);

export { oaiRouter };
