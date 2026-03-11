import { z } from 'zod/v4';
import { badVerb, badArgument } from '../utils/errors.js';

/**
 * Verbos OAI-PMH validos y sus parametros permitidos/requeridos.
 */
const VALID_VERBS = [
  'Identify',
  'ListMetadataFormats',
  'ListSets',
  'ListIdentifiers',
  'ListRecords',
  'GetRecord',
];

const VALID_METADATA_PREFIXES = ['oai_cerif'];

/**
 * Schema base: el query param "verb" es obligatorio.
 */
const baseSchema = z.object({
  verb: z.enum(VALID_VERBS),
});

/**
 * Reglas de validacion por verbo.
 */
const verbSchemas = {
  // Identify: no acepta parametros extra
  Identify: z.object({
    verb: z.literal('Identify'),
  }).strict(),

  // ListMetadataFormats: identifier es opcional
  ListMetadataFormats: z.object({
    verb: z.literal('ListMetadataFormats'),
    identifier: z.string().optional(),
  }).strict(),

  // ListSets: resumptionToken es opcional
  ListSets: z.object({
    verb: z.literal('ListSets'),
    resumptionToken: z.string().optional(),
  }).strict(),

  // ListIdentifiers: metadataPrefix obligatorio, + filtros opcionales
  ListIdentifiers: z.object({
    verb: z.literal('ListIdentifiers'),
    metadataPrefix: z.enum(VALID_METADATA_PREFIXES).optional(),
    set: z.string().optional(),
    from: z.string().optional(),
    until: z.string().optional(),
    resumptionToken: z.string().optional(),
  }).strict()
    .refine(
      (data) => data.resumptionToken || data.metadataPrefix,
      { message: 'metadataPrefix is required when resumptionToken is not provided' },
    ),

  // ListRecords: metadataPrefix obligatorio, + filtros opcionales
  ListRecords: z.object({
    verb: z.literal('ListRecords'),
    metadataPrefix: z.enum(VALID_METADATA_PREFIXES).optional(),
    set: z.string().optional(),
    from: z.string().optional(),
    until: z.string().optional(),
    resumptionToken: z.string().optional(),
  }).strict()
    .refine(
      (data) => data.resumptionToken || data.metadataPrefix,
      { message: 'metadataPrefix is required when resumptionToken is not provided' },
    ),

  // GetRecord: identifier y metadataPrefix obligatorios
  GetRecord: z.object({
    verb: z.literal('GetRecord'),
    identifier: z.string().min(1),
    metadataPrefix: z.enum(VALID_METADATA_PREFIXES),
  }).strict(),
};

/**
 * Middleware Express que valida los query params OAI-PMH.
 */
export function validateVerb(req, res, next) {
  // Paso 1: Validar que el verbo exista
  const baseParsed = baseSchema.safeParse(req.query);

  if (!baseParsed.success) {
    const err = badVerb(`Illegal OAI verb. Expected one of: ${VALID_VERBS.join(', ')}`);
    return res.status(200).json({
      responseDate: new Date().toISOString(),
      request: { baseURL: process.env.BASE_URL },
      error: { code: err.oaiCode, message: err.message },
    });
  }

  const { verb } = baseParsed.data;

  // Paso 2: Validar parametros segun el verbo
  const schema = verbSchemas[verb];
  const parsed = schema.safeParse(req.query);

  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join('; ');
    const err = badArgument(messages);
    return res.status(200).json({
      responseDate: new Date().toISOString(),
      request: { verb, baseURL: process.env.BASE_URL },
      error: { code: err.oaiCode, message: err.message },
    });
  }

  // Guardar los datos validados en req
  req.oaiParams = parsed.data;
  next();
}
