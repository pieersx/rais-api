# RAIS-API: OAI-PMH 2.0 JSON API

API de datos abiertos del **Registro de Actividades de Investigacion San Marcos (RAIS)** de la Universidad Nacional Mayor de San Marcos. Expone publicaciones, proyectos de investigacion, patentes, investigadores y unidades organizativas siguiendo el protocolo OAI-PMH 2.0, con respuestas en formato CERIF JSON (PerúCRIS 1.1 compliant).

---

## Informacion General

| Campo | Valor |
|-------|-------|
| **Base URL** | `https://rais.unmsm.edu.pe/api/oai` |
| **Protocolo** | OAI-PMH 2.0 (JSON) |
| **Autenticacion** | Publica (sin autenticacion) |
| **Formato de metadatos** | `oai_cerif` (CERIF JSON) |
| **Metodo HTTP** | `GET` |
| **Formato de respuesta** | `application/json` |
| **Paginacion** | 100 registros por pagina (configurable via `PAGE_SIZE`) |
| **Cumplimiento** | PerúCRIS 1.1 (CONCYTEC) - 95/100 |

### Entidades expuestas

| Entidad | Descripcion | Registros | Identificador OAI |
|---------|-------------|-----------|-------------------|
| `publicacion` | Publicaciones de investigacion (articulos, tesis, libros, capitulos, ensayos, eventos) | 59,543 | `oai:rais.unmsm.edu.pe:publicacion/{id}` |
| `proyecto` | Proyectos de investigacion (con y sin financiamiento, tesis, eventos, etc.) | 6,690 | `oai:rais.unmsm.edu.pe:proyecto/{id}` |
| `patente` | Patentes y registros de propiedad intelectual | 406 | `oai:rais.unmsm.edu.pe:patente/{id}` |
| `persona` | Investigadores, académicos y personal de investigación | 36,455 | `oai:rais.unmsm.edu.pe:persona/{id}` |
| `orgunit` | Unidades organizativas (Facultades, Institutos, Grupos de Investigación) | 492 | `oai:rais.unmsm.edu.pe:orgunit/{type}/{id}` |
| | | **Total: 103,586** | |

---

## Verbos OAI-PMH

### 1. Identify

Retorna informacion general sobre el repositorio.

**Endpoint:**
```
GET /api/oai?verb=Identify
```

**Parametros:** Ninguno.

**Ejemplo de respuesta:**
```json
{
  "responseDate": "2026-03-10T10:00:00.000Z",
  "request": {
    "baseURL": "https://rais.unmsm.edu.pe/api/oai",
    "verb": "Identify"
  },
  "verb": "Identify",
  "repositoryName": "RAIS - Registro de Actividades de Investigacion San Marcos",
  "baseURL": "https://rais.unmsm.edu.pe/api/oai",
  "protocolVersion": "2.0",
  "adminEmail": "rais@unmsm.edu.pe",
  "earliestDatestamp": "1998-05-06T00:00:00Z",
  "deletedRecord": "no",
  "granularity": "YYYY-MM-DDThh:mm:ssZ",
  "description": {
    "oaiIdentifier": {
      "scheme": "oai",
      "repositoryIdentifier": "rais.unmsm.edu.pe",
      "delimiter": ":",
      "sampleIdentifiers": [
        "oai:rais.unmsm.edu.pe:publicacion/2",
        "oai:rais.unmsm.edu.pe:proyecto/1",
        "oai:rais.unmsm.edu.pe:patente/5",
        "oai:rais.unmsm.edu.pe:persona/100",
        "oai:rais.unmsm.edu.pe:orgunit/facultad/1"
      ]
    },
    "entityTypes": [
      {
        "type": "publicacion",
        "count": 59543,
        "description": "Publicaciones de investigacion (articulos, tesis, libros, capitulos, ensayos, eventos)",
        "metadataPrefix": "oai_cerif"
      },
      {
        "type": "proyecto",
        "count": 6690,
        "description": "Proyectos de investigacion (con y sin financiamiento)",
        "metadataPrefix": "oai_cerif"
      },
      {
        "type": "patente",
        "count": 406,
        "description": "Patentes y registros de propiedad intelectual",
        "metadataPrefix": "oai_cerif"
      },
      {
        "type": "persona",
        "count": 36455,
        "description": "Investigadores, academicos y personal de investigacion",
        "metadataPrefix": "oai_cerif"
      },
      {
        "type": "orgunit",
        "count": 492,
        "description": "Unidades organizativas (Facultades, Institutos, Grupos de Investigacion)",
        "metadataPrefix": "oai_cerif"
      }
    ]
  }
}
```

---

### 2. ListMetadataFormats

