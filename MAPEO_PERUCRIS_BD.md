# 🗺️ MAPEO: Directrices PerúCRIS 1.1 ↔ Base de Datos RAIS

**Fecha:** 10 de marzo de 2026  
**Propósito:** Documentar correspondencia entre campos PerúCRIS 1.1 obligatorios/opcionales y columnas de BD

---

## 1️⃣ PUBLICACIÓN (Publication)

### Campos Obligatorios (DEBE tener)

| Campo PerúCRIS | Columna BD | Tabla | Cobertura | Solución |
|----------------|-----------|-------|-----------|----------|
| **ID** | `id` | Publicacion | 100% | ✅ Usar directamente |
| **Título** | `titulo` | Publicacion | 100% | ✅ Usar directamente |
| **Fecha Publicación** | `fecha_publicacion` | Publicacion | 95% | ✅ ISO 8601 |
| **Tipo de Documento** | `tipo_publicacion` | Publicacion | 100% | ✅ Mapear a COAR URI |
| **Idioma** | `idioma` | Publicacion | 3.6% (CRÍTICO) | ⚠️ Por defecto = "es" |
| **Autores** | `codigo_orcid` + `nombres` | Publicacion_autor | 100% | ✅ Array de objetos |

### Campos Opcionales (PUEDE tener)

| Campo PerúCRIS | Columna BD | Tabla | Cobertura | Nota |
|----------------|-----------|-------|-----------|------|
| Resumen | `resumen` | Publicacion | 21.3% | blob → texto UTF-8 |
| DOI | `doi` | Publicacion | 18% | Validar formato |
| ISSN | `issn` | Publicacion | 39.3% | Usar directamente |
| ISBN | `isbn` | Publicacion | 11.8% | Validar formato |
| Editorial | `editorial` | Publicacion | Partial | Usar directamente |
| Volumen | `volumen` | Publicacion | Partial | Usar directamente |
| Edición | `edicion` | Publicacion | Partial | Usar directamente |
| Páginas (inicio-fin) | `pagina_inicial`, `pagina_final` | Publicacion | Partial | Concatenar: "10-25" |
| Lugar de Publicación | `lugar_publicacion` | Publicacion | Partial | Usar directamente |
| URL | `url` | Publicacion | Partial | Validar URL |
| País (ISO 3166) | `pais_codigo` | Publicacion | 90% | Código de 2 letras |
| Palabras Clave | NO DISPONIBLE | — | 0% | ⚠️ Usar resumen keywords si existe |
| Proyectos Relacionados | `codigo_registro` (ref) | Publicacion_proyecto | 30% | Buscar relaciones |
| Indexación | `publicacion_indexada` | Publicacion | Partial | Usar directamente |
| Scopus ID | `publicacion_index` | Publicacion_index | Partial | De tabla indexación |

### Mapeo de Tipo de Documento → COAR URI

| Tipo Local | COAR URI | COAR Label |
|-----------|----------|-----------|
| articulo | `http://purl.org/coar/resource_type/c_6501` | Journal Article |
| libro | `http://purl.org/coar/resource_type/c_3734` | Book |
| capitulo | `http://purl.org/coar/resource_type/c_3248` | Book Part |
| tesis | `http://purl.org/coar/resource_type/c_db06` | Doctoral Thesis |
| evento | `http://purl.org/coar/resource_type/c_5794` | Conference Paper |
| resumen_evento | `http://purl.org/coar/resource_type/c_8185` | Conference Abstract |
| ensayo | `http://purl.org/coar/resource_type/c_6947` | Article |
| revisión | `http://purl.org/coar/resource_type/c_4317` | Review |

### Estructura JSON Esperada (Publicación)

