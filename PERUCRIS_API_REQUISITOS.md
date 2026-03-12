# Guia para creacion de APIs con formato Json para Integracion PeruCRIS

Oficina de Tecnologias de Informacion - Software PERUCRIS

---

## Contenido

- [1. Introduccion](#1-introduccion)
- [2. Acceso al servicio OAI-PMH](#2-acceso-al-servicio-oai-pmh)
  - [2.1 Identify](#21-identify)
  - [2.2 ListMetadataFormats](#22-listmetadataformats)
  - [2.3 ListSets](#23-listsets)
  - [2.4 ListRecords](#24-listrecords)
- [3. Tipos de cosecha](#3-tipos-de-cosecha)
- [4. Uso de ResumptionToken](#4-uso-de-resumptiontoken)
- [5. Perfil de aplicacion PeruCRIS (CERIF)](#5-perfil-de-aplicacion-perucris-cerif)
- [6. Estructura general de los JSON](#6-estructura-general-de-los-json)
- [7. JSON de Personas](#7-json-de-personas)
- [8. JSON de OrgUnits](#8-json-de-orgunits)
- [9. JSON de Publicaciones](#9-json-de-publicaciones)
- [10. JSON de Equipamientos](#10-json-de-equipamientos)
- [11. JSON de Patentes](#11-json-de-patentes)
- [12. JSON de Financiamientos](#12-json-de-financiamientos)
- [13. JSON de Proyectos](#13-json-de-proyectos)
- [14. Ejemplos de respuestas de TODOS los verbos OAI-PMH](#14-ejemplos-de-respuestas-de-todos-los-verbos-oai-pmh)

---

## 1. Introduccion

El objetivo principal de este documento es describir la forma en que las instituciones deben exponer la informacion de sus sistemas CRIS institucionales para permitir su interoperabilidad con la Plataforma PeruCRIS. La interoperabilidad se realiza mediante el protocolo OAI-PMH (Open Archives Initiative - Protocol for Metadata Harvesting), el cual permite que la plataforma PeruCRIS coseche informacion estructurada desde sistemas externos. Las instituciones deben implementar un endpoint OAI-PMH que permita consultar los metadatos de sus registros utilizando los verbos definidos por el protocolo. Estos metadatos deben seguir el perfil de aplicacion CERIF adoptado por PeruCRIS, asegurando consistencia semantica y compatibilidad con estandares internacionales de informacion cientifica. En este documento se incluyen tambien ejemplos de estructuras JSON (de uso comun en integraciones por API) para representar entidades CERIF, con todos los campos tipicos que suelen requerirse en PeruCRIS (identificadores, relaciones, fechas, roles y vocabularios).

Nota: OAI-PMH es un protocolo basado en XML. En esta version del documento, los ejemplos que originalmente estaban en XML se presentan en formato JSON para facilitar integraciones y pruebas (manteniendo la misma informacion y jerarquia).

---

## 2. Acceso al servicio OAI-PMH

Ejemplo de URL base: `https://cris.institucion.edu.pe/oai`

Para validar la correcta exposicion de los metadatos, el endpoint OAI-PMH debe responder a los verbos principales del protocolo.

### 2.1 Identify

Permite obtener informacion general del repositorio o sistema CRIS institucional.

Request: `?verb=Identify`

### 2.2 ListMetadataFormats

Permite identificar los formatos de metadatos soportados por el servicio. Debe incluir `perucris-cerif`.

Request: `?verb=ListMetadataFormats`

```json
{
  "OAI-PMH": {
    "xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:20:05Z",
    "request": {
      "@verb": "ListMetadataFormats",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListMetadataFormats": {
      "metadataFormat": [
        {
          "metadataPrefix": "oai_dc",
          "schema": "http://www.openarchives.org/OAI/2.0/oai_dc.xsd",
          "metadataNamespace": "http://www.openarchives.org/OAI/2.0/oai_dc/"
        },
        {
          "metadataPrefix": "perucris-cerif",
          "schema": "https://purl.org/pe-repo/perucris/cerif.xsd",
          "metadataNamespace": "https://purl.org/pe-repo/perucris/cerif"
        }
      ]
    }
  }
}
```

### 2.3 ListSets

Permite conocer los conjuntos de registros disponibles para cosecha (por entidad).

Request: `?verb=ListSets`

```json
{
  "OAI-PMH": {
    "xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:20:10Z",
    "request": {
      "@verb": "ListSets",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListSets": {
      "set": [
        {
          "setSpec": "persons",
          "setName": "Personas"
        },
        {
          "setSpec": "orgunits",
          "setName": "Unidades organizativas"
        },
        {
          "setSpec": "publications",
          "setName": "Publicaciones"
        },
        {
          "setSpec": "projects",
          "setName": "Proyectos"
        },
        {
          "setSpec": "fundings",
          "setName": "Financiamientos"
        },
        {
          "setSpec": "equipments",
          "setName": "Equipamientos"
        },
        {
          "setSpec": "patents",
          "setName": "Patentes"
        }
      ]
    }
  }
}
```

### 2.4 ListRecords

Obtiene registros completos en formato CERIF. Parametros clave: `metadataPrefix`, `set`, `from`, `until`, `resumptionToken`.

Regla general de paginacion (recursividad):
- Si la respuesta trae `resumptionToken` con texto (`#text` no vacio) → hay mas paginas → repetir llamada usando ese token.
- Si no viene token o viene vacio → fin.

#### 2.4.1 ListRecords sin from ni until (cosecha completa)

Request: `?verb=ListRecords&metadataPrefix=perucris-cerif&set=projects`

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:21:00Z",
    "request": {
      "@verb": "ListRecords",
      "@metadataPrefix": "perucris-cerif",
      "@set": "projects",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListRecords": {
      "record": [
        {
          "header": {
            "identifier": "oai:cris.institucion.edu.pe:Projects/1001",
            "datestamp": "2026-02-20T12:00:00Z",
            "setSpec": "projects"
          },
          "metadata": {
            "Project": {
              "@id": "Projects/1001",
              "@xmlns": "https://purl.org/pe-repo/perucris/cerif",
              "Title": [
                { "@xml:lang": "es", "#text": "Proyecto ejemplo" }
              ]
            }
          }
        }
      ],
      "resumptionToken": {
        "@cursor": "0",
        "@completeListSize": "250",
        "#text": "eyJwYWdlIjoyfQ=="
      }
    }
  }
}
```

Cuando usarlo: primera carga total, o si no tienes checkpoint.

#### 2.4.2 ListRecords con from y until (cosecha incremental)

Request: `?verb=ListRecords&metadataPrefix=perucris-cerif&set=projects&from=2026-02-20T00:00:00Z&until=2026-03-05T23:59:59Z`

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:21:00Z",
    "request": {
      "@verb": "ListRecords",
      "@metadataPrefix": "perucris-cerif",
      "@set": "projects",
      "@from": "2026-02-20T00:00:00Z",
      "@until": "2026-03-05T23:59:59Z",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListRecords": {
      "record": [
        {
          "header": {
            "identifier": "oai:cris.institucion.edu.pe:Projects/1001",
            "datestamp": "2026-02-20T12:00:00Z",
            "setSpec": "projects"
          },
          "metadata": { "Project": { "@id": "Projects/1001" } }
        }
      ],
      "resumptionToken": {
        "@cursor": "0",
        "@completeListSize": "80",
        "#text": "eyJwYWdlIjoyfQ=="
      }
    }
  }
}
```

Cuando usarlo: cuando ya tienes un "checkpoint" (lastDatestamp) y quieres traer solo lo nuevo/modificado.

#### 2.4.3 ListRecords con resumptionToken (continuacion estandar / OAI-PMH puro)

Esta es la forma correcta segun OAI-PMH: cuando usas token, continuas solo con token.

Request: `?verb=ListRecords&resumptionToken=eyJwYWdlIjoyfQ==`

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:21:10Z",
    "request": {
      "@verb": "ListRecords",
      "@resumptionToken": "eyJwYWdlIjoyfQ==",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListRecords": {
      "_comment": "siguientes records...",
      "resumptionToken": {
        "@cursor": "100",
        "@completeListSize": "250",
        "#text": "eyJwYWdlIjozfQ=="
      }
    }
  }
}
```

Cuando usarlo: siempre que el servidor devuelva token (paginacion).

#### 2.4.4 ListRecords con resumptionToken + from/until (NO recomendado / depende del servidor)

Request (si tu servidor lo soporta explicitamente): `?verb=ListRecords&resumptionToken=eyJwYWdlIjoyfQ==&from=2026-02-20T00:00:00Z&until=2026-03-05T23:59:59Z`

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:21:10Z",
    "request": {
      "@verb": "ListRecords",
      "@resumptionToken": "eyJwYWdlIjoyfQ==",
      "@from": "2026-02-20T00:00:00Z",
      "@until": "2026-03-05T23:59:59Z",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListRecords": {
      "_comment": "pagina siguiente (si el servidor tolera filtros repetidos)",
      "resumptionToken": {
        "@cursor": "100",
        "@completeListSize": "250",
        "#text": "eyJwYWdlIjozfQ=="
      }
    }
  }
}
```

Cuando usarlo: solo si tu implementacion esta documentada para aceptar esto (si no, puede responder error o ignorar parametros).

---

## 3. Tipos de cosecha

El proceso de recoleccion de datos puede realizarse de dos formas.

### 3.1 Cosecha inicial

Es la primera recoleccion de informacion que realiza la plataforma PeruCRIS.

En este caso:
- Se recuperan todos los registros disponibles
- No se especifica una fecha `from`
- El sistema devuelve el conjunto completo de datos.

Ejemplo:

```
?verb=ListRecords
&metadataPrefix=perucris-cerif
&set=projects
```

### 3.2 Cosecha iterativa o incremental

Se utiliza cuando ya existe una cosecha previa.

En este caso:
- Se recuperan solo los registros modificados o creados dentro de un rango de fechas.
- Se utilizan los parametros `from` y `until`.

Ejemplo:

```
?verb=ListRecords
&metadataPrefix=perucris-cerif
&set=projects
&from=2026-02-25T08:25:39Z
&until=2027-01-07T23:05:48Z
```

Esto permite optimizar la sincronizacion entre sistemas.

---

## 4. Uso de ResumptionToken

Cuando hay muchos registros, el servidor puede devolver resultados por bloques. En ese caso retorna `resumptionToken` para continuar.

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:21:10Z",
    "request": {
      "@verb": "ListRecords",
      "@resumptionToken": "eyJwYWdlIjoyfQ==",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListRecords": {
      "_comment": "siguientes records...",
      "resumptionToken": {
        "@cursor": "100",
        "@completeListSize": "250",
        "#text": "eyJwYWdlIjozfQ=="
      }
    }
  }
}
```

---

## 5. Perfil de aplicacion PeruCRIS (CERIF)

Las principales entidades definidas en el perfil de aplicacion son: Person, OrgUnit, Publication, Patent, Equipment, Funding y Project.

Reglas clave: El uso de los elementos definidos es obligatorio. No se deben utilizar elementos o vocabularios diferentes a los establecidos en el perfil. La estructura semantica se basa preferentemente en CERIF 1.5.

---

## 6. Estructura general de los JSON

A continuacion, se propone una estructura consistente para representar entidades CERIF en JSON (util para APIs internas, validaciones, cargas por lotes, etc.). Cada entidad mantiene: id estable (ej. Persons/..., OrgUnits/...) identifiers como lista con scheme + value campos multilenguaje como lista (lang/value) relaciones por referencia (id) o por objeto anidado segun necesidad lastModified para soporte de cosecha incremental

```json
{
  "id": "EntityType/123",
  "title": [
    {
      "lang": "es",
      "value": "..."
    },
    {
      "lang": "en",
      "value": "..."
    }
  ],
  "identifiers": [
    {
      "scheme": "...",
      "value": "..."
    }
  ],
  "relations": [
    {
      "type": "...",
      "target": {
        "id": "..."
      }
    }
  ],
  "lastModified": "2026-02-20T12:00:00Z"
}
```

---

## 7. JSON de Personas

Ejemplo completo de una persona con identificadores (DNI, ORCID, ResearcherID, Scopus Author ID) y afiliaciones a OrgUnits.

```json
{
  "id": "Persons/28521427",
  "personName": {
    "familyNames": "Cabrera Sanchez",
    "firstNames": "Paolo Edgar",
    "fullName": "Paolo Edgar Cabrera Sanchez"
  },
  "identifiers": [
    {
      "scheme": "http://purl.org/pe-repo/concytec/terminos#dni",
      "value": "08755499"
    },
    {
      "scheme": "https://orcid.org",
      "value": "https://orcid.org/0000-0001-8247-8975"
    },
    {
      "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#ResearcherID",
      "value": "HRC-7754-2023"
    },
    {
      "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#ScopusAuthorID",
      "value": "57123456789"
    }
  ],
  "emails": [
    "paolo.cabrera@unica.edu.pe"
  ],
  "affiliations": [
    {
      "orgUnit": {
        "id": "OrgUnits/38498322",
        "name": "Universidad Nacional San Luis Gonzaga"
      },
      "role": "Autor",
      "startDate": "2020-01-01"
    }
  ],
  "keywords": [
    {
      "value": "Ciencias veterinarias"
    }
  ],
  "lastModified": "2026-02-20T12:00:00Z"
}
```

---

## 8. JSON de OrgUnits

Ejemplo completo de una unidad organizativa con identificadores institucionales (RUC, ROR/GRID/ISNI), jerarquia (parentOrgUnit) y datos de ubicacion.

```json
{
  "id": "OrgUnits/38498322",
  "acronym": "UNSLG",
  "name": [
    {
      "value": "Universidad Nacional San Luis Gonzaga"
    },
    {
      "value": "National University San Luis Gonzaga"
    }
  ],
  "type": "Institucion principal",
  "identifiers": [
    {
      "scheme": "https://purl.org/pe-repo/concytec/terminos#ruc",
      "value": "20148421014"
    },
    {
      "scheme": "https://ror.org",
      "value": "https://ror.org/012345678"
    },
    {
      "scheme": "https://www.grid.ac",
      "value": "grid.12345.6"
    },
    {
      "scheme": "https://isni.org",
      "value": "0000000123456789"
    }
  ],
  "countryCode": "PE",
  "address": {
    "street": "Av. Universidad 123",
    "city": "Ica",
    "region": "Ica",
    "postalCode": "11001"
  },
  "parentOrgUnit": {
    "id": "OrgUnits/00000001"
  },
  "websites": [
    {
      "type": "homepage",
      "url": "https://www.unica.edu.pe"
    },
    {
      "type": "cris",
      "url": "https://cris.unica.edu.pe"
    }
  ],
  "classifications": [
    {
      "scheme": "https://purl.org/pe-repo/concytec/tipoOrganizacion",
      "value": "Institucion principal"
    }
  ],
  "lastModified": "2026-02-20T12:00:00Z"
}
```

---

## 9. JSON de Publicaciones

Ejemplo completo de una publicacion con identificadores (Handle, DOI, ISBN/ISSN, PMCID, ISI/SCP, URL), autores, editores, publicador, fechas, idioma, licencia, relaciones (publishedIn/partOf), origin (proyecto/financiamiento) y metadatos RENATI.

```json
{
  "id": "Publications/894518",
  "type": {
    "scheme": "https://www.openaire.eu/cerif-profile/vocab/COAR_Publication_Types",
    "value": "http://purl.org/coar/resource_type/c_0640"
  },
  "title": [
    {
      "value": "Revista de Investigaciones Veterinarias del Peru"
    },
    {
      "value": "Peruvian Journal of Veterinary Research"
    }
  ],
  "identifiers": [
    {
      "type": "Handle",
      "value": "https://hdl.handle.net/20.500.12345/9876"
    },
    {
      "type": "DOI",
      "value": "10.15381/pc.v24i1.16559"
    },
    {
      "type": "ISBN",
      "value": "978-9972-674-04-4"
    },
    {
      "type": "ISSN",
      "value": "1609-9117"
    },
    {
      "type": "PMCID",
      "value": "PMC7425445"
    },
    {
      "type": "ISI-Number",
      "value": "000245099300013"
    },
    {
      "type": "SCP-Number",
      "value": "2-s2.0-85045579729"
    },
    {
      "type": "URL",
      "value": "http://www.revistas.uni.edu.pe/index.php/devenir/article/view/757/1288"
    }
  ],
  "publishedIn": {
    "publication": {
      "id": "Publications/894518",
      "type": "http://purl.org/coar/resource_type/c_0640",
      "title": [
        {
          "value": "Revista de Investigaciones Veterinarias del Peru"
        }
      ],
      "issn": [
        "1609-9117"
      ]
    }
  },
  "partOf": {
    "publication": {
      "id": "Publications/756818",
      "type": "http://purl.org/coar/resource_type/c_2f33",
      "title": [
        {
          "value": "Salud, interculturalidad y comportamiento de riesgo"
        }
      ],
      "isbn": [
        "978-9972-615-58-0"
      ]
    }
  },
  "authors": [
    {
      "person": {
        "id": "Persons/28521427",
        "personName": {
          "familyNames": "Cabrera Sanchez",
          "firstNames": "Paolo Edgar",
          "fullName": "Paolo Edgar Cabrera Sanchez"
        },
        "identifiers": [
          {
            "scheme": "http://purl.org/pe-repo/concytec/terminos#dni",
            "value": "08755499"
          },
          {
            "scheme": "https://orcid.org",
            "value": "https://orcid.org/0000-0001-8247-8975"
          },
          {
            "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#ResearcherID",
            "value": "HRC-7754-2023"
          },
          {
            "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#ScopusAuthorID",
            "value": "57123456789"
          }
        ],
        "emails": [
          "paolo.cabrera@unica.edu.pe"
        ],
        "affiliations": [
          {
            "orgUnit": {
              "id": "OrgUnits/38498322",
              "name": "Universidad Nacional San Luis Gonzaga"
            },
            "role": "Autor",
            "startDate": "2020-01-01"
          }
        ],
        "keywords": [
          {
            "value": "Ciencias veterinarias"
          }
        ],
        "lastModified": "2026-02-20T12:00:00Z"
      },
      "affiliations": [
        {
          "orgUnit": {
            "id": "OrgUnits/38498322",
            "acronym": "UNSLG",
            "name": [
              {
                "value": "Universidad Nacional San Luis Gonzaga"
              },
              {
                "value": "National University San Luis Gonzaga"
              }
            ],
            "type": "Institucion principal",
            "identifiers": [
              {
                "scheme": "https://purl.org/pe-repo/concytec/terminos#ruc",
                "value": "20148421014"
              },
              {
                "scheme": "https://ror.org",
                "value": "https://ror.org/012345678"
              },
              {
                "scheme": "https://www.grid.ac",
                "value": "grid.12345.6"
              },
              {
                "scheme": "https://isni.org",
                "value": "0000000123456789"
              }
            ],
            "countryCode": "PE",
            "address": {
              "street": "Av. Universidad 123",
              "city": "Ica",
              "region": "Ica",
              "postalCode": "11001"
            },
            "parentOrgUnit": {
              "id": "OrgUnits/00000001"
            },
            "websites": [
              {
                "type": "homepage",
                "url": "https://www.unica.edu.pe"
              },
              {
                "type": "cris",
                "url": "https://cris.unica.edu.pe"
              }
            ],
            "classifications": [
              {
                "scheme": "https://purl.org/pe-repo/concytec/tipoOrganizacion",
                "value": "Institucion principal"
              }
            ],
            "lastModified": "2026-02-20T12:00:00Z"
          }
        }
      ],
      "order": 1
    },
    {
      "person": {
        "id": "Persons/28579219",
        "personName": {
          "familyNames": "Malpartida Morales",
          "firstNames": "Maria Luisa",
          "fullName": "Maria Luisa Malpartida Morales"
        },
        "identifiers": [
          {
            "scheme": "https://orcid.org",
            "value": "https://orcid.org/0000-0005-8754-877X"
          }
        ]
      },
      "affiliations": [
        {
          "orgUnit": {
            "id": "OrgUnits/39314778544",
            "name": [
              {
                "lang": "es",
                "value": "Universidad Peruana Cayetano Heredia"
              }
            ],
            "identifiers": [
              {
                "scheme": "ruc",
                "value": "20110768151"
              }
            ]
          }
        }
      ],
      "order": 2
    }
  ],
  "editors": [
    {
      "person": {
        "id": "Persons/21258497",
        "personName": {
          "familyNames": "Manrique Olivera",
          "firstNames": "Paola Judith",
          "fullName": "Paola Judith Manrique Olivera"
        },
        "identifiers": [
          {
            "scheme": "https://orcid.org",
            "value": "https://orcid.org/0000-0001-2874-9888"
          }
        ]
      },
      "order": 1
    }
  ],
  "publishers": [
    {
      "orgUnit": {
        "id": "OrgUnits/3082885",
        "name": [
          {
            "lang": "es",
            "value": "Universidad Nacional Agraria La Molina"
          }
        ]
      }
    }
  ],
  "publicationDate": "2013-08-25",
  "number": "5",
  "volume": "8",
  "issue": "2",
  "edition": "2a ed.",
  "startPage": "285",
  "endPage": "309",
  "language": [
    "es",
    "en"
  ],
  "license": [
    {
      "scheme": "https://www.openaire.eu/cerif-profile/vocab/LicenseTypes",
      "value": "CCAttribution(CCBY)"
    },
    {
      "url": "https://creativecommons.org/licenses/by/4.0/"
    }
  ],
  "originatesFrom": [
    {
      "project": {
        "id": "Projects/358478",
        "title": [
          {
            "value": "Sarna en vicunas: epidemiologia y estrategias para su prevencion y control"
          }
        ],
        "acronym": "SARNAVIC",
        "identifiers": [
          {
            "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#ProjectReference",
            "value": "160-2017"
          }
        ],
        "startDate": "2017-01-01",
        "endDate": "2020-10-31",
        "status": "completed",
        "abstract": [
          {
            "value": "Proyecto de ejemplo para interoperabilidad."
          }
        ],
        "keywords": [
          {
            "value": "Vicunas"
          },
          {
            "value": "Epidemiologia"
          }
        ],
        "subjects": [
          {
            "scheme": "https://purl.org/pe-repo/ocde/ford",
            "value": "https://purl.org/pe-repo/ocde/ford#1.06.05"
          }
        ],
        "participants": [
          {
            "person": {
              "id": "Persons/28521427",
              "name": "Paolo Edgar Cabrera Sanchez"
            },
            "role": "Investigador"
          },
          {
            "orgUnit": {
              "id": "OrgUnits/38498322",
              "name": "Universidad Nacional San Luis Gonzaga"
            },
            "role": "Institucion ejecutora"
          }
        ],
        "fundings": [
          {
            "id": "Fundings/187597"
          }
        ],
        "outputs": {
          "publications": [
            "Publications/894518"
          ],
          "patents": [],
          "products": []
        },
        "url": "https://cris.institucion.edu.pe/projects/358478",
        "lastModified": "2026-02-22T09:10:00Z"
      }
    },
    {
      "funding": {
        "id": "Fundings/187597",
        "title": [
          {
            "value": "Contrato No. 08-2019-FONDECYT"
          }
        ],
        "identifiers": [
          {
            "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#AwardNumber",
            "value": "08-2019-FON-DECYT"
          },
          {
            "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#FundRefID",
            "value": "http://dx.doi.org/10.13039/501100010751"
          }
        ],
        "fundedBy": {
          "orgUnit": {
            "id": "OrgUnits/854622",
            "acronym": "FONDECYT",
            "name": "Fondo Nacional de Desarrollo Cientifico, Tecnologico y de Innovacion Tecnologica"
          }
        },
        "amount": {
          "value": 250000.0,
          "currency": "PEN"
        },
        "startDate": "2019-01-01",
        "endDate": "2020-12-31",
        "relatedProjects": [
          "Projects/358478"
        ],
        "url": "https://funder.example.pe/awards/08-2019-FON-DECYT",
        "lastModified": "2026-02-22T09:10:00Z"
      }
    }
  ],
  "abstract": [
    {
      "value": "Este proyecto multidisciplinar e interinstitucional..."
    },
    {
      "value": "This multidisciplinary and inter-institutional project..."
    }
  ],
  "version": {
    "scheme": "http://purl.org/coar/version",
    "value": "http://purl.org/coar/version/c_970fb48d4fbd8a85"
  },
  "keywords": [
    {
      "value": "Silvicultura"
    },
    {
      "value": "Forestry"
    }
  ],
  "subjects": [
    {
      "scheme": "https://purl.org/pe-repo/ocde/ford",
      "value": "https://purl.org/pe-repo/ocde/ford#3.03.05"
    },
    {
      "scheme": "http://id.nlm.nih.gov/mesh",
      "value": "Epidemiological Surveillance"
    }
  ],
  "sponsorship": [
    {
      "value": "Esta investigacion se llevo a cabo en el marco de..."
    }
  ],
  "advisors": [
    {
      "person": {
        "id": "Persons/2185655",
        "personName": {
          "familyNames": "Gutierrez Gonzalez",
          "firstNames": "Martin Eduardo",
          "fullName": "Martin Eduardo Gutierrez Gonzalez"
        },
        "identifiers": [
          {
            "scheme": "dni",
            "value": "08755499"
          }
        ]
      }
    }
  ],
  "renatiType": {
    "scheme": "https://purl.org/pe-repo/renati/type",
    "value": "https://purl.org/pe-repo/renati/type#tesis"
  },
  "inSupportOf": {
    "qualification": {
      "title": "Maestro en Banca y Finanzas",
      "type": {
        "scheme": "https://purl.org/pe-repo/renati/level",
        "value": "https://purl.org/pe-repo/renati/level#maestro"
      },
      "discipline": {
        "scheme": "https://purl.org/pe-repo/inei/cpesutpt",
        "value": "412077"
      },
      "grantor": {
        "orgUnit": {
          "id": "OrgUnits/587498",
          "name": [
            {
              "value": "Facultad de Ingenieria"
            }
          ],
          "partOf": {
            "orgUnit": {
              "id": "OrgUnits/128753",
              "acronym": "UPC",
              "name": [
                {
                  "value": "Universidad Peruana de Ciencias Aplicadas"
                }
              ],
              "identifiers": [
                {
                  "scheme": "ruc",
                  "value": "20211614545"
                }
              ]
            }
          }
        }
      },
      "jurors": [
        {
          "person": {
            "id": "Persons/288725",
            "personName": {
              "familyNames": "Mariategui Suarez",
              "firstNames": "Miriam Josefina",
              "fullName": "Miriam Josefina Mariategui Suarez"
            },
            "identifiers": [
              {
                "scheme": "dni",
                "value": "10274587"
              }
            ]
          }
        },
        {
          "person": {
            "id": "Persons/288726",
            "personName": {
              "familyNames": "Lozada Martin",
              "firstNames": "Ruben Jesus",
              "fullName": "Ruben Jesus Lozada Martin"
            },
            "identifiers": [
              {
                "scheme": "dni",
                "value": "08974125"
              }
            ]
          }
        }
      ]
    }
  },
  "lastModified": "2026-02-20T12:00:00Z"
}
```

---

## 10. JSON de Equipamientos

Ejemplo completo de un equipamiento con identificadores (CRISID/serial), propietario (OrgUnit), ubicacion y relacion con productos/resultados.

```json
{
  "id": "Equipments/82394874",
  "name": [
    {
      "value": "Cromatografo de gases con detector de flama o llama"
    }
  ],
  "identifiers": [
    {
      "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#CRISID",
      "value": "F.5618"
    },
    {
      "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#SerialNumber",
      "value": "SN-CHROM-000123"
    }
  ],
  "type": "http://purl.org/coar/resource_type/c_2f33",
  "description": [
    {
      "value": "Equipo utilizado para analisis quimico."
    }
  ],
  "owner": {
    "orgUnit": {
      "id": "OrgUnits/38498322",
      "name": "Universidad Nacional San Luis Gonzaga"
    }
  },
  "location": {
    "campus": "Sede Central",
    "lab": "Laboratorio de Quimica Analitica"
  },
  "generatedOutputs": [
    "Products/258746"
  ],
  "url": "https://cris.institucion.edu.pe/equipment/82394874",
  "lastModified": "2026-02-18T11:00:00Z"
}
```

---

## 11. JSON de Patentes

Ejemplo completo de patente con numero, inventores, titulares, emisor, fechas, pais, materias (IPC) y relacion con proyectos/financiamientos.

```json
{
  "id": "Patents/284788",
  "type": "http://purl.org/coar/resource_type/9DKX-KSAF",
  "patentNumber": "000056-2010",
  "title": [
    {
      "value": "Valvula check para un circuito cerrado de bombeo de aire para un envase dispensador"
    }
  ],
  "inventors": [
    {
      "person": {
        "id": "Persons/2016875",
        "name": "Lizeth Maria Zarate Aguilar",
        "identifiers": [
          {
            "scheme": "dni",
            "value": "07928457"
          }
        ]
      }
    },
    {
      "person": {
        "id": "Persons/2875998",
        "name": "Marco Antonio Chaco Gomez",
        "identifiers": [
          {
            "scheme": "orcid",
            "value": "https://orcid.org/0000-0001-7291-6401"
          }
        ]
      }
    }
  ],
  "holders": [
    {
      "orgUnit": {
        "id": "OrgUnits/385244",
        "name": "Industrias Arguelles y Servicios Generales",
        "identifiers": [
          {
            "scheme": "ruc",
            "value": "20173136499"
          }
        ]
      }
    }
  ],
  "issuer": {
    "orgUnit": {
      "id": "OrgUnits/355471",
      "acronym": "INDECOPI",
      "name": "Instituto Nacional de Defensa de la Competencia y de la Proteccion de la Propiedad Intelectual"
    }
  },
  "registrationDate": "2010-01-25",
  "approvalDate": "2012-01-16",
  "countryCode": "PE",
  "language": [
    "es"
  ],
  "abstract": [
    {
      "value": "Resumen tecnico de la patente (ejemplo)."
    }
  ],
  "subjects": [
    {
      "scheme": "http://data.epo.org/linked-data/def/ipc/",
      "value": "http://data.epo.org/linked-data/def/ipc/A47K5-12"
    }
  ],
  "keywords": [
    {
      "value": "Dispensadores para jabon"
    }
  ],
  "url": "https://servicio.indecopi.gob.pe/portalSAE/Expedientes/consultaOIN.jsp?...",
  "originatesFrom": [
    {
      "project": {
        "id": "Projects/358478"
      }
    },
    {
      "funding": {
        "id": "Fundings/187597"
      }
    }
  ],
  "lastModified": "2026-02-19T08:00:00Z"
}
```

---

## 12. JSON de Financiamientos

Ejemplo completo de financiamiento con award number, funder, monto, fechas y relacion a proyectos.

```json
{
  "id": "Fundings/187597",
  "title": [
    {
      "value": "Contrato No. 08-2019-FONDECYT"
    }
  ],
  "identifiers": [
    {
      "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#AwardNumber",
      "value": "08-2019-FON-DECYT"
    },
    {
      "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#FundRefID",
      "value": "http://dx.doi.org/10.13039/501100010751"
    }
  ],
  "fundedBy": {
    "orgUnit": {
      "id": "OrgUnits/854622",
      "acronym": "FONDECYT",
      "name": "Fondo Nacional de Desarrollo Cientifico, Tecnologico y de Innovacion Tecnologica"
    }
  },
  "amount": {
    "value": 250000.0,
    "currency": "PEN"
  },
  "startDate": "2019-01-01",
  "endDate": "2020-12-31",
  "relatedProjects": [
    "Projects/358478"
  ],
  "url": "https://funder.example.pe/awards/08-2019-FON-DECYT",
  "lastModified": "2026-02-22T09:10:00Z"
}
```

---

## 13. JSON de Proyectos

Ejemplo completo de proyecto con participantes (personas y orgunits), estado, fechas, palabras clave, areas OCDE y salidas vinculadas.

```json
{
  "id": "Projects/358478",
  "title": [
    {
      "lang": "es",
      "value": "Sarna en vicunas: epidemiologia y estrategias para su prevencion y control"
    }
  ],
  "acronym": "SARNAVIC",
  "identifiers": [
    {
      "scheme": "https://w3id.org/cerif/vocab/IdentifierTypes#ProjectReference",
      "value": "160-2017"
    }
  ],
  "startDate": "2017-01-01",
  "endDate": "2020-10-31",
  "status": "completed",
  "abstract": [
    {
      "lang": "es",
      "value": "Proyecto de ejemplo para interoperabilidad."
    }
  ],
  "keywords": [
    {
      "lang": "es",
      "value": "Vicunas"
    },
    {
      "lang": "es",
      "value": "Epidemiologia"
    }
  ],
  "subjects": [
    {
      "scheme": "https://purl.org/pe-repo/ocde/ford",
      "value": "https://purl.org/pe-repo/ocde/ford#1.06.05"
    }
  ],
  "participants": [
    {
      "person": {
        "id": "Persons/28521427",
        "name": "Paolo Edgar Cabrera Sanchez"
      },
      "role": "Investigador"
    },
    {
      "orgUnit": {
        "id": "OrgUnits/38498322",
        "name": "Universidad Nacional San Luis Gonzaga"
      },
      "role": "Institucion ejecutora"
    }
  ],
  "fundings": [
    {
      "id": "Fundings/187597"
    }
  ],
  "outputs": {
    "publications": [
      "Publications/894518"
    ],
    "patents": [],
    "products": []
  },
  "url": "https://cris.institucion.edu.pe/projects/358478",
  "lastModified": "2026-02-22T09:10:00Z"
}
```

---

## 14. Ejemplos de respuestas de TODOS los verbos OAI-PMH

A continuacion se muestran ejemplos de respuestas equivalentes en JSON para cada verbo. Convencion usada para mapear XML a JSON: atributos con prefijo `@` y el texto del nodo en `#text`.

| Verbo | Uso principal | Ejemplo de request |
|---|---|---|
| Identify | Informacion del repositorio | `?verb=Identify` |
| ListMetadataFormats | Formatos disponibles (incluye perucris-cerif) | `?verb=ListMetadataFormats` |
| ListSets | Sets por entidad (persons, orgunits, ...) | `?verb=ListSets` |
| ListIdentifiers | Solo cabeceras (sin metadata) | `?verb=ListIdentifiers&metadataPrefix=perucris-cerif&set=publications` |
| ListRecords | Registros completos (cabecera + metadata) | `?verb=ListRecords&metadataPrefix=perucris-cerif&set=publications` |
| GetRecord | Un registro especifico por identifier | `?verb=GetRecord&metadataPrefix=perucris-cerif&identifier=oai:...` |

### 14.1 Identify (respuesta JSON)

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "@xsi:schemaLocation": "http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd",
    "responseDate": "2026-03-05T15:20:00Z",
    "request": {
      "@verb": "Identify",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "Identify": {
      "repositoryName": "CRIS Institucional - Universidad Ejemplo",
      "baseURL": "https://cris.institucion.edu.pe/oai",
      "protocolVersion": "2.0",
      "adminEmail": "admin@institucion.edu.pe",
      "earliestDatestamp": "2018-01-01T00:00:00Z",
      "deletedRecord": "persistent",
      "granularity": "YYYY-MM-DDThh:mm:ssZ"
    }
  }
}
```

### 14.2 ListMetadataFormats (respuesta JSON)

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:20:05Z",
    "request": {
      "@verb": "ListMetadataFormats",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListMetadataFormats": {
      "metadataFormat": [
        {
          "metadataPrefix": "oai_dc",
          "schema": "http://www.openarchives.org/OAI/2.0/oai_dc.xsd",
          "metadataNamespace": "http://www.openarchives.org/OAI/2.0/oai_dc/"
        },
        {
          "metadataPrefix": "perucris-cerif",
          "schema": "https://purl.org/pe-repo/perucris/cerif.xsd",
          "metadataNamespace": "https://purl.org/pe-repo/perucris/cerif"
        }
      ]
    }
  }
}
```

### 14.3 ListSets (respuesta JSON)

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:20:10Z",
    "request": {
      "@verb": "ListSets",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListSets": {
      "set": [
        {
          "setSpec": "persons",
          "setName": "Personas"
        },
        {
          "setSpec": "orgunits",
          "setName": "Unidades organizativas"
        },
        {
          "setSpec": "publications",
          "setName": "Publicaciones"
        },
        {
          "setSpec": "projects",
          "setName": "Proyectos"
        },
        {
          "setSpec": "fundings",
          "setName": "Financiamientos"
        },
        {
          "setSpec": "equipments",
          "setName": "Equipamientos"
        },
        {
          "setSpec": "patents",
          "setName": "Patentes"
        }
      ]
    }
  }
}
```

### 14.4 ListIdentifiers (respuesta JSON)

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:21:20Z",
    "request": {
      "@verb": "ListIdentifiers",
      "@metadataPrefix": "perucris-cerif",
      "@set": "publications",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListIdentifiers": {
      "header": [
        {
          "identifier": "oai:cris.institucion.edu.pe:Publications/894518",
          "datestamp": "2026-02-20T12:00:00Z",
          "setSpec": "publications"
        },
        {
          "identifier": "oai:cris.institucion.edu.pe:Publications/894519",
          "datestamp": "2026-02-21T10:30:00Z",
          "setSpec": "publications"
        }
      ],
      "resumptionToken": {
        "@cursor": "0",
        "@completeListSize": "250",
        "#text": "eyJwYWdlIjoyfQ=="
      }
    }
  }
}
```

### 14.5 ListRecords (respuesta JSON con resumptionToken)

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "responseDate": "2026-03-05T15:21:00Z",
    "request": {
      "@verb": "ListRecords",
      "@metadataPrefix": "perucris-cerif",
      "@set": "publications",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListRecords": {
      "record": [
        {
          "header": {
            "identifier": "oai:cris.institucion.edu.pe:Publications/894518",
            "datestamp": "2026-02-20T12:00:00Z",
            "setSpec": "publications"
          },
          "metadata": {
            "Publication": {
              "@id": "Publications/894518",
              "@xmlns": "https://purl.org/pe-repo/perucris/cerif",
              "Type": {
                "@xmlns": "https://www.openaire.eu/cerif-profile/vocab/COAR_Publication_Types",
                "#text": "http://purl.org/coar/resource_type/c_6501"
              },
              "Title": [
                {
                  "#text": "Efecto de la altitud en la variabilidad climatica"
                },
                {
                  "#text": "Effect of altitude on climate variability"
                }
              ],
              "DOI": "10.1234/abcd.2026.0001",
              "Handle": "https://hdl.handle.net/20.500.12345/9876",
              "PublicationDate": "2026-01-15",
              "Language": "es",
              "Abstract": {
                "#text": "Resumen de ejemplo."
              },
              "Keyword": {
                "#text": "Clima"
              },
              "Subject": {
                "@scheme": "https://purl.org/pe-repo/ocde/ford",
                "#text": "https://purl.org/pe-repo/ocde/ford#1.05.01"
              }
            }
          }
        }
      ],
      "resumptionToken": {
        "@cursor": "0",
        "@completeListSize": "250",
        "#text": "eyJwYWdlIjoyfQ=="
      }
    }
  }
}
```

### 14.6 ListRecords (continuacion con resumptionToken) (respuesta JSON)

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:21:10Z",
    "request": {
      "@verb": "ListRecords",
      "@resumptionToken": "eyJwYWdlIjoyfQ==",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "ListRecords": {
      "_comment": "siguientes records...",
      "resumptionToken": {
        "@cursor": "100",
        "@completeListSize": "250",
        "#text": "eyJwYWdlIjozfQ=="
      }
    }
  }
}
```

### 14.7 GetRecord (respuesta JSON)

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:21:30Z",
    "request": {
      "@verb": "GetRecord",
      "@metadataPrefix": "perucris-cerif",
      "@identifier": "oai:cris.institucion.edu.pe:Publications/894518",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "GetRecord": {
      "record": {
        "header": {
          "identifier": "oai:cris.institucion.edu.pe:Publications/894518",
          "datestamp": "2026-02-20T12:00:00Z",
          "setSpec": "publications"
        },
        "metadata": {
          "Publication": {
            "@id": "Publications/894518",
            "@xmlns": "https://purl.org/pe-repo/perucris/cerif",
            "Type": {
              "@xmlns": "https://www.openaire.eu/cerif-profile/vocab/COAR_Publication_Types",
              "#text": "http://purl.org/coar/resource_type/c_6501"
            },
            "Title": [
              {
                "#text": "Efecto de la altitud en la variabilidad climatica"
              },
              {
                "#text": "Effect of altitude on climate variability"
              }
            ],
            "DOI": "10.1234/abcd.2026.0001",
            "Handle": "https://hdl.handle.net/20.500.12345/9876",
            "PublicationDate": "2026-01-15",
            "Language": "es",
            "Abstract": {
              "#text": "Resumen de ejemplo."
            },
            "Keyword": {
              "#text": "Clima"
            },
            "Subject": {
              "@scheme": "https://purl.org/pe-repo/ocde/ford",
              "#text": "https://purl.org/pe-repo/ocde/ford#1.05.01"
            }
          }
        }
      }
    }
  }
}
```

### 14.8 Ejemplo de error OAI-PMH (respuesta JSON)

```json
{
  "OAI-PMH": {
    "@xmlns": "http://www.openarchives.org/OAI/2.0/",
    "responseDate": "2026-03-05T15:21:40Z",
    "request": {
      "@verb": "ListRecords",
      "@metadataPrefix": "perucris-cerif",
      "@set": "unknown",
      "#text": "https://cris.institucion.edu.pe/oai"
    },
    "error": {
      "@code": "noSetHierarchy",
      "#text": "El set solicitado no existe o no esta habilitado."
    }
  }
}
```
