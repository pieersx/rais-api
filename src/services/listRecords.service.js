import * as pubRepo from '../repositories/publicacion.repository.js';
import * as proyRepo from '../repositories/proyecto.repository.js';
import { buildOaiIdentifier, toDatestamp } from '../utils/oaiIdentifier.js';
import { noRecordsMatch, badResumptionToken } from '../utils/errors.js';
import { extractPaginationParams, buildResumptionToken, encodeToken } from './resumptionToken.js';
import { formatMetadata, buildHeader } from './getRecord.service.js';
import { resolveEntityType, getRepository, isMultiEntitySet } from './listIdentifiers.service.js';

/**
 * Servicio para el verbo ListRecords.
 * Soporta 5 entidades: Publications, Projects, Patents, Persons, OrgUnits.
 *
 * Para sets multi-entidad (facultad:*, ocde:*), combina registros
 * de Publications y Projects en secuencia.
 */
export async function handleListRecords(oaiParams) {
  const pagination = extractPaginationParams(oaiParams);
  if (!pagination) throw badResumptionToken();

  const { set, from, until, metadataPrefix, pageSize } = pagination;

  // Multi-entity sets: facultad:* and ocde:* return both publicaciones and proyectos
  if (isMultiEntitySet(set)) {
    return handleMultiEntityRecords(pagination);
  }

  // Single-entity flow
  const { cursor } = pagination;
  const entityType = resolveEntityType(set);
  const repo = getRepository(entityType);

  const completeListSize = await repo.countAll({ set, from, until });
  if (completeListSize === 0) throw noRecordsMatch();

  const records = await repo.findAll({ set, from, until, cursor, limit: pageSize });
  if (records.length === 0) throw noRecordsMatch();

  const formattedRecords = records.map((record) => ({
    header: buildHeader(record, entityType),
    metadata: formatMetadata(record, metadataPrefix, entityType),
  }));

  const resumption = buildResumptionToken({
    cursor, pageSize, completeListSize, set, from, until, metadataPrefix,
  });

  const result = { verb: 'ListRecords', record: formattedRecords };
  if (resumption) result.resumptionToken = resumption;
  return result;
}

/**
 * Handles ListRecords for multi-entity sets (facultad:*, ocde:*).
 * Returns Publications first, then Projects, using a composite cursor.
 */
async function handleMultiEntityRecords(pagination) {
  const { set, from, until, metadataPrefix, pageSize } = pagination;

  let entity = 'Publications';
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

  const formattedRecords = [];
  let remaining = pageSize;
  let nextEntity = entity;
  let nextCursor = cursor;

  if (entity === 'Publications' && remaining > 0 && cursor < pubTotal) {
    const pubs = await pubRepo.findAll({ set, from, until, cursor, limit: remaining });
    for (const record of pubs) {
      formattedRecords.push({
        header: buildHeader(record, 'Publications'),
        metadata: formatMetadata(record, metadataPrefix, 'Publications'),
      });
    }
    remaining -= pubs.length;
    nextCursor = cursor + pubs.length;

    if (nextCursor >= pubTotal) {
      nextEntity = 'Projects';
      nextCursor = 0;
    }
  }

  if ((entity === 'Projects' || (entity === 'Publications' && nextEntity === 'Projects')) && remaining > 0) {
    const proyCursor = entity === 'Projects' ? cursor : 0;
    const proys = await proyRepo.findAll({ set, from, until, cursor: proyCursor, limit: remaining });
    for (const record of proys) {
      formattedRecords.push({
        header: buildHeader(record, 'Projects'),
        metadata: formatMetadata(record, metadataPrefix, 'Projects'),
      });
    }
    nextEntity = 'Projects';
    nextCursor = proyCursor + proys.length;
  }

  if (formattedRecords.length === 0) throw noRecordsMatch();

  const globalOffset = (nextEntity === 'Publications' ? nextCursor : pubTotal + nextCursor);
  let resumption = null;

  if (globalOffset < completeListSize) {
    const token = encodeToken({
      cursor: 1,
      set: set ?? null,
      from: from ?? null,
      until: until ?? null,
      metadataPrefix: metadataPrefix ?? 'perucris-cerif',
      _multiEntity: {
        entity: nextEntity,
        cursor: nextCursor,
        pubTotal,
        proyTotal,
      },
    });
    resumption = {
      "#text": token,
      "@completeListSize": String(completeListSize),
      "@cursor": String(globalOffset - pageSize < 0 ? 0 : globalOffset - pageSize),
    };
  } else if (globalOffset >= completeListSize && (pagination.cursor > 0 || pagination._multiEntity)) {
    resumption = {
      "#text": '',
      "@completeListSize": String(completeListSize),
      "@cursor": String(globalOffset - formattedRecords.length),
    };
  }

  const result = { verb: 'ListRecords', record: formattedRecords };
  if (resumption) result.resumptionToken = resumption;
  return result;
}
