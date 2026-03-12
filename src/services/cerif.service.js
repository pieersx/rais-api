import { buildOrgUnitIdentifier } from '../utils/oaiIdentifier.js';

/**
 * Servicio de formateo CERIF para PeruCRIS 1.1.
 *
 * Genera metadatos en estructura JSON siguiendo el perfil CERIF oficial
 * del documento "Guia para creacion de APIs con formato Json para Integracion PeruCRIS".
 *
 * Entidades soportadas:
 * - Publication (Publicacion)
 * - Project (Proyecto)
 * - Patent (Patente)
 * - Person (Persona / Usuario_investigador)
 * - OrgUnit (Unidad Organizativa: Facultad/Instituto/Grupo)
 *
 * Cada formatter retorna el objeto que se coloca en metadata.{Entity}
 * del record de ListRecords / GetRecord.
 */

// ─── Constantes ────────────────────────────────────────────────────────────

const CERIF_XMLNS = 'https://purl.org/pe-repo/perucris/cerif';

/**
 * Mapeo tipo_publicacion local → COAR Resource Type URI
 * https://vocabularies.coar-repositories.org/resource_types/
 */
const COAR_RESOURCE_TYPES = {
  articulo: 'http://purl.org/coar/resource_type/c_6501',
  libro: 'http://purl.org/coar/resource_type/c_3734',
  capitulo: 'http://purl.org/coar/resource_type/c_3248',
  tesis: 'http://purl.org/coar/resource_type/c_db06',
  'tesis-bachiller': 'http://purl.org/coar/resource_type/c_7a1f',
  'tesis-maestria': 'http://purl.org/coar/resource_type/c_bdcc',
  'tesis-doctorado': 'http://purl.org/coar/resource_type/c_db06',
  evento: 'http://purl.org/coar/resource_type/c_5794',
  resumen_evento: 'http://purl.org/coar/resource_type/c_8185',
  ensayo: 'http://purl.org/coar/resource_type/c_6947',
  'revisión': 'http://purl.org/coar/resource_type/c_4317',
  revision: 'http://purl.org/coar/resource_type/c_4317',
};

/**
 * Mapeo tipo patente → COAR Resource Type URI
 */
const COAR_PATENT_TYPE = 'http://purl.org/coar/resource_type/c_15cd';

/**
 * Constantes institucionales UNMSM
 */
const UNMSM = {
  nombre: 'Universidad Nacional Mayor de San Marcos',
  ror: 'https://ror.org/00rwzpz13',
  ruc: '20148092282',
  pais: 'PE',
};

// ─── Utilidades internas ───────────────────────────────────────────────────

function decodeBlob(blob) {
  if (!blob) return undefined;
  if (typeof blob === 'string') return blob || undefined;
  if (Buffer.isBuffer(blob)) return blob.toString('utf-8') || undefined;
  return String(blob) || undefined;
}

function cleanArray(arr) {
  if (!arr || !Array.isArray(arr)) return undefined;
  const filtered = arr.filter(Boolean);
  return filtered.length > 0 ? filtered : undefined;
}

function toISODate(date) {
  if (!date) return undefined;
  if (typeof date === 'string') {
    if (date.startsWith('0000')) return undefined;
    const datePart = date.split(' ')[0].split('T')[0];
    const [year, month, day] = datePart.split('-');
    if (month === '00') return year;
    if (day === '00') return `${year}-${month}`;
    return datePart;
  }
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return undefined;
}

function toISODateTime(date) {
  if (!date) return undefined;
  if (typeof date === 'string') {
    if (date.startsWith('0000')) return undefined;
    const d = new Date(date.includes('T') ? date : date.replace(' ', 'T') + 'Z');
    return !isNaN(d.getTime()) ? d.toISOString() : undefined;
  }
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date.toISOString();
  }
  return undefined;
}

/**
 * Remueve claves con valor undefined, null, o arrays/objetos vacios.
 */