```json
{
  "id": "oai:rais.unmsm.edu.pe:publicacion/12345",
  "titulo": "Estudio de prevalencia de cysticercosis en Perú",
  "fecha_publicacion": "2023-05-15",
  "tipo_documento": {
    "local": "articulo",
    "coar_uri": "http://purl.org/coar/resource_type/c_6501"
  },
  "idioma": "es",
  "resumen": "Este es el resumen de la publicación...",
  "autores": [
    {
      "nombres": "GILMAN, R.H.",
      "orcid": "0000-0001-2345-6789",
      "scopus_id": "12345678",
      "filiacion_unmsm": true,
      "orden": 1
    }
  ],
  "doi": "10.1234/example",
  "issn": "0001-706X",
  "isbn": null,
  "editorial": "ELSEVIER",
  "volumen": "25",
  "edicion": null,
  "paginas": {
    "inicio": "234",
    "fin": "245"
  },
  "lugar_publicacion": "Amsterdam",
  "url": "https://example.com/pub",
  "pais": "NL",
  "proyectos_relacionados": [
    {
      "id": "oai:rais.unmsm.edu.pe:proyecto/1234",
      "titulo": "Proyecto de Investigación Principal"
    }
  ]
}
```

---

## 2️⃣ PROYECTO (Project)

### Campos Obligatorios

| Campo PerúCRIS | Columna BD | Tabla | Cobertura | Solución |
|----------------|-----------|-------|-----------|----------|
| **ID** | `id` | Proyecto | 100% | ✅ Usar directamente |
| **Título** | `titulo` | Proyecto | 100% | ✅ Usar directamente |
| **Fecha Inicio** | `fecha_inicio` | Proyecto | 95% | ✅ ISO 8601 |
| **Fecha Fin** | `fecha_fin` | Proyecto | 90% | ✅ ISO 8601 |
| **Investigador Principal** | `investigador_id` (PK) | Proyecto_integrante | 100% | ✅ Buscar rol "Responsable" |
| **Tipo de Proyecto** | `tipo_proyecto_id` | Proyecto | 100% | ✅ Uso directo |

### Campos Opcionales

| Campo PerúCRIS | Columna BD | Tabla | Cobertura | Nota |
|----------------|-----------|-------|-----------|------|
| Descripción/Resumen | NO DISPONIBLE | — | 0% | ⚠️ Usar título si no existe |
| Clasificación OCDE | `ocde_id` | Proyecto | 80.5% | ✅ Relación a tabla OCDE |
| Monto Asignado | `monto_asignado` | Proyecto | 4.1% | ⚠️ Prácticamente no capturado |
| Moneda | Implícito | — | — | PEN (Soles peruanos) |
| Línea Investigación | `linea_investigacion_id` | Proyecto | Partial | Join a tabla Linea_investigacion |
| Facultad | `facultad_id` | Proyecto | Partial | Join a tabla Facultad |
| Instituto | `instituto_id` | Proyecto | Partial | Join a tabla Instituto |
| Grupo | `grupo_id` | Proyecto | Partial | Join a tabla Grupo |
| Integrantes del Equipo | Múltiple | Proyecto_integrante | 100% | Array con roles |
| Estado | `estado` | Proyecto | 100% | Usar directamente |

### Estructura JSON Esperada (Proyecto)

```json
{
  "id": "oai:rais.unmsm.edu.pe:proyecto/5678",
  "titulo": "Epidemiología de enfermedades parasitarias en Perú rural",
  "fecha_inicio": "2021-01-15",
  "fecha_fin": "2024-12-31",
  "investigador_principal": {
    "id": "oai:rais.unmsm.edu.pe:persona/1234",
    "nombres": "GILMAN, R.H.",
    "orcid": "0000-0001-2345-6789",
    "facultad": "Medicina",
    "correo": "gilman@unmsm.edu.pe"
  },
  "tipo_proyecto": "Investigación Aplicada",
  "clasificacion_ocde": {
    "id": "3",
    "nivel": "Ciencias Médicas y de Salud",
    "subnivel": "3.2 Medicina clínica"
  },
  "linea_investigacion": "Parasitología y Control de Enfermedades",
  "unidad_organizativa": {
    "tipo": "Facultad",
    "nombre": "Medicina"
  },
  "monto_asignado": null,
  "integrantes": [
    {
      "id": "oai:rais.unmsm.edu.pe:persona/2234",
      "nombres": "MUÑOZ, C.",
      "rol": "Co-investigador",
      "orcid": "0000-0002-3456-7890"
    }
  ],
  "estado": "Activo"
}
```

