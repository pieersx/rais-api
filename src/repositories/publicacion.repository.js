import { pool } from '../config/database.js';

/**
 * Repositorio de consultas SQL para Publicaciones.
 * Integra: Publicacion, Publicacion_autor, Publicacion_categoria,
 *          Publicacion_palabra_clave, Publicacion_index, Publicacion_db_indexada,
 *          Publicacion_proyecto, Publicacion_revista, Usuario_investigador (ORCID)
 *
 * REGLA DE NEGOCIO: Solo registros con validado = 1.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildWhereClause(filters = {}) {
  const conditions = ['p.validado = 1'];
  const params = [];
  const joins = [];

  if (filters.set) {
    if (filters.set.startsWith('publicacion:')) {
      // Set especifico: publicacion:articulo -> tipo_publicacion = 'articulo'
      const setVal = filters.set.replace('publicacion:', '');
      conditions.push('p.tipo_publicacion = ?');
      params.push(setVal);
    } else if (filters.set === 'publicacion') {
      // Parent set: todas las publicaciones (sin filtro de tipo)
    } else if (filters.set.startsWith('facultad:')) {
      // Filtrar por facultad a traves de autores -> investigador -> grupo -> facultad
      const facId = Number(filters.set.replace('facultad:', ''));
      joins.push(
        'INNER JOIN Publicacion_autor pa_fac ON pa_fac.publicacion_id = p.id AND pa_fac.estado = 1',
        'INNER JOIN Grupo_integrante gi ON gi.investigador_id = pa_fac.investigador_id',
        'INNER JOIN Grupo g_fac ON g_fac.id = gi.grupo_id AND g_fac.facultad_id = ?',
      );
      params.push(facId);
    } else if (filters.set.startsWith('ocde:')) {
      // Filtrar publicaciones vinculadas a proyectos con el area OCDE
      // OCDE hierarchy: top (codigo='1') -> mid (parent_id=top.id) -> leaf (parent_id=mid.id)
      // Projects link to leaf or mid level, so we walk up the chain
      const ocdeCodigo = filters.set.replace('ocde:', '');
      joins.push(
        'INNER JOIN Publicacion_proyecto pp_ocde ON pp_ocde.publicacion_id = p.id AND pp_ocde.estado = 1',
        'INNER JOIN Proyecto proy_ocde ON proy_ocde.id = pp_ocde.proyecto_id',
        'INNER JOIN Ocde o_filter ON o_filter.id = proy_ocde.ocde_id',
      );
      conditions.push(
        `(o_filter.codigo = ? OR EXISTS (
           SELECT 1 FROM Ocde o_mid WHERE o_mid.id = o_filter.parent_id AND o_mid.codigo = ?
         ) OR EXISTS (
           SELECT 1 FROM Ocde o_mid2 WHERE o_mid2.id = o_filter.parent_id
           AND EXISTS (SELECT 1 FROM Ocde o_top WHERE o_top.id = o_mid2.parent_id AND o_top.codigo = ?)
         ))`
      );
      params.push(ocdeCodigo, ocdeCodigo, ocdeCodigo);
    }
  }

  if (filters.from) {
    conditions.push('p.updated_at >= ?');
    params.push(filters.from);
  }

  if (filters.until) {
    conditions.push('p.updated_at <= ?');
    params.push(filters.until);
  }

  return { where: conditions.join(' AND '), params, joins };
}

/**
 * Enriquece publicaciones con datos relacionados (autores+ORCID, keywords, indexacion, proyectos).
 * @param {object[]} pubs - Array de publicaciones
 */
