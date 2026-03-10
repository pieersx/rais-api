/**
 * Servicio para el verbo ListMetadataFormats.
 * Retorna los formatos de metadatos soportados por el repositorio.
 */
export async function handleListMetadataFormats() {
  return {
    verb: 'ListMetadataFormats',
    metadataFormats: [
      {
        metadataPrefix: 'oai_dc',
        schema: 'http://www.openarchives.org/OAI/2.0/oai_dc.xsd',
        metadataNamespace: 'http://www.openarchives.org/OAI/2.0/oai_dc/',
        description: 'Dublin Core simplificado - Formato base OAI-PMH',
      },
    ],
  };
}
