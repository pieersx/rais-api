# 🚀 Especificación Técnica: API OAI-PMH JSON - RAIS UNMSM

## 1. Descripción del Proyecto
Desarrollo desde cero del backend y la API REST para el sistema RAIS (Registro de Actividades de Investigación San Marcos). El objetivo es exponer los datos de investigación (Publicaciones y Proyectos) a CONCYTEC / PerúCRIS utilizando la lógica y los verbos del protocolo **OAI-PMH** 2.0, pero devolviendo las respuestas en **formato JSON** en lugar de XML.

## 2. Cronograma de Trabajo (5 Semanas)
De acuerdo con el cronograma oficial:
https://rais.unmsm.edu.pe/api/oai?verb=

Identify
ListMetadataFormats
ListSets
ListIdentifiers
ListRecords
GetRecord

* **Semana 1:** Análisis de requerimientos y Diseño de la Base de Datos.
* **Semana 2:** Configuración del Backend (Node.js, Express, Conexión a Base de Datos).
* **Semana 3:** Implementación de los verbos de configuración OAI-PMH (`Identify`, `ListSets`, `ListMetadataFormats`).
* **Semana 4:** Implementación de los verbos de datos (`GetRecord`, `ListIdentifiers`, `ListRecords` con paginación/resumptionToken).
* **Semana 5:** Pruebas, validación de interoperabilidad con CONCYTEC (según Directrices PerúCRIS) y Pase a Producción.

## 3. Stack Tecnológico (Backend 2026)
* **Runtime:** Node.js v24.x
* **Framework:** Express.js (ES Modules habilitados `type: module`)
* **Base de Datos:** MySQL
* **ORM / Query Builder:** `mysql2/promise`
* **Validación de Datos:** `zod`
* **Gestor de Paquetes:** `pnpm`

## 4. Estructura de la Base de Datos (Tablas Clave)
El sistema consumirá datos de las siguientes tablas existentes:

1. **`Publicacion`**:
"id","bigint unsigned","NO","PRI","","auto_increment"
"categoria_id","bigint unsigned","YES","MUL","",""
"codigo_registro","varchar(9)","YES","","",""
"cod_old","varchar(10)","YES","","",""
"isbn","varchar(50)","YES","","",""
"issn","varchar(50)","YES","","",""
"issn_e","varchar(15)","YES","","",""
"doi","varchar(150)","YES","","",""
"uri","text","YES","","",""
"titulo","text","YES","","",""
"resumen","blob","YES","","",""
"publicacion_nombre","varchar(250)","YES","","",""
"evento_nombre","varchar(250)","YES","","",""
"volumen","varchar(20)","YES","","",""
"edicion","varchar(20)","YES","","",""
"editorial","varchar(250)","YES","","",""
"editor","varchar(100)","YES","","",""
"pais_codigo","varchar(4)","YES","","",""
"pais","varchar(50)","YES","","",""
"lugar_publicacion","varchar(100)","YES","","",""
"universidad","varchar(250)","YES","","",""
"pagina_inicial","varchar(10)","YES","","",""
"pagina_final","varchar(10)","YES","","",""
"pagina_total","varchar(20)","YES","","",""
"fecha_publicacion","date","YES","","",""
"fecha_inicio","date","YES","","",""
"fecha_fin","date","YES","","",""
"fecha_inscripcion","datetime","YES","","",""
"tipo_publicacion","varchar(50)","NO","","",""
"formato","varchar(50)","YES","","",""
"comentario","text","YES","","",""
"observaciones_usuario","text","YES","","",""
"validado","tinyint(1)","YES","","",""
"url","varchar(250)","YES","","",""
"step","mediumint","YES","","",""
"estado","mediumint","YES","","",""
"tipo_tesis","varchar(255)","YES","","",""
"libro_resumen","varchar(255)","YES","","",""
"ciudad_edicion","varchar(255)","YES","","",""
"ciudad","varchar(255)","YES","","",""
"tipo_presentacion","varchar(255)","YES","","",""
"nombre_evento","varchar(255)","YES","","",""
"tipo_participacion","varchar(255)","YES","","",""
"publicacion_indexada","varchar(255)","YES","","",""
"year_publicacion","year","YES","","",""
"tipo_patente","varchar(255)","YES","","",""
"repositorio_tesis","text","YES","","",""
"nombre_libro","varchar(255)","YES","","",""
"art_tipo","varchar(255)","YES","","",""
"idioma","varchar(255)","YES","","",""
"source","varchar(255)","YES","","",""
"tipo_doc","varchar(255)","YES","","",""
"audit","text","YES","","",""
"resolucion","varchar(255)","YES","","",""
"created_at","timestamp","YES","","",""
"updated_at","timestamp","YES","","",""

2. **`Publicacion_categoria`**:
"id","bigint unsigned","NO","PRI","","auto_increment"
"rr","varchar(255)","YES","","",""
"tipo","varchar(255)","NO","","",""
"categoria","varchar(255)","NO","","",""
"titulo","varchar(255)","NO","","",""
"puntaje","decimal(8,2)","NO","","",""
"compartir","tinyint(1)","NO","","0",""
"monto_rec","decimal(8,2)","NO","","0.00",""
"created_at","timestamp","YES","","",""
"updated_at","timestamp","YES","","",""


3. **`Publicacion_autor`**:
"id","bigint unsigned","NO","PRI","","auto_increment"
"publicacion_id","bigint unsigned","NO","MUL","",""
"investigador_id","bigint unsigned","YES","MUL","",""
"codigo_orcid","varchar(100)","YES","","",""
"nro_registro","varchar(50)","YES","","",""
"fecha_registro","date","YES","","",""
"doc_tipo","varchar(50)","YES","","",""
"doc_numero","varchar(10)","YES","","",""
"autor","varchar(150)","YES","","",""
"nombres","varchar(100)","YES","","",""
"apellido1","varchar(50)","YES","","",""
"apellido2","varchar(50)","YES","","",""
"tipo","varchar(10)","YES","","",""
"categoria","varchar(50)","YES","","",""
"presentado","tinyint(1)","YES","","",""
"orden","int","YES","","",""
"puntaje","decimal(8,2)","YES","","",""
"filiacion","tinyint(1)","YES","","",""
"filiacion_unica","tinyint(1)","YES","","",""
"estado","tinyint(1)","NO","","0",""
"created_at","timestamp","YES","","",""
"updated_at","timestamp","YES","","",""


**⚠️ REGLA DE NEGOCIO CRÍTICA:** Solo se deben exponer a través de la API aquellos registros que tengan el campo `validado = 1` (registros públicos).

## 5. Arquitectura del Código (Service Pattern)
```text
src/
├── config/         # Pool de conexión a MySQL
├── controllers/    # Orquestador de peticiones (req, res)
├── middlewares/    # Zod validator para el parámetro 'verb'
├── models o repositories? /         # Consultas SQL a Publicacion y Proyecto
├── services/       # Lógica de los 6 verbos y Paginación
├── routes/         # Ruta: GET /api/oai
├── app.js          # Configuración de Express y CORS
└── server.js       # Punto de entrada (app.listen)
