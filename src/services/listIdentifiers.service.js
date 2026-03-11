import * as pubRepo from '../repositories/publicacion.repository.js';
import * as proyRepo from '../repositories/proyecto.repository.js';
import * as patRepo from '../repositories/patente.repository.js';
import * as personaRepo from '../repositories/persona.repository.js';
import * as orgunitRepo from '../repositories/orgunit.repository.js';
import { buildOaiIdentifier, toDatestamp } from '../utils/oaiIdentifier.js';
import { noRecordsMatch, badResumptionToken } from '../utils/errors.js';
import { extractPaginationParams, buildResumptionToken, encodeToken, decodeToken } from './resumptionToken.js';
import { getSetSpec } from './getRecord.service.js';

/**
 * Servicio para el verbo ListIdentifiers.
 * Soporta 5 entidades: publicacion, proyecto, patente, persona, orgunit.
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

  // Single-entity flow
  const { cursor } = pagination;
  const entityType = resolveEntityType(set);
  const repo = getRepository(entityType);

  const completeListSize = await repo.countAll({ set, from, until });
  if (completeListSize === 0) throw noRecordsMatch();

  const rows = await repo.getIdentifiers({ set, from, until, cursor, limit: pageSize });
  if (rows.length === 0) throw noRecordsMatch();

  const headers = rows.map((row) => ({
    identifier: entityType === 'orgunit'
      ? buildOaiIdentifier('orgunit', row.id)
      : buildOaiIdentifier(entityType, row.id),
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

  let entity = 'publicacion';
  let cursor = 0;
  let pubTotal = null;
  let proyTotal = null;

  if (pagination.cursor > 0 && pagination._multiEntity) {
    entity = pagination._multiEntity.entity;
    cursor = pagination._multiEntity.cursor;
    pubTotal = pagination._multiEntity.pubTotal;
    proyTotal = pagination._multiEntity.proyTotal;
  }

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

    if (nextCursor >= pubTotal) {
      nextEntity = 'proyecto';
      nextCursor = 0;
    }
  }

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

  const globalOffset = (nextEntity === 'publicacion' ? nextCursor : pubTotal + nextCursor);
  let resumption = null;

  if (globalOffset < completeListSize) {
    const token = encodeToken({
      cursor: 1,
      set: set ?? null,
      from: from ?? null,
      until: until ?? null,
      metadataPrefix: metadataPrefix ?? 'oai_cerif',
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
 * - "persona" o "persona:facultad-3" -> "persona"
 * - "orgunit" o "orgunit:facultad" -> "orgunit"
 * - sin set -> "publicacion" (default)
 *
 * Note: facultad:* and ocde:* are handled by multi-entity logic, not here.
 */
function resolveEntityType(set) {
  if (!set) return 'publicacion';
  if (set === 'publicacion' || set.startsWith('publicacion:')) return 'publicacion';
  if (set === 'proyecto' || set.startsWith('proyecto:')) return 'proyecto';
  if (set === 'patente' || set.startsWith('patente:')) return 'patente';
  if (set === 'persona' || set.startsWith('persona:')) return 'persona';
  if (set === 'orgunit' || set.startsWith('orgunit:')) return 'orgunit';
  return 'publicacion';
}

function getRepository(entityType) {
  switch (entityType) {
    case 'proyecto': return proyRepo;
    case 'patente': return patRepo;
    case 'persona': return personaRepo;
    case 'orgunit': return orgunitRepo;
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
    case 'persona':
      specs.push('persona');
      if (row.facultad_id) specs.push(`persona:facultad-${row.facultad_id}`);
      break;
    case 'orgunit':
      specs.push('orgunit');
      if (row.subtype) specs.push(`orgunit:${row.subtype}`);
      break;
    default:
      specs.push(entityType);
  }
  return specs;
}

export { resolveEntityType, getRepository, isMultiEntitySet };
