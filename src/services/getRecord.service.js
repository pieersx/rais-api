import * as pubRepo from '../repositories/publicacion.repository.js';
import * as proyRepo from '../repositories/proyecto.repository.js';
import * as patRepo from '../repositories/patente.repository.js';
import { parseOaiIdentifier, buildOaiIdentifier, toDatestamp } from '../utils/oaiIdentifier.js';
import { idDoesNotExist, cannotDisseminateFormat } from '../utils/errors.js';

/**
 * Servicio para el verbo GetRecord.
 * Soporta publicaciones, proyectos y patentes.
 *
 * @param {object} params - { identifier, metadataPrefix }
 */
export async function handleGetRecord({ identifier, metadataPrefix }) {
  const parsed = parseOaiIdentifier(identifier);
  if (!parsed) {
    throw idDoesNotExist(`The identifier "${identifier}" is not valid`);
  }

  const { type, id } = parsed;

  // Despachar segun tipo de entidad
  switch (type) {
    case 'publicacion': {
      const pub = await pubRepo.findById(id);
      if (!pub) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(pub, 'publicacion'),
          metadata: formatPublicacionDC(pub),
        },
      };
    }
    case 'proyecto': {
      const proy = await proyRepo.findById(id);
      if (!proy) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(proy, 'proyecto'),
          metadata: formatProyectoDC(proy),
        },
      };
    }
    case 'patente': {
      const pat = await patRepo.findById(id);
      if (!pat) throw idDoesNotExist(`No record found for identifier "${identifier}"`);
      return {
        verb: 'GetRecord',
        record: {
          header: buildHeader(pat, 'patente'),
          metadata: formatPatenteDC(pat),
        },
      };
    }
    default:
      throw idDoesNotExist(`Entity type "${type}" is not supported`);
  }
}

// ─── Headers ──────────────────────────────────────────────────────────────

function buildHeader(record, type) {
  return {
    identifier: buildOaiIdentifier(type, record.id),
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
    default:
      specs.push(type);
  }

  return specs;
}

// ─── Formateo Dublin Core: Publicacion ──────────────────────────────────

function formatPublicacionDC(pub) {
  return {
    'dc:title': pub.titulo ?? null,
    'dc:creator': formatCreators(pub.autores ?? []),
    'dc:subject': buildSubjects(pub),
    'dc:description': buildDescription(pub),
    'dc:publisher': pub.editorial ?? pub.universidad ?? null,
    'dc:contributor': buildContributors(pub),
    'dc:date': pub.fecha_publicacion ?? null,
    'dc:type': pub.tipo_publicacion ?? null,
    'dc:format': pub.formato ?? null,
    'dc:identifier': buildPubIdentifiers(pub),
    'dc:source': buildSource(pub),
    'dc:language': pub.idioma ?? null,
    'dc:relation': buildRelations(pub),
    'dc:coverage': buildCoverage(pub),
    'dc:rights': pub.url ? 'info:eu-repo/semantics/openAccess' : null,
  };
}

/**
 * Formatea creadores con ORCID y Scopus ID cuando estan disponibles.
 */
function formatCreators(autores) {
  return autores.map((a) => {
    const apellidos = [a.apellido1, a.apellido2].filter(Boolean).join(' ');
    const name = apellidos && a.nombres
      ? `${apellidos}, ${a.nombres}`
      : apellidos || a.nombres || a.autor || '';
    const creator = { name };
    if (a.codigo_orcid) creator.orcid = a.codigo_orcid;
    if (a.scopus_id) creator.scopusId = a.scopus_id;
    if (a.researcher_id) creator.researcherId = a.researcher_id;
    if (a.renacyt) creator.renacyt = a.renacyt;
    if (a.renacyt_nivel) creator.renacytNivel = a.renacyt_nivel;
    if (a.filiacion) creator.filiacion = true;
    return creator;
  });
}

/**
 * dc:subject = palabras clave + categoria + bases indexadas.
 */
function buildSubjects(pub) {
  const subjects = [];
  // Palabras clave reales (prioridad)
  if (pub.palabras_clave?.length > 0) {
    subjects.push(...pub.palabras_clave);
  }
  // Categoria como subject secundario
  if (pub.categoria_nombre) {
    subjects.push(pub.categoria_nombre);
  }
  return subjects.length > 0 ? subjects : null;
}

/**
 * dc:description = resumen + bases indexadas.
 */
function buildDescription(pub) {
  const parts = [];
  const resumen = pub.resumen ? decodeBlob(pub.resumen) : null;
  if (resumen) parts.push(resumen);
  if (pub.bases_indexadas?.length > 0) {
    parts.push(`Indexado en: ${pub.bases_indexadas.join(', ')}`);
  }
  return parts.length > 0 ? parts.join(' | ') : null;
}

/**
 * dc:contributor = autores con tipo != "Autor" (editores, asesores, etc.)
 */
