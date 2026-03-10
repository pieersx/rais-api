# 📐 ESTRUCTURA JSON PERUCRIS 1.1 - RAIS API

**Fecha:** 10 de marzo de 2026  
**Objetivo:** Especificación de estructura JSON que cumple con PerúCRIS 1.1  
**Formato:** JSON puro (no XML OAI-PMH)  
**Estándar:** PerúCRIS 1.1 + Vocabularios Controlados

---

## 1. RESPUESTA GENERAL (Envelope)

Todas las respuestas siguen este patrón:

```json
{
  "success": true,
  "statusCode": 200,
  "timestamp": "2026-03-10T15:30:45Z",
  "data": {
    // Contenido específico por endpoint
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12345,
    "totalPages": 618,
    "hasMore": true,
    "nextPage": "/api/publicaciones?page=2&limit=20"
  }
}
```

### En caso de error:

```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-03-10T15:30:45Z",
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Parámetro 'limit' debe ser un número entre 1 y 100",
    "details": {
      "parameter": "limit",
      "value": "abc"
    }
  }
}
```

---

## 2. ENTIDAD: PUBLICACIÓN

**Endpoint:** `GET /api/publicaciones`  
**Detalle:** `GET /api/publicaciones/:id`  

### 2.1 Estructura Completa (Objeto Publicación)

```json
{
  "id": "oai:rais.unmsm.edu.pe:publicacion/12345",
  "identificadores": {
    "local": 12345,
    "doi": "10.1234/example",
    "issn": "0001-706X",
    "isbn": "978-3-16-148410-0",
    "url": "https://example.com/pub"
  },
  "titulo": "Estudio de prevalencia de cysticercosis en zonas rurales de Perú",
  "resumen": "Este estudio evaluó la prevalencia de neurocisticercosis en comunidades rurales...",
  "autores": [
    {
      "orden": 1,
      "nombres": "Gilman",
      "apellidos": "R.H.",
      "identificadores": {
        "orcid": "0000-0001-2345-6789",
        "scopus_id": "12345678",
        "researcher_id": "C-1234567",
        "renacyt": null
      },
      "afiliacion": {
        "institucion": "Universidad Nacional Mayor de San Marcos",
        "facultad": "Medicina",
        "centro": "Instituto de Medicina Tropical",
        "pais": "PE",
        "es_unmsm": true
      },
      "email": "gilman@unmsm.edu.pe"
    },
    {
      "orden": 2,
      "nombres": "Muñoz",
      "apellidos": "C.",
      "identificadores": {
        "orcid": "0000-0002-3456-7890",
        "scopus_id": null,
        "researcher_id": null,
        "renacyt": "P001234"
      },
      "afiliacion": {
        "institucion": "Universidad Nacional Mayor de San Marcos",
        "facultad": "Medicina",
        "es_unmsm": true
      }
    }
  ],
  "fecha_publicacion": "2023-05-15",
  "tipo_documento": {
    "valor_local": "articulo",
    "coar_uri": "http://purl.org/coar/resource_type/c_6501",
    "coar_label": "Journal Article"
  },
  "idioma": "es",
  "publicacion": {
    "nombre": "American Journal of Tropical Medicine and Hygiene",
    "issn": "0002-9637",
    "volumen": "25",
    "numero": "3",
    "edicion": null,
    "paginas": {
      "inicio": "234",
      "fin": "245"
    },
    "articulo_numero": null,
    "editorial": "American Society of Tropical Medicine and Hygiene",
    "lugar_publicacion": "Baltimore, USA",
    "pais": "US"
  },
  "palabras_clave": [
    "neurocisticercosis",
    "epidemiología",
    "Perú"
  ],
  "cobertura": {
    "base_datos": [
      {
        "nombre": "PubMed",
        "id": "PubMed Central",
        "indexada": true
      },
      {
        "nombre": "Scopus",
        "id": "Elsevier",
        "indexada": true
      },
      {
        "nombre": "Web of Science",
        "id": "Core Collection",
        "indexada": false
      }
    ],
    "pais": "US",
    "region": null
  },
  "proyectos_relacionados": [
    {
      "id": "oai:rais.unmsm.edu.pe:proyecto/5678",
      "titulo": "Epidemiología de enfermedades parasitarias en Perú rural"
    }
  ],
  "tipo_acceso": "Acceso abierto",
  "url_texto_completo": "https://example.com/full_text.pdf",
  "derechos": {
    "licencia": "Creative Commons Attribution 4.0",
    "licencia_uri": "https://creativecommons.org/licenses/by/4.0/",
    "detenedor_derechos": "American Journal of Tropical Medicine"
  },
  "validacion": {
    "validado": true,
    "fecha_validacion": "2023-05-20",
    "validado_por": "Administrativo"
  },
  "auditoria": {
    "fecha_creacion": "2023-05-15T10:30:00Z",
    "fecha_actualizacion": "2023-05-20T14:25:00Z",
    "actualizado_por": "user@unmsm.edu.pe"
  }
}
```

