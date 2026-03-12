import { pool } from '../config/database.js';

/**
 * Repositorio de consultas SQL para Personas (Investigadores).
 * Tabla principal: Usuario_investigador
 * Enriquecimiento: Facultad (afiliacion), conteos de publicaciones/proyectos/patentes
 *
 * No tiene campo "validado" — se exponen todos los registros.
 * Se filtran solo los que tienen al menos nombres y apellidos.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildWhereClause(filters = {}) {
  const conditions = [
    'ui.nombres IS NOT NULL',
    "ui.nombres != ''",
    'ui.apellido1 IS NOT NULL',
    "ui.apellido1 != ''",
  ];
  const params = [];

  if (filters.set) {
    if (filters.set.startsWith('persons:facultad-')) {
      const facId = Number(filters.set.replace('persons:facultad-', ''));
      conditions.push('ui.facultad_id = ?');
      params.push(facId);
    } else if (filters.set === 'persons') {
      // Parent set: todas las personas (sin filtro)
    }
  }

  if (filters.from) {
    conditions.push('ui.updated_at >= ?');
    params.push(filters.from);
  }

  if (filters.until) {
    conditions.push('ui.updated_at <= ?');
    params.push(filters.until);
  }

  return { where: conditions.join(' AND '), params };
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

/**
 * Enriquece personas con conteos de publicaciones, proyectos y patentes.
 */
async function enrichPersonas(personas) {
  if (personas.length === 0) return;

  const ids = personas.map((p) => p.id);

  const [pubCountResult, proyCountResult, patCountResult] = await Promise.all([
    pool.query(
      `SELECT investigador_id, COUNT(DISTINCT publicacion_id) AS total
       FROM Publicacion_autor
       WHERE investigador_id IN (?) AND estado = 1
       GROUP BY investigador_id`,
      [ids],
    ),
    pool.query(
      `SELECT investigador_id, COUNT(DISTINCT proyecto_id) AS total
       FROM Proyecto_integrante
       WHERE investigador_id IN (?) AND (excluido IS NULL OR excluido != 1)
       GROUP BY investigador_id`,
      [ids],
    ),
    pool.query(
      `SELECT investigador_id, COUNT(DISTINCT patente_id) AS total
       FROM Patente_autor
       WHERE investigador_id IN (?)
       GROUP BY investigador_id`,
      [ids],
    ),
  ]);

  const pubCounts = {};
  for (const row of pubCountResult[0]) pubCounts[row.investigador_id] = row.total;

  const proyCounts = {};
  for (const row of proyCountResult[0]) proyCounts[row.investigador_id] = row.total;

  const patCounts = {};
  for (const row of patCountResult[0]) patCounts[row.investigador_id] = row.total;

  for (const persona of personas) {
    persona.pub_count = pubCounts[persona.id] ?? 0;
    persona.proy_count = proyCounts[persona.id] ?? 0;
    persona.pat_count = patCounts[persona.id] ?? 0;
  }
}

// ─── Queries publicas ───────────────────────────────────────────────────────

const BASE_SELECT = `
  SELECT ui.id, ui.nombres, ui.apellido1, ui.apellido2,
         ui.codigo_orcid, ui.scopus_id, ui.researcher_id,
         ui.renacyt, ui.renacyt_nivel,
         ui.doc_tipo, ui.doc_numero,
         ui.email3 AS email,
         ui.telefono_movil AS telefono,
         ui.grado, ui.especialidad, ui.titulo_profesional,
         ui.facultad_id,
         f.nombre AS facultad_nombre,
         ui.created_at, ui.updated_at
  FROM Usuario_investigador ui
  LEFT JOIN Facultad f ON ui.facultad_id = f.id
`;

export async function findById(id) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE ui.id = ? LIMIT 1`,
    [id],
  );

  if (rows.length === 0) return null;

  const personas = [rows[0]];
  await enrichPersonas(personas);
  return personas[0];
}

export async function countAll(filters = {}) {
  const { where, params } = buildWhereClause(filters);
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM Usuario_investigador ui WHERE ${where}`,
    params,
  );
  return rows[0].total;
}

export async function getIdentifiers({ set, from, until, cursor = 0, limit = 100 } = {}) {
  const { where, params } = buildWhereClause({ set, from, until });
  params.push(limit, cursor);

  const [rows] = await pool.query(
    `SELECT ui.id, ui.facultad_id, ui.updated_at
     FROM Usuario_investigador ui
     WHERE ${where}
     ORDER BY ui.id ASC
     LIMIT ? OFFSET ?`,
    params,
  );

  return rows;
}

export async function findAll({ set, from, until, cursor = 0, limit = 100 } = {}) {
  const { where, params } = buildWhereClause({ set, from, until });
  params.push(limit, cursor);

  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE ${where} ORDER BY ui.id ASC LIMIT ? OFFSET ?`,
    params,
  );

  if (rows.length === 0) return [];

  await enrichPersonas(rows);
  return rows;
}

export async function getDistinctSets() {
  // Personas se agrupan por facultad de afiliacion
  const [rows] = await pool.query(
    `SELECT DISTINCT ui.facultad_id, f.nombre AS facultad_nombre
     FROM Usuario_investigador ui
     INNER JOIN Facultad f ON ui.facultad_id = f.id
     WHERE ui.facultad_id IS NOT NULL
       AND ui.nombres IS NOT NULL AND ui.nombres != ''
       AND ui.apellido1 IS NOT NULL AND ui.apellido1 != ''
     ORDER BY f.nombre ASC`,
  );
  return rows;
}

export async function getEarliestDatestamp() {
  const [rows] = await pool.query(
    `SELECT MIN(created_at) AS earliest
     FROM Usuario_investigador
     WHERE created_at IS NOT NULL AND YEAR(created_at) > 0`,
  );
  return rows[0]?.earliest ?? null;
}