function buildContributors(pub) {
  const contributors = (pub.autores ?? [])
    .filter((a) => a.tipo && a.tipo.toLowerCase() !== 'autor' && a.tipo.toLowerCase() !== 'interno')
    .map((a) => {
      const apellidos = [a.apellido1, a.apellido2].filter(Boolean).join(' ');
      const name = apellidos && a.nombres
        ? `${apellidos}, ${a.nombres}`
        : apellidos || a.nombres || a.autor || '';
      return `${name} (${a.tipo})`;
    });
  return contributors.length > 0 ? contributors : null;
}

/**
 * dc:source = nombre de la revista/publicacion + editorial + ISSN + volumen + paginas.
 * Enriched with Publicacion_revista data (casa, pais, cobertura) when available.
 */
function buildSource(pub) {
  const parts = [];
  if (pub.publicacion_nombre) parts.push(pub.publicacion_nombre);
  else if (pub.revista?.nombre) parts.push(pub.revista.nombre);
  else if (pub.source) parts.push(pub.source);
  if (pub.revista?.casa) parts.push(`Editorial: ${pub.revista.casa}`);
  if (pub.issn) parts.push(`ISSN: ${pub.issn}`);
  if (pub.issn_e) parts.push(`eISSN: ${pub.issn_e}`);
  if (pub.volumen) parts.push(`Vol. ${pub.volumen}`);
  if (pub.edicion) parts.push(`Ed. ${pub.edicion}`);
  if (pub.pagina_inicial && pub.pagina_final) {
    parts.push(`pp. ${pub.pagina_inicial}-${pub.pagina_final}`);
  }
  if (pub.revista?.cobertura) parts.push(`Cobertura: ${pub.revista.cobertura}`);
  if (pub.revista?.isi === 1) parts.push('ISI');
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * dc:relation = URL + proyectos vinculados.
 */
function buildRelations(pub) {
  const relations = [];
  if (pub.url) relations.push(pub.url);
  if (pub.uri) relations.push(pub.uri);
  if (pub.proyectos_vinculados?.length > 0) {
    for (const pv of pub.proyectos_vinculados) {
      const label = pv.codigo_proyecto
        ? `Proyecto: ${pv.codigo_proyecto} - ${pv.nombre_proyecto}`
        : `Proyecto: ${pv.nombre_proyecto}`;
      if (pv.entidad_financiadora) {
        relations.push(`${label} (${pv.entidad_financiadora})`);
      } else {
        relations.push(label);
      }
    }
  }
  return relations.length > 0 ? relations : null;
}

/**
 * dc:coverage = pais + lugar de publicacion + pais de revista.
 */
function buildCoverage(pub) {
  const parts = [];
  if (pub.pais) parts.push(pub.pais);
  if (pub.lugar_publicacion) parts.push(pub.lugar_publicacion);
  if (pub.ciudad) parts.push(pub.ciudad);
  // Fallback: pais de la revista vinculada
  if (pub.revista?.pais && !parts.includes(pub.revista.pais)) {
    parts.push(pub.revista.pais);
  }
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * dc:identifier = DOI, ISBN, ISSN, URI, URL, OAI id.
 */
function buildPubIdentifiers(pub) {
  const ids = [];
  if (pub.doi) ids.push(`doi:${pub.doi}`);
  if (pub.isbn) ids.push(`isbn:${pub.isbn}`);
  if (pub.issn) ids.push(`issn:${pub.issn}`);
  if (pub.issn_e) ids.push(`eissn:${pub.issn_e}`);
  if (pub.uri) ids.push(pub.uri);
  if (pub.url) ids.push(pub.url);
  ids.push(buildOaiIdentifier('publicacion', pub.id));
  return ids;
}

// ─── Formateo Dublin Core: Proyecto ─────────────────────────────────────

function formatProyectoDC(proy) {
  return {
    'dc:title': proy.titulo ?? null,
    'dc:creator': formatProyectoCreators(proy.integrantes ?? []),
    'dc:subject': buildProyectoSubjects(proy),
    'dc:description': buildProyectoDescription(proy),
    'dc:publisher': 'Universidad Nacional Mayor de San Marcos',
    'dc:contributor': buildProyectoContributors(proy.integrantes ?? []),
    'dc:date': proy.fecha_inicio ?? proy.periodo?.toString() ?? null,
    'dc:type': proy.tipo_proyecto ?? null,
    'dc:format': null,
    'dc:identifier': buildProyectoIdentifiers(proy),
    'dc:source': proy.entidad_financiadora ?? proy.facultad_nombre ?? null,
    'dc:language': 'es',
    'dc:relation': buildProyectoRelations(proy),
    'dc:coverage': proy.localizacion ?? null,
    'dc:rights': null,
  };
}

function formatProyectoCreators(integrantes) {
  return integrantes
    .filter((i) => i.rol_nombre?.toLowerCase().includes('responsable'))
    .map((i) => {
      const creator = { name: i.nombre_completo };
      if (i.codigo_orcid) creator.orcid = i.codigo_orcid;
      return creator;
    });
}

function buildProyectoSubjects(proy) {
  const subjects = [];
  if (proy.palabras_clave) {
    subjects.push(...proy.palabras_clave.split(',').map((s) => s.trim()).filter(Boolean));
  }
  if (proy.linea_investigacion) subjects.push(proy.linea_investigacion);
  if (proy.ocde_linea) subjects.push(`OCDE: ${proy.ocde_linea}`);
  return subjects.length > 0 ? subjects : null;
}

function buildProyectoDescription(proy) {
  const parts = [];
  if (proy.descripciones?.resumen) parts.push(proy.descripciones.resumen);
  if (proy.monto_asignado) parts.push(`Monto asignado: S/ ${proy.monto_asignado}`);
  if (proy.periodo) parts.push(`Periodo: ${proy.periodo}`);
  if (proy.duracion_proyecto) parts.push(`Duracion: ${proy.duracion_proyecto} meses`);
  return parts.length > 0 ? parts.join(' | ') : null;
}

function buildProyectoContributors(integrantes) {
  return integrantes
    .filter((i) => !i.rol_nombre?.toLowerCase().includes('responsable'))
    .map((i) => {
      const info = { name: i.nombre_completo, role: i.rol_nombre };
      if (i.codigo_orcid) info.orcid = i.codigo_orcid;
      return info;
    });
}

function buildProyectoIdentifiers(proy) {
  const ids = [];
  if (proy.codigo_proyecto) ids.push(`codigo:${proy.codigo_proyecto}`);
  if (proy.resolucion_rectoral) ids.push(`rr:${proy.resolucion_rectoral}`);
  ids.push(buildOaiIdentifier('proyecto', proy.id));
  return ids;
}

function buildProyectoRelations(proy) {
  const relations = [];
  if (proy.grupo_nombre) relations.push(`Grupo: ${proy.grupo_nombre}`);
  if (proy.facultad_nombre) relations.push(`Facultad: ${proy.facultad_nombre}`);
  if (proy.instituto_nombre) relations.push(`Instituto: ${proy.instituto_nombre}`);
  return relations.length > 0 ? relations : null;
}

// ─── Formateo Dublin Core: Patente ──────────────────────────────────────

function formatPatenteDC(pat) {
  return {
    'dc:title': pat.titulo ?? null,
    'dc:creator': (pat.autores ?? []).map((a) => {
      const apellidos = [a.apellido1, a.apellido2].filter(Boolean).join(' ');
      const name = apellidos && a.nombres
        ? `${apellidos}, ${a.nombres}`
        : apellidos || a.nombres || '';
      const creator = { name };
      if (a.codigo_orcid) creator.orcid = a.codigo_orcid;
      if (a.scopus_id) creator.scopusId = a.scopus_id;
      if (a.condicion) creator.condicion = a.condicion;
      if (a.es_presentador) creator.presentador = true;
      return creator;
    }),
    'dc:subject': pat.tipo ?? null,
    'dc:description': pat.comentario ?? null,
    'dc:publisher': (pat.entidades ?? []).map((e) => e.titular).join('; ') || null,
    'dc:contributor': null,
    'dc:date': pat.fecha_presentacion ?? null,
    'dc:type': `patente:${pat.tipo ?? 'invención'}`,
    'dc:format': null,
    'dc:identifier': buildPatenteIdentifiers(pat),
    'dc:source': pat.oficina_presentacion ?? null,
    'dc:language': null,
    'dc:relation': pat.enlace ?? null,
    'dc:coverage': null,
    'dc:rights': pat.titular1 ?? null,
  };
}

function buildPatenteIdentifiers(pat) {
  const ids = [];
  if (pat.nro_registro) ids.push(`registro:${pat.nro_registro}`);
  if (pat.nro_expediente) ids.push(`expediente:${pat.nro_expediente}`);
  if (pat.enlace) ids.push(pat.enlace);
  ids.push(buildOaiIdentifier('patente', pat.id));
  return ids;
}

// ─── Utilidades ─────────────────────────────────────────────────────────

function decodeBlob(blob) {
  if (!blob) return '';
  if (typeof blob === 'string') return blob;
  if (Buffer.isBuffer(blob)) return blob.toString('utf-8');
  return String(blob);
}

/**
 * Genera metadata segun tipo de entidad y prefix.
 * Usado por listRecords y listIdentifiers.
 */
export function formatMetadata(record, metadataPrefix, entityType = 'publicacion') {
  if (metadataPrefix !== 'oai_dc') {
    throw cannotDisseminateFormat(`Metadata prefix "${metadataPrefix}" is not supported`);
  }

  switch (entityType) {
    case 'publicacion':
      return formatPublicacionDC(record);
    case 'proyecto':
      return formatProyectoDC(record);
    case 'patente':
      return formatPatenteDC(record);
    default:
      throw cannotDisseminateFormat(`Entity type "${entityType}" is not supported`);
  }
}

export { buildHeader, getSetSpec };
