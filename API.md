# RAIS-API: OAI-PMH 2.0 JSON API

API de datos abiertos del **Registro de Actividades de Investigacion San Marcos (RAIS)** de la Universidad Nacional Mayor de San Marcos. Expone publicaciones, proyectos de investigacion y patentes siguiendo el protocolo OAI-PMH 2.0, con respuestas en formato JSON.

---

## Informacion General

| Campo | Valor |
|-------|-------|
| **Base URL** | `https://rais.unmsm.edu.pe/api/oai` |
| **Protocolo** | OAI-PMH 2.0 (JSON) |
| **Autenticacion** | Publica (sin autenticacion) |
| **Formato de metadatos** | `oai_dc` (Dublin Core) |
| **Metodo HTTP** | `GET` |
| **Formato de respuesta** | `application/json` |
| **Paginacion** | 100 registros por pagina (configurable via `PAGE_SIZE`) |

### Entidades expuestas

| Entidad | Descripcion | Registros |
|---------|-------------|-----------|
| `publicacion` | Publicaciones de investigacion (articulos, tesis, libros, capitulos, ensayos, eventos) | ~59,543 |
| `proyecto` | Proyectos de investigacion (con y sin financiamiento, tesis, eventos, etc.) | ~6,690 |
| `patente` | Patentes y registros de propiedad intelectual | ~406 |

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
  "responseDate": "2026-03-07T06:00:00.000Z",
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
      "sampleIdentifier": "oai:rais.unmsm.edu.pe:publicacion/2"
    },
    "entityTypes": [
      {
        "type": "publicacion",
        "count": 59543,
        "description": "Publicaciones de investigacion (articulos, tesis, libros, etc.)"
      },
      {
        "type": "proyecto",
        "count": 6690,
        "description": "Proyectos de investigacion financiados y no financiados"
      },
      {
        "type": "patente",
        "count": 406,
        "description": "Patentes y registros de propiedad intelectual"
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
      "metadataPrefix": "oai_dc",
      "schema": "http://www.openarchives.org/OAI/2.0/oai_dc.xsd",
      "metadataNamespace": "http://purl.org/dc/elements/1.1/"
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
| `metadataPrefix` | Si* | Formato de metadatos (`oai_dc`) |
| `set` | No | Filtrar por set (ej. `publicacion:articulo`, `facultad:1`, `ocde:3`) |
| `from` | No | Fecha inicio ISO 8601 (ej. `2024-01-01`) |
| `until` | No | Fecha fin ISO 8601 (ej. `2024-12-31`) |
| `resumptionToken` | No | Token de paginacion (excluye los demas parametros) |

*\*Requerido cuando `resumptionToken` no esta presente.*

**Ejemplos:**
```
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_dc
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_dc&set=publicacion:articulo
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_dc&set=facultad:1
GET /api/oai?verb=ListIdentifiers&metadataPrefix=oai_dc&set=ocde:3&from=2020-01-01
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

Retorna registros completos con encabezados y metadatos Dublin Core. Mismos parametros que `ListIdentifiers`.

**Endpoint:**
```
GET /api/oai?verb=ListRecords&metadataPrefix=oai_dc
```

**Parametros:** Identicos a `ListIdentifiers`.

**Ejemplos:**
```
GET /api/oai?verb=ListRecords&metadataPrefix=oai_dc&set=proyecto:PCONFIGI
GET /api/oai?verb=ListRecords&metadataPrefix=oai_dc&set=patente
GET /api/oai?verb=ListRecords&metadataPrefix=oai_dc&set=facultad:10&from=2023-01-01
```

**Respuesta:**
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
        "dc:title": "Human and porcine Taenia solium infection...",
        "dc:creator": [
          { "name": "GILMAN, R.H." },
          { "name": "VERASTEGUI, M." }
        ],
        "dc:subject": ["Cysticercosis", "Taenia solium", "epidemiology"],
        "dc:description": "...",
        "dc:publisher": null,
        "dc:contributor": [...],
        "dc:date": "1999-00-00",
        "dc:type": "articulo",
        "dc:format": null,
        "dc:identifier": ["issn:0001-706X", "oai:rais.unmsm.edu.pe:publicacion/34"],
        "dc:source": "Acta Tropica, Editorial: ELSEVIER..., ISSN: 0001-706X, Vol. 73",
        "dc:language": null,
        "dc:relation": null,
        "dc:coverage": "NL",
        "dc:rights": null
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

---

### 6. GetRecord

Retorna un registro individual por su identificador OAI.

**Endpoint:**
```
GET /api/oai?verb=GetRecord&identifier={id}&metadataPrefix=oai_dc
```

**Parametros:**

| Parametro | Requerido | Descripcion |
|-----------|-----------|-------------|
| `identifier` | Si | Identificador OAI completo |
| `metadataPrefix` | Si | Formato de metadatos (`oai_dc`) |

**Formato de identificadores:**
```
oai:rais.unmsm.edu.pe:publicacion/{id}
oai:rais.unmsm.edu.pe:proyecto/{id}
oai:rais.unmsm.edu.pe:patente/{id}
```

**Ejemplos:**
```
GET /api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:publicacion/34&metadataPrefix=oai_dc
GET /api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:proyecto/1&metadataPrefix=oai_dc
GET /api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:patente/5&metadataPrefix=oai_dc
```

---

## Formato de Metadatos Dublin Core (oai_dc)

### Publicaciones

| Campo DC | Contenido |
|----------|-----------|
| `dc:title` | Titulo de la publicacion |
| `dc:creator` | Array de autores con `name`, `orcid`, `scopusId`, `researcherId`, `renacyt`, `filiacion` |
| `dc:subject` | Palabras clave + categoria |
| `dc:description` | Resumen + bases indexadas (Scopus, WoS, etc.) |
| `dc:publisher` | Editorial o universidad |
| `dc:contributor` | Autores con rol no principal (editores, asesores) |
| `dc:date` | Fecha de publicacion |
| `dc:type` | Tipo: `articulo`, `libro`, `tesis`, `capitulo`, `ensayo`, `evento`, `tesis-asesoria` |
| `dc:format` | Formato del documento |
| `dc:identifier` | Array: DOI, ISBN, ISSN, eISSN, URL, URI, identificador OAI |
| `dc:source` | Revista, editorial, ISSN, volumen, edicion, paginas, cobertura, ISI |
| `dc:language` | Idioma |
| `dc:relation` | URL + proyectos vinculados con codigo y entidad financiadora |
| `dc:coverage` | Pais, lugar de publicacion, pais de la revista |
| `dc:rights` | `info:eu-repo/semantics/openAccess` si tiene URL |

### Proyectos

| Campo DC | Contenido |
|----------|-----------|
| `dc:title` | Titulo del proyecto |
| `dc:creator` | Responsable(s) del proyecto con `name`, `orcid` |
| `dc:subject` | Palabras clave + linea de investigacion + area OCDE |
| `dc:description` | Resumen + monto asignado + periodo + duracion |
| `dc:publisher` | Universidad Nacional Mayor de San Marcos |
| `dc:contributor` | Integrantes no responsables con `name`, `role`, `orcid` |
| `dc:date` | Fecha de inicio o periodo |
| `dc:type` | Tipo de proyecto (PCONFIGI, PSINFINV, PTPGRADO, etc.) |
| `dc:identifier` | Codigo de proyecto + resolucion rectoral + identificador OAI |
| `dc:source` | Entidad financiadora o facultad |
| `dc:language` | `es` |
| `dc:relation` | Grupo de investigacion + facultad + instituto |
| `dc:coverage` | Localizacion del proyecto |

### Patentes

| Campo DC | Contenido |
|----------|-----------|
| `dc:title` | Titulo de la patente |
| `dc:creator` | Inventores con `name`, `orcid`, `scopusId`, `condicion`, `presentador` |
| `dc:subject` | Tipo de patente |
| `dc:description` | Comentario/descripcion |
| `dc:publisher` | Entidad(es) titular(es) |
| `dc:date` | Fecha de presentacion |
| `dc:type` | `patente:Patente de invencion`, `patente:Modelo de utilidad`, etc. |
| `dc:identifier` | Numero de registro + numero de expediente + enlace + identificador OAI |
| `dc:source` | Oficina de presentacion |
| `dc:relation` | Enlace web |
| `dc:rights` | Titular principal |

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

### Cosechar todas las publicaciones
```bash
# Primera pagina
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_dc&set=publicacion"

# Siguientes paginas (usar el token de la respuesta anterior)
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&resumptionToken=eyJjdXJzb3IiOjEwMCwi..."
```

### Cosechar articulos del 2024
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_dc&set=publicacion:articulo&from=2024-01-01&until=2024-12-31"
```

### Cosechar proyectos con financiamiento
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_dc&set=proyecto:PCONFIGI"
```

### Cosechar todo de la Facultad de Medicina (publicaciones + proyectos)
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListIdentifiers&metadataPrefix=oai_dc&set=facultad:1"
```

### Cosechar por area OCDE: Ciencias Medicas (publicaciones + proyectos)
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_dc&set=ocde:3"
```

### Obtener todas las patentes
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=ListRecords&metadataPrefix=oai_dc&set=patente"
```

### Obtener un registro especifico
```bash
curl "https://rais.unmsm.edu.pe/api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:publicacion/34&metadataPrefix=oai_dc"
curl "https://rais.unmsm.edu.pe/api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:proyecto/1&metadataPrefix=oai_dc"
curl "https://rais.unmsm.edu.pe/api/oai?verb=GetRecord&identifier=oai:rais.unmsm.edu.pe:patente/5&metadataPrefix=oai_dc"
```

### Script de cosecha completa (Python)
```python
import requests
import json

BASE = "https://rais.unmsm.edu.pe/api/oai"
records = []
params = {
    "verb": "ListRecords",
    "metadataPrefix": "oai_dc",
    "set": "publicacion:articulo"
}

while True:
    resp = requests.get(BASE, params=params).json()
    
    if "error" in resp:
        print(f"Error: {resp['error']['code']} - {resp['error']['message']}")
        break
    
    records.extend(resp.get("records", []))
    print(f"Cosechados: {len(records)} / {resp.get('resumptionToken', {}).get('completeListSize', len(records))}")
    
    token = resp.get("resumptionToken", {}).get("token")
    if not token:
        break
    
    params = {"verb": "ListRecords", "resumptionToken": token}

with open("articulos.json", "w") as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f"Total cosechado: {len(records)} articulos")
```

### Script de cosecha (Node.js)
```javascript
const BASE = 'https://rais.unmsm.edu.pe/api/oai';
const records = [];
let params = new URLSearchParams({
  verb: 'ListRecords',
  metadataPrefix: 'oai_dc',
  set: 'proyecto:PCONFIGI',
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

console.log(`Total: ${records.length} proyectos PCONFIGI`);
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
│   │   ├── publicacion.repository.js # Queries para publicaciones
│   │   ├── proyecto.repository.js    # Queries para proyectos
│   │   └── patente.repository.js     # Queries para patentes
│   ├── services/
│   │   ├── oai.service.js            # Dispatcher central
│   │   ├── identify.service.js       # Verb: Identify
│   │   ├── listSets.service.js       # Verb: ListSets
│   │   ├── listMetadataFormats.service.js
│   │   ├── getRecord.service.js      # Verb: GetRecord + formateo DC
│   │   ├── listIdentifiers.service.js # Verb: ListIdentifiers
│   │   ├── listRecords.service.js    # Verb: ListRecords
│   │   └── resumptionToken.js        # Paginacion stateless
│   ├── routes/
│   │   └── oai.routes.js             # GET /api/oai
│   └── utils/
│       ├── errors.js                 # Errores OAI-PMH
│       └── oaiIdentifier.js          # Construccion/parseo de IDs OAI
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

- **Reglas de negocio**: Solo se exponen publicaciones con `validado = 1` y proyectos/patentes con `estado >= 1`.
- **Formato de nombres**: `APELLIDO1 APELLIDO2, NOMBRES` (ej. "GARCIA PEREZ, JUAN CARLOS").
- **ORCID**: Se obtiene de `Usuario_investigador.codigo_orcid` con fallback a `Publicacion_autor.codigo_orcid`.
- **Revista**: Los datos de la revista (editorial, pais, cobertura) se enriquecen desde `Publicacion_revista` via matching ISSN/eISSN.
- **Sets multi-entidad**: `facultad:*` y `ocde:*` retornan publicaciones y proyectos. Las publicaciones se vinculan a facultades indirectamente via sus autores, y a areas OCDE via sus proyectos vinculados.
- **OCDE**: La jerarquia tiene 3 niveles (top -> mid -> leaf). El filtrado por codigo top-level recorre la jerarquia completa.
- **Paginacion**: Stateless, sin almacenamiento en BD. El token codifica todos los parametros necesarios en Base64url.
- **Fechas**: Las fechas `0000-00-00` de MySQL se manejan gracefully (retornan cadena vacia en el datestamp).
