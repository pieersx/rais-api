import * as pubRepo from '../repositories/publicacion.repository.js';
import * as proyRepo from '../repositories/proyecto.repository.js';
import * as patRepo from '../repositories/patente.repository.js';
import * as personaRepo from '../repositories/persona.repository.js';
import * as orgunitRepo from '../repositories/orgunit.repository.js';
import { toDatestamp } from '../utils/oaiIdentifier.js';

/**
 * Servicio para el verbo Identify.
 * Retorna informacion descriptiva del repositorio con las 5 entidades.
 */
export async function handleIdentify() {
  // Obtener fechas mas antiguas y conteos en paralelo
  const [
    pubEarliest, proyEarliest, patEarliest, personaEarliest, orgunitEarliest,
    pubCount, proyCount, patCount, personaCount, orgunitCount,
  ] = await Promise.all([
    pubRepo.getEarliestDatestamp(),
    proyRepo.getEarliestDatestamp(),
    patRepo.getEarliestDatestamp(),
    personaRepo.getEarliestDatestamp(),
    orgunitRepo.getEarliestDatestamp(),
    pubRepo.countAll(),
    proyRepo.countAll(),
    patRepo.countAll(),
    personaRepo.countAll(),
    orgunitRepo.countAll(),
  ]);

  // La fecha mas antigua de las 5 entidades
  const dates = [pubEarliest, proyEarliest, patEarliest, personaEarliest, orgunitEarliest]
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
    deletedRecord: 'persistent',
    granularity: 'YYYY-MM-DDThh:mm:ssZ',
    metadataPrefix: 'perucris-cerif',
    description: {
      oaiIdentifier: {
        scheme: 'oai',
        repositoryIdentifier: 'cris.unmsm.edu.pe',
        delimiter: ':',
        sampleIdentifier: 'oai:cris.unmsm.edu.pe:Publications/2',
      },
      entityTypes: [
        {
          type: 'Publications',
          count: pubCount,
          description: 'Publicaciones de investigacion (articulos, tesis, libros, etc.)',
        },
        {
          type: 'Projects',
          count: proyCount,
          description: 'Proyectos de investigacion financiados y no financiados',
        },
        {
          type: 'Patents',
          count: patCount,
          description: 'Patentes y registros de propiedad intelectual',
        },
        {
          type: 'Persons',
          count: personaCount,
          description: 'Investigadores y personal academico de la UNMSM',
        },
        {
          type: 'OrgUnits',
          count: orgunitCount,
          description: 'Unidades organizativas: facultades, institutos y grupos de investigacion',
        },
      ],
      institution: {
        name: 'Universidad Nacional Mayor de San Marcos',
        ror: 'https://ror.org/00rwzpz13',
        ruc: '20148092282',
        country: 'PE',
      },
      compliance: {
        profile: 'PeruCRIS 1.1',
        metadataFormat: 'perucris-cerif',
        schema: 'https://purl.org/pe-repo/perucris/cerif.xsd',
      },
    },
  };
}