### 2.2 Valores Enumerados y Vocabularios (Publicación)

**tipo_documento (COAR):**
```json
{
  "articulo": "http://purl.org/coar/resource_type/c_6501",
  "libro": "http://purl.org/coar/resource_type/c_3734",
  "capitulo": "http://purl.org/coar/resource_type/c_3248",
  "tesis": "http://purl.org/coar/resource_type/c_db06",
  "evento": "http://purl.org/coar/resource_type/c_5794",
  "resumen_evento": "http://purl.org/coar/resource_type/c_8185",
  "ensayo": "http://purl.org/coar/resource_type/c_6947",
  "revisión": "http://purl.org/coar/resource_type/c_4317"
}
```

**idioma (ISO 639-1):**
```
es = Español
en = Inglés
fr = Francés
pt = Portugués
qu = Quechua
ay = Aymara
```

**pais (ISO 3166-1 alfa-2):**
```
PE = Perú
US = Estados Unidos
NL = Países Bajos
DE = Alemania
```

---

## 3. ENTIDAD: PROYECTO

**Endpoint:** `GET /api/proyectos`  
**Detalle:** `GET /api/proyectos/:id`

### 3.1 Estructura Completa (Objeto Proyecto)

```json
{
  "id": "oai:rais.unmsm.edu.pe:proyecto/5678",
  "identificadores": {
    "local": 5678,
    "codigo_unmsm": "PRY-2021-001234",
    "uuid": "550e8400-e29b-41d4-a716-446655440000"
  },
  "titulo": "Epidemiología de enfermedades parasitarias en zonas rurales de Perú",
  "investigador_principal": {
    "id": "oai:rais.unmsm.edu.pe:persona/1234",
    "nombres": "Gilman",
    "apellidos": "R.H.",
    "identificadores": {
      "orcid": "0000-0001-2345-6789",
      "renacyt": null
    },
    "afiliacion": "Facultad de Medicina",
    "email": "gilman@unmsm.edu.pe"
  },
  "integrantes": [
    {
      "id": "oai:rais.unmsm.edu.pe:persona/1234",
      "nombres": "Gilman",
      "apellidos": "R.H.",
      "rol": "Responsable",
      "orden": 1
    },
    {
      "id": "oai:rais.unmsm.edu.pe:persona/2234",
      "nombres": "Muñoz",
      "apellidos": "C.",
      "rol": "Co-investigador",
      "orden": 2
    },
    {
      "id": "oai:rais.unmsm.edu.pe:persona/3234",
      "nombres": "López",
      "apellidos": "J.",
      "rol": "Asistente de Investigación",
      "orden": 3
    }
  ],
  "tipo_proyecto": "Investigación Aplicada",
  "clasificacion_ocde": {
    "codigo": "3.2.2",
    "nivel_1": "3 - Ciencias Médicas y de Salud",
    "nivel_2": "3.2 - Medicina clínica",
    "nivel_3": "3.2.2 - Epidemiología",
    "descripcion": "Estudio de distribución de enfermedades en poblaciones"
  },
  "linea_investigacion": {
    "id": 123,
    "nombre": "Parasitología y Control de Enfermedades",
    "descripcion": "Investigación en parásitos y sus efectos en la salud"
  },
  "fechas": {
    "inicio": "2021-01-15",
    "fin": "2024-12-31",
    "duracion_meses": 48,
    "estado_vigencia": "Activo"
  },
  "unidad_organizativa": {
    "tipo": "Facultad",
    "id": "oai:rais.unmsm.edu.pe:unidad/23",
    "nombre": "Facultad de Medicina",
    "jeraquica": {
      "institucion": "Universidad Nacional Mayor de San Marcos",
      "facultad": "Medicina"
    }
  },
  "financiamiento": {
    "monto_asignado": null,
    "monto_aporte_unmsm": null,
    "moneda": "PEN",
    "fuente_financiamiento": null,
    "entidad_financiadora": null
  },
  "publicaciones_derivadas": 12,
  "palabras_clave": [
    "parasitología",
    "epidemiología",
    "Perú rural",
    "salud pública"
  ],
  "estado": "Activo",
  "visibilidad": "Público",
  "auditoria": {
    "fecha_creacion": "2021-01-15T09:00:00Z",
    "fecha_actualizacion": "2024-03-10T11:30:00Z",
    "actualizado_por": "user@unmsm.edu.pe"
  }
}
```