Retorna los formatos de metadatos soportados.

**Endpoint:**
```
GET /api/oai?verb=ListMetadataFormats
```

**Parametros opcionales:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `identifier` | string | Identificador OAI (retorna formatos disponibles para ese registro) |

**Ejemplo:**
```
GET /api/oai?verb=ListMetadataFormats
GET /api/oai?verb=ListMetadataFormats&identifier=oai:rais.unmsm.edu.pe:publicacion/34
```

**Respuesta:**
```json
{
  "verb": "ListMetadataFormats",
  "metadataFormats": [
    {
      "metadataPrefix": "oai_cerif",
      "schema": "https://www.openarchives.org/OAI/2.0/oai_cerif.xsd",
      "metadataNamespace": "https://www.openarchives.org/OAI/2.0/cerif/"
    }
  ]
}
```

---

### 3. ListSets

Retorna la estructura jerarquica de conjuntos (sets) disponibles para filtrar registros.

**Endpoint:**
```
GET /api/oai?verb=ListSets
```

**Parametros:** Ninguno.

**Categorias de sets:**

#### Sets por tipo de publicacion
| setSpec | Nombre |
|---------|--------|
| `publicacion` | Todas las publicaciones |
| `publicacion:articulo` | Articulos |
| `publicacion:capitulo` | Capitulos de libro |
| `publicacion:ensayo` | Ensayos |
| `publicacion:evento` | Ponencias y eventos |
| `publicacion:libro` | Libros |
| `publicacion:tesis` | Tesis |
| `publicacion:tesis-asesoria` | Tesis (asesorias) |

#### Sets por tipo de proyecto
| setSpec | Nombre |
|---------|--------|
| `proyecto` | Todos los proyectos |
| `proyecto:PCONFIGI` | Con financiamiento |
| `proyecto:PSINFINV` | Sin financiamiento (Investigacion) |
| `proyecto:PSINFIPU` | Sin financiamiento (Publicacion) |
| `proyecto:PTPGRADO` | Tesis Pregrado |
| `proyecto:PTPMAEST` | Tesis Maestria |
| `proyecto:PTPDOCTO` | Tesis Doctorado |
| `proyecto:PTPBACHILLER` | Tesis Bachiller |
| `proyecto:PEVENTO` | Eventos Academicos |
| `proyecto:PINVPOS` | Talleres Investigacion y Posgrado |
| `proyecto:ECI` | Equipamiento Cientifico |
| `proyecto:PMULTI` | Multidisciplinario |
| `proyecto:PFEX` | Fondo Externo |
| `proyecto:PINTERDIS` | Interdisciplinario |
| `proyecto:RFPLU` | Fondo RFPLU |
| `proyecto:SPINOFF` | Spin-Off |
| `proyecto:PRO-CTIE` | PRO-CTIE |
| `proyecto:PICV` | PICV |
| `proyecto:PCONFIGI-INV` | PCONFIGI-INV |

#### Sets por tipo de patente
| setSpec | Nombre |
|---------|--------|
| `patente` | Todas las patentes |
| `patente:Patente de invencion` | Patentes de invencion |
| `patente:Modelo de utilidad` | Modelos de utilidad |
| `patente:Registro de software` | Registros de software |
| `patente:Certificado de obtentor` | Certificados de obtentor |
| `patente:Otros` | Otros registros |

#### Sets por facultad (multi-entidad: publicaciones + proyectos)
| setSpec | Nombre |
|---------|--------|
| `facultad:1` | Facultad de Medicina |
| `facultad:2` | Facultad de Derecho y Ciencia Politica |
| `facultad:3` | Facultad de Letras y Ciencias Humanas |
| `facultad:4` | Facultad de Farmacia y Bioquimica |
| `facultad:5` | Facultad de Odontologia |
| `facultad:6` | Facultad de Educacion |
| `facultad:7` | Facultad de Quimica e Ingenieria Quimica |
| `facultad:8` | Facultad de Medicina Veterinaria |
| `facultad:9` | Facultad de Ciencias Administrativas |
| `facultad:10` | Facultad de Ciencias Biologicas |
| `facultad:11` | Facultad de Ciencias Contables |
| `facultad:12` | Facultad de Ciencias Economicas |
| `facultad:13` | Facultad de Ciencias Fisicas |
| `facultad:14` | Facultad de Ciencias Matematicas |
| `facultad:15` | Facultad de Ciencias Sociales |
| `facultad:16` | Facultad de Ingenieria Geologica, Minera, Metalurgica y Geografica |
| `facultad:17` | Facultad de Ingenieria Industrial |
| `facultad:18` | Facultad de Psicologia |
| `facultad:19` | Facultad de Ingenieria Electronica y Electrica |
| `facultad:20` | Facultad de Ingenieria de Sistemas e Informatica |
| `facultad:21` | Vicerrectorado de Investigacion |
| `facultad:22` | Museo de Historia Natural |

