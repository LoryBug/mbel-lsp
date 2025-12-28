import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCli, runCli } from '../src/cli.js';
import type { CliResult } from '../src/types.js';
import { Command } from 'commander';

describe('TDDAB#20: CLI Scaffolding', () => {
  describe('createCli', () => {
    it('should create a Commander program instance', () => {
      const cli = createCli();
      expect(cli).toBeInstanceOf(Command);
    });

    it('should have name "mbel"', () => {
      const cli = createCli();
      expect(cli.name()).toBe('mbel');
    });

    it('should have version defined', () => {
      const cli = createCli();
      expect(cli.version()).toBeDefined();
      expect(cli.version()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have description', () => {
      const cli = createCli();
      expect(cli.description()).toBe('MBEL CLI - Agent-First Command Line Interface');
    });
  });

  describe('runCli', () => {
    it('should return CliResult with success status for valid commands', async () => {
      const result = await runCli(['node', 'mbel', '--version']);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('output');
    });

    it('should return JSON output when --json flag is provided', async () => {
      const result = await runCli(['node', 'mbel', '--json', '--version']);
      expect(result.format).toBe('json');
      expect(() => JSON.parse(result.output)).not.toThrow();
    });

    it('should return text output by default', async () => {
      const result = await runCli(['node', 'mbel', '--version']);
      expect(result.format).toBe('text');
    });

    it('should return error for unknown commands', async () => {
      const result = await runCli(['node', 'mbel', 'unknown-command']);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('CliResult structure', () => {
    it('should have success boolean', async () => {
      const result = await runCli(['node', 'mbel', '--version']);
      expect(typeof result.success).toBe('boolean');
    });

    it('should have output string', async () => {
      const result = await runCli(['node', 'mbel', '--version']);
      expect(typeof result.output).toBe('string');
    });

    it('should have format property', async () => {
      const result = await runCli(['node', 'mbel', '--version']);
      expect(result.format).toMatch(/^(json|text)$/);
    });

    it('should have optional error property on failure', async () => {
      const result = await runCli(['node', 'mbel', 'invalid']);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Global options', () => {
    it('should support --json flag', () => {
      const cli = createCli();
      const jsonOption = cli.options.find(opt => opt.long === '--json');
      expect(jsonOption).toBeDefined();
    });

    it('should support --quiet flag', () => {
      const cli = createCli();
      const quietOption = cli.options.find(opt => opt.long === '--quiet');
      expect(quietOption).toBeDefined();
    });
  });
});