---

## 3️⃣ PATENTE (Patent)

### Campos Obligatorios

| Campo PerúCRIS | Columna BD | Tabla | Cobertura | Solución |
|----------------|-----------|-------|-----------|----------|
| **ID** | `id` | Patente | 100% | ✅ Usar directamente |
| **Título** | `titulo` | Patente | 100% | ✅ Usar directamente |
| **Tipo de Patente** | `tipo_patente` | Patente | 100% | ✅ Usar directamente |
| **Número de Registro** | `nro_registro` | Patente | 99.1% | ✅ Usar directamente |
| **Fecha Presentación** | `fecha_presentacion` | Patente | 100% | ✅ ISO 8601 |
| **Inventores** | `codigo_orcid` + `nombres` | Patente_autor | 100% | ✅ Array de objetos |

### Campos Opcionales

| Campo PerúCRIS | Columna BD | Tabla | Cobertura | Nota |
|----------------|-----------|-------|-----------|------|
| Resumen | `comentario` | Patente | Partial | Usar si existe |
| Número de Expediente | `nro_expediente` | Patente | 87.6% | Usar directamente |
| Oficina de Presentación | `oficina_presentacion` | Patente | 97.4% | Usar directamente |
| Titulares | `titular1`, `titular2` | Patente | 100% | Array |
| Estado | `estado` | Patente | 100% | Usar directamente |
| URL | `url_web` | Patente | Partial | Validar URL |
| Palabras Clave | NO DISPONIBLE | — | 0% | Extraer del título si es necesario |

### Estructura JSON Esperada (Patente)

```json
{
  "id": "oai:rais.unmsm.edu.pe:patente/901",
  "titulo": "Sistema de purificación de agua mediante tecnología avanzada",
  "tipo_patente": "Patente de Invención",
  "numero_registro": "PE-2021-001234",
  "numero_expediente": "EXP-2020-45678",
  "fecha_presentacion": "2021-06-15",
  "oficina_presentacion": "INDECOPI",
  "inventores": [
    {
      "nombres": "RODRIGUEZ, J.",
      "orcid": null,
      "rol": "Inventor Principal",
      "orden": 1
    }
  ],
  "titulares": [
    {
      "nombre": "Universidad Nacional Mayor de San Marcos",
      "rol": "Titular"
    }
  ],
  "estado": "Concedida",
  "url": "https://indecopi.gob.pe/patentes/PE-2021-001234"
}
```

---

## 4️⃣ PERSONA (Person)

### Campos Obligatorios

| Campo PerúCRIS | Columna BD | Tabla | Cobertura | Solución |
|----------------|-----------|-------|-----------|----------|
| **ID** | `id` | Usuario_investigador | 100% | ✅ Usar directamente |
| **Nombres** | `nombres` | Usuario_investigador | 100% | ✅ Usar directamente |
| **Apellidos** | `apellido1` + `apellido2` | Usuario_investigador | 100% | ✅ Concatenar |
| **Identificador Persistente** | `codigo_orcid` O `renacyt` | Usuario_investigador | 14.8% ORCID / 2.9% RENACYT | ⚠️ CRÍTICA - Preferred: ORCID |

### Campos Opcionales

