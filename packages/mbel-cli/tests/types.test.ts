import { describe, it, expect } from 'vitest';
import type { CliResult, CliOptions, OutputFormat } from '../src/types.js';

describe('TDDAB#20: CLI Types', () => {
  describe('CliResult interface', () => {
    it('should define success result structure', () => {
      const successResult: CliResult = {
        success: true,
        output: 'Operation completed',
        format: 'text'
      };

      expect(successResult.success).toBe(true);
      expect(successResult.output).toBe('Operation completed');
      expect(successResult.format).toBe('text');
    });

    it('should define error result structure', () => {
      const errorResult: CliResult = {
        success: false,
        output: '',
        format: 'text',
        error: 'Command not found'
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe('Command not found');
    });

    it('should support JSON format', () => {
      const jsonResult: CliResult = {
        success: true,
        output: '{"status":"ok"}',
        format: 'json'
      };

      expect(jsonResult.format).toBe('json');
      expect(() => JSON.parse(jsonResult.output)).not.toThrow();
    });
  });

  describe('CliOptions interface', () => {
    it('should define json option', () => {
      const options: CliOptions = {
        json: true,
        quiet: false
      };

      expect(options.json).toBe(true);
    });

    it('should define quiet option', () => {
      const options: CliOptions = {
        json: false,
        quiet: true
      };

      expect(options.quiet).toBe(true);
    });
  });

  describe('OutputFormat type', () => {
    it('should accept json format', () => {
      const format: OutputFormat = 'json';
      expect(format).toBe('json');
    });

    it('should accept text format', () => {
      const format: OutputFormat = 'text';
      expect(format).toBe('text');
    });
  });
});