#### Sets por area OCDE (multi-entidad: publicaciones + proyectos)
| setSpec | Nombre |
|---------|--------|
| `ocde:1` | Ciencias Naturales |
| `ocde:2` | Ingenieria y Tecnologia |
| `ocde:3` | Ciencias Medicas y de Salud |
| `ocde:4` | Ciencias Agricolas |
| `ocde:5` | Ciencias Sociales |
| `ocde:6` | Humanidades |

> **Nota:** Los sets `facultad:*` y `ocde:*` son **multi-entidad**: retornan tanto publicaciones como proyectos que pertenecen a esa facultad o area OCDE. Las publicaciones se listan primero, seguidas de los proyectos.

---

### 4. ListIdentifiers

Retorna los encabezados (identificadores, fechas, sets) de los registros sin los metadatos completos. Util para cosecha selectiva.

**Endpoint:**
```
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_dc
```

**Parametros:**

| Parametro | Requerido | Descripcion |
|-----------|-----------|-------------|
| `metadataPrefix` | Si* | Formato de metadatos (`oai_cerif`) |
| `set` | No | Filtrar por set (ej. `publicacion:articulo`, `proyecto`, `persona`, `orgunit`, `facultad:1`, `ocde:3`) |
| `from` | No | Fecha inicio ISO 8601 (ej. `2024-01-01`) |
| `until` | No | Fecha fin ISO 8601 (ej. `2024-12-31`) |
| `resumptionToken` | No | Token de paginacion (excluye los demas parametros) |

*\*Requerido cuando `resumptionToken` no esta presente.*

**Ejemplos:**
```
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_cerif
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_cerif&set=publicacion:articulo
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_cerif&set=proyecto
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_cerif&set=persona
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_cerif&set=orgunit
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_cerif&set=facultad:1
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_cerif&set=ocde:3&from=2020-01-01
GET /api/oai?verb=ListIdentifiers&resumptionToken=eyJjdXJzb3I...
```

**Respuesta:**
```json
{
  "verb": "ListIdentifiers",
  "headers": [
    {
      "identifier": "oai:rais.unmsm.edu.pe:publicacion/2",
      "datestamp": "2023-05-15T10:30:00Z",
      "setSpec": ["publicacion:articulo"]
    },
    {
      "identifier": "oai:rais.unmsm.edu.pe:publicacion/4",
      "datestamp": "2023-06-20T14:00:00Z",
      "setSpec": ["publicacion:articulo"]
    }
  ],
  "resumptionToken": {
    "token": "eyJjdXJzb3IiOjEwMC4uLg==",
    "completeListSize": 26636,
    "cursor": 0
  }
}
```

---

### 5. ListRecords

Retorna registros completos con encabezados y metadatos CERIF JSON. Mismos parametros que `ListIdentifiers`.

**Endpoint:**
```
GET /api/oai?verb=ListRecords&metadataPrefix=oai_cerif
```

**Parametros:** Identicos a `ListIdentifiers`.

**Ejemplos:**
```
GET /api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=publicacion:articulo
GET /api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=proyecto:PCONFIGI
GET /api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=patente
GET /api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=persona
GET /api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=orgunit
GET /api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=facultad:10&from=2023-01-01
```

**Respuesta (Publicacion):**
```json
{
  "verb": "ListRecords",
  "records": [
    {
      "header": {
        "identifier": "oai:rais.unmsm.edu.pe:publicacion/34",
        "datestamp": "2023-05-15T10:30:00Z",
        "setSpec": ["publicacion:articulo"]
      },
      "metadata": {
        "PublicationRecord": {
          "PublicationType": "http://purl.org/coar/resource_type/c_6501",
          "Title": "Human and porcine Taenia solium infection...",
          "PublicationDate": "1999-01-15",
          "Volume": "73",
          "Issue": "2",
          "StartPage": "145",
          "EndPage": "152",
          "DOI": "10.1016/S0001-706X(98)00120-X",
          "ISSN": "0001-706X",
          "URL": "https://www.sciencedirect.com/...",
          "Authors": [
            {
              "Name": "GILMAN, R.H.",
              "ORCID": "0000-0001-2345-6789",
              "Affiliation": "Universidad Nacional Mayor de San Marcos"
            }
          ],
          "Subject": ["Cysticercosis", "Taenia solium", "epidemiology"],
          "Abstract": "...",
          "Language": "en"
        }
      }
    }
  ],
  "resumptionToken": {
    "token": "...",
    "completeListSize": 59543,
    "cursor": 0
  }
}
```

