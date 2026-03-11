import { buildOaiIdentifier, buildOrgUnitIdentifier } from '../utils/oaiIdentifier.js';

/**
 * Servicio de formateo CERIF para PeruCRIS 1.1.
 *
 * Genera metadatos en estructura JSON siguiendo el perfil CERIF del XSD:
 * https://github.com/concytec-pe/Peru-CRIS/blob/main/directrices/schemas/perucris-cerif-profile.xsd
 *
 * Entidades soportadas:
 * - Publication (Publicacion)
 * - Project (Proyecto)
 * - Patent (Patente)
 * - Person (Persona / Usuario_investigador)
 * - OrgUnit (Unidad Organizativa: Facultad/Instituto/Grupo)
 */

// ─── Vocabularios controlados ──────────────────────────────────────────────

/**
 * Mapeo tipo_publicacion local → COAR Resource Type URI
 * https://vocabularies.coar-repositories.org/resource_types/
 */
const COAR_RESOURCE_TYPES = {
  articulo: { uri: 'http://purl.org/coar/resource_type/c_6501', label: 'journal article' },
  libro: { uri: 'http://purl.org/coar/resource_type/c_3734', label: 'book' },
  capitulo: { uri: 'http://purl.org/coar/resource_type/c_3248', label: 'book part' },
  tesis: { uri: 'http://purl.org/coar/resource_type/c_db06', label: 'doctoral thesis' },
  evento: { uri: 'http://purl.org/coar/resource_type/c_5794', label: 'conference paper' },
  resumen_evento: { uri: 'http://purl.org/coar/resource_type/c_8185', label: 'conference poster not in proceedings' },
  ensayo: { uri: 'http://purl.org/coar/resource_type/c_6947', label: 'article' },
  'revisión': { uri: 'http://purl.org/coar/resource_type/c_4317', label: 'review article' },
  revision: { uri: 'http://purl.org/coar/resource_type/c_4317', label: 'review article' },
};

/**
 * Mapeo tipo patente → COAR Patent Types
 */
const COAR_PATENT_TYPES = {
  'invención': { uri: 'http://purl.org/coar/resource_type/c_15cd', label: 'patent' },
  invencion: { uri: 'http://purl.org/coar/resource_type/c_15cd', label: 'patent' },
  'modelo de utilidad': { uri: 'http://purl.org/coar/resource_type/c_15cd', label: 'patent' },
  'diseño industrial': { uri: 'http://purl.org/coar/resource_type/c_15cd', label: 'patent' },
};

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
    // Tomar solo la parte de fecha "YYYY-MM-DD" (sin hora)
    const datePart = date.split(' ')[0].split('T')[0];
    const [year, month, day] = datePart.split('-');
    // "1998-00-00" -> "1998", "2021-05-00" -> "2021-05"
    if (month === '00') return year;
    if (day === '00') return `${year}-${month}`;
    return datePart;
  }
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return undefined;
}

// ─── PUBLICATION ───────────────────────────────────────────────────────────

/**
 * Formatea una publicacion al perfil CERIF Publication.
 */
