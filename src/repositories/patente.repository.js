import { pool } from '../config/database.js';

/**
 * Repositorio de consultas SQL para Patentes.
 * Integra: Patente, Patente_autor, Patente_entidad
 *
 * REGLA: Solo patentes con estado >= 1.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildWhereClause(filters = {}) {
  const conditions = ['p.estado >= 1'];
  const params = [];

  if (filters.set) {
    if (filters.set.startsWith('patents:')) {
      const setVal = filters.set.replace('patents:', '');
      conditions.push('p.tipo = ?');
      params.push(setVal);
    } else if (filters.set === 'patents') {
      // Parent set: todas las patentes (sin filtro de tipo)
    }
    // patentes no tienen facultad_id ni ocde_id, so facultad:/ocde: sets don't apply
  }

  if (filters.from) {
    conditions.push('p.updated_at >= ?');
    params.push(filters.from);
  }

  if (filters.until) {
    conditions.push('p.updated_at <= ?');
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
 * Enriquece patentes con autores y entidades.
 */
async function enrichPatents(patents) {
  if (patents.length === 0) return;

  const patIds = patents.map((p) => p.id);

  const [autoresResult, entidadesResult] = await Promise.all([
    pool.query(
      `SELECT pa.patente_id, pa.id, pa.investigador_id, pa.condicion,
              pa.es_presentador, pa.nombres, pa.apellido1, pa.apellido2, pa.puntaje,
              ui.codigo_orcid, ui.scopus_id, ui.renacyt, ui.renacyt_nivel
       FROM Patente_autor pa
       LEFT JOIN Usuario_investigador ui ON pa.investigador_id = ui.id
       WHERE pa.patente_id IN (?)
       ORDER BY pa.id ASC`,
      [patIds],
    ),
    pool.query(
      `SELECT pe.patente_id, pe.titular
       FROM Patente_entidad pe
       WHERE pe.patente_id IN (?)`,
      [patIds],
    ),
  ]);

  const autoresByPat = groupBy(autoresResult[0], 'patente_id');
  const entidadesByPat = groupBy(entidadesResult[0], 'patente_id');

  for (const pat of patents) {
    pat.autores = autoresByPat[pat.id] ?? [];
    pat.entidades = entidadesByPat[pat.id] ?? [];
  }
}

// ─── Queries publicas ───────────────────────────────────────────────────────

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM Patente WHERE id = ? AND estado >= 1 LIMIT 1`,
    [id],
  );

  if (rows.length === 0) return null;

  const patents = [rows[0]];
  await enrichPatents(patents);
  return patents[0];
}

export async function countAll(filters = {}) {
  const { where, params } = buildWhereClause(filters);
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM Patente p WHERE ${where}`,
    params,
  );
  return rows[0].total;
}

export async function getIdentifiers({ set, from, until, cursor = 0, limit = 100 } = {}) {
  const { where, params } = buildWhereClause({ set, from, until });
  params.push(limit, cursor);

  const [rows] = await pool.query(
    `SELECT p.id, p.tipo, p.updated_at
     FROM Patente p
     WHERE ${where}
     ORDER BY p.id ASC
     LIMIT ? OFFSET ?`,
    params,
  );

  return rows;
}

export async function findAll({ set, from, until, cursor = 0, limit = 100 } = {}) {
  const { where, params } = buildWhereClause({ set, from, until });
  params.push(limit, cursor);

  const [rows] = await pool.query(
    `SELECT * FROM Patente p WHERE ${where} ORDER BY p.id ASC LIMIT ? OFFSET ?`,
    params,
  );

  if (rows.length === 0) return [];

  await enrichPatents(rows);
  return rows;
}

export async function getDistinctSets() {
  const [rows] = await pool.query(
    `SELECT DISTINCT tipo
     FROM Patente
     WHERE estado >= 1 AND tipo IS NOT NULL AND tipo != ''
     ORDER BY tipo ASC`,
  );
  return rows.map((r) => r.tipo);
}

export async function getEarliestDatestamp() {
  const [rows] = await pool.query(
    `SELECT MIN(created_at) AS earliest
     FROM Patente
     WHERE estado >= 1 AND created_at IS NOT NULL AND YEAR(created_at) > 0`,
  );
  return rows[0]?.earliest ?? null;
}