### 3.2 Valores Enumerados (Proyecto)

**tipo_proyecto:**
```
Investigación Básica
Investigación Aplicada
Investigación Fundamental
Desarrollo Tecnológico
Transferencia Tecnológica
```

**estado_vigencia:**
```
Activo
Finalizado
Suspendido
Cancelado
Próximo a finalizar
```

---

## 4. ENTIDAD: PATENTE

**Endpoint:** `GET /api/patentes`  
**Detalle:** `GET /api/patentes/:id`

### 4.1 Estructura Completa (Objeto Patente)

```json
{
  "id": "oai:rais.unmsm.edu.pe:patente/901",
  "identificadores": {
    "local": 901,
    "numero_registro": "PE-2021-001234",
    "numero_expediente": "EXP-2020-45678",
    "doi": null
  },
  "titulo": "Sistema de purificación de agua mediante tecnología de adsorción avanzada",
  "tipo_patente": "Patente de Invención",
  "clasificacion_internacional": "C02F 1/00",
  "inventores": [
    {
      "orden": 1,
      "nombres": "Rodriguez",
      "apellidos": "J.",
      "identificadores": {
        "orcid": null,
        "dni": "12345678"
      },
      "afiliacion": {
        "institucion": "Universidad Nacional Mayor de San Marcos",
        "facultad": "Ingeniería"
      }
    },
    {
      "orden": 2,
      "nombres": "García",
      "apellidos": "M.",
      "identificadores": {
        "orcid": null
      },
      "afiliacion": {
        "institucion": "Universidad Nacional Mayor de San Marcos"
      }
    }
  ],
  "titulares": [
    {
      "nombre": "Universidad Nacional Mayor de San Marcos",
      "rol": "Titular Originario",
      "porcentaje": 100
    }
  ],
  "resumen": "Se presenta un nuevo método de purificación de agua basado en adsorción con materiales compuestos...",
  "palabras_clave": [
    "purificación",
    "adsorción",
    "agua",
    "tecnología",
    "sostenibilidad"
  ],
  "fechas": {
    "presentacion": "2021-06-15",
    "publicacion": "2021-09-20",
    "otorgamiento": "2023-11-10",
    "vencimiento": "2031-06-15"
  },
  "oficina_presentacion": "INDECOPI",
  "pais_presentacion": "PE",
  "estado": "Concedida",
  "url_indecopi": "https://indecopi.gob.pe/patentes/PE-2021-001234",
  "url_oficial": null,
  "proyectos_derivados": [
    {
      "id": "oai:rais.unmsm.edu.pe:proyecto/5678",
      "titulo": "Aplicaciones industriales de sistemas de purificación"
    }
  ],
  "publicaciones_relacionadas": 3,
  "validacion": {
    "validado": true,
    "fecha_validacion": "2023-11-20"
  },
  "auditoria": {
    "fecha_creacion": "2023-11-10T10:00:00Z",
    "fecha_actualizacion": "2024-03-10T15:30:00Z"
  }
}
```

