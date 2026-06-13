/**
 * Build a safe `Content-Disposition` header value for a user-supplied
 * filename. `original_filename` is user-controlled, so it must never be
 * interpolated raw into a header:
 *
 *  - the ASCII `filename="..."` fallback strips CR/LF and quotes
 *    (header-injection guard) and replaces any non-printable-ASCII byte;
 *  - the RFC 5987 `filename*=UTF-8''<pct-encoded>` carries the full UTF-8
 *    name, percent-encoded, for clients that support it.
 */
export function contentDisposition(
  filename: string,
  type: 'inline' | 'attachment' = 'inline',
): string {
  const asciiFallback =
    filename
      .replace(/[\r\n"\\]/g, '')
      .replace(/[^\x20-\x7e]/g, '_')
      .trim() || 'download';
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
  return `${type}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
