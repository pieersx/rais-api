import * as pubRepo from '../repositories/publicacion.repository.js';
import * as proyRepo from '../repositories/proyecto.repository.js';
import * as patRepo from '../repositories/patente.repository.js';
import * as personaRepo from '../repositories/persona.repository.js';
import * as orgunitRepo from '../repositories/orgunit.repository.js';
import { pool } from '../config/database.js';

/**
 * Servicio para el verbo ListSets.
 * Retorna sets jerarquicos para las 5 entidades (formato oficial PerúCRIS en inglés):
 *   - publications:<tipo>
 *   - projects:<tipo>
 *   - patents:<tipo>
 *   - persons / persons:facultad-<id>
 *   - orgunits / orgunits:facultad / orgunits:instituto / orgunits:grupo
 *   - facultad:<id>    (cross-entity: publicaciones + proyectos de la facultad)
 *   - ocde:<codigo>    (cross-entity: publicaciones + proyectos del area OCDE)
 */
export async function handleListSets() {
  // Ejecutar todas las consultas en paralelo
  const [pubSets, proySets, patSets, personaSets, facultades, ocdeAreas] = await Promise.all([
    pubRepo.getDistinctSets(),
    proyRepo.getDistinctSets(),
    patRepo.getDistinctSets(),
    personaRepo.getDistinctSets(),
    pool.query('SELECT id, nombre FROM Facultad ORDER BY nombre ASC'),
    pool.query(
      `SELECT codigo, linea FROM Ocde WHERE parent_id IS NULL ORDER BY codigo ASC`,
    ),
  ]);

  const sets = [];

  // ── Sets de publicaciones ──
  sets.push({
    setSpec: 'publications',
    setName: 'Publications',
    setDescription: 'Todas las publicaciones de investigacion de RAIS UNMSM',
  });
  for (const tipo of pubSets) {
    sets.push({
      setSpec: `publications:${tipo}`,
      setName: `Publications - ${capitalize(tipo)}`,
    });
  }

  // ── Sets de proyectos ──
  sets.push({
    setSpec: 'projects',
    setName: 'Research Projects',
    setDescription: 'Todos los proyectos de investigacion de RAIS UNMSM',
  });
  for (const tipo of proySets) {
    sets.push({
      setSpec: `projects:${tipo}`,
      setName: `Projects - ${getProyectoTipoNombre(tipo)}`,
    });
  }

  // ── Sets de patentes ──
  sets.push({
    setSpec: 'patents',
    setName: 'Patents and Intellectual Property',
    setDescription: 'Patentes y registros de propiedad intelectual',
  });
  for (const tipo of patSets) {
    sets.push({
      setSpec: `patents:${tipo}`,
      setName: `Patents - ${capitalize(tipo)}`,
    });
  }

  // ── Sets de personas ──
  sets.push({
    setSpec: 'persons',
    setName: 'Persons (Researchers)',
    setDescription: 'Investigadores y personal academico de la UNMSM',
  });
  for (const row of personaSets) {
    sets.push({
      setSpec: `persons:facultad-${row.facultad_id}`,
      setName: `Persons - ${row.facultad_nombre}`,
    });
  }

  // ── Sets de unidades organizativas ──
  sets.push({
    setSpec: 'orgunits',
    setName: 'Organizational Units',
    setDescription: 'Facultades, institutos y grupos de investigacion de la UNMSM',
  });
  sets.push({
    setSpec: 'orgunits:facultad',
    setName: 'Organizational Units - Faculties',
  });
  sets.push({
    setSpec: 'orgunits:instituto',
    setName: 'Organizational Units - Institutes',
  });
  sets.push({
    setSpec: 'orgunits:grupo',
    setName: 'Organizational Units - Research Groups',
  });

  // ── Sets por facultad (cross-entity) ──
  for (const fac of facultades[0]) {
    sets.push({
      setSpec: `facultad:${fac.id}`,
      setName: `Facultad de ${fac.nombre}`,
    });
  }

  // ── Sets por area OCDE (cross-entity) ──
  for (const ocde of ocdeAreas[0]) {
    sets.push({
      setSpec: `ocde:${ocde.codigo}`,
      setName: `OCDE: ${ocde.linea}`,
    });
  }

  return {
    verb: 'ListSets',
    set: sets,
  };
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const PROYECTO_TIPOS = {
  PCONFIGI: 'Con financiamiento',
  PSINFINV: 'Sin financiamiento (Investigacion)',
  PSINFIPU: 'Sin financiamiento (Publicacion)',
  PTPGRADO: 'Tesis Pregrado',
  PTPMAEST: 'Tesis Maestria',
  PTPDOCTO: 'Tesis Doctorado',
  PTPBACHILLER: 'Tesis Bachiller',
  PEVENTO: 'Eventos Academicos',
  PINVPOS: 'Talleres Investigacion y Posgrado',
  ECI: 'Equipamiento Cientifico',
  PMULTI: 'Multidisciplinario',
  PFEX: 'Fondo Externo',
  PINTERDIS: 'Interdisciplinario',
  RFPLU: 'Fondo RFPLU',
  SPINOFF: 'Spin-Off',
  'PRO-CTIE': 'PRO-CTIE',
  PICV: 'PICV',
};

function getProyectoTipoNombre(tipo) {
  return PROYECTO_TIPOS[tipo] ?? tipo;
}
