import { pool } from '../config/database.js';

/**
 * Repositorio de consultas SQL para Proyectos.
 * Integra: Proyecto, Proyecto_integrante, Proyecto_integrante_tipo,
 *          Proyecto_descripcion, Linea_investigacion, Ocde,
 *          Facultad, Instituto, Grupo, Usuario_investigador
 *
 * REGLA: Solo proyectos con estado >= 1 (activos/aprobados).
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildWhereClause(filters = {}) {
  const conditions = ['p.estado >= 1'];
  const params = [];

  if (filters.set) {
    if (filters.set.startsWith('proyecto:')) {
      const setVal = filters.set.replace('proyecto:', '');
      conditions.push('p.tipo_proyecto = ?');
      params.push(setVal);
    } else if (filters.set === 'proyecto') {
      // Parent set: todos los proyectos (sin filtro de tipo)
    } else if (filters.set.startsWith('facultad:')) {
      const facId = Number(filters.set.replace('facultad:', ''));
      conditions.push('p.facultad_id = ?');
      params.push(facId);
    } else if (filters.set.startsWith('ocde:')) {
      // OCDE hierarchy: top (codigo='1') -> mid (parent_id=top.id) -> leaf (parent_id=mid.id)
      // Projects link to leaf or mid level, so we walk up the chain
      const ocdeCodigo = filters.set.replace('ocde:', '');
      conditions.push(
        `(o.codigo = ? OR EXISTS (
           SELECT 1 FROM Ocde o_mid WHERE o_mid.id = o.parent_id AND o_mid.codigo = ?
         ) OR EXISTS (
           SELECT 1 FROM Ocde o_mid2 WHERE o_mid2.id = o.parent_id
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
 * Enriquece proyectos con integrantes, descripciones y datos relacionados.
 */
async function enrichProjects(projects) {
  if (projects.length === 0) return;

  const projIds = projects.map((p) => p.id);

  const [integrantesResult, descripcionesResult] = await Promise.all([
    // Integrantes con datos de investigador y rol
    pool.query(
      `SELECT pi.proyecto_id, pi.investigador_id, pi.condicion, pi.tipo_tesista,
              pi.titulo_tesis, pi.contribucion,
              pit.nombre AS rol_nombre, pit.perfil AS rol_perfil,
              CONCAT(COALESCE(ui.apellido1, ''), ' ', COALESCE(ui.apellido2, ''), ', ', COALESCE(ui.nombres, '')) AS nombre_completo,
              ui.codigo_orcid, ui.scopus_id, ui.renacyt, ui.renacyt_nivel
       FROM Proyecto_integrante pi
       LEFT JOIN Proyecto_integrante_tipo pit ON pi.proyecto_integrante_tipo_id = pit.id
       LEFT JOIN Usuario_investigador ui ON pi.investigador_id = ui.id
       WHERE pi.proyecto_id IN (?) AND (pi.excluido IS NULL OR pi.excluido != 1)
       ORDER BY pit.id ASC`,
      [projIds],
    ),

    // Descripciones del proyecto (resumen, objetivos, etc.)
    pool.query(
      `SELECT proyecto_id, codigo, detalle
       FROM Proyecto_descripcion
       WHERE proyecto_id IN (?)`,
      [projIds],
    ),
  ]);

  const integrantesByProj = groupBy(integrantesResult[0], 'proyecto_id');
  const descripcionesByProj = groupBy(descripcionesResult[0], 'proyecto_id');

  for (const proj of projects) {
    proj.integrantes = integrantesByProj[proj.id] ?? [];

    // Convertir descripciones a objeto { codigo: detalle }
    const descs = descripcionesByProj[proj.id] ?? [];
    proj.descripciones = {};
    for (const d of descs) {
      proj.descripciones[d.codigo] = d.detalle;
    }
  }
}

// ─── Queries publicas ───────────────────────────────────────────────────────

const BASE_SELECT = `
  SELECT p.*, 
         f.nombre AS facultad_nombre,
         i.instituto AS instituto_nombre,
         g.grupo_nombre,
         li.nombre AS linea_investigacion,
         o.linea AS ocde_linea, o.codigo AS ocde_codigo
  FROM Proyecto p
  LEFT JOIN Facultad f ON p.facultad_id = f.id
  LEFT JOIN Instituto i ON p.instituto_id = i.id
  LEFT JOIN Grupo g ON p.grupo_id = g.id
  LEFT JOIN Linea_investigacion li ON p.linea_investigacion_id = li.id
  LEFT JOIN Ocde o ON p.ocde_id = o.id
`;

export async function findById(id) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE p.id = ? AND p.estado >= 1 LIMIT 1`,
    [id],
  );

  if (rows.length === 0) return null;

  const projects = [rows[0]];
  await enrichProjects(projects);
  return projects[0];
}

export async function countAll(filters = {}) {
  const { where, params } = buildWhereClause(filters);
  // Always join Ocde since WHERE may reference o.codigo for ocde: sets
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM Proyecto p LEFT JOIN Ocde o ON p.ocde_id = o.id WHERE ${where}`,
    params,
  );
  return rows[0].total;
}

export async function getIdentifiers({ set, from, until, cursor = 0, limit = 100 } = {}) {
  const { where, params } = buildWhereClause({ set, from, until });
  params.push(limit, cursor);

  const [rows] = await pool.query(
    `SELECT p.id, p.tipo_proyecto, p.updated_at, p.facultad_id, o.codigo AS ocde_codigo
     FROM Proyecto p
     LEFT JOIN Ocde o ON p.ocde_id = o.id
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
    `${BASE_SELECT} WHERE ${where} ORDER BY p.id ASC LIMIT ? OFFSET ?`,
    params,
  );

  if (rows.length === 0) return [];

  await enrichProjects(rows);
  return rows;
}

export async function getDistinctSets() {
  const [rows] = await pool.query(
    `SELECT DISTINCT tipo_proyecto
     FROM Proyecto
     WHERE estado >= 1 AND tipo_proyecto IS NOT NULL AND tipo_proyecto != ''
     ORDER BY tipo_proyecto ASC`,
  );
  return rows.map((r) => r.tipo_proyecto);
}

export async function getEarliestDatestamp() {
  const [rows] = await pool.query(
    `SELECT MIN(created_at) AS earliest
     FROM Proyecto
     WHERE estado >= 1 AND created_at IS NOT NULL AND YEAR(created_at) > 0`,
  );
  return rows[0]?.earliest ?? null;
}