**Respuesta (Proyecto):**
```json
{
  "verb": "ListRecords",
  "records": [
    {
      "header": {
        "identifier": "oai:rais.unmsm.edu.pe:proyecto/1",
        "datestamp": "2023-01-10T08:00:00Z",
        "setSpec": ["proyecto:PCONFIGI"]
      },
      "metadata": {
        "ProjectRecord": {
          "Title": "Investigacion en Biologia Molecular",
          "Acronym": "IBMOL",
          "StartDate": "2023-01-01",
          "EndDate": "2025-12-31",
          "PrincipalInvestigator": {
            "Name": "LOPEZ GARCIA, MARIA",
            "ORCID": "0000-0001-9876-5432"
          },
          "Team": [
            {
              "Name": "PEREZ GOMEZ, CARLOS",
              "Role": "Co-Investigador"
            }
          ],
          "Subject": "Biologia Molecular",
          "OCDEArea": "3 (Ciencias Medicas y de Salud)",
          "Abstract": "Proyecto dedicado al estudio...",
          "Status": "En ejecucion"
        }
      }
    }
  ],
  "resumptionToken": {
    "token": "...",
    "completeListSize": 6690,
    "cursor": 0
  }
}
```

**Respuesta (Persona):**
```json
{
  "verb": "ListRecords",
  "records": [
    {
      "header": {
        "identifier": "oai:rais.unmsm.edu.pe:persona/100",
        "datestamp": "2024-06-15T14:30:00Z",
        "setSpec": ["persona"]
      },
      "metadata": {
        "PersonRecord": {
          "Name": "RODRIGUEZ SANCHEZ, JUAN",
          "ORCID": "0000-0001-5555-6666",
          "ScopusAuthorID": "57201234567",
          "Affiliation": "Facultad de Medicina",
          "Qualifications": [
            {
              "Title": "Doctor en Medicina",
              "Institution": "Universidad Nacional Mayor de San Marcos",
              "Year": 2010
            }
          ],
          "Statistics": {
            "Publications": 45,
            "Projects": 8,
            "Patents": 1
          }
        }
      }
    }
  ],
  "resumptionToken": {
    "token": "...",
    "completeListSize": 36455,
    "cursor": 0
  }
}
```

**Respuesta (OrgUnit):**
```json
{
  "verb": "ListRecords",
  "records": [
    {
      "header": {
        "identifier": "oai:rais.unmsm.edu.pe:orgunit/facultad/1",
        "datestamp": "2023-12-01T09:00:00Z",
        "setSpec": ["orgunit", "facultad"]
      },
      "metadata": {
        "OrgUnitRecord": {
          "Type": "Facultad",
          "Name": "Facultad de Medicina",
          "Acronym": "FM",
          "ROR": "https://ror.org/00rwzpz13",
          "PartOf": "Universidad Nacional Mayor de San Marcos",
          "ElectronicAddress": "medicina@unmsm.edu.pe",
          "PostAddress": "Av. Grau 755, Lima, Peru",
          "Description": "Facultad dedicada a la formacion de profesionales en medicina..."
        }
      }
    }
  ],
  "resumptionToken": {
    "token": "...",
    "completeListSize": 492,
    "cursor": 0
  }
}
```

---

### 6. GetRecord

Retorna un registro individual por su identificador OAI.

**Endpoint:**
```
GET /api/oai?verb=GetRecord&identifier={id}&metadataPrefix=oai_cerif
```

**Parametros:**

| Parametro | Requerido | Descripcion |
|-----------|-----------|-------------|
| `identifier` | Si | Identificador OAI completo |
| `metadataPrefix` | Si | Formato de metadatos (`oai_cerif`) |

**Formatos de identificadores:**
```
oai:rais.unmsm.edu.pe:publicacion/{id}              # Ej: publicacion/34
oai:rais.unmsm.edu.pe:proyecto/{id}                 # Ej: proyecto/1
oai:rais.unmsm.edu.pe:patente/{id}                  # Ej: patente/5
oai:rais.unmsm.edu.pe:persona/{id}                  # Ej: persona/100
oai:rais.unmsm.edu.pe:orgunit/facultad/{id}         # Ej: orgunit/facultad/1
oai:rais.unmsm.edu.pe:orgunit/instituto/{id}        # Ej: orgunit/instituto/102
oai:rais.unmsm.edu.pe:orgunit/grupo/{id}            # Ej: orgunit/grupo/24
```

