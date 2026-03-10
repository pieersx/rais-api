import * as pubRepo from '../repositories/publicacion.repository.js';
import * as proyRepo from '../repositories/proyecto.repository.js';
import * as patRepo from '../repositories/patente.repository.js';
import { buildOaiIdentifier, toDatestamp } from '../utils/oaiIdentifier.js';
import { noRecordsMatch, badResumptionToken } from '../utils/errors.js';
import { extractPaginationParams, buildResumptionToken, encodeToken, decodeToken } from './resumptionToken.js';
import { getSetSpec } from './getRecord.service.js';

/**
 * Servicio para el verbo ListIdentifiers.
 * Soporta publicaciones, proyectos y patentes segun el set.
 *
 * Para sets multi-entidad (facultad:*, ocde:*), combina resultados
 * de publicaciones y proyectos en secuencia.
 */
export async function handleListIdentifiers(oaiParams) {
  const pagination = extractPaginationParams(oaiParams);
  if (!pagination) throw badResumptionToken();

  const { set, from, until, metadataPrefix, pageSize } = pagination;

  // Multi-entity sets: facultad:* and ocde:* return both publicaciones and proyectos
  if (isMultiEntitySet(set)) {
    return handleMultiEntityIdentifiers(pagination);
  }

  // Single-entity flow (original behavior)
  const { cursor } = pagination;
  const entityType = resolveEntityType(set);
  const repo = getRepository(entityType);

  const completeListSize = await repo.countAll({ set, from, until });
  if (completeListSize === 0) throw noRecordsMatch();

  const rows = await repo.getIdentifiers({ set, from, until, cursor, limit: pageSize });
  if (rows.length === 0) throw noRecordsMatch();

  const headers = rows.map((row) => ({
    identifier: buildOaiIdentifier(entityType, row.id),
    datestamp: toDatestamp(row.updated_at),
    setSpec: getSetSpecFromRow(row, entityType),
  }));

  const resumption = buildResumptionToken({
    cursor, pageSize, completeListSize, set, from, until, metadataPrefix,
  });

  const result = { verb: 'ListIdentifiers', headers };
  if (resumption) result.resumptionToken = resumption;
  return result;
}

/**
 * Handles ListIdentifiers for multi-entity sets (facultad:*, ocde:*).
 * Returns publicaciones first, then proyectos, using a composite cursor:
 * { cursor, entity: 'publicacion'|'proyecto', pubTotal, proyTotal }
 */