### 4.2 Valores Enumerados (Patente)

**tipo_patente:**
```
Patente de Invención
Modelo de Utilidad
Certificado de Obtención Vegetal
Diseño Industrial
Secreto Industrial
```

**estado:**
```
Solicitada
Publicada
Otorgada
Concedida
Rechazada
Abandonada
Renovada
Vencida
```

---

## 5. ENTIDAD: PERSONA

**Endpoint:** `GET /api/personas`  
**Detalle:** `GET /api/personas/:id`

### 5.1 Estructura Completa (Objeto Persona)

```json
{
  "id": "oai:rais.unmsm.edu.pe:persona/1234",
  "nombres": "Gilman",
  "apellidos": "R.H.",
  "nombre_completo": "Gilman, R.H.",
  "identificadores": {
    "orcid": "0000-0001-2345-6789",
    "renacyt": null,
    "scopus_id": "12345678",
    "researcher_id": "C-1234567",
    "isni": null,
    "dni": "00000001",
    "pasaporte": null
  },
  "contacto": {
    "email_institucional": "gilman@unmsm.edu.pe",
    "email_personal": null,
    "telefono": "+51-1-4726000",
    "telefono_celular": null,
    "direccion": "Lima, Perú"
  },
  "afiliacion": {
    "institucion": "Universidad Nacional Mayor de San Marcos",
    "facultad": {
      "id": "oai:rais.unmsm.edu.pe:unidad/23",
      "nombre": "Facultad de Medicina"
    },
    "instituto": {
      "id": "oai:rais.unmsm.edu.pe:unidad/45",
      "nombre": "Instituto de Medicina Tropical"
    },
    "grupo_investigacion": {
      "id": "oai:rais.unmsm.edu.pe:unidad/234",
      "nombre": "Grupo de Parasitología"
    },
    "cargo": "Profesor Investigador",
    "categoria_docente": "Docente Principal",
    "desde": "2005-01-15"
  },
  "formacion_academica": {
    "grado": "PhD",
    "especialidad": "Medicina Tropical",
    "institucion_grado": "Johns Hopkins University",
    "pais_grado": "US",
    "año_grado": 1992
  },
  "credenciales": {
    "renati_nivel": "Investigador Senior",
    "renati_categoria": "P",
    "renacyt": null,
    "dina_categoria": null
  },
  "estadisticas": {
    "publicaciones_totales": 145,
    "publicaciones_ultimos_5_años": 45,
    "proyectos_totales": 12,
    "patentes": 2,
    "citaciones_totales": 3456,
    "h_index": 24
  },
  "areas_investigacion": [
    {
      "codigo_ocde": "3.2.2",
      "descripcion": "Epidemiología"
    },
    {
      "codigo_ocde": "3.2.1",
      "descripcion": "Medicina clínica"
    }
  ],
  "visibilidad": "Público",
  "auditoria": {
    "fecha_creacion": "2005-01-15T08:00:00Z",
    "fecha_actualizacion": "2024-03-10T16:45:00Z",
    "actualizado_por": "admin@unmsm.edu.pe"
  }
}
```

---

## 6. ENTIDAD: UNIDAD ORGANIZATIVA

**Endpoint:** `GET /api/unidades-organizativas`  
**Detalle:** `GET /api/unidades-organizativas/:id`

