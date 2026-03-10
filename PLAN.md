# 📋 PLAN DE IMPLEMENTACIÓN: API JSON PerúCRIS 1.1 - RAIS UNMSM

**Fecha:** 10 de marzo de 2026  
**Objetivo:** Adaptar RAIS-API para devolver JSON que cumpla con las directrices PerúCRIS 1.1  
**Restricción:** Solo usar tablas y columnas existentes en la BD  
**Alcance:** Campos obligatorios y opcionales según PerúCRIS 1.1  

---

## 📊 TAREAS PRINCIPALES

### TAREA 1: Analizar Mapeo de Campos PerúCRIS ↔ BD
**Estado:** ⏳ Pendiente  
**Tiempo Estimado:** 4 horas  
**Descripción:**
- Leer el documento `Directrices_PerúCRIS_versión 1.1_junio2024.pdf`
- Identificar campos obligatorios y opcionales para cada entidad
- Mapear campos PerúCRIS a columnas de BD existentes
- Documentar gaps y soluciones (ejemplos: idioma NULL → "es", campos calculados, etc.)
- Crear archivo `MAPEO_PERUCRIS_BD.md`

**Deliverables:**
- ✅ MAPEO_PERUCRIS_BD.md: Tabla de correspondencia PerúCRIS ↔ BD para cada entidad

---

### TAREA 2: Diseñar Estructura de Respuesta JSON
**Estado:** ⏳ Pendiente  
**Tiempo Estimado:** 3 horas  
**Descripción:**
- Diseñar estructura JSON que respete PerúCRIS 1.1 sin ser OAI-PMH XML
- Incluir campos obligatorios, opcionales, identificadores y vocabularios controlados
- Especificar formato para:
  - Publicación (Publication)
  - Proyecto (Project)
  - Patente (Patent)
  - Persona (Person) - derivada de Usuario_investigador
  - Unidad Organizativa (OrganizationalUnit) - derivada de Facultad/Instituto
- Crear esquema en `ESTRUCTURA_JSON_PERUCRIS.md`

**Deliverables:**
- ✅ ESTRUCTURA_JSON_PERUCRIS.md: Especificación de estructura JSON con ejemplos

---

### TAREA 3: Enriquecer Modelos de Datos (Repositories)
**Estado:** ⏳ Pendiente  
**Tiempo Estimado:** 8 horas  
**Descripción:**
- Actualizar `src/repositories/publicacion.repository.js` para retornar campos completos
- Actualizar `src/repositories/proyecto.repository.js`
- Crear `src/repositories/patente.repository.js` (si no existe)
- Crear `src/repositories/persona.repository.js` (datos de Usuario_investigador)
- Crear `src/repositories/unidadOrganizativa.repository.js` (Facultad/Instituto)
- Incluir TODAS las columnas relevantes de la BD
- Aplicar transformaciones: idioma NULL → "es", fechas con formato ISO, etc.

**Deliverables:**
- ✅ Todos los repositories actualizados con campos PerúCRIS

---

### TAREA 4: Crear Formateadores JSON-PerúCRIS
**Estado:** ⏳ Pendiente  
**Tiempo Estimado:** 12 horas  
**Descripción:**
- Crear `src/formatters/publicacion.formatter.js`: mapea datos BD → estructura JSON PerúCRIS
- Crear `src/formatters/proyecto.formatter.js`
- Crear `src/formatters/patente.formatter.js`
- Crear `src/formatters/persona.formatter.js`
- Crear `src/formatters/unidadOrganizativa.formatter.js`
- Incluir lógica para:
  - Mapeo de campos
  - Aplicación de vocabularios controlados (OCDE, COAR, ISO 639-1, etc.)
  - Enriquecimiento de identificadores (ORCID, DOI, ISSN, Scopus ID, RENACYT)
  - Construcciones de arrays (creadores, colaboradores, palabras clave)
  - Manejo de valores NULL y valores por defecto

**Deliverables:**
- ✅ 5 formateadores implementados y funcionales

---

### TAREA 5: Implementar Controladores y Rutas
**Estado:** ⏳ Pendiente  
**Tiempo Estimado:** 10 horas  
**Descripción:**
- Crear/actualizar controladores para cada entidad:
  - `/api/publicaciones` (GET con paginación, filtros)
  - `/api/publicaciones/:id` (GET detalle)
  - `/api/proyectos` (GET con paginación)
  - `/api/proyectos/:id`
  - `/api/patentes`
  - `/api/patentes/:id`
  - `/api/personas`
  - `/api/personas/:id`
  - `/api/unidades-organizativas`
  - `/api/unidades-organizativas/:id`
- Implementar paginación, filtros, búsqueda
- Incluir validaciones con Zod
- Manejo de errores consistente

**Deliverables:**
- ✅ Todos los endpoints implementados y funcionando

---

### TAREA 6: Documentar en README.md
**Estado:** ⏳ Pendiente  
**Tiempo Estimado:** 4 horas  
**Descripción:**
- Actualizar README.md con:
  - Descripción de cumplimiento PerúCRIS 1.1
  - Especificación de cada endpoint
  - Ejemplos de respuestas JSON
  - Mapeo de campos PerúCRIS a respuestas
  - Vocabularios controlados soportados
  - Identificadores soportados
  - Guía de paginación y filtros
  - Restricción de solo datos validados (validado = 1)