async function handleMultiEntityIdentifiers(pagination) {
  const { set, from, until, metadataPrefix, pageSize } = pagination;

  // Decode composite cursor from resumptionToken if present
  let entity = 'publicacion';
  let cursor = 0;
  let pubTotal = null;
  let proyTotal = null;

  if (pagination.cursor > 0 && pagination._multiEntity) {
    // Resumption from multi-entity token
    entity = pagination._multiEntity.entity;
    cursor = pagination._multiEntity.cursor;
    pubTotal = pagination._multiEntity.pubTotal;
    proyTotal = pagination._multiEntity.proyTotal;
  }

  // Get totals (cache in token for subsequent pages)
  if (pubTotal === null || proyTotal === null) {
    [pubTotal, proyTotal] = await Promise.all([
      pubRepo.countAll({ set, from, until }),
      proyRepo.countAll({ set, from, until }),
    ]);
  }

  const completeListSize = pubTotal + proyTotal;
  if (completeListSize === 0) throw noRecordsMatch();

  const headers = [];
  let remaining = pageSize;
  let nextEntity = entity;
  let nextCursor = cursor;

  // Fill from publicaciones
  if (entity === 'publicacion' && remaining > 0 && cursor < pubTotal) {
    const pubRows = await pubRepo.getIdentifiers({ set, from, until, cursor, limit: remaining });
    for (const row of pubRows) {
      headers.push({
        identifier: buildOaiIdentifier('publicacion', row.id),
        datestamp: toDatestamp(row.updated_at),
        setSpec: getSetSpecFromRow(row, 'publicacion'),
      });
    }
    remaining -= pubRows.length;
    nextCursor = cursor + pubRows.length;

    // If we've exhausted publicaciones, switch to proyectos
    if (nextCursor >= pubTotal) {
      nextEntity = 'proyecto';
      nextCursor = 0;
    }
  }

  // Fill from proyectos (either continuing or after exhausting publicaciones)
  if ((entity === 'proyecto' || (entity === 'publicacion' && nextEntity === 'proyecto')) && remaining > 0) {
    const proyCursor = entity === 'proyecto' ? cursor : 0;
    const proyRows = await proyRepo.getIdentifiers({ set, from, until, cursor: proyCursor, limit: remaining });
    for (const row of proyRows) {
      headers.push({
        identifier: buildOaiIdentifier('proyecto', row.id),
        datestamp: toDatestamp(row.updated_at),
        setSpec: getSetSpecFromRow(row, 'proyecto'),
      });
    }
    nextEntity = 'proyecto';
    nextCursor = proyCursor + proyRows.length;
  }

  if (headers.length === 0) throw noRecordsMatch();

  // Build resumption token
  const globalOffset = (nextEntity === 'publicacion' ? nextCursor : pubTotal + nextCursor);
  let resumption = null;

  if (globalOffset < completeListSize) {
    // More pages to come
    const token = encodeToken({
      cursor: 1, // Non-zero to signal resumption
      set: set ?? null,
      from: from ?? null,
      until: until ?? null,
      metadataPrefix: metadataPrefix ?? 'oai_dc',
      _multiEntity: {
        entity: nextEntity,
        cursor: nextCursor,
        pubTotal,
        proyTotal,
      },
    });
    resumption = {
      token,
      completeListSize,
      cursor: globalOffset - pageSize < 0 ? 0 : globalOffset - pageSize,
    };
  } else if (globalOffset >= completeListSize && (pagination.cursor > 0 || pagination._multiEntity)) {
    // Last page of a paginated result
    resumption = {
      token: '',
      completeListSize,
      cursor: globalOffset - headers.length,
    };
  }

  const result = { verb: 'ListIdentifiers', headers };
  if (resumption) result.resumptionToken = resumption;
  return result;
}

/**
 * Determines if a set requires multi-entity handling.
 */
function isMultiEntitySet(set) {
  if (!set) return false;
  return set.startsWith('facultad:') || set.startsWith('ocde:');
}

/**
 * Determina el tipo de entidad a partir del set.
 * - "publicacion:articulo" -> "publicacion"
 * - "proyecto:PCONFIGI" -> "proyecto"
 * - "patente:invención" -> "patente"
 * - "publicacion" (parent) -> "publicacion"
 * - "proyecto" (parent) -> "proyecto"
 * - "patente" (parent) -> "patente"
 * - sin set -> "publicacion" (default)
 *
 * Note: facultad:* and ocde:* are handled by multi-entity logic, not here.
 */
function resolveEntityType(set) {
  if (!set) return 'publicacion';
  if (set === 'publicacion' || set.startsWith('publicacion:')) return 'publicacion';
  if (set === 'proyecto' || set.startsWith('proyecto:')) return 'proyecto';
  if (set === 'patente' || set.startsWith('patente:')) return 'patente';
  return 'publicacion';
}

function getRepository(entityType) {
  switch (entityType) {
    case 'proyecto': return proyRepo;
    case 'patente': return patRepo;
    default: return pubRepo;
  }
}

function getSetSpecFromRow(row, entityType) {
  const specs = [];
  switch (entityType) {
    case 'publicacion':
      specs.push(row.tipo_publicacion ? `publicacion:${row.tipo_publicacion}` : 'publicacion');
      break;
    case 'proyecto':
      specs.push(row.tipo_proyecto ? `proyecto:${row.tipo_proyecto}` : 'proyecto');
      if (row.facultad_id) specs.push(`facultad:${row.facultad_id}`);
      if (row.ocde_codigo) specs.push(`ocde:${row.ocde_codigo}`);
      break;
    case 'patente':
      specs.push(row.tipo ? `patente:${row.tipo}` : 'patente');
      break;
    default:
      specs.push(entityType);
  }
  return specs;
}

export { resolveEntityType, getRepository, isMultiEntitySet };
