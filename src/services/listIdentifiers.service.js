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
 * Soporta 5 entidades: Publications, Projects, Patents, Persons, OrgUnits.
 *
 * Para sets multi-entidad (facultad:*, ocde:*), combina resultados
 * de Publications y Projects en secuencia.
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
    identifier: entityType === 'OrgUnits'
      ? buildOaiIdentifier('OrgUnits', row.id)
      : buildOaiIdentifier(entityType, row.id),
    datestamp: toDatestamp(row.updated_at),
    setSpec: getSetSpecFromRow(row, entityType),
  }));

  const resumption = buildResumptionToken({
    cursor, pageSize, completeListSize, set, from, until, metadataPrefix,
  });

  const result = { verb: 'ListIdentifiers', header: headers };
  if (resumption) result.resumptionToken = resumption;
  return result;
}

/**
 * Handles ListIdentifiers for multi-entity sets (facultad:*, ocde:*).
 * Returns Publications first, then Projects, using a composite cursor:
 * { cursor, entity: 'Publications'|'Projects', pubTotal, proyTotal }
 */
async function handleMultiEntityIdentifiers(pagination) {
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

  const headers = [];
  let remaining = pageSize;
  let nextEntity = entity;
  let nextCursor = cursor;

  if (entity === 'Publications' && remaining > 0 && cursor < pubTotal) {
    const pubRows = await pubRepo.getIdentifiers({ set, from, until, cursor, limit: remaining });
    for (const row of pubRows) {
      headers.push({
        identifier: buildOaiIdentifier('Publications', row.id),
        datestamp: toDatestamp(row.updated_at),
        setSpec: getSetSpecFromRow(row, 'Publications'),
      });
    }
    remaining -= pubRows.length;
    nextCursor = cursor + pubRows.length;

    if (nextCursor >= pubTotal) {
      nextEntity = 'Projects';
      nextCursor = 0;
    }
  }

  if ((entity === 'Projects' || (entity === 'Publications' && nextEntity === 'Projects')) && remaining > 0) {
    const proyCursor = entity === 'Projects' ? cursor : 0;
    const proyRows = await proyRepo.getIdentifiers({ set, from, until, cursor: proyCursor, limit: remaining });
    for (const row of proyRows) {
      headers.push({
        identifier: buildOaiIdentifier('Projects', row.id),
        datestamp: toDatestamp(row.updated_at),
        setSpec: getSetSpecFromRow(row, 'Projects'),
      });
    }
    nextEntity = 'Projects';
    nextCursor = proyCursor + proyRows.length;
  }

  if (headers.length === 0) throw noRecordsMatch();

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
      "@cursor": String(globalOffset - headers.length),
    };
  }

  const result = { verb: 'ListIdentifiers', header: headers };
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
 * - "publications:articulo" -> "Publications"
 * - "projects:PCONFIGI" -> "Projects"
 * - "patents:invención" -> "Patents"
 * - "persons" o "persons:facultad-3" -> "Persons"
 * - "orgunits" o "orgunits:facultad" -> "OrgUnits"
 * - sin set -> "Publications" (default)
 *
 * Note: facultad:* and ocde:* are handled by multi-entity logic, not here.
 */
function resolveEntityType(set) {
  if (!set) return 'Publications';
  if (set === 'publications' || set.startsWith('publications:')) return 'Publications';
  if (set === 'projects' || set.startsWith('projects:')) return 'Projects';
  if (set === 'patents' || set.startsWith('patents:')) return 'Patents';
  if (set === 'persons' || set.startsWith('persons:')) return 'Persons';
  if (set === 'orgunits' || set.startsWith('orgunits:')) return 'OrgUnits';
  return 'Publications';
}

function getRepository(entityType) {
  switch (entityType) {
    case 'Projects': return proyRepo;
    case 'Patents': return patRepo;
    case 'Persons': return personaRepo;
    case 'OrgUnits': return orgunitRepo;
    default: return pubRepo;
  }
}

function getSetSpecFromRow(row, entityType) {
  const specs = [];
  switch (entityType) {
    case 'Publications':
      specs.push(row.tipo_publicacion ? `publications:${row.tipo_publicacion}` : 'publications');
      break;
    case 'Projects':
      specs.push(row.tipo_proyecto ? `projects:${row.tipo_proyecto}` : 'projects');
      if (row.facultad_id) specs.push(`facultad:${row.facultad_id}`);
      if (row.ocde_codigo) specs.push(`ocde:${row.ocde_codigo}`);
      break;
    case 'Patents':
      specs.push(row.tipo ? `patents:${row.tipo}` : 'patents');
      break;
    case 'Persons':
      specs.push('persons');
      if (row.facultad_id) specs.push(`persons:facultad-${row.facultad_id}`);
      break;
    case 'OrgUnits':
      specs.push('orgunits');
      if (row.subtype) specs.push(`orgunits:${row.subtype}`);
      break;
    default:
      specs.push(entityType);
  }
  return specs;
}

export { resolveEntityType, getRepository, isMultiEntitySet };
