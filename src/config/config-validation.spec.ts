import validateConfig from '@/utils/validate-config';
import { IsInt, IsString, Max, Min } from 'class-validator';

class TestEnv {
  @IsString()
  REQUIRED_STRING: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  PORT: number;
}

describe('validateConfig', () => {
  it('passes when all required env vars present and valid', () => {
    expect(() => validateConfig({ REQUIRED_STRING: 'ok', PORT: '5432' }, TestEnv)).not.toThrow();
  });

  it('throws when a required env var is missing', () => {
    expect(() => validateConfig({ PORT: '5432' }, TestEnv)).toThrow(/REQUIRED_STRING/);
  });

  it('throws when an env var fails its validator', () => {
    expect(() => validateConfig({ REQUIRED_STRING: 'ok', PORT: '99999' }, TestEnv)).toThrow(/PORT/);
  });
});
