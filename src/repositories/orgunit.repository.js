import { pool } from '../config/database.js';

/**
 * Repositorio de consultas SQL para Unidades Organizativas.
 * Vista unificada de 3 tablas: Facultad, Instituto, Grupo.
 *
 * Identificadores compuestos: "facultad-3", "instituto-5", "grupo-10"
 * Jerarquia: UNMSM -> Facultad -> Grupo (Grupo.facultad_id, no instituto_id)
 *            UNMSM -> Facultad -> Instituto (Instituto.facultad_id)
 *
 * Conteos en Facultad: 23, Instituto: 38, Grupo: 431 = 492 total
 */

// ─── Constantes ─────────────────────────────────────────────────────────────

const UNMSM = {
  nombre: 'Universidad Nacional Mayor de San Marcos',
  ror: 'https://ror.org/00rwzpz13',
  ruc: '20148092282',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parsea un ID compuesto de orgunit: "facultad-3" -> { subtype: 'facultad', numericId: 3 }
 */
export function parseOrgUnitId(compoundId) {
  if (typeof compoundId === 'string') {
    const match = compoundId.match(/^(facultad|instituto|grupo)-(\d+)$/);
    if (match) return { subtype: match[1], numericId: Number(match[2]) };
  }
  return null;
}

// ─── Queries publicas ───────────────────────────────────────────────────────

export async function findById(compoundId) {
  const parsed = parseOrgUnitId(compoundId);
  if (!parsed) return null;

  const { subtype, numericId } = parsed;

  switch (subtype) {
    case 'facultad': {
      const [rows] = await pool.query(
        `SELECT f.id, f.nombre, f.area_id
         FROM Facultad f WHERE f.id = ? LIMIT 1`,
        [numericId],
      );
      if (rows.length === 0) return null;
      const fac = rows[0];
      return {
        id: compoundId,
        subtype: 'facultad',
        numericId: fac.id,
        nombre: fac.nombre,
        acronimo: null,
        tipo: 'Facultad',
        parent: UNMSM,
        email: null,
        telefono: null,
        web: null,
        direccion: null,
        updated_at: null,
        created_at: null,
      };
    }

    case 'instituto': {
      const [rows] = await pool.query(
        `SELECT i.id, i.instituto AS nombre, i.facultad_id, i.estado,
                f.nombre AS facultad_nombre
         FROM Instituto i
         LEFT JOIN Facultad f ON i.facultad_id = f.id
         WHERE i.id = ? LIMIT 1`,
        [numericId],
      );
      if (rows.length === 0) return null;
      const inst = rows[0];
      return {
        id: compoundId,
        subtype: 'instituto',
        numericId: inst.id,
        nombre: inst.nombre,
        acronimo: null,
        tipo: 'Instituto',
        parent: inst.facultad_id ? {
          id: `facultad-${inst.facultad_id}`,
          nombre: inst.facultad_nombre ?? 'Facultad',
          tipo: 'Facultad',
        } : UNMSM,
        email: null,
        telefono: null,
        web: null,
        direccion: null,
        estado: inst.estado,
        updated_at: null,
        created_at: null,
      };
    }

    case 'grupo': {
      const [rows] = await pool.query(
        `SELECT g.id, g.grupo_nombre AS nombre, g.grupo_nombre_corto AS acronimo,
                g.email, g.telefono, g.web, g.direccion,
                g.presentacion, g.objetivos, g.servicios,
                g.facultad_id, g.estado,
                g.created_at, g.updated_at,
                f.nombre AS facultad_nombre
         FROM Grupo g
         LEFT JOIN Facultad f ON g.facultad_id = f.id
         WHERE g.id = ? LIMIT 1`,
        [numericId],
      );
      if (rows.length === 0) return null;
      const grp = rows[0];

      // Jerarquia: Grupo -> Facultad -> UNMSM (no hay instituto_id en Grupo)
      const parent = grp.facultad_id
        ? {
            id: `facultad-${grp.facultad_id}`,
            nombre: grp.facultad_nombre ?? 'Facultad',
            tipo: 'Facultad',
          }
        : UNMSM;

      return {
        id: compoundId,
        subtype: 'grupo',
        numericId: grp.id,
        nombre: grp.nombre,
        acronimo: grp.acronimo,
        tipo: 'Grupo de Investigacion',
        parent,
        email: grp.email,
        telefono: grp.telefono,
        web: grp.web,
        direccion: grp.direccion,
        presentacion: grp.presentacion,
        objetivos: grp.objetivos,
        servicios: grp.servicios,
        estado: grp.estado,
        updated_at: grp.updated_at,
        created_at: grp.created_at,
      };
    }

    default:
      return null;
  }
}

/**
 * Cuenta todas las unidades organizativas.
 * Filtra por set si se proporciona: orgunits, orgunits:facultad, orgunits:instituto, orgunits:grupo
 */
export async function countAll(filters = {}) {
  const { set } = filters;

  if (set === 'orgunits:facultad') {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM Facultad');
    return rows[0].total;
  }
  if (set === 'orgunits:instituto') {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM Instituto WHERE estado >= 1');
    return rows[0].total;
  }
  if (set === 'orgunits:grupo') {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM Grupo WHERE estado >= 1');
    return rows[0].total;
  }

  // orgunits (parent) o sin set — todas las unidades
  const [facCount, instCount, grpCount] = await Promise.all([
    pool.query('SELECT COUNT(*) AS total FROM Facultad'),
    pool.query('SELECT COUNT(*) AS total FROM Instituto WHERE estado >= 1'),
    pool.query('SELECT COUNT(*) AS total FROM Grupo WHERE estado >= 1'),
  ]);

  return facCount[0][0].total + instCount[0][0].total + grpCount[0][0].total;
}

/**
 * Lista identificadores (headers) paginados.
 * Orden secuencial: facultades, luego institutos, luego grupos.
 */
export async function getIdentifiers({ set, from, until, cursor = 0, limit = 100 } = {}) {
  const rows = [];

  if (!set || set === 'orgunits' || set === 'orgunits:facultad') {
    const [facs] = await pool.query(
      `SELECT id, 'facultad' AS subtype, NULL AS updated_at
       FROM Facultad
       ORDER BY id ASC`,
    );
    for (const f of facs) {
      rows.push({ id: `facultad-${f.id}`, subtype: 'facultad', updated_at: f.updated_at });
    }
  }

  if (!set || set === 'orgunits' || set === 'orgunits:instituto') {
    const [insts] = await pool.query(
      `SELECT id, 'instituto' AS subtype, NULL AS updated_at
       FROM Instituto
       WHERE estado >= 1
       ORDER BY id ASC`,
    );
    for (const i of insts) {
      rows.push({ id: `instituto-${i.id}`, subtype: 'instituto', updated_at: i.updated_at });
    }
  }

  if (!set || set === 'orgunits' || set === 'orgunits:grupo') {
    const [grps] = await pool.query(
      `SELECT id, 'grupo' AS subtype, updated_at
       FROM Grupo
       WHERE estado >= 1
       ORDER BY id ASC`,
    );
    for (const g of grps) {
      rows.push({ id: `grupo-${g.id}`, subtype: 'grupo', updated_at: g.updated_at });
    }
  }

  // Paginacion manual (el total es pequeno ~701)
  return rows.slice(cursor, cursor + limit);
}

/**
 * Lista registros completos paginados.
 * Delega a findById para cada uno (el total es pequeno).
 */
export async function findAll({ set, from, until, cursor = 0, limit = 100 } = {}) {
  const identifiers = await getIdentifiers({ set, from, until, cursor, limit });
  const results = [];

  for (const row of identifiers) {
    const record = await findById(row.id);
    if (record) {
      record.updated_at = row.updated_at;
      results.push(record);
    }
  }

  return results;
}

/**
 * Sets disponibles para orgunits.
 */
export async function getDistinctSets() {
  return ['facultad', 'instituto', 'grupo'];
}

export async function getEarliestDatestamp() {
  // Solo Grupo tiene timestamps; Facultad e Instituto no los tienen
  const [rows] = await pool.query(
    `SELECT MIN(created_at) AS earliest
     FROM Grupo
     WHERE estado >= 1 AND created_at IS NOT NULL AND YEAR(created_at) > 0`,
  );
  return rows[0]?.earliest ?? null;
}
