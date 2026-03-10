import * as pubRepo from '../repositories/publicacion.repository.js';
import * as proyRepo from '../repositories/proyecto.repository.js';
import * as patRepo from '../repositories/patente.repository.js';
import { toDatestamp } from '../utils/oaiIdentifier.js';

/**
 * Servicio para el verbo Identify.
 * Retorna informacion descriptiva del repositorio con las 3 entidades.
 */
export async function handleIdentify() {
  // Obtener fechas mas antiguas y conteos en paralelo
  const [pubEarliest, proyEarliest, patEarliest, pubCount, proyCount, patCount] =
    await Promise.all([
      pubRepo.getEarliestDatestamp(),
      proyRepo.getEarliestDatestamp(),
      patRepo.getEarliestDatestamp(),
      pubRepo.countAll(),
      proyRepo.countAll(),
      patRepo.countAll(),
    ]);

  // La fecha mas antigua de las 3 entidades
  const dates = [pubEarliest, proyEarliest, patEarliest]
    .filter(Boolean)
    .filter((d) => !d.startsWith?.('0000'))
    .map((d) => new Date(typeof d === 'string' ? d.replace(' ', 'T') + 'Z' : d))
    .filter((d) => !isNaN(d.getTime()));

  const earliest = dates.length > 0
    ? toDatestamp(new Date(Math.min(...dates.map((d) => d.getTime()))))
    : '2000-01-01T00:00:00Z';

  return {
    verb: 'Identify',
    repositoryName: 'RAIS - Registro de Actividades de Investigacion San Marcos',
    baseURL: process.env.BASE_URL,
    protocolVersion: '2.0',
    adminEmail: process.env.ADMIN_EMAIL ?? 'rais@unmsm.edu.pe',
    earliestDatestamp: earliest,
    deletedRecord: 'no',
    granularity: 'YYYY-MM-DDThh:mm:ssZ',
    description: {
      oaiIdentifier: {
        scheme: 'oai',
        repositoryIdentifier: 'rais.unmsm.edu.pe',
        delimiter: ':',
        sampleIdentifier: 'oai:rais.unmsm.edu.pe:publicacion/2',
      },
      entityTypes: [
        {
          type: 'publicacion',
          count: pubCount,
          description: 'Publicaciones de investigacion (articulos, tesis, libros, etc.)',
        },
        {
          type: 'proyecto',
          count: proyCount,
          description: 'Proyectos de investigacion financiados y no financiados',
        },
        {
          type: 'patente',
          count: patCount,
          description: 'Patentes y registros de propiedad intelectual',
        },
      ],
    },
  };
}