async function enrichPublications(pubs) {
  if (pubs.length === 0) return;

  const pubIds = pubs.map((p) => p.id);

  // Ejecutar los 5 queries de enriquecimiento en paralelo
  const [autoresResult, keywordsResult, indexResult, proyectosResult, revistaResult] = await Promise.all([
    // 1. Autores + ORCID real desde Usuario_investigador
    pool.query(
      `SELECT pa.publicacion_id, pa.id, pa.investigador_id,
              COALESCE(ui.codigo_orcid, pa.codigo_orcid) AS codigo_orcid,
              pa.autor, pa.nombres, pa.apellido1, pa.apellido2,
              pa.tipo, pa.orden, pa.filiacion, pa.filiacion_unica,
              ui.scopus_id, ui.researcher_id, ui.renacyt, ui.renacyt_nivel
       FROM Publicacion_autor pa
       LEFT JOIN Usuario_investigador ui ON pa.investigador_id = ui.id
       WHERE pa.publicacion_id IN (?) AND pa.estado = 1
       ORDER BY pa.orden ASC`,
      [pubIds],
    ),

    // 2. Palabras clave
    pool.query(
      `SELECT publicacion_id, clave
       FROM Publicacion_palabra_clave
       WHERE publicacion_id IN (?)`,
      [pubIds],
    ),

    // 3. Indexacion (Scopus, WoS, EBSCO, etc.)
    pool.query(
      `SELECT pi.publicacion_id, pdi.nombre AS db_indexada
       FROM Publicacion_index pi
       INNER JOIN Publicacion_db_indexada pdi ON pi.publicacion_db_indexada_id = pdi.id
       WHERE pi.publicacion_id IN (?)`,
      [pubIds],
    ),

    // 4. Proyectos vinculados
    pool.query(
      `SELECT publicacion_id, proyecto_id, codigo_proyecto,
              nombre_proyecto, entidad_financiadora, tipo
       FROM Publicacion_proyecto
       WHERE publicacion_id IN (?) AND estado = 1`,
      [pubIds],
    ),

    // 5. Datos de revista via ISSN matching (editorial, pais, cobertura)
    pool.query(
      `SELECT p.id AS publicacion_id,
              pr.revista AS revista_nombre, pr.casa, pr.pais, pr.cobertura, pr.isi
       FROM Publicacion p
       INNER JOIN Publicacion_revista pr
         ON (p.issn = pr.issn AND p.issn IS NOT NULL AND p.issn != '')
         OR (p.issn_e = pr.issne AND p.issn_e IS NOT NULL AND p.issn_e != '')
       WHERE p.id IN (?)`,
      [pubIds],
    ),
  ]);

  // Indexar resultados por publicacion_id
  const autoresByPub = groupBy(autoresResult[0], 'publicacion_id');
  const keywordsByPub = groupBy(keywordsResult[0], 'publicacion_id');
  const indexByPub = groupBy(indexResult[0], 'publicacion_id');
  const proyectosByPub = groupBy(proyectosResult[0], 'publicacion_id');
  const revistaByPub = groupBy(revistaResult[0], 'publicacion_id');

  for (const pub of pubs) {
    pub.autores = autoresByPub[pub.id] ?? [];
    pub.palabras_clave = (keywordsByPub[pub.id] ?? []).map((k) => k.clave);
    pub.bases_indexadas = (indexByPub[pub.id] ?? []).map((i) => i.db_indexada);
    pub.proyectos_vinculados = proyectosByPub[pub.id] ?? [];
    // Datos de revista (first match wins — may have multiple via ISSN/eISSN)
    const revistas = revistaByPub[pub.id];
    if (revistas && revistas.length > 0) {
      const rev = revistas[0];
      pub.revista = {
        nombre: rev.revista_nombre,
        casa: rev.casa,
        pais: rev.pais,
        cobertura: rev.cobertura,
        isi: rev.isi,
      };
    }
  }
}

function groupBy(arr, key) {
  const map = {};
  for (const item of arr) {
    const k = item[key];
    if (!map[k]) map[k] = [];
    map[k].push(item);
  }
  return map;
}

// ─── Queries publicas ───────────────────────────────────────────────────────

/**
 * Busca una publicacion por ID con todos sus datos relacionados.
 */
export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT p.*, pc.tipo AS categoria_tipo, pc.categoria AS categoria_nombre
     FROM Publicacion p
     LEFT JOIN Publicacion_categoria pc ON p.categoria_id = pc.id
     WHERE p.id = ? AND p.validado = 1
     LIMIT 1`,
    [id],
  );

  if (rows.length === 0) return null;

  const pubs = [rows[0]];
  await enrichPublications(pubs);
  return pubs[0];
}

/**
 * Cuenta los registros validados que cumplen los filtros.
 */
export async function countAll(filters = {}) {
  const { where, params, joins } = buildWhereClause(filters);
  const joinClause = joins.length > 0 ? joins.join('\n') : '';
  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT p.id) AS total FROM Publicacion p ${joinClause} WHERE ${where}`,
    params,
  );
  return rows[0].total;
}

/**
 * Lista identificadores (headers) paginados.
 */
export async function getIdentifiers({ set, from, until, cursor = 0, limit = 100 } = {}) {
  const { where, params, joins } = buildWhereClause({ set, from, until });
  const joinClause = joins.length > 0 ? joins.join('\n') : '';
  params.push(limit, cursor);

  const [rows] = await pool.query(
    `SELECT DISTINCT p.id, p.tipo_publicacion, p.updated_at
     FROM Publicacion p
     ${joinClause}
     WHERE ${where}
     ORDER BY p.id ASC
     LIMIT ? OFFSET ?`,
    params,
  );

  return rows;
}

/**
 * Lista registros completos paginados (con todos los datos enriquecidos).
 */
export async function findAll({ set, from, until, cursor = 0, limit = 100 } = {}) {
  const { where, params, joins } = buildWhereClause({ set, from, until });
  const joinClause = joins.length > 0 ? joins.join('\n') : '';
  params.push(limit, cursor);

  const [pubs] = await pool.query(
    `SELECT DISTINCT p.*, pc.tipo AS categoria_tipo, pc.categoria AS categoria_nombre
     FROM Publicacion p
     LEFT JOIN Publicacion_categoria pc ON p.categoria_id = pc.id
     ${joinClause}
     WHERE ${where}
     ORDER BY p.id ASC
     LIMIT ? OFFSET ?`,
    params,
  );

  if (pubs.length === 0) return [];

  await enrichPublications(pubs);
  return pubs;
}

/**
 * Obtiene los sets (tipos de publicacion distintos).
 */
export async function getDistinctSets() {
  const [rows] = await pool.query(
    `SELECT DISTINCT tipo_publicacion
     FROM Publicacion
     WHERE validado = 1 AND tipo_publicacion IS NOT NULL AND tipo_publicacion != ''
     ORDER BY tipo_publicacion ASC`,
  );
  return rows.map((r) => r.tipo_publicacion);
}

/**
 * Obtiene la fecha mas antigua del repositorio.
 */
export async function getEarliestDatestamp() {
  const [rows] = await pool.query(
    `SELECT MIN(created_at) AS earliest
     FROM Publicacion
     WHERE validado = 1 AND created_at IS NOT NULL AND YEAR(created_at) > 0`,
  );
  return rows[0]?.earliest ?? null;
}