### 6.1 Estructura Completa (Objeto Unidad Organizativa)

```json
{
  "id": "oai:rais.unmsm.edu.pe:unidad/23",
  "nombre": "Facultad de Medicina",
  "tipo": "Facultad",
  "identificadores": {
    "ror": "00rwzpz13",
    "ruc": "15027626",
    "grid": null
  },
  "jerarquia": {
    "institucion_padre": {
      "id": "oai:rais.unmsm.edu.pe:unidad/1",
      "nombre": "Universidad Nacional Mayor de San Marcos",
      "ror": "00rwzpz13"
    },
    "unidades_dependientes": [
      {
        "id": "oai:rais.unmsm.edu.pe:unidad/45",
        "nombre": "Instituto de Medicina Tropical",
        "tipo": "Instituto"
      },
      {
        "id": "oai:rais.unmsm.edu.pe:unidad/46",
        "nombre": "Instituto de Investigaciones Biomédicas",
        "tipo": "Instituto"
      }
    ]
  },
  "contacto": {
    "email": "medicina@unmsm.edu.pe",
    "telefono": "+51-1-4726000",
    "sitio_web": "https://medicina.unmsm.edu.pe",
    "direccion": "Av. Grau 755, Lima, Perú",
    "codigo_postal": "15001",
    "ubicacion_geografica": {
      "ubigeo": "150131",
      "region": "Lima",
      "provincia": "Lima",
      "distrito": "San Isidro"
    }
  },
  "autoridades": {
    "decano": {
      "nombre": "Dr. Juan Pérez",
      "email": "decano@unmsm.edu.pe"
    },
    "vice_decano": {
      "nombre": "Dra. María García",
      "email": "vdecano@unmsm.edu.pe"
    }
  },
  "descripcion": "Facultad de Medicina de la Universidad Nacional Mayor de San Marcos, dedicada a la formación de médicos y desarrollo de investigación en ciencias médicas.",
  "fundacion": {
    "fecha": "1551-01-01",
    "historia": "Una de las facultades más antiguas de América Latina..."
  },
  "estadisticas": {
    "investigadores": 456,
    "estudiantes": 2345,
    "publicaciones_totales": 2345,
    "publicaciones_ultimos_5_años": 890,
    "proyectos_totales": 123,
    "patentes": 12,
    "grupos_investigacion": 28
  },
  "areas_investigacion": [
    {
      "codigo_ocde": "3.2",
      "descripcion": "Medicina clínica"
    },
    {
      "codigo_ocde": "3.1",
      "descripcion": "Ciencias de la salud"
    }
  ],
  "acreditaciones": [
    {
      "nombre": "Acreditación Institucional SINAACES",
      "año": 2022,
      "estado": "Vigente"
    }
  ],
  "visibilidad": "Público",
  "auditoria": {
    "fecha_creacion": "1551-01-01T00:00:00Z",
    "fecha_actualizacion": "2024-03-10T17:00:00Z"
  }
}
```

### 6.2 Valores Enumerados (Unidad Organizativa)

**tipo:**
```
Universidad
Facultad
Instituto
Centro de Investigación
Grupo de Investigación
Departamento
Laboratorio
Centro
```

---

## 7. PARÁMETROS DE CONSULTA (Query Parameters)

### Para todos los endpoints de listado:

| Parámetro | Tipo | Ejemplo | Descripción |
|-----------|------|---------|-------------|
| `page` | integer | `?page=1` | Página (por defecto: 1) |
| `limit` | integer | `?limit=20` | Registros por página (por defecto: 20, máx: 100) |
| `q` | string | `?q=malaria` | Búsqueda de texto (busca en títulos, resumen) |
| `sort` | string | `?sort=fecha_desc` | Ordenamiento (fecha_asc, fecha_desc, titulo_asc, titulo_desc) |
| `from_date` | date | `?from_date=2020-01-01` | Filtro desde fecha (ISO 8601) |
| `to_date` | date | `?to_date=2024-12-31` | Filtro hasta fecha (ISO 8601) |