| Campo PerúCRIS | Columna BD | Tabla | Cobertura | Nota |
|----------------|-----------|-------|-----------|------|
| DNI/Doc Identidad | `documento_numero` | Usuario_investigador | 90% | Usar directamente |
| Email Profesional | `email` (múltiples) | Usuario_investigador | 60% | Usar email principal |
| Teléfono | `telefono` (múltiple) | Usuario_investigador | 30% | Usar principal |
| Afiliación | `facultad_id` | Usuario_investigador | 95% | Join a Facultad/Instituto |
| Grado Académico | `grado` | Usuario_investigador | 50% | Usar directamente |
| Especialidad | `especialidad` | Usuario_investigador | 40% | Usar directamente |
| Scopus ID | `scopus_id` | Usuario_investigador | 63.7% | Usar directamente |
| ResearcherID | `researcher_id` | Usuario_investigador | 63.1% | Usar directamente |
| Publicaciones | COUNT | Publicacion_autor | 100% | Contar registros |
| Proyectos | COUNT | Proyecto_integrante | 100% | Contar registros |
| Patentes | COUNT | Patente_autor | 100% | Contar registros |

### Estructura JSON Esperada (Persona)

```json
{
  "id": "oai:rais.unmsm.edu.pe:persona/1234",
  "nombres": "GILMAN",
  "apellidos": "R.H.",
  "dni": "12345678",
  "identificadores": {
    "orcid": "0000-0001-2345-6789",
    "renacyt": null,
    "scopus_id": "12345678",
    "researcher_id": "C-1234567"
  },
  "email_profesional": "gilman@unmsm.edu.pe",
  "telefono": "+51-1-4726000",
  "afiliacion": {
    "tipo": "Facultad",
    "nombre": "Medicina",
    "unidad_padre": "UNMSM"
  },
  "grado_academico": "PhD",
  "especialidad": "Medicina Tropical",
  "estadisticas": {
    "publicaciones": 145,
    "proyectos": 12,
    "patentes": 2
  }
}
```

---

## 5️⃣ UNIDAD ORGANIZATIVA (OrganizationalUnit)

### Campos Obligatorios

| Campo PerúCRIS | Columna BD | Tabla | Cobertura | Solución |
|----------------|-----------|-------|-----------|----------|
| **ID** | `id` | Facultad/Instituto/Grupo | 100% | ✅ Usar directamente |
| **Nombre** | `nombre` | Facultad/Instituto/Grupo | 100% | ✅ Usar directamente |
| **Tipo** | Implícito | — | 100% | "Facultad", "Instituto", "Grupo" |
| **ROR ID** | NO DISPONIBLE | — | 0% | ⚠️ CRÍTICA - Mapeo manual necesario |

### Campos Opcionales

| Campo PerúCRIS | Columna BD | Tabla | Cobertura | Nota |
|----------------|-----------|-------|-----------|------|
| RUC | NO DISPONIBLE | — | 0% | UNMSM: 15027626 (hardcoded) |
| Unidad Padre | `facultad_id` (para Instituto) | Instituto/Grupo | 100% | Crear jerarquía |
| Email | `email` | Grupo | 70% | Usar si existe |
| Teléfono | `telefono` | Grupo | 60% | Usar si existe |
| Sitio Web | `web` | Grupo | 50% | Usar si existe |
| Dirección | `direccion` | Grupo | 40% | Usar si existe |
| Publicaciones | COUNT | Publicacion (via facultad) | 100% | Contar relaciones |
| Proyectos | COUNT | Proyecto (via facultad) | 100% | Contar relaciones |

### Mapeo ROR - UNMSM y Unidades

| Unidad | Tipo | ROR ID | Nota |
|--------|------|--------|------|
| Universidad Nacional Mayor de San Marcos | Institución | 00rwzpz13 | Principal |
| Facultad de Medicina | Facultad | — | Submitter: UNMSM |
| Facultad de Ciencias | Facultad | — | Submitter: UNMSM |
| Instituto Especializado | Instituto | — | Submitter: UNMSM |
| Grupo de Investigación X | Grupo | — | Submitter: Instituto |

