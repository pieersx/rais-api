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


2. **`Publicacion_categoria`**:

3. **`Publicacion_autor`**:


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
