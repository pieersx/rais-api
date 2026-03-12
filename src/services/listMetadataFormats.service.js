/**
 * Servicio para el verbo ListMetadataFormats.
 * Retorna los formatos de metadatos soportados por el repositorio.
 * Formato unico: perucris-cerif (formato oficial PerúCRIS)
 */
export async function handleListMetadataFormats() {
  return {
    verb: 'ListMetadataFormats',
    metadataFormat: [
      {
        metadataPrefix: 'perucris-cerif',
        schema: 'https://purl.org/pe-repo/perucris/cerif.xsd',
        metadataNamespace: 'https://purl.org/pe-repo/perucris/cerif',
      },
    ],
  };
}
