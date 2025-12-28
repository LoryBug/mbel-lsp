/**
 * TDDAB#29: MbelMerge Command Tests
 *
 * Tests for the mbel merge command that performs atomic merge of delta MBEL
 * into Memory Bank files.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  mergeCommand,
  parseDelta,
  findInsertionPoint,
  atomicWrite,
  type MergeOptions,
  type MergeResult,
  type ParseResult,
  type InsertionPoint,
} from '../../src/commands/merge.js';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  renameSync: vi.fn(),
  unlinkSync: vi.fn(),
  mkdtempSync: vi.fn(),
}));

// Mock path module for temp file handling
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    dirname: vi.fn((p: string) => {
      const parts = p.split(/[/\\]/);
      parts.pop();
      return parts.join('/') || '.';
    }),
    join: vi.fn((...args: string[]) => args.join('/')),
  };
});

describe('TDDAB#29: mbel merge command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================
  // Test 1: Merge single statement
  // =========================================
  describe('Merge single statement', () => {
    it('should merge a single MBEL statement into existing file', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
@feature::Parser
  ✓TASK#1::Complete
`;
      const delta = '✓TASK#2::Complete';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
      vi.mocked(fs.renameSync).mockImplementation(() => undefined);

      const result = await mergeCommand('test.mbel', { delta });

      expect(result.success).toBe(true);
      expect(result.merged).toBe(true);
      expect(result.insertedAt).toBeDefined();
    });
  });

  // =========================================
  // Test 2: Merge into existing section
  // =========================================
  describe('Merge into existing section', () => {
    it('should insert delta into the correct section', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
@feature::Parser
  ✓TASK#1::Complete

[PENDING]
?TASK#10::Waiting
`;
      const delta = '✓TASK#2::Complete';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
      vi.mocked(fs.renameSync).mockImplementation(() => undefined);

      const result = await mergeCommand('test.mbel', { delta });

      expect(result.success).toBe(true);
      expect(result.insertedAt?.section).toBe('PROGRESS');
    });
  });

  // =========================================
  // Test 3: Create new section if needed
  // =========================================
  describe('Create new section if needed', () => {
    it('should create new section when section does not exist', async () => {
      const targetContent = `§MBEL:6.0
[FEATURES]
@feature::Parser
`;
      const delta = `[PROGRESS]
✓TASK#1::Complete`;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
      vi.mocked(fs.renameSync).mockImplementation(() => undefined);

      const result = await mergeCommand('test.mbel', { delta });

      expect(result.success).toBe(true);
      expect(result.merged).toBe(true);
      expect(result.insertedAt?.section).toBe('PROGRESS');
    });
  });

  // =========================================
  // Test 4: Preserve file structure
  // =========================================
  describe('Preserve file structure', () => {
    it('should preserve existing file structure and formatting', async () => {
      const targetContent = `§MBEL:6.0

[PROGRESS]
@feature::Parser
  ✓TASK#1::Complete

[NOTES]
Some notes here
`;
      const delta = '✓TASK#2::Complete';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);
      let writtenContent = '';
      vi.mocked(fs.writeFileSync).mockImplementation((p, content) => {
        writtenContent = content as string;
      });
      vi.mocked(fs.renameSync).mockImplementation(() => undefined);

      const result = await mergeCommand('test.mbel', { delta });

      expect(result.success).toBe(true);
      // Should preserve the version header
      expect(writtenContent).toContain('§MBEL:6.0');
      // Should preserve both sections
      expect(writtenContent).toContain('[PROGRESS]');
      expect(writtenContent).toContain('[NOTES]');
    });
  });

  // =========================================
  // Test 5: Atomic write (no corruption)
  // =========================================
  describe('Atomic write (no corruption)', () => {
    it('should use temp file + rename pattern for atomic writes', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
✓TASK#1::Complete
`;
      const delta = '✓TASK#2::Complete';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);

      const writeFileSyncMock = vi.mocked(fs.writeFileSync);
      const renameSyncMock = vi.mocked(fs.renameSync);

      await mergeCommand('test.mbel', { delta });

      // Should write to temp file first
      expect(writeFileSyncMock).toHaveBeenCalled();
      // Should rename temp to target
      expect(renameSyncMock).toHaveBeenCalled();
    });

    it('should handle write errors gracefully', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
`;
      const delta = '✓TASK#1::Complete';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Disk full');
      });

      const result = await mergeCommand('test.mbel', { delta });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Disk full');
    });
  });

  // =========================================
  // Test 6: Dry-run mode (no write)
  // =========================================
  describe('Dry-run mode', () => {
    it('should not write to file in dry-run mode', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
✓TASK#1::Complete
`;
      const delta = '✓TASK#2::Complete';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);

      const writeFileSyncMock = vi.mocked(fs.writeFileSync);

      const result = await mergeCommand('test.mbel', { delta, dryRun: true });

      expect(result.success).toBe(true);
      expect(result.merged).toBe(true);
      expect(writeFileSyncMock).not.toHaveBeenCalled();
    });

    it('should still return insertion point in dry-run mode', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
✓TASK#1::Complete
`;
      const delta = '✓TASK#2::Complete';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);

      const result = await mergeCommand('test.mbel', { delta, dryRun: true });

      expect(result.insertedAt).toBeDefined();
      expect(result.insertedAt?.section).toBe('PROGRESS');
    });
  });

  // =========================================
  // Test 7: JSON output format
  // =========================================
  describe('JSON output format', () => {
    it('should return valid JSON when format=json', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
`;
      const delta = '✓TASK#1::Complete';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
      vi.mocked(fs.renameSync).mockImplementation(() => undefined);

      const result = await mergeCommand('test.mbel', { delta, format: 'json' });

      expect(result.success).toBe(true);
      // Result should be serializable as JSON
      expect(() => JSON.stringify(result)).not.toThrow();
    });

    it('should include all fields in JSON result', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
`;
      const delta = '✓TASK#1::Complete';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
      vi.mocked(fs.renameSync).mockImplementation(() => undefined);

      const result = await mergeCommand('test.mbel', { delta, format: 'json' });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('merged');
      expect(result).toHaveProperty('insertedAt');
    });
  });

  // =========================================
  // Test 8: Error - invalid delta syntax
  // =========================================
  describe('Error: invalid delta syntax', () => {
    it('should return error for invalid MBEL delta syntax', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
`;
      const delta = '<<<INVALID>>>';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);

      const result = await mergeCommand('test.mbel', { delta });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should not modify file when delta is invalid', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
`;
      const delta = '<<<INVALID>>>';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);
      const writeFileSyncMock = vi.mocked(fs.writeFileSync);

      await mergeCommand('test.mbel', { delta });

      expect(writeFileSyncMock).not.toHaveBeenCalled();
    });
  });

  // =========================================
  // Test 9: Error - file not found
  // =========================================
  describe('Error: file not found', () => {
    it('should return error when target file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await mergeCommand('nonexistent.mbel', { delta: '✓TASK#1::Complete' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // =========================================
  // Test 10: Error - section conflict
  // =========================================
  describe('Error: section conflict', () => {
    it('should detect duplicate entries and prevent conflicts', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
✓TASK#1::Complete
`;
      // Trying to add the same task again
      const delta = '✓TASK#1::Complete';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);

      const result = await mergeCommand('test.mbel', { delta });

      // Should still succeed but indicate no merge was needed
      expect(result.success).toBe(true);
      expect(result.merged).toBe(false);
    });
  });

  // =========================================
  // Test 11: Delta from file (--file option)
  // =========================================
  describe('Delta from file (--file option)', () => {
    it('should read delta from file when --file option is used', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
`;
      const deltaFileContent = '✓TASK#1::Complete';

      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return p === 'test.mbel' || p === 'delta.mbel';
      });
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        if (p === 'test.mbel') return targetContent;
        if (p === 'delta.mbel') return deltaFileContent;
        return '';
      });
      vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
      vi.mocked(fs.renameSync).mockImplementation(() => undefined);

      const result = await mergeCommand('test.mbel', { file: 'delta.mbel' });

      expect(result.success).toBe(true);
      expect(result.merged).toBe(true);
    });

    it('should return error when delta file does not exist', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return p === 'test.mbel';
      });
      vi.mocked(fs.readFileSync).mockReturnValue('§MBEL:6.0');

      const result = await mergeCommand('test.mbel', { file: 'nonexistent.mbel' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Delta file not found');
    });
  });

  // =========================================
  // Additional Test Cases for Coverage
  // =========================================
  describe('parseDelta function', () => {
    it('should parse valid MBEL delta', () => {
      const delta = '✓TASK#1::Complete';
      const result = parseDelta(delta);

      expect(result.valid).toBe(true);
      expect(result.statements).toBeDefined();
    });

    it('should return error for empty delta', () => {
      const result = parseDelta('');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should parse section declaration in delta', () => {
      const delta = `[PROGRESS]
✓TASK#1::Complete`;
      const result = parseDelta(delta);

      expect(result.valid).toBe(true);
      expect(result.section).toBe('PROGRESS');
    });

    it('should handle delta with version header', () => {
      const delta = `§MBEL:6.0
[PROGRESS]
✓TASK#1::Complete`;
      const result = parseDelta(delta);

      expect(result.valid).toBe(true);
      expect(result.section).toBe('PROGRESS');
    });

    it('should handle whitespace-only delta', () => {
      const result = parseDelta('   \n  \t  ');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Empty delta');
    });

    it('should return error for unclosed brackets', () => {
      // Unclosed bracket triggers a lexer error
      const delta = '[UNCLOSED';
      const result = parseDelta(delta);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Parse error');
    });
  });

  describe('findInsertionPoint function', () => {
    it('should find correct insertion point for existing section', () => {
      const content = `§MBEL:6.0
[PROGRESS]
@feature::Parser
  ✓TASK#1::Complete
`;
      const delta = '✓TASK#2::Complete';

      const point = findInsertionPoint(content, delta);

      expect(point.section).toBe('PROGRESS');
      expect(point.line).toBeGreaterThan(0);
    });

    it('should return end of file for new section', () => {
      const content = `§MBEL:6.0
[FEATURES]
@feature::Parser
`;
      const delta = `[PROGRESS]
✓TASK#1::Complete`;

      const point = findInsertionPoint(content, delta);

      expect(point.section).toBe('PROGRESS');
      expect(point.isNewSection).toBe(true);
    });
  });

  describe('atomicWrite function', () => {
    it('should write content atomically', async () => {
      const writeSpy = vi.mocked(fs.writeFileSync);
      const renameSpy = vi.mocked(fs.renameSync);

      await atomicWrite('test.mbel', 'content');

      expect(writeSpy).toHaveBeenCalled();
      expect(renameSpy).toHaveBeenCalled();
    });

    it('should clean up temp file on error', async () => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
      vi.mocked(fs.renameSync).mockImplementation(() => {
        throw new Error('Rename failed');
      });
      const unlinkSpy = vi.mocked(fs.unlinkSync);

      await expect(atomicWrite('test.mbel', 'content')).rejects.toThrow('Rename failed');
      expect(unlinkSpy).toHaveBeenCalled();
    });

    it('should handle cleanup failure silently', async () => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
      vi.mocked(fs.renameSync).mockImplementation(() => {
        throw new Error('Rename failed');
      });
      vi.mocked(fs.unlinkSync).mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      // Should still throw the original error, not the cleanup error
      await expect(atomicWrite('test.mbel', 'content')).rejects.toThrow('Rename failed');
    });
  });

  describe('Edge cases', () => {
    it('should handle file with only version header', async () => {
      const targetContent = '§MBEL:6.0';
      const delta = `[PROGRESS]
✓TASK#1::Complete`;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(targetContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
      vi.mocked(fs.renameSync).mockImplementation(() => undefined);

      const result = await mergeCommand('test.mbel', { delta });

      expect(result.success).toBe(true);
      expect(result.merged).toBe(true);
    });

    it('should handle empty options', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('§MBEL:6.0');

      const result = await mergeCommand('test.mbel', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('No delta provided');
    });

    it('should prefer delta option over file option', async () => {
      const targetContent = `§MBEL:6.0
[PROGRESS]
`;
      const deltaContent = '✓TASK#1::FromDelta';
      const fileContent = '✓TASK#2::FromFile';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        if (p === 'test.mbel') return targetContent;
        if (p === 'delta.mbel') return fileContent;
        return '';
      });
      let writtenContent = '';
      vi.mocked(fs.writeFileSync).mockImplementation((p, content) => {
        writtenContent = content as string;
      });
      vi.mocked(fs.renameSync).mockImplementation(() => undefined);

      await mergeCommand('test.mbel', { delta: deltaContent, file: 'delta.mbel' });

      expect(writtenContent).toContain('TASK#1');
      expect(writtenContent).not.toContain('TASK#2');
    });
  });
});
