import * as pubRepo from '../repositories/publicacion.repository.js';
import * as proyRepo from '../repositories/proyecto.repository.js';
import * as patRepo from '../repositories/patente.repository.js';
import * as personaRepo from '../repositories/persona.repository.js';
import * as orgunitRepo from '../repositories/orgunit.repository.js';
import { parseOaiIdentifier, buildOaiIdentifier, toDatestamp } from '../utils/oaiIdentifier.js';
import { idDoesNotExist, cannotDisseminateFormat } from '../utils/errors.js';
import {
  formatPublicacionCERIF,
  formatProyectoCERIF,
  formatPatenteCERIF,
  formatPersonaCERIF,
  formatOrgUnitCERIF,
} from './cerif.service.js';

/**
 * Servicio para el verbo GetRecord.
 * Soporta 5 entidades: publicacion, proyecto, patente, persona, orgunit.
 * Formato unico: oai_cerif (perfil CERIF PeruCRIS 1.1).
 *
 * @param {object} params - { identifier, metadataPrefix }
 */
export async function handleGetRecord({ identifier, metadataPrefix }) {
  const parsed = parseOaiIdentifier(identifier);
  if (!parsed) {
    throw idDoesNotExist(`The identifier "${identifier}" is not valid`);
  }

  const { type } = parsed;

  switch (type) {
    case 'publicacion': {
      const pub = await pubRepo.findById(parsed.id);
      if (!pub) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(pub, 'publicacion'),
          metadata: formatPublicacionCERIF(pub),
        },
      };
    }

    case 'proyecto': {
      const proy = await proyRepo.findById(parsed.id);
      if (!proy) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(proy, 'proyecto'),
          metadata: formatProyectoCERIF(proy),
        },
      };
    }

    case 'patente': {
      const pat = await patRepo.findById(parsed.id);
      if (!pat) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(pat, 'patente'),
          metadata: formatPatenteCERIF(pat),
        },
      };
    }

    case 'persona': {
      const persona = await personaRepo.findById(parsed.id);
      if (!persona) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(persona, 'persona'),
          metadata: formatPersonaCERIF(persona),
        },
      };
    }

    case 'orgunit': {
      // parsed.id es compuesto: "facultad-3", "instituto-5", "grupo-10"
      const unit = await orgunitRepo.findById(parsed.id);
      if (!unit) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(unit, 'orgunit'),
          metadata: formatOrgUnitCERIF(unit),
        },
      };
    }

    default:
      throw idDoesNotExist(`Entity type "${type}" is not supported`);
  }
}

// ─── Headers ──────────────────────────────────────────────────────────────

function buildHeader(record, type) {
  const identifier = type === 'orgunit'
    ? buildOaiIdentifier('orgunit', record.id)
    : buildOaiIdentifier(type, record.id);

  return {
    identifier,
    datestamp: toDatestamp(record.updated_at),
    setSpec: getSetSpec(record, type),
  };
}

function getSetSpec(record, type) {
  const specs = [];

  switch (type) {
    case 'publicacion':
      specs.push(record.tipo_publicacion ? `publicacion:${record.tipo_publicacion}` : 'publicacion');
      break;
    case 'proyecto':
      specs.push(record.tipo_proyecto ? `proyecto:${record.tipo_proyecto}` : 'proyecto');
      if (record.facultad_id) specs.push(`facultad:${record.facultad_id}`);
      if (record.ocde_codigo) specs.push(`ocde:${record.ocde_codigo}`);
      break;
    case 'patente':
      specs.push(record.tipo ? `patente:${record.tipo}` : 'patente');
      break;
    case 'persona':
      specs.push('persona');
      if (record.facultad_id) specs.push(`persona:facultad-${record.facultad_id}`);
      break;
    case 'orgunit':
      specs.push('orgunit');
      if (record.subtype) specs.push(`orgunit:${record.subtype}`);
      break;
    default:
      specs.push(type);
  }

  return specs;
}

// ─── Formateo de metadatos (usado por listRecords) ─────────────────────────

/**
 * Genera metadata CERIF segun tipo de entidad.
 * Usado por listRecords.service.js y listIdentifiers.service.js
 */
export function formatMetadata(record, metadataPrefix, entityType = 'publicacion') {
  if (metadataPrefix !== 'oai_cerif') {
    throw cannotDisseminateFormat(`Metadata prefix "${metadataPrefix}" is not supported. Use "oai_cerif".`);
  }

  switch (entityType) {
    case 'publicacion':
      return formatPublicacionCERIF(record);
    case 'proyecto':
      return formatProyectoCERIF(record);
    case 'patente':
      return formatPatenteCERIF(record);
    case 'persona':
      return formatPersonaCERIF(record);
    case 'orgunit':
      return formatOrgUnitCERIF(record);
    default:
      throw cannotDisseminateFormat(`Entity type "${entityType}" is not supported`);
  }
}

export { buildHeader, getSetSpec };
