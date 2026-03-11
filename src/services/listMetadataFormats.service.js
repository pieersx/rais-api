/**
 * Servicio para el verbo ListMetadataFormats.
 * Retorna los formatos de metadatos soportados por el repositorio.
 */
export async function handleListMetadataFormats() {
  return {
    verb: 'ListMetadataFormats',
    metadataFormats: [
      {
        metadataPrefix: 'oai_cerif',
        schema: 'https://raw.githubusercontent.com/concytec-pe/Peru-CRIS/main/directrices/schemas/perucris-cerif-profile.xsd',
        metadataNamespace: 'urn:xmlns:org:eurocris:cerif-1.6-2',
        description: 'Perfil CERIF PeruCRIS 1.1 - Formato para interoperabilidad con CONCYTEC',
      },
    ],
  };
}
