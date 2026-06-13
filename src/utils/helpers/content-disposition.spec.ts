import { contentDisposition } from '@/utils/helpers/content-disposition';

describe('contentDisposition', () => {
  it('emits an inline disposition with ASCII fallback + RFC 5987 filename*', () => {
    expect(contentDisposition('report.pdf')).toBe(
      'inline; filename="report.pdf"; filename*=UTF-8\'\'report.pdf',
    );
  });

  it('strips CR/LF and quotes from the ASCII fallback (header-injection guard)', () => {
    const header = contentDisposition('a"b\r\nSet-Cookie: x.pdf');
    const ascii = /filename="([^"]*)"/.exec(header)![1];
    expect(ascii).not.toMatch(/[\r\n"]/);
  });

  it('percent-encodes a UTF-8 name in filename* and replaces non-ASCII in the fallback', () => {
    const header = contentDisposition('niño-café.png');
    expect(header).toContain("filename*=UTF-8''");
    expect(header).toContain('%C3%B1'); // ñ
    const ascii = /filename="([^"]*)"/.exec(header)![1];
    expect(ascii).toMatch(/^[\x20-\x7e]*$/);
  });

  it('falls back to "download" when nothing printable remains', () => {
    expect(contentDisposition('\r\n')).toContain('filename="download"');
  });

  it('supports an attachment disposition type', () => {
    expect(contentDisposition('x.webp', 'attachment')).toMatch(/^attachment; /);
  });
});
