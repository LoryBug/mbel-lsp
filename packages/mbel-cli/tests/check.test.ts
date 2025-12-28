import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkCommand, CheckResult } from '../src/commands/check.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('TDDAB#21: mbel check command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkCommand', () => {
    it('should return error when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await checkCommand('nonexistent.mbel', { json: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });

    it('should return valid=true for valid MBEL file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0
[SECTION]
@attr::value
`);

      const result = await checkCommand('valid.mbel', { json: true });

      expect(result.success).toBe(true);
      const data = JSON.parse(result.output) as CheckResult;
      expect(data.valid).toBe(true);
      expect(data.errors).toHaveLength(0);
    });

    it('should return valid=false with errors for invalid MBEL', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0
[SECTION
@attr::value
`);

      const result = await checkCommand('invalid.mbel', { json: true });

      expect(result.success).toBe(true); // Command succeeded, file has errors
      const data = JSON.parse(result.output) as CheckResult;
      expect(data.valid).toBe(false);
      expect(data.errors.length).toBeGreaterThan(0);
    });

    it('should include line and column in error output', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0
[UNCLOSED
`);

      const result = await checkCommand('error.mbel', { json: true });
      const data = JSON.parse(result.output) as CheckResult;

      expect(data.errors.length).toBeGreaterThan(0);
      const firstError = data.errors[0];
      expect(firstError).toHaveProperty('line');
      expect(firstError).toHaveProperty('column');
      expect(typeof firstError?.line).toBe('number');
    });

    it('should include error code in output', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0
[UNCLOSED
`);

      const result = await checkCommand('error.mbel', { json: true });
      const data = JSON.parse(result.output) as CheckResult;

      expect(data.errors.length).toBeGreaterThan(0);
      const firstError = data.errors[0];
      expect(firstError).toHaveProperty('code');
      expect(typeof firstError?.code).toBe('string');
    });

    it('should include severity in error output', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0
[UNCLOSED
`);

      const result = await checkCommand('error.mbel', { json: true });
      const data = JSON.parse(result.output) as CheckResult;

      expect(data.errors.length).toBeGreaterThan(0);
      const firstError = data.errors[0];
      expect(firstError).toHaveProperty('severity');
      expect(firstError?.severity).toBe('error');
    });

    it('should include file path in output', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0
[SECTION]
`);

      const result = await checkCommand('test.mbel', { json: true });
      const data = JSON.parse(result.output) as CheckResult;

      expect(data.file).toBe('test.mbel');
    });

    it('should separate errors and warnings', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0
[section]
`);

      const result = await checkCommand('case.mbel', { json: true });
      const data = JSON.parse(result.output) as CheckResult;

      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('warnings');
      expect(Array.isArray(data.errors)).toBe(true);
      expect(Array.isArray(data.warnings)).toBe(true);
    });
  });

  describe('CheckResult structure', () => {
    it('should have valid boolean', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0`);

      const result = await checkCommand('test.mbel', { json: true });
      const data = JSON.parse(result.output) as CheckResult;

      expect(typeof data.valid).toBe('boolean');
    });

    it('should have errors array', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0`);

      const result = await checkCommand('test.mbel', { json: true });
      const data = JSON.parse(result.output) as CheckResult;

      expect(Array.isArray(data.errors)).toBe(true);
    });

    it('should have warnings array', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0`);

      const result = await checkCommand('test.mbel', { json: true });
      const data = JSON.parse(result.output) as CheckResult;

      expect(Array.isArray(data.warnings)).toBe(true);
    });
  });

  describe('text output format', () => {
    it('should return human-readable text when json=false', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0
[SECTION]
`);

      const result = await checkCommand('test.mbel', { json: false });

      expect(result.format).toBe('text');
      expect(() => JSON.parse(result.output)).toThrow(); // Not JSON
    });

    it('should show success message for valid files', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0
[SECTION]
`);

      const result = await checkCommand('test.mbel', { json: false });

      expect(result.output).toContain('valid');
    });

    it('should show error count for invalid files', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0
[UNCLOSED
`);

      const result = await checkCommand('test.mbel', { json: false });

      expect(result.output).toMatch(/error|invalid/i);
    });
  });

  describe('suggestedFix support', () => {
    it('should include suggestedFix when available', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      // Unicode arrow that should suggest ->
      vi.mocked(fs.readFileSync).mockReturnValue(`§MBEL:6.0
[SECTION]
@feature{Test}
  →files[test.ts]
`);

      const result = await checkCommand('arrow.mbel', { json: true });
      const data = JSON.parse(result.output) as CheckResult;

      // If there's an error with a suggested fix, it should have the structure
      const errorWithFix = data.errors.find(e => e.suggestedFix);
      if (errorWithFix) {
        expect(errorWithFix.suggestedFix).toHaveProperty('find');
        expect(errorWithFix.suggestedFix).toHaveProperty('replace');
      }
    });
  });
});