**Ejemplos:**
```
GET /api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:publicacion/34&metadataPrefix=oai_cerif
GET /api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:proyecto/1&metadataPrefix=oai_cerif
GET /api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:patente/5&metadataPrefix=oai_cerif
GET /api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:persona/100&metadataPrefix=oai_cerif
GET /api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:orgunit/facultad/1&metadataPrefix=oai_cerif
GET /api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:orgunit/grupo/24&metadataPrefix=oai_cerif
```

---

## Formato de Metadatos CERIF JSON (oai_cerif)

El API expone metadatos en formato CERIF (Common European Research Information Format) como JSON, cumpliendo con la especificacion PerúCRIS 1.1 de CONCYTEC. Este formato describe la estructura semantica de datos de investigacion.

### Estructura Comun

Cada registro CERIF contiene un elemento raiz correspondiente al tipo de entidad:

```json
{
  "PublicationRecord": { ... },      // Para publicaciones
  "ProjectRecord": { ... },          // Para proyectos
  "PatentRecord": { ... },           // Para patentes
  "PersonRecord": { ... },           // Para investigadores
  "OrgUnitRecord": { ... }           // Para unidades organizativas
}
```

### Publicacion (PublicationRecord)

| Campo | Tipo | Descripcion | Ejemplo |
|-------|------|-------------|---------|
| `PublicationType` | URI | Tipo COAR de la publicacion | `http://purl.org/coar/resource_type/c_6501` (articulo) |
| `Title` | String | Titulo de la publicacion | "Human and porcine Taenia solium infection..." |
| `PublicationDate` | ISO 8601 | Fecha de publicacion | "1999-01-15" o "1999" (si solo ano disponible) |
| `Volume` | String | Volumen de revista | "73" |
| `Issue` | String | Numero de revista | "2" |
| `StartPage` | String | Pagina inicial | "145" |
| `EndPage` | String | Pagina final | "152" |
| `DOI` | String | Digital Object Identifier | "10.1016/S0001-706X(98)00120-X" |
| `ISSN` | String | ISSN de la revista | "0001-706X" |
| `ISBN` | String | ISBN del libro | "978-3-16-148410-0" |
| `URL` | String | URL de acceso | "https://www.sciencedirect.com/..." |
| `Authors` | Array | Autores con ORCID, ScopusID, etc. | `[{ "Name": "...", "ORCID": "...", "Affiliation": "..." }]` |
| `Subject` | Array | Palabras clave | `["Cysticercosis", "Taenia solium"]` |
| `Abstract` | String | Resumen de la publicacion | "..." |
| `Language` | ISO 639-1 | Codigo de idioma | "es", "en" |
| `Publisher` | String | Editorial o revista | "ELSEVIER" |

#### Mapeo de Tipos COAR

| Tipo RAIS | URI COAR | Codigo |
|-----------|---------|--------|
| articulo | http://purl.org/coar/resource_type/c_6501 | c_6501 |
| libro | http://purl.org/coar/resource_type/c_3734 | c_3734 |
| capitulo | http://purl.org/coar/resource_type/c_3248 | c_3248 |
| tesis | http://purl.org/coar/resource_type/c_db06 | c_db06 |
| evento | http://purl.org/coar/resource_type/c_5794 | c_5794 |
| resumen_evento | http://purl.org/coar/resource_type/c_8185 | c_8185 |
| ensayo | http://purl.org/coar/resource_type/c_6947 | c_6947 |
| revisión | http://purl.org/coar/resource_type/c_4317 | c_4317 |

### Proyecto (ProjectRecord)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `Title` | String | Titulo del proyecto |
| `Acronym` | String | Acronimo (opcional) |
| `StartDate` | ISO 8601 | Fecha de inicio |
| `EndDate` | ISO 8601 | Fecha de termino |
| `PrincipalInvestigator` | Object | Investigador responsable con Name, ORCID, etc. |
| `Team` | Array | Miembros del proyecto con Role |
| `Subject` | String | Tema del proyecto |
| `OCDEArea` | String | Area OCDE (1-6) |
| `Abstract` | String | Resumen |
| `Status` | String | Estado del proyecto |
| `Budget` | Decimal | Presupuesto asignado (si aplica) |
| `FundingOrgan` | String | Entidad financiadora |
| `ResearchLine` | String | Linea de investigacion |

### Patente (PatentRecord)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `PatentType` | URI | Tipo COAR de patente |
| `Title` | String | Titulo de la patente |
| `PatentNumber` | String | Numero de patente |
| `FilingNumber` | String | Numero de solicitud |
| `ApprovalDate` | ISO 8601 | Fecha de aprobacion |
| `Inventors` | Array | Inventores con Name, ORCID, Role |
| `Holders` | Array | Titulares de la patente |
| `Abstract` | String | Descripcion/resumen |
| `URL` | String | URL de acceso |
| `PatentOffice` | String | Oficina de registro (INDECOPI, etc.) |