export function formatPublicacionCERIF(pub) {
  const tipoLocal = (pub.tipo_publicacion ?? '').toLowerCase();
  const coarType = COAR_RESOURCE_TYPES[tipoLocal];

  // Autores CERIF con referencia a Persona
  const authors = (pub.autores ?? [])
    .filter((a) => !a.tipo || a.tipo.toLowerCase() === 'autor' || a.tipo.toLowerCase() === 'interno')
    .map((a) => {
      const apellidos = [a.apellido1, a.apellido2].filter(Boolean).join(' ');
      const displayName = apellidos && a.nombres
        ? `${apellidos}, ${a.nombres}`
        : apellidos || a.nombres || a.autor || '';

      const author = { DisplayName: displayName };

      // Referencia a persona si tiene investigador_id
      if (a.investigador_id) {
        author.Person = {
          '@id': buildOaiIdentifier('persona', a.investigador_id),
        };
      }

      // ORCID
      if (a.codigo_orcid) {
        author.Person = author.Person ?? {};
        author.Person.ORCID = `https://orcid.org/${a.codigo_orcid}`;
      }

      // Afiliacion
      if (a.filiacion) {
        author.Affiliation = {
          OrgUnit: {
            '@id': buildOaiIdentifier('orgunit', 'facultad-0'),
            Name: UNMSM.nombre,
            Identifier: { RORID: UNMSM.ror },
          },
        };
      }

      return author;
    });

  // Editores
  const editors = (pub.autores ?? [])
    .filter((a) => a.tipo && a.tipo.toLowerCase() !== 'autor' && a.tipo.toLowerCase() !== 'interno')
    .map((a) => {
      const apellidos = [a.apellido1, a.apellido2].filter(Boolean).join(' ');
      return {
        DisplayName: apellidos && a.nombres
          ? `${apellidos}, ${a.nombres}`
          : apellidos || a.nombres || a.autor || '',
        Role: a.tipo,
      };
    });

  // Palabras clave
  const keywords = cleanArray(pub.palabras_clave);

  // Subjects
  const subjects = [];
  if (pub.categoria_nombre) subjects.push(pub.categoria_nombre);
  if (pub.bases_indexadas?.length > 0) {
    for (const base of pub.bases_indexadas) subjects.push(`Indexado en: ${base}`);
  }

  // Identificadores
  const identifiers = {};
  if (pub.doi) identifiers.DOI = pub.doi;
  if (pub.isbn) identifiers.ISBN = pub.isbn;
  if (pub.issn) identifiers.ISSN = pub.issn;
  if (pub.issn_e) identifiers.eISSN = pub.issn_e;
  if (pub.uri) identifiers.Handle = pub.uri;

  // Proyectos vinculados (OriginatesFrom)
  const originatesFrom = (pub.proyectos_vinculados ?? []).map((pv) => {
    const project = {
      '@id': pv.proyecto_id ? buildOaiIdentifier('proyecto', pv.proyecto_id) : undefined,
      Title: pv.nombre_proyecto,
    };
    if (pv.codigo_proyecto) project.Identifier = { code: pv.codigo_proyecto };
    return { Project: project };
  });

  const result = {
    '@type': 'Publication',
    Type: coarType ? { '@uri': coarType.uri, '#text': coarType.label } : (pub.tipo_publicacion ?? undefined),
    Language: pub.idioma ?? 'es',
    Title: pub.titulo ?? undefined,
    Subtitle: undefined,
    PublicationDate: toISODate(pub.fecha_publicacion),
    Volume: pub.volumen ?? undefined,
    Issue: pub.edicion ?? undefined,
    StartPage: pub.pagina_inicial ?? undefined,
    EndPage: pub.pagina_final ?? undefined,
    Identifier: Object.keys(identifiers).length > 0 ? identifiers : undefined,
    URL: pub.url ?? undefined,
    Authors: authors.length > 0 ? { Author: authors } : undefined,
    Editors: editors.length > 0 ? { Editor: editors } : undefined,
    Publishers: pub.editorial ? { Publisher: { OrgUnit: { Name: pub.editorial } } } : undefined,
    License: undefined,
    Subject: subjects.length > 0 ? subjects : undefined,
    Keyword: keywords,
    Abstract: decodeBlob(pub.resumen),
    Status: pub.validado === 1 ? 'Published' : undefined,
    Access: pub.url ? 'http://purl.org/coar/access_right/c_abf2' : undefined,
    OriginatesFrom: originatesFrom.length > 0 ? originatesFrom : undefined,
    Source: buildSourceInfo(pub),
  };

  return removeUndefined(result);
}

function buildSourceInfo(pub) {
  const source = {};
  if (pub.publicacion_nombre) source.Title = pub.publicacion_nombre;
  else if (pub.revista?.nombre) source.Title = pub.revista.nombre;
  if (pub.revista?.casa) source.Publisher = pub.revista.casa;
  if (pub.issn) source.ISSN = pub.issn;
  if (pub.issn_e) source.eISSN = pub.issn_e;
  if (pub.revista?.pais) source.Country = pub.revista.pais;
  return Object.keys(source).length > 0 ? source : undefined;
}

// ─── PROJECT ──────────────────────────────────────────────────────────────

/**
 * Formatea un proyecto al perfil CERIF Project.
 */
