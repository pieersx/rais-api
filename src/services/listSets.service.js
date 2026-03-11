import * as pubRepo from '../repositories/publicacion.repository.js';
import * as proyRepo from '../repositories/proyecto.repository.js';
import * as patRepo from '../repositories/patente.repository.js';
import * as personaRepo from '../repositories/persona.repository.js';
import * as orgunitRepo from '../repositories/orgunit.repository.js';
import { pool } from '../config/database.js';

/**
 * Servicio para el verbo ListSets.
 * Retorna sets jerarquicos para las 5 entidades:
 *   - publicacion:<tipo>
 *   - proyecto:<tipo>
 *   - patente:<tipo>
 *   - persona / persona:facultad-<id>
 *   - orgunit / orgunit:facultad / orgunit:instituto / orgunit:grupo
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
    setSpec: 'publicacion',
    setName: 'Publicaciones',
    setDescription: 'Todas las publicaciones de investigacion de RAIS UNMSM',
  });
  for (const tipo of pubSets) {
    sets.push({
      setSpec: `publicacion:${tipo}`,
      setName: `Publicaciones - ${capitalize(tipo)}`,
    });
  }

  // ── Sets de proyectos ──
  sets.push({
    setSpec: 'proyecto',
    setName: 'Proyectos de Investigacion',
    setDescription: 'Todos los proyectos de investigacion de RAIS UNMSM',
  });
  for (const tipo of proySets) {
    sets.push({
      setSpec: `proyecto:${tipo}`,
      setName: `Proyectos - ${getProyectoTipoNombre(tipo)}`,
    });
  }

  // ── Sets de patentes ──
  sets.push({
    setSpec: 'patente',
    setName: 'Patentes y Propiedad Intelectual',
    setDescription: 'Patentes y registros de propiedad intelectual',
  });
  for (const tipo of patSets) {
    sets.push({
      setSpec: `patente:${tipo}`,
      setName: `Patentes - ${capitalize(tipo)}`,
    });
  }

  // ── Sets de personas ──
  sets.push({
    setSpec: 'persona',
    setName: 'Personas (Investigadores)',
    setDescription: 'Investigadores y personal academico de la UNMSM',
  });
  for (const row of personaSets) {
    sets.push({
      setSpec: `persona:facultad-${row.facultad_id}`,
      setName: `Personas - ${row.facultad_nombre}`,
    });
  }

  // ── Sets de unidades organizativas ──
  sets.push({
    setSpec: 'orgunit',
    setName: 'Unidades Organizativas',
    setDescription: 'Facultades, institutos y grupos de investigacion de la UNMSM',
  });
  sets.push({
    setSpec: 'orgunit:facultad',
    setName: 'Unidades Organizativas - Facultades',
  });
  sets.push({
    setSpec: 'orgunit:instituto',
    setName: 'Unidades Organizativas - Institutos',
  });
  sets.push({
    setSpec: 'orgunit:grupo',
    setName: 'Unidades Organizativas - Grupos de Investigacion',
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
    sets,
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