**Solución:** Crear tabla `Unidad_Organizativa_ROR` con mapeo manual

### Estructura JSON Esperada (Unidad Organizativa)

```json
{
  "id": "oai:rais.unmsm.edu.pe:unidad/23",
  "nombre": "Facultad de Medicina",
  "tipo": "Facultad",
  "ror": "00rwzpz13",
  "ruc": "15027626",
  "unidad_padre": {
    "id": "oai:rais.unmsm.edu.pe:unidad/1",
    "nombre": "Universidad Nacional Mayor de San Marcos",
    "ror": "00rwzpz13"
  },
  "contacto": {
    "email": "medicina@unmsm.edu.pe",
    "telefono": "+51-1-4726000",
    "sitio_web": "https://medicina.unmsm.edu.pe",
    "direccion": "Av. Grau 755, Lima"
  },
  "estadisticas": {
    "publicaciones": 2345,
    "proyectos": 123,
    "investigadores": 456
  }
}
```

---

## 📊 RESUMEN: COBERTURA DE CAMPOS

| Entidad | Obligatorios Completos | Obligatorios Faltantes | Opcionales Disponibles | Prioridad |
|---------|------------------------|----------------------|------------------------|-----------|
| **Publicación** | 4/6 (67%) | Idioma (CRÍTICO) | 70% | 🔴 Crítica |
| **Proyecto** | 5/6 (83%) | Investigador Principal (sí existe) | 75% | 🔴 Crítica |
| **Patente** | 6/6 (100%) | Ninguno | 70% | 🟢 Completa |
| **Persona** | 3/4 (75%) | Identificador Persistente (14.8%) | 60% | 🔴 Crítica |
| **Unidad Organizativa** | 2/4 (50%) | ROR, RUC | 50% | 🔴 Crítica |

---

## 🎯 ACCIONES INMEDIATAS

### Prioridad 1: AHORA (antes de TAREA 2)

- [ ] **Publicación.idioma:** Establecer default = "es" en formateador
- [ ] **Mapeo COAR:** Crear tabla o dict en código para tipos de documento
- [ ] **Persona.identificador:** Priorizar ORCID; fallback a RENACYT
- [ ] **ROR**: Hardcode ROR UNMSM (00rwzpz13) por ahora; expandir después

### Prioridad 2: TAREA 4 (Formateadores)

- [ ] Enriquecer Publicacion_autor con scopus_id si existe
- [ ] Enriquecer Proyecto con nombres de OCDE
- [ ] Crear jerarquía de Unidad Organizativa (Facultad → Instituto → Grupo)

### Prioridad 3: Futuro (Fase 2)

- [ ] Crear tabla `Unidad_Organizativa_ROR` para mapeos
- [ ] Crear tabla `Publicacion_Categoria_COAR` para mapeos
- [ ] Campaña para recopilar ORCIDs: 14.8% → 90%
- [ ] Crear tabla `Financiamiento` como entidad separada

---

## 📝 NOTAS TÉCNICAS

1. **Idioma NULL:** 96.4% de Publicacion.idioma es NULL. Solución en formateador:
   ```javascript
   idioma: publicacion.idioma || 'es'
   ```

2. **Autores Deduplicados:** Usar `Publicacion_autor.investigador_id` + `codigo_orcid` como clave única

3. **Jerarquía de Unidades:** 
   - Facultad (23 registros)
   - Instituto (50 registros) - pertenece a Facultad
   - Grupo (628 registros) - pertenece a Instituto

4. **Vocabularios Controlados Usados:**
   - OCDE: tabla `Ocde` (100% implementado)
   - COAR: mapeo manual (0% implementado, CRÍTICO)
   - ISO 639-1: códigos de 2 letras
   - ISO 3166: códigos de país de 2 letras
   - ISO 8601: fechas en formato YYYY-MM-DD

5. **Restricción de Datos:** SOLO registros con `Publicacion.validado = 1`