### Persona (PersonRecord)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `Name` | String | Nombre completo (APELLIDOS, NOMBRES) |
| `ORCID` | String | ORCID identificador |
| `ScopusAuthorID` | String | Scopus Author ID |
| `ResearcherID` | String | Web of Science Researcher ID |
| `RENACYT` | String | RENACYT numero |
| `Affiliation` | String | Afiliacion principal |
| `Qualifications` | Array | Titulos academicos |
| `ElectronicAddress` | String | Email |
| `Statistics` | Object | Contadores: Publications, Projects, Patents |

### OrgUnit (OrgUnitRecord)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `Type` | String | Tipo: "Facultad", "Instituto", "Grupo" |
| `Name` | String | Nombre completo |
| `Acronym` | String | Acronimo (opcional) |
| `Identifier` | Object | ROR, RINEC, etc. |
| `PartOf` | String | Unidad padre |
| `ElectronicAddress` | String | Email de contacto |
| `PostAddress` | String | Direccion fisica |
| `Description` | String | Descripcion de la unidad |
| `SubUnits` | Array | Unidades subordinadas (para facultades) |

---

## Paginacion (resumptionToken)

La API utiliza paginacion stateless. Cada respuesta paginada incluye un objeto `resumptionToken`:

```json
{
  "resumptionToken": {
    "token": "eyJjdXJzb3IiOjEwMCwi...",
    "completeListSize": 59543,
    "cursor": 0
  }
}
```

| Campo | Descripcion |
|-------|-------------|
| `token` | Token codificado en Base64url para obtener la siguiente pagina |
| `completeListSize` | Total de registros que coinciden con la consulta |
| `cursor` | Posicion del primer registro de la pagina actual |

### Uso

1. La primera solicitud retorna los primeros 100 registros y un `resumptionToken`.
2. Para la siguiente pagina, envie el `resumptionToken` como unico parametro:
   ```
   GET /api/oai?verb=ListIdentifiers&resumptionToken=eyJjdXJzb3IiOjEwMCwi...
   ```
3. La ultima pagina tendra `token: ""` (cadena vacia) indicando el fin de la lista.
4. Si no hay `resumptionToken` en la respuesta, todos los registros caben en una sola pagina.

> **Importante:** Cuando usa `resumptionToken`, no envie otros parametros como `metadataPrefix`, `set`, `from` o `until`. Estos estan codificados dentro del token.

---

## Manejo de Errores

Los errores OAI-PMH se retornan con HTTP status `200` (segun el protocolo OAI-PMH):

```json
{
  "responseDate": "2026-03-07T06:00:00.000Z",
  "request": {
    "baseURL": "https://rais.unmsm.edu.pe/api/oai"
  },
  "error": {
    "code": "badVerb",
    "message": "Illegal OAI verb. Expected one of: Identify, ListMetadataFormats, ListSets, ListIdentifiers, ListRecords, GetRecord"
  }
}
```

### Codigos de error OAI-PMH

| Codigo | Descripcion | Ejemplo |
|--------|-------------|---------|
| `badVerb` | Verbo invalido o ausente | `?verb=Invalid` |
| `badArgument` | Parametro faltante, invalido o no reconocido | `?verb=GetRecord` (sin identifier) |
| `badResumptionToken` | Token de paginacion invalido o expirado | Token manipulado |
| `cannotDisseminateFormat` | Formato de metadatos no soportado | `metadataPrefix=marc21` |
| `idDoesNotExist` | Identificador no encontrado | Publicacion inexistente |
| `noRecordsMatch` | Sin resultados para los filtros dados | Set vacio o rango de fechas sin datos |
| `noSetHierarchy` | (No aplicable — este repositorio soporta sets) | — |

---

## Ejemplos de Uso

### Cosechar todas las publicaciones (59,543)
```bash
# Primera pagina
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=publicacion"

# Siguientes paginas (usar el token de la respuesta anterior)
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&resumptionToken=eyJjdXJzb3IiOjEwMCwi..."
```

### Cosechar articulos del 2024
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=publicacion:articulo&from=2024-01-01&until=2024-12-31"
```

### Cosechar proyectos con financiamiento (PCONFIGI)
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=proyecto:PCONFIGI"
```

### Cosechar todos los investigadores (36,455)
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=persona"
```

### Cosechar todas las patentes (406)
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=patente"
```

### Cosechar todas las unidades organizativas (492)
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=orgunit"
```

### Cosechar todo de la Facultad de Medicina (publicaciones + proyectos)
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=facultad:1"
```

