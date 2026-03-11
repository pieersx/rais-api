/**
 * Modulo de paginacion stateless para OAI-PMH.
 *
 * El resumptionToken es un objeto JSON codificado en Base64 que contiene
 * todos los parametros necesarios para reconstruir la consulta:
 * { cursor, set, from, until, metadataPrefix }
 *
 * Esto elimina la necesidad de almacenar tokens en la BD.
 */

/**
 * Codifica los parametros de paginacion en un token Base64.
 * @param {object} params - { cursor, set, from, until, metadataPrefix }
 * @returns {string}
 */
export function encodeToken(params) {
  const payload = JSON.stringify(params);
  return Buffer.from(payload, 'utf-8').toString('base64url');
}

/**
 * Decodifica un resumptionToken Base64 a sus parametros originales.
 * @param {string} token
 * @returns {object|null} - { cursor, set, from, until, metadataPrefix } o null si es invalido
 */
export function decodeToken(token) {
  try {
    const payload = Buffer.from(token, 'base64url').toString('utf-8');
    const data = JSON.parse(payload);

    // Validacion minima: cursor debe ser un numero
    if (typeof data.cursor !== 'number' || data.cursor < 0) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * Genera el objeto resumptionToken para la respuesta OAI-PMH.
 * Si no hay mas paginas, retorna un token vacio (indica fin de lista).
 *
 * @param {object} options
 * @param {number} options.cursor - Offset actual
 * @param {number} options.pageSize - Tamano de pagina
 * @param {number} options.completeListSize - Total de registros
 * @param {string} [options.set]
 * @param {string} [options.from]
 * @param {string} [options.until]
 * @param {string} [options.metadataPrefix]
 * @returns {object|null} - El objeto resumptionToken o null si es la ultima pagina
 */
export function buildResumptionToken({ cursor, pageSize, completeListSize, set, from, until, metadataPrefix }) {
  const nextCursor = cursor + pageSize;

  // Si ya no hay mas registros, retornar token vacio (fin de lista)
  if (nextCursor >= completeListSize) {
    // Solo incluir resumptionToken si hubo paginacion (cursor > 0)
    if (cursor > 0) {
      return {
        token: '',
        completeListSize,
        cursor,
      };
    }
    return null;
  }

  // Hay mas paginas: generar token con los parametros para la siguiente
  const token = encodeToken({
    cursor: nextCursor,
    set: set ?? null,
    from: from ?? null,
    until: until ?? null,
    metadataPrefix: metadataPrefix ?? 'oai_cerif',
  });

  return {
    token,
    completeListSize,
    cursor,
  };
}

/**
 * Extrae los parametros de paginacion: si hay resumptionToken lo decodifica,
 * si no, usa los query params directamente.
 *
 * @param {object} oaiParams - Los query params validados
 * @returns {{ cursor: number, set: string|null, from: string|null, until: string|null, metadataPrefix: string, pageSize: number }}
 */
export function extractPaginationParams(oaiParams) {
  const pageSize = Number(process.env.PAGE_SIZE ?? 100);

  if (oaiParams.resumptionToken) {
    const decoded = decodeToken(oaiParams.resumptionToken);
    if (!decoded) return null;

    return {
      cursor: decoded.cursor,
      set: decoded.set,
      from: decoded.from,
      until: decoded.until,
      metadataPrefix: decoded.metadataPrefix ?? 'oai_cerif',
      pageSize,
      _multiEntity: decoded._multiEntity ?? null,
    };
  }

  return {
    cursor: 0,
    set: oaiParams.set ?? null,
    from: oaiParams.from ?? null,
    until: oaiParams.until ?? null,
    metadataPrefix: oaiParams.metadataPrefix ?? 'oai_cerif',
    pageSize,
    _multiEntity: null,
  };
}