export function formatProyectoCERIF(proy) {
  // Equipo: Responsable = PrincipalInvestigator, otros = Member
  const team = [];
  for (const integ of (proy.integrantes ?? [])) {
    const isPI = integ.rol_nombre?.toLowerCase().includes('responsable');
    const member = {
      Role: isPI ? 'PrincipalInvestigator' : 'Member',
      DisplayName: integ.nombre_completo,
    };

    if (integ.investigador_id) {
      member.Person = {
        '@id': buildOaiIdentifier('persona', integ.investigador_id),
      };
    }

    if (integ.codigo_orcid) {
      member.Person = member.Person ?? {};
      member.Person.ORCID = `https://orcid.org/${integ.codigo_orcid}`;
    }

    // Afiliacion: si tiene datos de facultad del proyecto
    if (proy.facultad_id) {
      member.Affiliation = {
        OrgUnit: {
          '@id': buildOaiIdentifier('orgunit', `facultad-${proy.facultad_id}`),
          Name: proy.facultad_nombre ?? undefined,
        },
      };
    }

    team.push(member);
  }

  // Financiamiento
  let funded;
  if (proy.monto_asignado || proy.entidad_financiadora) {
    funded = {
      By: proy.entidad_financiadora ? {
        OrgUnit: { Name: proy.entidad_financiadora },
      } : {
        OrgUnit: { Name: UNMSM.nombre, Identifier: { RORID: UNMSM.ror } },
      },
    };
    if (proy.monto_asignado) {
      funded.As = {
        Funding: {
          Amount: { '@currency': 'PEN', '#text': String(proy.monto_asignado) },
        },
      };
    }
  }

  // Subjects (OCDE + Linea investigacion)
  const subjects = [];
  if (proy.ocde_linea) subjects.push({ '@scheme': 'OCDE', '#text': proy.ocde_linea });
  if (proy.linea_investigacion) subjects.push(proy.linea_investigacion);

  // Keywords
  const keywords = proy.palabras_clave
    ? proy.palabras_clave.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  // Abstract (desde descripciones)
  const abstract = proy.descripciones?.resumen
    ? decodeBlob(proy.descripciones.resumen)
    : undefined;

  // Estado
  const statusMap = {
    1: 'Aprobado',
    2: 'En ejecucion',
    3: 'Finalizado',
    4: 'Cancelado',
  };

  // Relaciones a OrgUnits
  const orgUnits = [];
  if (proy.facultad_id) {
    orgUnits.push({
      '@id': buildOaiIdentifier('orgunit', `facultad-${proy.facultad_id}`),
      Name: proy.facultad_nombre,
      Type: 'Facultad',
    });
  }
  if (proy.instituto_id) {
    orgUnits.push({
      '@id': buildOaiIdentifier('orgunit', `instituto-${proy.instituto_id}`),
      Name: proy.instituto_nombre,
      Type: 'Instituto',
    });
  }
  if (proy.grupo_id) {
    orgUnits.push({
      '@id': buildOaiIdentifier('orgunit', `grupo-${proy.grupo_id}`),
      Name: proy.grupo_nombre,
      Type: 'Grupo de Investigacion',
    });
  }

  const result = {
    '@type': 'Project',
    Type: proy.tipo_proyecto ?? undefined,
    Acronym: proy.codigo_proyecto ?? undefined,
    Title: proy.titulo ?? undefined,
    Identifier: buildProyectoIdentifiers(proy),
    StartDate: toISODate(proy.fecha_inicio),
    EndDate: toISODate(proy.fecha_fin),
    Consortium: orgUnits.length > 0 ? { Coordinator: { OrgUnit: orgUnits[0] } } : undefined,
    Team: team.length > 0 ? { Member: team } : undefined,
    Funded: funded,
    Subject: subjects.length > 0 ? subjects : undefined,
    Keyword: cleanArray(keywords),
    Abstract: abstract,
    Status: statusMap[proy.estado] ?? (proy.estado >= 1 ? 'Activo' : undefined),
    ResearchLine: proy.linea_investigacion ?? undefined,
    OrgUnit: orgUnits.length > 0 ? orgUnits : undefined,
    Duration: proy.duracion_proyecto ? `${proy.duracion_proyecto} meses` : undefined,
    Period: proy.periodo ? String(proy.periodo) : undefined,
  };

  return removeUndefined(result);
}

