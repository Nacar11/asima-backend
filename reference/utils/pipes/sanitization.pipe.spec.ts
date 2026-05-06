import { defaultSanitizationConfig } from '@/config/sanitization.config';
import { SanitizationPipe } from './sanitization.pipe';

describe('SanitizationPipe', () => {
  const pipe = new SanitizationPipe(defaultSanitizationConfig);

  it('should trim and normalize whitespace', () => {
    const input = { username: '  John   Doe  ' };
    const result = pipe.transform(input, { type: 'body', metatype: undefined });
    expect(result.username).toBe('John Doe');
  });

  it('should lowercase emails', () => {
    const input = { email: '  ExAmple@DOMAIN.com ' };
    const result = pipe.transform(input, { type: 'body', metatype: undefined });
    expect(result.email).toBe('example@domain.com');
  });

  it('should titlecase names', () => {
    const input = { firstName: 'jANE', lastName: 'doE' };
    const result = pipe.transform(input, { type: 'body', metatype: undefined });
    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('Doe');
  });

  it('should standardize date fields', () => {
    const input = { createdDate: '2023-12-31 14:56:00' };
    const result = pipe.transform(input, { type: 'body', metatype: undefined });
    expect(result.createdDate).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
    );
  });

  it('should strip emojis from username', () => {
    const input = { username: 'user😃123' };
    const result = pipe.transform(input, { type: 'body', metatype: undefined });
    expect(result.username).toBe('user123');
  });

  it('should allow emojis in description', () => {
    const input = { description: 'Hello world! 😃' };
    const result = pipe.transform(input, { type: 'body', metatype: undefined });
    expect(result.description).toContain('😃');
  });

  it('should restrict non-Latin for slugs', () => {
    const input = { slug: 'slug测试' };
    const result = pipe.transform(input, { type: 'body', metatype: undefined });
    expect(result.slug).toBe('slug');
  });

  it('should strip HTML tags from username', () => {
    const input = { username: '<script>alert("x")</script>user' };
    const result = pipe.transform(input, { type: 'body', metatype: undefined });
    expect(result.username).toBe('user');
  });

  it('should normalize line endings in description', () => {
    const input = { description: 'line1\r\nline2\rline3\nline4' };
    const result = pipe.transform(input, { type: 'body', metatype: undefined });
    expect(result.description).toBe('line1\nline2\nline3\nline4');
  });

  it('should deeply sanitize nested objects', () => {
    const input = { profile: { username: '  user😃  ' } };
    const result = pipe.transform(input, { type: 'body', metatype: undefined });
    expect(result.profile.username).toBe('user');
  });
});
