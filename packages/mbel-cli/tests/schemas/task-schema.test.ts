import { describe, it, expect } from 'vitest';
import {
  type TaskAssignment,
  type TaskContext,
  type TaskConstraints,
  type TaskType,
  TASK_TYPES,
  createTaskAssignment,
  validateTaskAssignment,
  serializeTask,
  deserializeTask,
} from '../../src/schemas/task-schema.js';

describe('TDDAB#27: TaskSchema', () => {
  describe('TaskType', () => {
    it('should define implement type', () => {
      const taskType: TaskType = 'implement';
      expect(taskType).toBe('implement');
    });

    it('should define refactor type', () => {
      const taskType: TaskType = 'refactor';
      expect(taskType).toBe('refactor');
    });

    it('should define test type', () => {
      const taskType: TaskType = 'test';
      expect(taskType).toBe('test');
    });

    it('should define fix type', () => {
      const taskType: TaskType = 'fix';
      expect(taskType).toBe('fix');
    });

    it('should define document type', () => {
      const taskType: TaskType = 'document';
      expect(taskType).toBe('document');
    });

    it('should export TASK_TYPES array with all 5 types', () => {
      expect(TASK_TYPES).toEqual(['implement', 'refactor', 'test', 'fix', 'document']);
      expect(TASK_TYPES).toHaveLength(5);
    });
  });

  describe('TaskContext interface', () => {
    it('should define context with mbSnapshot', () => {
      const context: TaskContext = {
        mbSnapshot: '§MBEL:6.0\n@feature{Parser}->files[parser.ts]',
        files: ['src/parser.ts'],
        dependencies: ['Lexer'],
      };

      expect(context.mbSnapshot).toContain('§MBEL:6.0');
      expect(context.files).toContain('src/parser.ts');
      expect(context.dependencies).toContain('Lexer');
    });

    it('should support empty files array', () => {
      const context: TaskContext = {
        mbSnapshot: '',
        files: [],
        dependencies: [],
      };

      expect(context.files).toHaveLength(0);
    });

    it('should support multiple files and dependencies', () => {
      const context: TaskContext = {
        mbSnapshot: '@feature{Analyzer}',
        files: ['src/analyzer.ts', 'src/types.ts', 'src/validators.ts'],
        dependencies: ['Parser', 'Lexer', 'AST'],
      };

      expect(context.files).toHaveLength(3);
      expect(context.dependencies).toHaveLength(3);
    });
  });

  describe('TaskConstraints interface', () => {
    it('should define required constraints', () => {
      const constraints: TaskConstraints = {
        maxFiles: 3,
        testCommand: 'npm run test',
      };

      expect(constraints.maxFiles).toBe(3);
      expect(constraints.testCommand).toBe('npm run test');
    });

    it('should support optional maxTokens', () => {
      const constraints: TaskConstraints = {
        maxFiles: 5,
        testCommand: 'vitest run',
        maxTokens: 4000,
      };

      expect(constraints.maxTokens).toBe(4000);
    });

    it('should support optional timeout', () => {
      const constraints: TaskConstraints = {
        maxFiles: 2,
        testCommand: 'npm test',
        timeout: 60000,
      };

      expect(constraints.timeout).toBe(60000);
    });

    it('should support all optional fields', () => {
      const constraints: TaskConstraints = {
        maxFiles: 10,
        testCommand: 'npm run test:unit',
        maxTokens: 8000,
        timeout: 120000,
      };

      expect(constraints.maxFiles).toBe(10);
      expect(constraints.maxTokens).toBe(8000);
      expect(constraints.timeout).toBe(120000);
    });
  });

  describe('TaskAssignment interface', () => {
    it('should define complete task assignment', () => {
      const task: TaskAssignment = {
        id: 'TDDAB#27',
        type: 'implement',
        target: 'TaskSchema',
        description: 'Implement task assignment schema for multi-agent architecture',
        context: {
          mbSnapshot: '@feature{CLI}->files[cli.ts]',
          files: ['src/schemas/task-schema.ts'],
          dependencies: [],
        },
        acceptance: [
          'All tests pass',
          '100% coverage',
          'Zero any types',
        ],
        constraints: {
          maxFiles: 3,
          testCommand: 'npm run test',
        },
      };

      expect(task.id).toBe('TDDAB#27');
      expect(task.type).toBe('implement');
      expect(task.target).toBe('TaskSchema');
      expect(task.acceptance).toHaveLength(3);
    });

    it('should enforce readonly properties', () => {
      const task: TaskAssignment = {
        id: 'TDDAB#28',
        type: 'refactor',
        target: 'Parser',
        description: 'Refactor parser for performance',
        context: {
          mbSnapshot: '',
          files: [],
          dependencies: [],
        },
        acceptance: ['Tests pass'],
        constraints: {
          maxFiles: 5,
          testCommand: 'vitest',
        },
      };

      // TypeScript should prevent mutation - this is a compile-time check
      // At runtime, we verify the structure is correct
      expect(Object.isFrozen(task)).toBe(false); // Objects aren't frozen by default
      expect(task.id).toBe('TDDAB#28');
    });
  });

  describe('createTaskAssignment factory', () => {
    it('should create valid task assignment', () => {
      const task = createTaskAssignment({
        id: 'TDDAB#30',
        type: 'implement',
        target: 'MergeCommand',
        description: 'Implement mbel merge command',
        context: {
          mbSnapshot: '@feature{CLI}',
          files: ['src/commands/merge.ts'],
          dependencies: ['Parser', 'Analyzer'],
        },
        acceptance: ['Atomic writes work'],
        constraints: {
          maxFiles: 2,
          testCommand: 'npm test',
        },
      });

      expect(task.id).toBe('TDDAB#30');
      expect(task.type).toBe('implement');
      expect(task.target).toBe('MergeCommand');
    });

    it('should freeze the returned object', () => {
      const task = createTaskAssignment({
        id: 'TDDAB#31',
        type: 'test',
        target: 'Lexer',
        description: 'Add edge case tests',
        context: {
          mbSnapshot: '',
          files: [],
          dependencies: [],
        },
        acceptance: [],
        constraints: {
          maxFiles: 1,
          testCommand: 'vitest',
        },
      });

      expect(Object.isFrozen(task)).toBe(true);
    });

    it('should deep freeze nested objects', () => {
      const task = createTaskAssignment({
        id: 'TDDAB#32',
        type: 'fix',
        target: 'Analyzer',
        description: 'Fix validation bug',
        context: {
          mbSnapshot: 'snapshot',
          files: ['file.ts'],
          dependencies: ['dep'],
        },
        acceptance: ['Bug fixed'],
        constraints: {
          maxFiles: 1,
          testCommand: 'npm test',
        },
      });

      expect(Object.isFrozen(task.context)).toBe(true);
      expect(Object.isFrozen(task.constraints)).toBe(true);
      expect(Object.isFrozen(task.acceptance)).toBe(true);
    });
  });

  describe('validateTaskAssignment', () => {
    const validTask: TaskAssignment = {
      id: 'TDDAB#27',
      type: 'implement',
      target: 'TaskSchema',
      description: 'Implement schema',
      context: {
        mbSnapshot: '',
        files: [],
        dependencies: [],
      },
      acceptance: [],
      constraints: {
        maxFiles: 3,
        testCommand: 'npm test',
      },
    };

    it('should return valid for correct task', () => {
      const result = validateTaskAssignment(validTask);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty id', () => {
      const task = { ...validTask, id: '' };
      const result = validateTaskAssignment(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('id is required');
    });

    it('should reject invalid task type', () => {
      const task = { ...validTask, type: 'invalid' as TaskType };
      const result = validateTaskAssignment(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('type must be one of: implement, refactor, test, fix, document');
    });

    it('should reject empty target', () => {
      const task = { ...validTask, target: '' };
      const result = validateTaskAssignment(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('target is required');
    });

    it('should reject empty description', () => {
      const task = { ...validTask, description: '' };
      const result = validateTaskAssignment(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('description is required');
    });

    it('should reject zero maxFiles', () => {
      const task = {
        ...validTask,
        constraints: { ...validTask.constraints, maxFiles: 0 },
      };
      const result = validateTaskAssignment(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxFiles must be greater than 0');
    });

    it('should reject negative maxFiles', () => {
      const task = {
        ...validTask,
        constraints: { ...validTask.constraints, maxFiles: -1 },
      };
      const result = validateTaskAssignment(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxFiles must be greater than 0');
    });

    it('should reject empty testCommand', () => {
      const task = {
        ...validTask,
        constraints: { ...validTask.constraints, testCommand: '' },
      };
      const result = validateTaskAssignment(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('testCommand is required');
    });

    it('should collect multiple errors', () => {
      const task = {
        ...validTask,
        id: '',
        target: '',
        type: 'bad' as TaskType,
      };
      const result = validateTaskAssignment(task);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('serializeTask', () => {
    it('should serialize task to JSON string', () => {
      const task = createTaskAssignment({
        id: 'TDDAB#27',
        type: 'implement',
        target: 'Schema',
        description: 'Test serialization',
        context: {
          mbSnapshot: '@feature{Test}',
          files: ['test.ts'],
          dependencies: ['Dep'],
        },
        acceptance: ['Works'],
        constraints: {
          maxFiles: 1,
          testCommand: 'npm test',
        },
      });

      const json = serializeTask(task);
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should produce valid JSON with all fields', () => {
      const task = createTaskAssignment({
        id: 'TDDAB#28',
        type: 'refactor',
        target: 'Parser',
        description: 'Refactor',
        context: {
          mbSnapshot: 'snapshot',
          files: ['a.ts', 'b.ts'],
          dependencies: ['X', 'Y'],
        },
        acceptance: ['A', 'B', 'C'],
        constraints: {
          maxFiles: 5,
          testCommand: 'vitest',
          maxTokens: 4000,
          timeout: 30000,
        },
      });

      const json = serializeTask(task);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe('TDDAB#28');
      expect(parsed.type).toBe('refactor');
      expect(parsed.context.files).toHaveLength(2);
      expect(parsed.constraints.maxTokens).toBe(4000);
    });
  });

  describe('deserializeTask', () => {
    it('should deserialize valid JSON to TaskAssignment', () => {
      const json = JSON.stringify({
        id: 'TDDAB#27',
        type: 'implement',
        target: 'Schema',
        description: 'Deserialize test',
        context: {
          mbSnapshot: '',
          files: [],
          dependencies: [],
        },
        acceptance: [],
        constraints: {
          maxFiles: 1,
          testCommand: 'npm test',
        },
      });

      const result = deserializeTask(json);
      expect(result.success).toBe(true);
      expect(result.task?.id).toBe('TDDAB#27');
    });

    it('should return frozen task on success', () => {
      const json = JSON.stringify({
        id: 'TDDAB#28',
        type: 'test',
        target: 'Lexer',
        description: 'Test',
        context: { mbSnapshot: '', files: [], dependencies: [] },
        acceptance: [],
        constraints: { maxFiles: 1, testCommand: 'npm test' },
      });

      const result = deserializeTask(json);
      expect(result.success).toBe(true);
      expect(Object.isFrozen(result.task)).toBe(true);
    });

    it('should fail for invalid JSON', () => {
      const result = deserializeTask('not valid json');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should fail for JSON null', () => {
      const result = deserializeTask('null');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid structure');
    });

    it('should fail for JSON array', () => {
      const result = deserializeTask('[]');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid structure');
    });

    it('should fail for JSON primitive', () => {
      const result = deserializeTask('"just a string"');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid structure');
    });

    it('should handle missing optional nested objects', () => {
      // context and constraints missing entirely
      const json = JSON.stringify({
        id: 'TDDAB#33',
        type: 'implement',
        target: 'Feature',
        description: 'No context or constraints',
        acceptance: [],
      });

      const result = deserializeTask(json);
      // Should fail because constraints is missing (maxFiles and testCommand required)
      expect(result.success).toBe(false);
    });

    it('should use default type when missing', () => {
      const json = JSON.stringify({
        id: 'TDDAB#34',
        // type is missing
        target: 'Feature',
        description: 'No type specified',
        context: { mbSnapshot: '', files: [], dependencies: [] },
        acceptance: [],
        constraints: { maxFiles: 1, testCommand: 'npm test' },
      });

      const result = deserializeTask(json);
      expect(result.success).toBe(true);
      expect(result.task?.type).toBe('implement'); // default
    });

    it('should handle undefined id and target gracefully', () => {
      // id and target are explicitly undefined
      const json = JSON.stringify({
        // id is missing
        type: 'test',
        // target is missing
        description: 'Missing id and target',
        context: { mbSnapshot: '', files: [], dependencies: [] },
        acceptance: [],
        constraints: { maxFiles: 1, testCommand: 'npm test' },
      });

      const result = deserializeTask(json);
      // Should fail validation because id and target are required
      expect(result.success).toBe(false);
      expect(result.errors).toContain('id is required');
      expect(result.errors).toContain('target is required');
    });

    it('should fail for invalid task structure', () => {
      const json = JSON.stringify({
        id: '',
        type: 'invalid',
        target: '',
      });

      const result = deserializeTask(json);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should validate after parsing', () => {
      const json = JSON.stringify({
        id: 'TDDAB#29',
        type: 'implement',
        target: 'Merge',
        description: 'Valid task',
        context: { mbSnapshot: '', files: [], dependencies: [] },
        acceptance: [],
        constraints: { maxFiles: 0, testCommand: 'npm test' }, // Invalid: maxFiles = 0
      });

      const result = deserializeTask(json);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('maxFiles must be greater than 0');
    });

    it('should preserve optional maxTokens field', () => {
      const json = JSON.stringify({
        id: 'TDDAB#30',
        type: 'implement',
        target: 'Feature',
        description: 'With maxTokens',
        context: { mbSnapshot: '', files: [], dependencies: [] },
        acceptance: [],
        constraints: { maxFiles: 1, testCommand: 'npm test', maxTokens: 8000 },
      });

      const result = deserializeTask(json);
      expect(result.success).toBe(true);
      expect(result.task?.constraints.maxTokens).toBe(8000);
    });

    it('should preserve optional timeout field', () => {
      const json = JSON.stringify({
        id: 'TDDAB#31',
        type: 'fix',
        target: 'Bug',
        description: 'With timeout',
        context: { mbSnapshot: '', files: [], dependencies: [] },
        acceptance: [],
        constraints: { maxFiles: 2, testCommand: 'vitest', timeout: 60000 },
      });

      const result = deserializeTask(json);
      expect(result.success).toBe(true);
      expect(result.task?.constraints.timeout).toBe(60000);
    });

    it('should preserve both optional fields', () => {
      const json = JSON.stringify({
        id: 'TDDAB#32',
        type: 'refactor',
        target: 'Module',
        description: 'With both optional',
        context: { mbSnapshot: '', files: [], dependencies: [] },
        acceptance: [],
        constraints: { maxFiles: 3, testCommand: 'npm test', maxTokens: 4000, timeout: 30000 },
      });

      const result = deserializeTask(json);
      expect(result.success).toBe(true);
      expect(result.task?.constraints.maxTokens).toBe(4000);
      expect(result.task?.constraints.timeout).toBe(30000);
    });
  });
});