function buildProyectoIdentifiers(proy) {
  const ids = {};
  if (proy.codigo_proyecto) ids.code = proy.codigo_proyecto;
  if (proy.resolucion_rectoral) ids.resolucionRectoral = proy.resolucion_rectoral;
  if (proy.uuid) ids.uuid = proy.uuid;
  return Object.keys(ids).length > 0 ? ids : undefined;
}

// ─── PATENT ───────────────────────────────────────────────────────────────

/**
 * Formatea una patente al perfil CERIF Patent.
 */
export function formatPatenteCERIF(pat) {
  const tipoLocal = (pat.tipo ?? '').toLowerCase();
  const coarType = COAR_PATENT_TYPES[tipoLocal] ?? COAR_PATENT_TYPES['invención'];

  // Inventores
  const inventors = (pat.autores ?? []).map((a) => {
    const apellidos = [a.apellido1, a.apellido2].filter(Boolean).join(' ');
    const displayName = apellidos && a.nombres
      ? `${apellidos}, ${a.nombres}`
      : apellidos || a.nombres || '';

    const inventor = { DisplayName: displayName };

    if (a.investigador_id) {
      inventor.Person = { '@id': buildOaiIdentifier('persona', a.investigador_id) };
    }
    if (a.codigo_orcid) {
      inventor.Person = inventor.Person ?? {};
      inventor.Person.ORCID = `https://orcid.org/${a.codigo_orcid}`;
    }
    if (a.condicion) inventor.Role = a.condicion;
    if (a.es_presentador) inventor.Presenter = true;

    return inventor;
  });

  // Titulares (Holders)
  const holders = (pat.entidades ?? []).map((e) => ({
    OrgUnit: { Name: e.titular },
  }));

  // Agregar titulares de campos directos si existen
  if (pat.titular1 && !holders.some((h) => h.OrgUnit.Name === pat.titular1)) {
    holders.push({ OrgUnit: { Name: pat.titular1 } });
  }
  if (pat.titular2 && !holders.some((h) => h.OrgUnit.Name === pat.titular2)) {
    holders.push({ OrgUnit: { Name: pat.titular2 } });
  }

  const result = {
    '@type': 'Patent',
    Type: coarType ? { '@uri': coarType.uri, '#text': coarType.label } : (pat.tipo ?? undefined),
    Language: undefined,
    Title: pat.titulo ?? undefined,
    Inventors: inventors.length > 0 ? { Author: inventors } : undefined,
    Holders: holders.length > 0 ? { Holder: holders } : undefined,
    PatentNumber: pat.nro_registro ?? undefined,
    FilingNumber: pat.nro_expediente ?? undefined,
    ApprovalDate: toISODate(pat.fecha_presentacion),
    CountryCode: undefined,
    Subject: pat.tipo ?? undefined,
    Abstract: pat.comentario ?? undefined,
    URL: pat.enlace ?? undefined,
    Office: pat.oficina_presentacion ?? undefined,
    Status: pat.estado >= 1 ? 'Registrada' : undefined,
  };

  return removeUndefined(result);
}

// ─── PERSON ───────────────────────────────────────────────────────────────

/**
 * Formatea una persona al perfil CERIF Person.
 */