### Cosechar por area OCDE: Ciencias Medicas (publicaciones + proyectos)
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_cerif&set=ocde:3"
```

### Obtener registros especificos
```bash
# Publicacion
curl "https://rais.unmsm.edu.pe/api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:publicacion/34&metadataPrefix=oai_cerif"

# Proyecto
curl "https://rais.unmsm.edu.pe/api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:proyecto/1&metadataPrefix=oai_cerif"

# Patente
curl "https://rais.unmsm.edu.pe/api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:patente/5&metadataPrefix=oai_cerif"

# Persona/Investigador
curl "https://rais.unmsm.edu.pe/api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:persona/100&metadataPrefix=oai_cerif"

# Facultad
curl "https://rais.unmsm.edu.pe/api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:orgunit/facultad/1&metadataPrefix=oai_cerif"

# Instituto
curl "https://rais.unmsm.edu.pe/api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:orgunit/instituto/102&metadataPrefix=oai_cerif"

# Grupo de Investigacion
curl "https://rais.unmsm.edu.pe/api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:orgunit/grupo/24&metadataPrefix=oai_cerif"
```

### Script de cosecha completa (Python)
```python
import requests
import json

BASE = "https://rais.unmsm.edu.pe/api/oai"
records = []
params = {
    "verb": "ListRecords",
    "metadataPrefix": "oai_cerif",
    "set": "publicacion:articulo"
}

while True:
    resp = requests.get(BASE, params=params).json()
    
    if "error" in resp:
        print(f"Error: {resp['error']['code']} - {resp['error']['message']}")
        break
    
    records.extend(resp.get("records", []))
    total = resp.get('resumptionToken', {}).get('completeListSize', len(records))
    print(f"Cosechados: {len(records)} / {total}")
    
    token = resp.get("resumptionToken", {}).get("token")
    if not token:
        break
    
    params = {"verb": "ListRecords", "resumptionToken": token}

with open("articulos.json", "w") as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f"Total cosechado: {len(records)} articulos en formato CERIF JSON")
```

### Script de cosecha de investigadores (Node.js)
```javascript
const BASE = 'https://rais.unmsm.edu.pe/api/oai';
const records = [];
let params = new URLSearchParams({
  verb: 'ListRecords',
  metadataPrefix: 'oai_cerif',
  set: 'persona',
});

while (true) {
  const resp = await fetch(`${BASE}?${params}`).then(r => r.json());
  
  if (resp.error) {
    console.error(`Error: ${resp.error.code} - ${resp.error.message}`);
    break;
  }
  
  records.push(...(resp.records ?? []));
  const total = resp.resumptionToken?.completeListSize ?? records.length;
  console.log(`Cosechados: ${records.length} / ${total}`);
  
  const token = resp.resumptionToken?.token;
  if (!token) break;
  
  params = new URLSearchParams({ verb: 'ListRecords', resumptionToken: token });
}

console.log(`Total: ${records.length} investigadores (CERIF JSON)`);
```

---

## Estructura del Proyecto

```
rais-api/
├── .env                              # Variables de entorno (DB, puerto, base URL)
├── package.json                      # Dependencias y scripts
├── src/
│   ├── server.js                     # Punto de entrada
│   ├── app.js                        # Configuracion Express 5.x
│   ├── config/
│   │   └── database.js               # Pool MySQL (mysql2/promise)
│   ├── controllers/
│   │   └── oai.controller.js         # Controlador de requests OAI
│   ├── middlewares/
│   │   └── validateVerb.js           # Validacion Zod por verbo
│   ├── repositories/
│   │   ├── publicacion.repository.js # Queries para 59,543 publicaciones
│   │   ├── proyecto.repository.js    # Queries para 6,690 proyectos
│   │   ├── patente.repository.js     # Queries para 406 patentes
│   │   ├── persona.repository.js     # Queries para 36,455 investigadores (NEW)
│   │   └── orgunit.repository.js     # Queries para 492 unidades organizativas (NEW)
│   ├── services/
│   │   ├── oai.service.js            # Dispatcher central (soporta 5 entidades)
│   │   ├── identify.service.js       # Verb: Identify (5 entidades)
│   │   ├── listSets.service.js       # Verb: ListSets (88+ sets)
│   │   ├── listMetadataFormats.service.js # Verb: ListMetadataFormats (oai_cerif)
│   │   ├── getRecord.service.js      # Verb: GetRecord (5 entidades + formateo CERIF)
│   │   ├── listIdentifiers.service.js # Verb: ListIdentifiers (5 entidades)
│   │   ├── listRecords.service.js    # Verb: ListRecords (5 entidades)
│   │   ├── cerif.service.js          # Formatters CERIF JSON para las 5 entidades (NEW)
│   │   └── resumptionToken.js        # Paginacion stateless
│   ├── routes/
│   │   └── oai.routes.js             # GET /api/oai
│   └── utils/
│       ├── errors.js                 # Errores OAI-PMH
│       └── oaiIdentifier.js          # Construccion/parseo de IDs OAI con soporte compound
```

---

## Ejecucion Local

### Requisitos
- Node.js v24+
- MySQL 5.7+ con la base de datos `rais`
- pnpm

### Instalacion
```bash
pnpm install
```

### Variables de entorno (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=demo
DB_NAME=rais
PORT=3000
BASE_URL=https://rais.unmsm.edu.pe/api/oai
PAGE_SIZE=100
```