### Solo Publicaciones:

| Parámetro | Tipo | Ejemplo | Descripción |
|-----------|------|---------|-------------|
| `tipo` | string | `?tipo=articulo` | Tipo de documento |
| `idioma` | string | `?idioma=es` | ISO 639-1 |
| `pais` | string | `?pais=PE` | ISO 3166 |
| `issn` | string | `?issn=0001-706X` | ISSN específico |
| `doi` | string | `?doi=10.1234/example` | DOI específico |

### Solo Proyectos:

| Parámetro | Tipo | Ejemplo | Descripción |
|-----------|------|---------|-------------|
| `tipo_proyecto` | string | `?tipo_proyecto=Investigación Aplicada` | Tipo |
| `ocde` | string | `?ocde=3.2` | Clasificación OCDE |
| `facultad` | integer | `?facultad=23` | ID Facultad |
| `estado` | string | `?estado=Activo` | Estado del proyecto |

---

## 8. EJEMPLOS DE RESPUESTA COMPLETA (Endpoint)

### GET /api/publicaciones?page=1&limit=2

```json
{
  "success": true,
  "statusCode": 200,
  "timestamp": "2026-03-10T15:30:45Z",
  "data": [
    {
      "id": "oai:rais.unmsm.edu.pe:publicacion/12345",
      "titulo": "Estudio de prevalencia de cysticercosis en Perú",
      "autores": [
        {
          "nombres": "Gilman",
          "apellidos": "R.H.",
          "identificadores": {
            "orcid": "0000-0001-2345-6789"
          }
        }
      ],
      "fecha_publicacion": "2023-05-15",
      "tipo_documento": {
        "valor_local": "articulo",
        "coar_uri": "http://purl.org/coar/resource_type/c_6501"
      },
      "idioma": "es"
    },
    {
      "id": "oai:rais.unmsm.edu.pe:publicacion/12346",
      "titulo": "Tratamiento de dengue en contexto de endemicidad",
      "autores": [
        {
          "nombres": "Muñoz",
          "apellidos": "C.",
          "identificadores": {
            "orcid": null
          }
        }
      ],
      "fecha_publicacion": "2023-06-20",
      "tipo_documento": {
        "valor_local": "articulo",
        "coar_uri": "http://purl.org/coar/resource_type/c_6501"
      },
      "idioma": "es"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 67157,
    "totalPages": 33579,
    "hasMore": true,
    "nextPage": "/api/publicaciones?page=2&limit=2"
  }
}
```

---

## 9. RESTRICCIÓN DE DATOS

Todos los endpoints respetan:

✅ **SOLO registros con `validado = 1`** (registros públicos validados)

---

## 10. VOCABULARIOS CONTROLADOS A INCLUIR

| Vocabulario | Estándar | Aplicación | Implementación |
|------------|----------|-----------|-----------------|
| OCDE | OCDE | Clasificación de investigación | URI + código + etiqueta |
| COAR | COAR | Tipo de documento | URI + etiqueta |
| ISO 639-1 | ISO | Idioma | Código de 2 letras |
| ISO 3166-1 | ISO | País | Código de 2 letras |
| ISO 8601 | ISO | Fechas | YYYY-MM-DD o YYYY-MM-DDTHH:MM:SSZ |

---

## 📝 NOTAS FINALES

1. **Estructura:** Diseñada para cumplir PerúCRIS 1.1 en formato JSON
2. **Identificadores:** Incluye ORCID, RENACYT, Scopus ID, ROR, RUC
3. **Vocabularios:** Utiliza OCDE, COAR, ISO 639-1, ISO 3166
4. **Paginación:** Estándar offset/limit con metadatos de navegación
5. **Validación:** Todos los datos provienen de registros validados (validado=1)
6. **Flexibilidad:** Campos opcionales pueden ser `null` si no aplican