export function formatPersonaCERIF(persona) {
  // Identificadores persistentes
  const identifiers = {};
  if (persona.codigo_orcid) identifiers.ORCID = `https://orcid.org/${persona.codigo_orcid}`;
  if (persona.scopus_id) identifiers.ScopusAuthorID = persona.scopus_id;
  if (persona.researcher_id) identifiers.ResearcherID = persona.researcher_id;
  if (persona.renacyt) identifiers.RENACYT = persona.renacyt;
  if (persona.doc_numero) identifiers.NationalID = persona.doc_numero;

  // Afiliacion
  let affiliation;
  if (persona.facultad_id) {
    affiliation = {
      OrgUnit: {
        '@id': buildOaiIdentifier('orgunit', `facultad-${persona.facultad_id}`),
        Name: persona.facultad_nombre ?? undefined,
        Type: 'Facultad',
        PartOf: {
          OrgUnit: {
            Name: UNMSM.nombre,
            Identifier: { RORID: UNMSM.ror },
          },
        },
      },
    };
  }

  // Contacto
  const electronicAddress = [];
  if (persona.email) electronicAddress.push({ '@type': 'email', '#text': persona.email });
  if (persona.telefono) electronicAddress.push({ '@type': 'phone', '#text': persona.telefono });

  const result = {
    '@type': 'Person',
    PersonName: {
      FamilyNames: [persona.apellido1, persona.apellido2].filter(Boolean).join(' ') || undefined,
      FirstNames: persona.nombres ?? undefined,
    },
    Identifier: Object.keys(identifiers).length > 0 ? identifiers : undefined,
    ElectronicAddress: electronicAddress.length > 0 ? electronicAddress : undefined,
    Affiliation: affiliation,
    Qualification: buildQualification(persona),
    RENACYTLevel: persona.renacyt_nivel ?? undefined,
    Statistics: {
      Publications: persona.pub_count ?? 0,
      Projects: persona.proy_count ?? 0,
      Patents: persona.pat_count ?? 0,
    },
  };

  return removeUndefined(result);
}

function buildQualification(persona) {
  const quals = [];
  if (persona.grado) quals.push(persona.grado);
  if (persona.titulo_profesional) quals.push(persona.titulo_profesional);
  if (persona.especialidad) quals.push(persona.especialidad);
  return quals.length > 0 ? quals : undefined;
}

// ─── ORGUNIT ──────────────────────────────────────────────────────────────

/**
 * Formatea una unidad organizativa al perfil CERIF OrgUnit.
 */
export function formatOrgUnitCERIF(unit) {
  // Tipo CERIF
  const typeMap = {
    'Facultad': 'Faculty',
    'Instituto': 'Institute',
    'Grupo de Investigacion': 'ResearchGroup',
  };

  // Identificadores
  const identifiers = {};
  // Solo UNMSM tiene ROR
  if (unit.subtype === 'facultad' || !unit.subtype) {
    identifiers.RORID = UNMSM.ror;
  }

  // PartOf (jerarquia padre)
  let partOf;
  if (unit.parent) {
    if (unit.parent.ror) {
      // Padre es UNMSM
      partOf = {
        OrgUnit: {
          Name: unit.parent.nombre,
          Identifier: { RORID: unit.parent.ror },
        },
      };
    } else if (unit.parent.id) {
      // Padre es otra unidad organizativa
      partOf = {
        OrgUnit: {
          '@id': buildOaiIdentifier('orgunit', unit.parent.id),
          Name: unit.parent.nombre,
          Type: unit.parent.tipo ?? undefined,
        },
      };
    }
  }

  // Contacto
  const electronicAddress = [];
  if (unit.email) electronicAddress.push({ '@type': 'email', '#text': unit.email });
  if (unit.telefono) electronicAddress.push({ '@type': 'phone', '#text': unit.telefono });
  if (unit.web) electronicAddress.push({ '@type': 'url', '#text': unit.web });

  // Direccion postal
  let postAddress;
  if (unit.direccion) {
    postAddress = {
      StreetAddress: unit.direccion,
      AddressCountry: 'PE',
    };
  }

  const result = {
    '@type': 'OrgUnit',
    Type: typeMap[unit.tipo] ?? unit.tipo ?? undefined,
    Name: unit.nombre ?? undefined,
    Acronym: unit.acronimo ?? undefined,
    Identifier: Object.keys(identifiers).length > 0 ? identifiers : undefined,
    ElectronicAddress: electronicAddress.length > 0 ? electronicAddress : undefined,
    PartOf: partOf,
    PostAddress: postAddress,
    Description: unit.presentacion ?? undefined,
    Objectives: unit.objetivos ?? undefined,
    Status: unit.estado >= 1 ? 'Active' : (unit.estado === 0 ? 'Inactive' : undefined),
  };

  return removeUndefined(result);
}

// ─── Utilidad: remover claves con valor undefined ──────────────────────────

function removeUndefined(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter((v) => v !== undefined);
  }
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = removeUndefined(value);
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  return obj;
}
