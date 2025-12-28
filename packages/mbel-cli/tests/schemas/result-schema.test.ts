import { describe, it, expect } from 'vitest';
import {
  type TaskResult,
  type FileChange,
  type TestSummary,
  type ResultStatus,
  RESULT_STATUSES,
  FILE_ACTIONS,
  createTaskResult,
  validateTaskResult,
  serializeResult,
  deserializeResult,
  aggregateTestSummaries,
} from '../../src/schemas/result-schema.js';

describe('TDDAB#28: ResultSchema', () => {
  describe('ResultStatus', () => {
    it('should define completed status', () => {
      const status: ResultStatus = 'completed';
      expect(status).toBe('completed');
    });

    it('should define blocked status', () => {
      const status: ResultStatus = 'blocked';
      expect(status).toBe('blocked');
    });

    it('should define failed status', () => {
      const status: ResultStatus = 'failed';
      expect(status).toBe('failed');
    });

    it('should define partial status', () => {
      const status: ResultStatus = 'partial';
      expect(status).toBe('partial');
    });

    it('should export RESULT_STATUSES array with all 4 statuses', () => {
      expect(RESULT_STATUSES).toEqual(['completed', 'blocked', 'failed', 'partial']);
      expect(RESULT_STATUSES).toHaveLength(4);
    });
  });

  describe('FileChange interface', () => {
    it('should define created file change', () => {
      const change: FileChange = {
        path: 'src/new-file.ts',
        action: 'created',
      };

      expect(change.path).toBe('src/new-file.ts');
      expect(change.action).toBe('created');
    });

    it('should define modified file change', () => {
      const change: FileChange = {
        path: 'src/existing.ts',
        action: 'modified',
        linesChanged: 42,
      };

      expect(change.action).toBe('modified');
      expect(change.linesChanged).toBe(42);
    });

    it('should define deleted file change', () => {
      const change: FileChange = {
        path: 'src/old-file.ts',
        action: 'deleted',
      };

      expect(change.action).toBe('deleted');
    });

    it('should export FILE_ACTIONS array', () => {
      expect(FILE_ACTIONS).toEqual(['created', 'modified', 'deleted']);
      expect(FILE_ACTIONS).toHaveLength(3);
    });
  });

  describe('TestSummary interface', () => {
    it('should define test summary with all fields', () => {
      const summary: TestSummary = {
        passed: 10,
        failed: 2,
        skipped: 1,
        newTests: 3,
      };

      expect(summary.passed).toBe(10);
      expect(summary.failed).toBe(2);
      expect(summary.skipped).toBe(1);
      expect(summary.newTests).toBe(3);
    });

    it('should support zero values', () => {
      const summary: TestSummary = {
        passed: 0,
        failed: 0,
        skipped: 0,
        newTests: 0,
      };

      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(0);
    });

    it('should calculate total tests', () => {
      const summary: TestSummary = {
        passed: 10,
        failed: 2,
        skipped: 1,
        newTests: 5,
      };

      const total = summary.passed + summary.failed + summary.skipped;
      expect(total).toBe(13);
    });
  });

  describe('TaskResult interface', () => {
    it('should define complete task result', () => {
      const result: TaskResult = {
        taskId: 'TDDAB#27',
        status: 'completed',
        filesChanged: [
          { path: 'src/schema.ts', action: 'created' },
        ],
        tests: {
          passed: 43,
          failed: 0,
          skipped: 0,
          newTests: 43,
        },
        mbDelta: '✓TDDAB#27::TaskSchema{complete}',
        blockers: [],
        duration: 5000,
      };

      expect(result.taskId).toBe('TDDAB#27');
      expect(result.status).toBe('completed');
      expect(result.filesChanged).toHaveLength(1);
      expect(result.duration).toBe(5000);
    });

    it('should define blocked result with blockers', () => {
      const result: TaskResult = {
        taskId: 'TDDAB#28',
        status: 'blocked',
        filesChanged: [],
        tests: { passed: 0, failed: 0, skipped: 0, newTests: 0 },
        mbDelta: '',
        blockers: ['Missing dependency: Parser', 'Test infrastructure not ready'],
        duration: 1000,
      };

      expect(result.status).toBe('blocked');
      expect(result.blockers).toHaveLength(2);
      expect(result.blockers[0]).toContain('Missing dependency');
    });

    it('should define failed result', () => {
      const result: TaskResult = {
        taskId: 'TDDAB#29',
        status: 'failed',
        filesChanged: [{ path: 'src/broken.ts', action: 'modified' }],
        tests: { passed: 5, failed: 3, skipped: 0, newTests: 0 },
        mbDelta: '',
        blockers: ['3 tests failing'],
        duration: 3000,
      };

      expect(result.status).toBe('failed');
      expect(result.tests.failed).toBe(3);
    });

    it('should define partial result', () => {
      const result: TaskResult = {
        taskId: 'TDDAB#30',
        status: 'partial',
        filesChanged: [
          { path: 'src/part1.ts', action: 'created' },
          { path: 'src/part2.ts', action: 'created' },
        ],
        tests: { passed: 10, failed: 0, skipped: 5, newTests: 10 },
        mbDelta: '?TDDAB#30::InProgress{2/3-files}',
        blockers: ['Third file blocked by API decision'],
        duration: 8000,
      };

      expect(result.status).toBe('partial');
      expect(result.filesChanged).toHaveLength(2);
    });
  });

  describe('createTaskResult factory', () => {
    it('should create valid task result', () => {
      const result = createTaskResult({
        taskId: 'TDDAB#27',
        status: 'completed',
        filesChanged: [{ path: 'test.ts', action: 'created' }],
        tests: { passed: 10, failed: 0, skipped: 0, newTests: 10 },
        mbDelta: '✓TDDAB#27::Done',
        blockers: [],
        duration: 5000,
      });

      expect(result.taskId).toBe('TDDAB#27');
      expect(result.status).toBe('completed');
    });

    it('should freeze the returned object', () => {
      const result = createTaskResult({
        taskId: 'TDDAB#28',
        status: 'completed',
        filesChanged: [],
        tests: { passed: 0, failed: 0, skipped: 0, newTests: 0 },
        mbDelta: '',
        blockers: [],
        duration: 100,
      });

      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should deep freeze nested objects', () => {
      const result = createTaskResult({
        taskId: 'TDDAB#29',
        status: 'blocked',
        filesChanged: [{ path: 'a.ts', action: 'modified', linesChanged: 10 }],
        tests: { passed: 5, failed: 1, skipped: 0, newTests: 2 },
        mbDelta: '?blocked',
        blockers: ['issue'],
        duration: 2000,
      });

      expect(Object.isFrozen(result.filesChanged)).toBe(true);
      expect(Object.isFrozen(result.tests)).toBe(true);
      expect(Object.isFrozen(result.blockers)).toBe(true);
    });
  });

  describe('validateTaskResult', () => {
    const validResult: TaskResult = {
      taskId: 'TDDAB#27',
      status: 'completed',
      filesChanged: [{ path: 'test.ts', action: 'created' }],
      tests: { passed: 10, failed: 0, skipped: 0, newTests: 10 },
      mbDelta: '✓Done',
      blockers: [],
      duration: 1000,
    };

    it('should return valid for correct result', () => {
      const validation = validateTaskResult(validResult);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject empty taskId', () => {
      const result = { ...validResult, taskId: '' };
      const validation = validateTaskResult(result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('taskId is required');
    });

    it('should reject invalid status', () => {
      const result = { ...validResult, status: 'invalid' as ResultStatus };
      const validation = validateTaskResult(result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('status must be one of: completed, blocked, failed, partial');
    });

    it('should reject negative duration', () => {
      const result = { ...validResult, duration: -100 };
      const validation = validateTaskResult(result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('duration must be non-negative');
    });

    it('should reject negative test counts', () => {
      const result = {
        ...validResult,
        tests: { passed: -1, failed: 0, skipped: 0, newTests: 0 },
      };
      const validation = validateTaskResult(result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('test counts must be non-negative');
    });

    it('should reject invalid file action', () => {
      const result = {
        ...validResult,
        filesChanged: [{ path: 'test.ts', action: 'invalid' as FileChange['action'] }],
      };
      const validation = validateTaskResult(result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('invalid file action: invalid');
    });

    it('should reject empty file path', () => {
      const result = {
        ...validResult,
        filesChanged: [{ path: '', action: 'created' as const }],
      };
      const validation = validateTaskResult(result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('file path is required');
    });

    it('should warn if blocked status but no blockers', () => {
      const result = { ...validResult, status: 'blocked' as const, blockers: [] };
      const validation = validateTaskResult(result);
      expect(validation.valid).toBe(true); // Warning, not error
      expect(validation.warnings).toContain('blocked status but no blockers listed');
    });

    it('should collect multiple errors', () => {
      const result = {
        ...validResult,
        taskId: '',
        status: 'bad' as ResultStatus,
        duration: -1,
      };
      const validation = validateTaskResult(result);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('serializeResult', () => {
    it('should serialize result to JSON string', () => {
      const result = createTaskResult({
        taskId: 'TDDAB#27',
        status: 'completed',
        filesChanged: [{ path: 'test.ts', action: 'created' }],
        tests: { passed: 10, failed: 0, skipped: 0, newTests: 10 },
        mbDelta: '✓Done',
        blockers: [],
        duration: 1000,
      });

      const json = serializeResult(result);
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should produce valid JSON with all fields', () => {
      const result = createTaskResult({
        taskId: 'TDDAB#28',
        status: 'partial',
        filesChanged: [
          { path: 'a.ts', action: 'created' },
          { path: 'b.ts', action: 'modified', linesChanged: 50 },
        ],
        tests: { passed: 15, failed: 2, skipped: 3, newTests: 8 },
        mbDelta: '?TDDAB#28::Partial',
        blockers: ['Issue 1', 'Issue 2'],
        duration: 5000,
      });

      const json = serializeResult(result);
      const parsed = JSON.parse(json);

      expect(parsed.taskId).toBe('TDDAB#28');
      expect(parsed.status).toBe('partial');
      expect(parsed.filesChanged).toHaveLength(2);
      expect(parsed.tests.passed).toBe(15);
      expect(parsed.blockers).toHaveLength(2);
    });
  });

  describe('deserializeResult', () => {
    it('should deserialize valid JSON to TaskResult', () => {
      const json = JSON.stringify({
        taskId: 'TDDAB#27',
        status: 'completed',
        filesChanged: [{ path: 'test.ts', action: 'created' }],
        tests: { passed: 10, failed: 0, skipped: 0, newTests: 10 },
        mbDelta: '✓Done',
        blockers: [],
        duration: 1000,
      });

      const result = deserializeResult(json);
      expect(result.success).toBe(true);
      expect(result.result?.taskId).toBe('TDDAB#27');
    });

    it('should return frozen result on success', () => {
      const json = JSON.stringify({
        taskId: 'TDDAB#28',
        status: 'completed',
        filesChanged: [],
        tests: { passed: 0, failed: 0, skipped: 0, newTests: 0 },
        mbDelta: '',
        blockers: [],
        duration: 100,
      });

      const result = deserializeResult(json);
      expect(result.success).toBe(true);
      expect(Object.isFrozen(result.result)).toBe(true);
    });

    it('should fail for invalid JSON', () => {
      const result = deserializeResult('not valid json');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should fail for JSON null', () => {
      const result = deserializeResult('null');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid structure');
    });

    it('should fail for JSON array', () => {
      const result = deserializeResult('[]');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid structure');
    });

    it('should fail for invalid result structure', () => {
      const json = JSON.stringify({
        taskId: '',
        status: 'invalid',
      });

      const result = deserializeResult(json);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should validate after parsing', () => {
      const json = JSON.stringify({
        taskId: 'TDDAB#29',
        status: 'completed',
        filesChanged: [],
        tests: { passed: 0, failed: 0, skipped: 0, newTests: 0 },
        mbDelta: '',
        blockers: [],
        duration: -100, // Invalid: negative duration
      });

      const result = deserializeResult(json);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('duration must be non-negative');
    });

    it('should handle missing optional linesChanged', () => {
      const json = JSON.stringify({
        taskId: 'TDDAB#30',
        status: 'completed',
        filesChanged: [{ path: 'test.ts', action: 'created' }],
        tests: { passed: 5, failed: 0, skipped: 0, newTests: 5 },
        mbDelta: '✓Done',
        blockers: [],
        duration: 500,
      });

      const result = deserializeResult(json);
      expect(result.success).toBe(true);
      expect(result.result?.filesChanged[0]?.linesChanged).toBeUndefined();
    });

    it('should preserve linesChanged when present', () => {
      const json = JSON.stringify({
        taskId: 'TDDAB#31',
        status: 'completed',
        filesChanged: [{ path: 'modified.ts', action: 'modified', linesChanged: 42 }],
        tests: { passed: 10, failed: 0, skipped: 0, newTests: 3 },
        mbDelta: '✓Complete',
        blockers: [],
        duration: 800,
      });

      const result = deserializeResult(json);
      expect(result.success).toBe(true);
      expect(result.result?.filesChanged[0]?.linesChanged).toBe(42);
    });

    it('should handle missing taskId and status with defaults', () => {
      const json = JSON.stringify({
        // taskId missing
        // status missing
        filesChanged: [],
        tests: { passed: 0, failed: 0, skipped: 0, newTests: 0 },
        mbDelta: '',
        blockers: [],
        duration: 0,
      });

      const result = deserializeResult(json);
      // Should fail because taskId is required (becomes empty string after default)
      expect(result.success).toBe(false);
      expect(result.errors).toContain('taskId is required');
    });

    it('should handle missing file path and action with defaults', () => {
      const json = JSON.stringify({
        taskId: 'TDDAB#32',
        status: 'completed',
        filesChanged: [{ }], // path and action missing
        tests: { passed: 0, failed: 0, skipped: 0, newTests: 0 },
        mbDelta: '',
        blockers: [],
        duration: 100,
      });

      const result = deserializeResult(json);
      // Should fail because path becomes empty (required)
      expect(result.success).toBe(false);
      expect(result.errors).toContain('file path is required');
    });
  });

  describe('aggregateTestSummaries', () => {
    it('should aggregate multiple test summaries', () => {
      const summaries: TestSummary[] = [
        { passed: 10, failed: 1, skipped: 2, newTests: 5 },
        { passed: 20, failed: 3, skipped: 1, newTests: 8 },
        { passed: 15, failed: 0, skipped: 0, newTests: 3 },
      ];

      const aggregated = aggregateTestSummaries(summaries);

      expect(aggregated.passed).toBe(45);
      expect(aggregated.failed).toBe(4);
      expect(aggregated.skipped).toBe(3);
      expect(aggregated.newTests).toBe(16);
    });

    it('should return zeros for empty array', () => {
      const aggregated = aggregateTestSummaries([]);

      expect(aggregated.passed).toBe(0);
      expect(aggregated.failed).toBe(0);
      expect(aggregated.skipped).toBe(0);
      expect(aggregated.newTests).toBe(0);
    });

    it('should handle single summary', () => {
      const summaries: TestSummary[] = [
        { passed: 42, failed: 0, skipped: 2, newTests: 10 },
      ];

      const aggregated = aggregateTestSummaries(summaries);

      expect(aggregated.passed).toBe(42);
      expect(aggregated.newTests).toBe(10);
    });
  });
});