**Deliverables:**
- ✅ README.md completo y actualizado

---

### TAREA 7: Testing y Validación
**Estado:** ⏳ Pendiente  
**Tiempo Estimado:** 6 horas  
**Descripción:**
- Crear tests unitarios para cada formateador
- Crear tests de integración para cada endpoint
- Validar que respuestas JSON cumplen estructura PerúCRIS
- Probar con datos reales de la BD
- Validar filtros, paginación y búsqueda
- Documentar casos de prueba

**Deliverables:**
- ✅ Suite de tests completa
- ✅ Reporte de cobertura

---

### TAREA 8: Crear Script de Validación PerúCRIS
**Estado:** ⏳ Pendiente  
**Tiempo Estimado:** 3 horas  
**Descripción:**
- Crear `scripts/validar-perucris.js`: valida que respuestas JSON cumplan con estructura PerúCRIS
- Verificar campos obligatorios presentes
- Verificar tipos de datos correctos
- Verificar identificadores válidos
- Ejecutar contra muestras de cada entidad

**Deliverables:**
- ✅ Script de validación funcional

---

## 📈 PROGRESO

| # | Tarea | Estado | Tiempo |
|---|-------|--------|--------|
| 1 | Analizar Mapeo PerúCRIS ↔ BD | ⏳ Pendiente | 4h |
| 2 | Diseñar Estructura JSON | ⏳ Pendiente | 3h |
| 3 | Enriquecer Repositories | ⏳ Pendiente | 8h |
| 4 | Crear Formateadores | ⏳ Pendiente | 12h |
| 5 | Implementar Controladores | ⏳ Pendiente | 10h |
| 6 | Documentar en README.md | ⏳ Pendiente | 4h |
| 7 | Testing y Validación | ⏳ Pendiente | 6h |
| 8 | Script de Validación | ⏳ Pendiente | 3h |
| | **TOTAL ESTIMADO** | | **50h** |

---

## 🎯 DEFINICIONES Y RESTRICCIONES

### Entidades Soportadas
1. **Publicación** (Publication) - Tablas: `Publicacion`, `Publicacion_autor`, `Publicacion_revista`
2. **Proyecto** (Project) - Tablas: `Proyecto`, `Proyecto_integrante`
3. **Patente** (Patent) - Tablas: `Patente`, `Patente_autor`
4. **Persona** (Person) - Tabla: `Usuario_investigador` (derivada de autores/integrantes)
5. **Unidad Organizativa** (OrganizationalUnit) - Tablas: `Facultad`, `Instituto`, `Grupo` (derivada de organizaciones)

### Restricción Principal
- ✅ **SOLO datos con `validado = 1`** (registros públicos)
- ✅ Solo usar columnas existentes en la BD
- ✅ No crear nuevas tablas
- ✅ Respuestas en JSON (no XML)

### Vocabularios Controlados a Soportar
| Vocabulario | Fuente | Aplicable a |
|-------------|--------|-------------|
| **OCDE** | Tabla `OCDE` en BD | Proyectos, Publicaciones |
| **COAR** | Mapeo local de tipos | Publicaciones (tipo documento) |
| **ISO 639-1** | Códigos de idioma | Publicaciones (idioma) |
| **ISO 3166-1** | Códigos de país | Publicaciones (país) |
| **ISO 8601** | Formato de fecha | Todas las fechas |
| **RENATI** | Tabla `Usuario_investigador` | Personas |

### Identificadores a Soportar
| Identificador | Almacenado en | Tipo de Dato |
|---------------|---------------|-------------|
| **ORCID** | `Publicacion_autor.codigo_orcid` | string |
| **DOI** | `Publicacion.doi` | string |
| **ISSN** | `Publicacion.issn` | string |
| **ISBN** | `Publicacion.isbn` | string |
| **Scopus ID** | `Usuario_investigador` (si existe) | string |
| **RENACYT** | `Usuario_investigador` (si existe) | string |

---

## 📝 NOTAS IMPORTANTES

1. **Idioma NULL:** Campo `Publicacion.idioma` tiene 96.4% NULL. Solución: por defecto = "es" (español)

2. **Personas como Entidad:** No existe tabla `Persona`. Solución: derivarla desde:
   - `Usuario_investigador` (tabla principal)
   - Deduplicar autores de `Publicacion_autor`
   - Deduplicar integrantes de `Proyecto_integrante`

3. **Unidades Organizativas:** Datos en tablas separadas:
   - `Facultad` (23 registros)
   - `Instituto` (50 registros)
   - `Grupo` (628 registros)
   - Crear jerarquía en respuesta JSON

4. **Paginación:** Implementar con offset/limit estándar:
   - Parámetros: `?page=1&limit=20`
   - Response: `{ data: [...], total: N, page: 1, totalPages: X }`

5. **Filtros:** Soportar búsqueda básica:
   - `?q=texto` (búsqueda en titulo, resumen)
   - `?from_date=2020-01-01&to_date=2024-12-31` (rango de fechas)
   - `?tipo=articulo` (tipo de documento)

---

## 🚀 PRÓXIMO PASO

Ejecutar **TAREA 1: Analizar Mapeo de Campos PerúCRIS ↔ BD**

