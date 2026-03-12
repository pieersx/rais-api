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
 * Soporta 5 entidades: Publications, Projects, Patents, Persons, OrgUnits.
 * Formato unico: perucris-cerif (perfil CERIF PeruCRIS 1.1).
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
    case 'Publications': {
      const pub = await pubRepo.findById(parsed.id);
      if (!pub) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(pub, 'Publications'),
          metadata: formatPublicacionCERIF(pub),
        },
      };
    }

    case 'Projects': {
      const proy = await proyRepo.findById(parsed.id);
      if (!proy) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(proy, 'Projects'),
          metadata: formatProyectoCERIF(proy),
        },
      };
    }

    case 'Patents': {
      const pat = await patRepo.findById(parsed.id);
      if (!pat) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(pat, 'Patents'),
          metadata: formatPatenteCERIF(pat),
        },
      };
    }

    case 'Persons': {
      const persona = await personaRepo.findById(parsed.id);
      if (!persona) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(persona, 'Persons'),
          metadata: formatPersonaCERIF(persona),
        },
      };
    }

    case 'OrgUnits': {
      // parsed.id es compuesto: "facultad-3", "instituto-5", "grupo-10"
      const unit = await orgunitRepo.findById(parsed.id);
      if (!unit) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(unit, 'OrgUnits'),
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
  const identifier = type === 'OrgUnits'
    ? buildOaiIdentifier('OrgUnits', record.id)
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
    case 'Publications':
      specs.push(record.tipo_publicacion ? `publications:${record.tipo_publicacion}` : 'publications');
      break;
    case 'Projects':
      specs.push(record.tipo_proyecto ? `projects:${record.tipo_proyecto}` : 'projects');
      if (record.facultad_id) specs.push(`facultad:${record.facultad_id}`);
      if (record.ocde_codigo) specs.push(`ocde:${record.ocde_codigo}`);
      break;
    case 'Patents':
      specs.push(record.tipo ? `patents:${record.tipo}` : 'patents');
      break;
    case 'Persons':
      specs.push('persons');
      if (record.facultad_id) specs.push(`persons:facultad-${record.facultad_id}`);
      break;
    case 'OrgUnits':
      specs.push('orgunits');
      if (record.subtype) specs.push(`orgunits:${record.subtype}`);
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
export function formatMetadata(record, metadataPrefix, entityType = 'Publications') {
  if (metadataPrefix !== 'perucris-cerif') {
    throw cannotDisseminateFormat(`Metadata prefix "${metadataPrefix}" is not supported. Use "perucris-cerif".`);
  }

  switch (entityType) {
    case 'Publications':
      return formatPublicacionCERIF(record);
    case 'Projects':
      return formatProyectoCERIF(record);
    case 'Patents':
      return formatPatenteCERIF(record);
    case 'Persons':
      return formatPersonaCERIF(record);
    case 'OrgUnits':
      return formatOrgUnitCERIF(record);
    default:
      throw cannotDisseminateFormat(`Entity type "${entityType}" is not supported`);
  }
}

export { buildHeader, getSetSpec };