function removeEmpty(obj) {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    const cleaned = obj.map(removeEmpty).filter((v) => v !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      const v = removeEmpty(value);
      if (v !== undefined) cleaned[key] = v;
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  return obj;
}

// ─── PUBLICATION (Section 7/9 del documento oficial) ───────────────────────

/**
 * Formatea una publicacion al perfil CERIF Publication oficial PeruCRIS.
 *
 * Estructura destino (dentro de metadata.Publication):
 * {
 *   "@id": "Publications/894518",
 *   "@xmlns": "https://purl.org/pe-repo/perucris/cerif",
 *   "type": { "scheme": "...", "value": "..." },
 *   "title": [{ "value": "..." }],
 *   "identifiers": [...],
 *   "publishedIn": { "publication": { ... } },
 *   "authors": [...],
 *   "editors": [...],
 *   "publishers": [...],
 *   "publicationDate": "...",
 *   "volume": "...", "issue": "...",
 *   "startPage": "...", "endPage": "...",
 *   "language": [...],
 *   "abstract": [{ "value": "..." }],
 *   "keywords": [{ "value": "..." }],
 *   "subjects": [{ "scheme": "...", "value": "..." }],
 *   "originatesFrom": [...],
 *   "lastModified": "..."
 * }
 */
export function formatPublicacionCERIF(pub) {
  const tipoLocal = (pub.tipo_publicacion ?? '').toLowerCase();
  const coarUri = COAR_RESOURCE_TYPES[tipoLocal];

  // --- Type ---
  const type = coarUri
    ? {
        scheme: 'https://www.openaire.eu/cerif-profile/vocab/COAR_Publication_Types',
        value: coarUri,
      }
    : undefined;

  // --- Title ---
  const title = pub.titulo ? [{ value: pub.titulo }] : undefined;

  // --- Identifiers ---
  const identifiers = [];
  if (pub.doi) identifiers.push({ type: 'DOI', value: pub.doi });
  if (pub.isbn) identifiers.push({ type: 'ISBN', value: pub.isbn });
  if (pub.issn) identifiers.push({ type: 'ISSN', value: pub.issn });
  if (pub.issn_e) identifiers.push({ type: 'ISSN', value: pub.issn_e });
  if (pub.uri) identifiers.push({ type: 'Handle', value: pub.uri });
  if (pub.url) identifiers.push({ type: 'URL', value: pub.url });

  // --- PublishedIn (revista/fuente) ---
  let publishedIn;
  const sourceName = pub.publicacion_nombre || pub.revista?.nombre;
  if (sourceName) {
    const sourcePublication = {
      title: [{ value: sourceName }],
    };
    const issns = [];
    if (pub.issn) issns.push(pub.issn);
    if (pub.issn_e) issns.push(pub.issn_e);
    if (issns.length > 0) sourcePublication.issn = issns;
    publishedIn = { publication: sourcePublication };
  }

  // --- Authors ---
  const authors = [];
  const editors = [];
  let authorOrder = 0;

  for (const a of (pub.autores ?? [])) {
    const isAutor = !a.tipo || a.tipo.toLowerCase() === 'autor' || a.tipo.toLowerCase() === 'interno';

    const apellidos = [a.apellido1, a.apellido2].filter(Boolean).join(' ');
    const fullName = apellidos && a.nombres
      ? `${apellidos}, ${a.nombres}`
      : apellidos || a.nombres || a.autor || '';

    const personObj = {};
    if (a.investigador_id) personObj.id = `Persons/${a.investigador_id}`;

    personObj.personName = {
      familyNames: [a.apellido1, a.apellido2].filter(Boolean).join(' ') || undefined,
      firstNames: a.nombres || undefined,
      fullName: fullName || undefined,
    };

    // Identificadores de la persona
    const personIdentifiers = [];
    if (a.codigo_orcid) {
      personIdentifiers.push({
        scheme: 'https://orcid.org',
        value: `https://orcid.org/${a.codigo_orcid}`,
      });
    }
    if (a.scopus_id) {
      personIdentifiers.push({
        scheme: 'https://www.scopus.com/authid',
        value: a.scopus_id,
      });
    }
    if (a.researcher_id) {
      personIdentifiers.push({
        scheme: 'https://www.webofscience.com/wos/author/rid',
        value: a.researcher_id,
      });
    }
    if (personIdentifiers.length > 0) personObj.identifiers = personIdentifiers;

    // Afiliacion
    const affiliations = [];
    if (a.filiacion || a.filiacion_unica) {
      affiliations.push({
        orgUnit: {
          name: UNMSM.nombre,
          identifiers: [
            { scheme: 'https://ror.org', value: UNMSM.ror },
          ],
        },
      });
    }

    if (isAutor) {
      authorOrder++;
      const authorEntry = {
        person: removeEmpty(personObj),
        order: a.orden ?? authorOrder,
      };
      if (affiliations.length > 0) authorEntry.affiliations = affiliations;
      authors.push(authorEntry);
    } else {
      const editorEntry = {
        person: removeEmpty(personObj),
        order: a.orden ?? undefined,
      };
      editors.push(editorEntry);
    }
  }

  // --- Publishers ---
  const publishers = [];
  if (pub.editorial) {
    publishers.push({
      orgUnit: { name: pub.editorial },
    });
  }

  // --- Language ---
  const language = pub.idioma ? [pub.idioma] : undefined;

  // --- Abstract ---
  const abstractText = decodeBlob(pub.resumen);
  const abstract = abstractText ? [{ value: abstractText }] : undefined;

  // --- Keywords ---
  const rawKeywords = cleanArray(pub.palabras_clave);
  const keywords = rawKeywords
    ? rawKeywords.map((k) => ({ value: k }))
    : undefined;

  // --- Subjects ---
  const subjects = [];
  if (pub.categoria_nombre) {
    subjects.push({ value: pub.categoria_nombre });
  }
  if (pub.bases_indexadas?.length > 0) {
    for (const base of pub.bases_indexadas) {
      subjects.push({ value: `Indexado en: ${base}` });
    }
  }

  // --- OriginatesFrom (proyectos vinculados) ---
  const originatesFrom = [];
  for (const pv of (pub.proyectos_vinculados ?? [])) {
    const project = {};
    if (pv.proyecto_id) project.id = `Projects/${pv.proyecto_id}`;
    if (pv.nombre_proyecto) project.title = [{ value: pv.nombre_proyecto }];
    if (pv.codigo_proyecto) {
      project.identifiers = [{
        scheme: 'https://w3id.org/cerif/vocab/IdentifierTypes#ProjectReference',
        value: pv.codigo_proyecto,
      }];
    }
    originatesFrom.push({ project });
  }

  // --- Armar resultado ---
  const result = {
    Publication: {
      '@id': `Publications/${pub.id}`,
      '@xmlns': CERIF_XMLNS,
      type,
      title,
      identifiers: identifiers.length > 0 ? identifiers : undefined,
      publishedIn,
      authors: authors.length > 0 ? authors : undefined,
      editors: editors.length > 0 ? editors : undefined,
      publishers: publishers.length > 0 ? publishers : undefined,
      publicationDate: toISODate(pub.fecha_publicacion),
      volume: pub.volumen ?? undefined,
      issue: pub.edicion ?? undefined,
      startPage: pub.pagina_inicial ?? undefined,
      endPage: pub.pagina_final ?? undefined,
      language,
      abstract,
      keywords,
      subjects: subjects.length > 0 ? subjects : undefined,
      originatesFrom: originatesFrom.length > 0 ? originatesFrom : undefined,
      lastModified: toISODateTime(pub.updated_at),
    },
  };

  return removeEmpty(result);
}

// ─── PROJECT (Section 13 del documento oficial) ────────────────────────────

/**
 * Formatea un proyecto al perfil CERIF Project oficial PeruCRIS.
 *
 * Estructura destino (dentro de metadata.Project):
 * {
 *   "@id": "Projects/358478",
 *   "@xmlns": "...",
 *   "title": [{ "lang": "es", "value": "..." }],
 *   "acronym": "...",
 *   "identifiers": [{ "scheme": "...", "value": "..." }],
 *   "startDate": "...", "endDate": "...",
 *   "status": "completed",
 *   "abstract": [{ "lang": "es", "value": "..." }],
 *   "keywords": [{ "lang": "es", "value": "..." }],
 *   "subjects": [{ "scheme": "...", "value": "..." }],
 *   "participants": [{ "person": {...}, "role": "..." }, { "orgUnit": {...}, "role": "..." }],
 *   "fundings": [...],
 *   "outputs": { "publications": [...], "patents": [], "products": [] },
 *   "url": "...",
 *   "lastModified": "..."
 * }
 */
export function formatProyectoCERIF(proy) {
  // --- Title ---
  const title = proy.titulo ? [{ lang: 'es', value: proy.titulo }] : undefined;

  // --- Acronym ---
  const acronym = proy.codigo_proyecto ?? undefined;

  // --- Identifiers ---
  const identifiers = [];
  if (proy.codigo_proyecto) {
    identifiers.push({
      scheme: 'https://w3id.org/cerif/vocab/IdentifierTypes#ProjectReference',
      value: proy.codigo_proyecto,
    });
  }
  if (proy.resolucion_rectoral) {
    identifiers.push({
      scheme: 'https://purl.org/pe-repo/concytec/terminos#resolucionRectoral',
      value: proy.resolucion_rectoral,
    });
  }
  if (proy.uuid) {
    identifiers.push({
      scheme: 'https://w3id.org/cerif/vocab/IdentifierTypes#UUID',
      value: proy.uuid,
    });
  }

  // --- Status ---
  const statusMap = {
    1: 'approved',
    2: 'in-progress',
    3: 'completed',
    4: 'cancelled',
  };
  const status = statusMap[proy.estado] ?? undefined;

  // --- Abstract ---
  const abstractText = proy.descripciones?.resumen
    ? decodeBlob(proy.descripciones.resumen)
    : undefined;
  const abstract = abstractText ? [{ lang: 'es', value: abstractText }] : undefined;

  // --- Keywords ---
  const rawKeywords = proy.palabras_clave
    ? proy.palabras_clave.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const keywords = rawKeywords.length > 0
    ? rawKeywords.map((k) => ({ lang: 'es', value: k }))
    : undefined;

  // --- Subjects (OCDE) ---
  const subjects = [];
  if (proy.ocde_linea) {
    subjects.push({
      scheme: 'https://purl.org/pe-repo/ocde/ford',
      value: proy.ocde_linea,
    });
  }
  if (proy.linea_investigacion) {
    subjects.push({
      scheme: 'https://purl.org/pe-repo/concytec/terminos#lineaInvestigacion',
      value: proy.linea_investigacion,
    });
  }

  // --- Participants (personas + orgUnits) ---
  const participants = [];

  for (const integ of (proy.integrantes ?? [])) {
    const isPI = integ.rol_nombre?.toLowerCase().includes('responsable');
    const role = isPI ? 'Investigador principal' : (integ.rol_nombre ?? 'Investigador');

    const personObj = {};
    if (integ.investigador_id) personObj.id = `Persons/${integ.investigador_id}`;
    if (integ.nombre_completo) personObj.name = integ.nombre_completo;

    const personIdentifiers = [];
    if (integ.codigo_orcid) {
      personIdentifiers.push({
        scheme: 'https://orcid.org',
        value: `https://orcid.org/${integ.codigo_orcid}`,
      });
    }
    if (integ.scopus_id) {
      personIdentifiers.push({
        scheme: 'https://www.scopus.com/authid',
        value: integ.scopus_id,
      });
    }
    if (personIdentifiers.length > 0) personObj.identifiers = personIdentifiers;

    participants.push({
      person: removeEmpty(personObj),
      role,
    });
  }

  // OrgUnits como participantes
  if (proy.facultad_id) {
    participants.push({
      orgUnit: {
        id: `OrgUnits/facultad-${proy.facultad_id}`,
        name: proy.facultad_nombre ?? undefined,
      },
      role: 'Institucion ejecutora',
    });
  }
  if (proy.instituto_id) {
    participants.push({
      orgUnit: {
        id: `OrgUnits/instituto-${proy.instituto_id}`,
        name: proy.instituto_nombre ?? undefined,
      },
      role: 'Instituto ejecutor',
    });
  }
  if (proy.grupo_id) {
    participants.push({
      orgUnit: {
        id: `OrgUnits/grupo-${proy.grupo_id}`,
        name: proy.grupo_nombre ?? undefined,
      },
      role: 'Grupo de investigacion',
    });
  }

  // --- Fundings ---
  const fundings = [];
  if (proy.entidad_financiadora || proy.monto_asignado) {
    const funding = {};
    if (proy.entidad_financiadora) {
      funding.funder = {
        orgUnit: { name: proy.entidad_financiadora },
      };
    }
    if (proy.monto_asignado) {
      funding.amount = {
        currency: 'PEN',
        value: String(proy.monto_asignado),
      };
    }
    fundings.push(funding);
  }

  // --- Armar resultado ---
  const result = {
    Project: {
      '@id': `Projects/${proy.id}`,
      '@xmlns': CERIF_XMLNS,
      title,
      acronym,
      identifiers: identifiers.length > 0 ? identifiers : undefined,
      startDate: toISODate(proy.fecha_inicio),
      endDate: toISODate(proy.fecha_fin),
      status,
      abstract,
      keywords,
      subjects: subjects.length > 0 ? subjects : undefined,
      participants: participants.length > 0 ? participants : undefined,
      fundings: fundings.length > 0 ? fundings : undefined,
      outputs: { publications: [], patents: [], products: [] },
      lastModified: toISODateTime(proy.updated_at),
    },
  };

  return removeEmpty(result);
}

// ─── PATENT (Section 11 del documento oficial) ─────────────────────────────

/**
 * Formatea una patente al perfil CERIF Patent oficial PeruCRIS.
 *
 * Estructura destino (dentro de metadata.Patent):
 * {
 *   "@id": "Patents/284788",
 *   "@xmlns": "...",
 *   "type": "http://purl.org/coar/resource_type/9DKX-KSAF",
 *   "patentNumber": "000056-2010",
 *   "title": [{ "value": "..." }],
 *   "inventors": [{ "person": { "id": "...", "name": "...", "identifiers": [...] } }],
 *   "holders": [{ "orgUnit": { "id": "...", "name": "...", "identifiers": [...] } }],
 *   "issuer": { "orgUnit": { ... } },
 *   "registrationDate": "...",
 *   "approvalDate": "...",
 *   "countryCode": "PE",
 *   "language": [...],
 *   "abstract": [{ "value": "..." }],
 *   "subjects": [...],
 *   "keywords": [...],
 *   "url": "...",
 *   "originatesFrom": [...],
 *   "lastModified": "..."
 * }
 */
export function formatPatenteCERIF(pat) {
  // --- Title ---
  const title = pat.titulo ? [{ value: pat.titulo }] : undefined;

  // --- Type (COAR patent) ---
  const type = COAR_PATENT_TYPE;

  // --- Inventors ---
  const inventors = [];
  for (const a of (pat.autores ?? [])) {
    const apellidos = [a.apellido1, a.apellido2].filter(Boolean).join(' ');
    const fullName = apellidos && a.nombres
      ? `${apellidos}, ${a.nombres}`
      : apellidos || a.nombres || '';

    const personObj = {};
    if (a.investigador_id) personObj.id = `Persons/${a.investigador_id}`;
    personObj.name = fullName || undefined;

    const personIdentifiers = [];
    if (a.codigo_orcid) {
      personIdentifiers.push({
        scheme: 'https://orcid.org',
        value: `https://orcid.org/${a.codigo_orcid}`,
      });
    }
    if (a.scopus_id) {
      personIdentifiers.push({
        scheme: 'https://www.scopus.com/authid',
        value: a.scopus_id,
      });
    }
    if (personIdentifiers.length > 0) personObj.identifiers = personIdentifiers;

    inventors.push({ person: removeEmpty(personObj) });
  }

  // --- Holders ---
  const holders = [];
  const seenHolders = new Set();

  for (const e of (pat.entidades ?? [])) {
    if (e.titular && !seenHolders.has(e.titular)) {
      seenHolders.add(e.titular);
      holders.push({
        orgUnit: { name: e.titular },
      });
    }
  }
  if (pat.titular1 && !seenHolders.has(pat.titular1)) {
    seenHolders.add(pat.titular1);
    holders.push({ orgUnit: { name: pat.titular1 } });
  }
  if (pat.titular2 && !seenHolders.has(pat.titular2)) {
    seenHolders.add(pat.titular2);
    holders.push({ orgUnit: { name: pat.titular2 } });
  }

  // --- Issuer (oficina de patentes) ---
  const issuer = pat.oficina_presentacion
    ? { orgUnit: { name: pat.oficina_presentacion } }
    : undefined;

  // --- Abstract ---
  const abstract = pat.comentario ? [{ value: pat.comentario }] : undefined;

  // --- Armar resultado ---
  const result = {
    Patent: {
      '@id': `Patents/${pat.id}`,
      '@xmlns': CERIF_XMLNS,
      type,
      patentNumber: pat.nro_registro ?? undefined,
      title,
      inventors: inventors.length > 0 ? inventors : undefined,
      holders: holders.length > 0 ? holders : undefined,
      issuer,
      registrationDate: toISODate(pat.fecha_presentacion),
      countryCode: 'PE',
      language: ['es'],
      abstract,
      url: pat.enlace ?? undefined,
      lastModified: toISODateTime(pat.updated_at),
    },
  };

  return removeEmpty(result);
}

// ─── PERSON (Section 7 del documento oficial) ──────────────────────────────

/**
 * Formatea una persona al perfil CERIF Person oficial PeruCRIS.
 *
 * Estructura destino (dentro de metadata.Person):
 * {
 *   "@id": "Persons/28521427",
 *   "@xmlns": "...",
 *   "personName": { "familyNames": "...", "firstNames": "...", "fullName": "..." },
 *   "identifiers": [{ "scheme": "...", "value": "..." }],
 *   "emails": ["..."],
 *   "affiliations": [{ "orgUnit": { "id": "...", "name": "..." }, "role": "...", "startDate": "..." }],
 *   "keywords": [{ "value": "..." }],
 *   "lastModified": "..."
 * }
 */
export function formatPersonaCERIF(persona) {
  // --- PersonName ---
  const familyNames = [persona.apellido1, persona.apellido2].filter(Boolean).join(' ') || undefined;
  const firstNames = persona.nombres ?? undefined;
  const fullName = familyNames && firstNames
    ? `${familyNames}, ${firstNames}`
    : familyNames || firstNames || undefined;

  const personName = { familyNames, firstNames, fullName };

  // --- Identifiers ---
  const identifiers = [];
  if (persona.doc_numero) {
    const scheme = persona.doc_tipo === 'CE'
      ? 'http://purl.org/pe-repo/concytec/terminos#ce'
      : 'http://purl.org/pe-repo/concytec/terminos#dni';
    identifiers.push({ scheme, value: persona.doc_numero });
  }
  if (persona.codigo_orcid) {
    identifiers.push({
      scheme: 'https://orcid.org',
      value: `https://orcid.org/${persona.codigo_orcid}`,
    });
  }
  if (persona.scopus_id) {
    identifiers.push({
      scheme: 'https://www.scopus.com/authid',
      value: persona.scopus_id,
    });
  }
  if (persona.researcher_id) {
    identifiers.push({
      scheme: 'https://www.webofscience.com/wos/author/rid',
      value: persona.researcher_id,
    });
  }
  if (persona.renacyt) {
    identifiers.push({
      scheme: 'http://purl.org/pe-repo/concytec/terminos#renacyt',
      value: persona.renacyt,
    });
  }

  // --- Emails ---
  const emails = persona.email ? [persona.email] : undefined;

  // --- Affiliations ---
  const affiliations = [];
  if (persona.facultad_id) {
    affiliations.push({
      orgUnit: {
        id: `OrgUnits/facultad-${persona.facultad_id}`,
        name: persona.facultad_nombre ?? undefined,
      },
      role: 'Investigador',
    });
  }

  // --- Keywords (qualifications como keywords) ---
  const keywords = [];
  if (persona.grado) keywords.push({ value: persona.grado });
  if (persona.titulo_profesional) keywords.push({ value: persona.titulo_profesional });
  if (persona.especialidad) keywords.push({ value: persona.especialidad });
  if (persona.renacyt_nivel) keywords.push({ value: `RENACYT: ${persona.renacyt_nivel}` });

  // --- Armar resultado ---
  const result = {
    Person: {
      '@id': `Persons/${persona.id}`,
      '@xmlns': CERIF_XMLNS,
      personName: removeEmpty(personName),
      identifiers: identifiers.length > 0 ? identifiers : undefined,
      emails,
      affiliations: affiliations.length > 0 ? affiliations : undefined,
      keywords: keywords.length > 0 ? keywords : undefined,
      lastModified: toISODateTime(persona.updated_at),
    },
  };

  return removeEmpty(result);
}

// ─── ORGUNIT (Section 8 del documento oficial) ─────────────────────────────

/**
 * Formatea una unidad organizativa al perfil CERIF OrgUnit oficial PeruCRIS.
 *
 * Estructura destino (dentro de metadata.OrgUnit):
 * {
 *   "@id": "OrgUnits/38498322",
 *   "@xmlns": "...",
 *   "acronym": "...",
 *   "name": [{ "value": "..." }],
 *   "type": "Institucion principal",
 *   "identifiers": [{ "scheme": "...", "value": "..." }],
 *   "countryCode": "PE",
 *   "address": { "street": "...", "city": "...", "region": "...", "postalCode": "..." },
 *   "parentOrgUnit": { "id": "OrgUnits/..." },
 *   "websites": [{ "type": "homepage", "url": "..." }],
 *   "classifications": [{ "scheme": "...", "value": "..." }],
 *   "lastModified": "..."
 * }
 */
export function formatOrgUnitCERIF(unit) {
  // --- Type ---
  const typeMap = {
    'Facultad': 'Facultad',
    'Instituto': 'Instituto de investigacion',
    'Grupo de Investigacion': 'Grupo de investigacion',
  };
  const type = typeMap[unit.tipo] ?? unit.tipo ?? undefined;

  // --- Name ---
  const name = unit.nombre ? [{ value: unit.nombre }] : undefined;

  // --- Acronym ---
  const acronym = unit.acronimo ?? undefined;

  // --- Identifiers ---
  const identifiers = [];
  if (unit.subtype === 'facultad' || !unit.subtype) {
    identifiers.push({
      scheme: 'https://purl.org/pe-repo/concytec/terminos#ruc',
      value: UNMSM.ruc,
    });
    identifiers.push({
      scheme: 'https://ror.org',
      value: UNMSM.ror,
    });
  }

  // --- CountryCode ---
  const countryCode = 'PE';

  // --- Address ---
  const address = unit.direccion
    ? { street: unit.direccion }
    : undefined;

  // --- ParentOrgUnit ---
  let parentOrgUnit;
  if (unit.parent) {
    if (unit.parent.id) {
      // Padre es otra orgUnit (facultad)
      parentOrgUnit = {
        id: `OrgUnits/${unit.parent.id}`,
        name: unit.parent.nombre ?? undefined,
      };
    } else if (unit.parent.ror) {
      // Padre es UNMSM (raiz)
      parentOrgUnit = {
        name: unit.parent.nombre,
        identifiers: [
          { scheme: 'https://ror.org', value: unit.parent.ror },
          { scheme: 'https://purl.org/pe-repo/concytec/terminos#ruc', value: unit.parent.ruc },
        ],
      };
    }
  }

  // --- Websites ---
  const websites = [];
  if (unit.web) {
    websites.push({ type: 'homepage', url: unit.web });
  }

  // --- Classifications ---
  const classifications = [];
  if (unit.tipo) {
    classifications.push({
      scheme: 'https://purl.org/pe-repo/concytec/terminos#tipoOrgUnit',
      value: type,
    });
  }

  // --- Armar resultado ---
  const result = {
    OrgUnit: {
      '@id': `OrgUnits/${unit.id}`,
      '@xmlns': CERIF_XMLNS,
      acronym,
      name,
      type,
      identifiers: identifiers.length > 0 ? identifiers : undefined,
      countryCode,
      address,
      parentOrgUnit: removeEmpty(parentOrgUnit),
      websites: websites.length > 0 ? websites : undefined,
      classifications: classifications.length > 0 ? classifications : undefined,
      lastModified: toISODateTime(unit.updated_at),
    },
  };

  return removeEmpty(result);
}