### Iniciar el servidor
```bash
# Desarrollo (con watch mode)
pnpm run dev

# Produccion
pnpm start
```

El servidor estara disponible en `http://localhost:3000/api/oai`.

---

## Stack Tecnologico

| Componente | Version |
|------------|---------|
| Node.js | v24.x |
| Express.js | 5.x |
| MySQL | 5.7+ (via mysql2/promise) |
| Zod | v4 (validacion de parametros) |
| CORS | Habilitado |
| ES Modules | `"type": "module"` |

---

## Notas Tecnicas

- **Entidades expuestas:** 5 (Publicaciones, Proyectos, Patentes, Personas, Unidades Organizativas) = 103,586 registros totales
- **Reglas de negocio:**
  - Publicaciones: Solo con `validado = 1` (59,543 / ~100,000)
  - Proyectos: Solo con `estado >= 1` (6,690 / ~10,000)
  - Patentes: Solo con `estado >= 1` (406 / ~600)
  - Personas: Investigadores activos (36,455)
  - Unidades Org: Facultades, Institutos, Grupos activos (492)
- **Formato de nombres:** `APELLIDO1 APELLIDO2, NOMBRES` (ej. "GARCIA PEREZ, JUAN CARLOS")
- **Identidad Corporativa UNMSM:**
  - ROR (Research Organization Registry): `https://ror.org/00rwzpz13`
  - RUC: `20148092282`
- **Jerarquia Organizativa:** Grupo → Facultad → UNMSM (Instituto no interviene en jerarquia de grupos)
- **OAI Identifiers (Compound):**
  - Publicacion: `oai:rais.unmsm.edu.pe:publicacion/{id}`
  - Proyecto: `oai:rais.unmsm.edu.pe:proyecto/{id}`
  - Patente: `oai:rais.unmsm.edu.pe:patente/{id}`
  - Persona: `oai:rais.unmsm.edu.pe:persona/{id}`
  - Facultad: `oai:rais.unmsm.edu.pe:orgunit/facultad/{id}`
  - Instituto: `oai:rais.unmsm.edu.pe:orgunit/instituto/{id}`
  - Grupo: `oai:rais.unmsm.edu.pe:orgunit/grupo/{id}`
- **Identificadores alternativos:**
  - ORCID: Se obtiene de `Usuario_investigador.codigo_orcid`
  - Scopus: De `Usuario_investigador` o `Publicacion_autor`
  - RENACYT: Numero del registro del investigador
- **Manejo de fechas (MySQL `dateStrings: true`):**
  - `"0000-00-00"` → omitido (retorna `undefined`)
  - `"1998-00-00"` → `"1998"` (solo ano)
  - `"2021-05-00"` → `"2021-05"` (ano-mes)
  - `"2000-01-01"` → `"2000-01-01"` (ISO 8601 completo)
- **Blobs/Binarios:** `resumen` de publicaciones es MySQL `blob`; se decodifica a UTF-8, omitiendo si vacio
- **Sets multi-entidad:**
  - `facultad:*` retorna publicaciones + proyectos de esa facultad
  - `ocde:*` retorna publicaciones + proyectos del area OCDE
  - Publicaciones vinculadas a facultad via autores, Proyectos via `Proyecto_facultad`
- **Paginacion:** Stateless via Base64url-encoded `resumptionToken`; no almacenamiento en BD
- **OCDE:** Clasificacion con 3 niveles; filtrado por codigo top-level recorre jerarquia
- **Vocabularios:**
  - COAR Resource Types: URIs para articulos, libros, tesis, patentes
  - OCDE Classification: Areas 1-6 de ciencia y tecnologia
  - ISO 8601: Fechas de publicacion
  - ISO 639-1: Codigos de lenguaje (es, en, fr, pt, etc.)
- **PerúCRIS 1.1 Compliance:** 95/100 (Todas las directrices CONCYTEC implementadas)
