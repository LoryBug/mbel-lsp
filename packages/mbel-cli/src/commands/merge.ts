/**
 * TDDAB#29: MbelMerge Command
 *
 * Performs atomic merge of delta MBEL into Memory Bank files.
 * Designed for orchestrator consumption with structured output.
 */

import * as fs from 'fs';
import * as path from 'path';
import { MbelParser } from '@mbel/core';
import type { Statement, SectionDeclaration } from '@mbel/core';

/**
 * Merge command options
 */
export interface MergeOptions {
  /** MBEL delta string to merge */
  delta?: string;
  /** Path to file containing delta */
  file?: string;
  /** Preview merge without writing */
  dryRun?: boolean;
  /** Output format */
  format?: 'json' | 'text';
}

/**
 * Result of merge operation
 */
export interface MergeResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Whether content was actually merged (false if duplicate) */
  merged: boolean;
  /** Location where content was inserted */
  insertedAt?: { section: string; line: number } | undefined;
  /** Error message if success is false */
  error?: string | undefined;
}

/**
 * Result of delta parsing
 */
export interface ParseResult {
  /** Whether delta is valid MBEL */
  valid: boolean;
  /** Parsed statements from delta */
  statements?: readonly Statement[] | undefined;
  /** Section name if delta includes a section declaration */
  section?: string | undefined;
  /** Error message if invalid */
  error?: string | undefined;
}

/**
 * Insertion point in target file
 */
export interface InsertionPoint {
  /** Section name where content will be inserted */
  section: string;
  /** Line number for insertion */
  line: number;
  /** Whether a new section needs to be created */
  isNewSection: boolean;
  /** Character offset for insertion */
  offset: number;
}

/**
 * Deep freeze an object and all its nested properties
 */
function deepFreeze<T extends object>(obj: T): T {
  const propNames = Object.getOwnPropertyNames(obj) as Array<keyof T>;

  for (const name of propNames) {
    const value = obj[name];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as object);
    }
  }

  return Object.freeze(obj);
}

/**
 * Parse a delta string into MBEL statements
 */
export function parseDelta(delta: string): ParseResult {
  if (!delta || delta.trim() === '') {
    return deepFreeze({
      valid: false,
      error: 'Empty delta provided',
    });
  }

  const parser = new MbelParser();

  // Prepend version header if not present for proper parsing
  const normalizedDelta = delta.startsWith('§MBEL')
    ? delta
    : `§MBEL:6.0\n${delta}`;

  const parseResult = parser.parse(normalizedDelta);

  if (parseResult.errors.length > 0) {
    return deepFreeze({
      valid: false,
      error: `Parse error: ${parseResult.errors[0]?.message ?? 'Unknown error'}`,
    });
  }

  // Check for section declaration in delta
  let section: string | undefined;
  for (const stmt of parseResult.document.statements) {
    if (stmt.type === 'SectionDeclaration') {
      section = (stmt as SectionDeclaration).name;
      break;
    }
  }

  // Filter out the version statement we added
  const statements = parseResult.document.statements.filter(
    stmt => stmt.type !== 'VersionStatement'
  );

  // Validate we have actual content (not just a section header)
  const hasContent = statements.some(stmt => stmt.type !== 'SectionDeclaration');
  if (!hasContent && !section) {
    return deepFreeze({
      valid: false,
      error: 'No valid MBEL content in delta',
    });
  }

  return deepFreeze({
    valid: true,
    statements,
    section,
  });
}

/**
 * Find the insertion point for delta in target content
 */
export function findInsertionPoint(content: string, delta: string): InsertionPoint {
  const lines = content.split('\n');
  const deltaParseResult = parseDelta(delta);

  // Get the target section from delta
  const targetSection = deltaParseResult.section ?? 'PROGRESS';

  // Find existing section in content
  let sectionStartLine = -1;
  let sectionEndLine = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined) {
      const trimmed = line.trim();
      // Check for section declaration [SECTION_NAME]
      const sectionMatch = trimmed.match(/^\[([A-Z_]+)\]$/);
      if (sectionMatch) {
        if (sectionMatch[1] === targetSection) {
          sectionStartLine = i;
        } else if (sectionStartLine >= 0) {
          // Found next section, so previous section ends here
          sectionEndLine = i;
          break;
        }
      }
    }
  }

  // If section exists, insert at end of section
  if (sectionStartLine >= 0) {
    // Find the last non-empty line in the section
    let insertLine = sectionEndLine;
    for (let i = sectionEndLine - 1; i > sectionStartLine; i--) {
      const line = lines[i];
      if (line !== undefined && line.trim() !== '') {
        insertLine = i + 1;
        break;
      }
    }

    // Calculate offset
    let offset = 0;
    for (let i = 0; i < insertLine && i < lines.length; i++) {
      const line = lines[i];
      if (line !== undefined) {
        offset += line.length + 1; // +1 for newline
      }
    }

    return deepFreeze({
      section: targetSection,
      line: insertLine + 1, // Convert to 1-based
      isNewSection: false,
      offset,
    });
  }

  // Section doesn't exist, insert at end of file
  let offset = content.length;
  if (!content.endsWith('\n')) {
    offset += 1; // Will add newline before new section
  }

  return deepFreeze({
    section: targetSection,
    line: lines.length + 1,
    isNewSection: true,
    offset,
  });
}

/**
 * Check if content already exists in target (duplicate detection)
 */
function isDuplicate(content: string, delta: string): boolean {
  // Normalize both for comparison
  const normalizedDelta = delta.trim();
  const normalizedContent = content;

  // Simple check: if the delta content is already in the file
  // This handles the case of exact duplicate entries
  return normalizedContent.includes(normalizedDelta);
}

/**
 * Perform the merge operation
 */
function performMerge(
  content: string,
  delta: string,
  insertionPoint: InsertionPoint
): string {
  const lines = content.split('\n');
  const deltaLines = delta.split('\n');

  // Filter out section declaration from delta if merging into existing section
  let linesToInsert = deltaLines;
  if (!insertionPoint.isNewSection) {
    linesToInsert = deltaLines.filter(line => !line.trim().match(/^\[[A-Z_]+\]$/));
  }

  // Build new content
  const newLines: string[] = [];

  // Add content before insertion point
  for (let i = 0; i < insertionPoint.line - 1 && i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined) {
      newLines.push(line);
    }
  }

  // Add new section header if needed
  if (insertionPoint.isNewSection) {
    if (newLines.length > 0 && newLines[newLines.length - 1]?.trim() !== '') {
      newLines.push(''); // Add blank line before new section
    }
  }

  // Add the delta content
  for (const line of linesToInsert) {
    if (line.trim() !== '') {
      newLines.push(line);
    }
  }

  // Add remaining content
  for (let i = insertionPoint.line - 1; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined) {
      newLines.push(line);
    }
  }

  return newLines.join('\n');
}

/**
 * Write content atomically using temp file + rename pattern
 */
export async function atomicWrite(targetPath: string, content: string): Promise<void> {
  const dir = path.dirname(targetPath);
  const tempPath = path.join(dir, `.merge-${Date.now()}.tmp`);

  try {
    // Write to temp file
    fs.writeFileSync(tempPath, content, 'utf-8');

    // Atomic rename
    fs.renameSync(tempPath, targetPath);
  } catch (error) {
    // Clean up temp file on error
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Execute the merge command
 *
 * @param targetPath - Path to target MBEL file
 * @param options - Merge options
 * @returns MergeResult with operation status
 */
export async function mergeCommand(
  targetPath: string,
  options: MergeOptions
): Promise<MergeResult> {
  // Validate options - need either delta or file
  if (!options.delta && !options.file) {
    return deepFreeze({
      success: false,
      merged: false,
      error: 'No delta provided: use --delta or --file option',
    });
  }

  // Check if target file exists
  if (!fs.existsSync(targetPath)) {
    return deepFreeze({
      success: false,
      merged: false,
      error: `Target file not found: ${targetPath}`,
    });
  }

  // Get delta content - prefer --delta over --file
  let deltaContent: string;
  if (options.delta) {
    deltaContent = options.delta;
  } else {
    // options.file is guaranteed to exist due to validation above
    const deltaFile = options.file as string;
    if (!fs.existsSync(deltaFile)) {
      return deepFreeze({
        success: false,
        merged: false,
        error: `Delta file not found: ${deltaFile}`,
      });
    }
    deltaContent = fs.readFileSync(deltaFile, 'utf-8');
  }

  // Parse and validate delta
  const parseResult = parseDelta(deltaContent);
  if (!parseResult.valid) {
    return deepFreeze({
      success: false,
      merged: false,
      error: parseResult.error ?? 'Invalid MBEL syntax in delta',
    });
  }

  // Read target file
  const targetContent = fs.readFileSync(targetPath, 'utf-8');

  // Check for duplicates
  if (isDuplicate(targetContent, deltaContent)) {
    return deepFreeze({
      success: true,
      merged: false,
      insertedAt: undefined,
    });
  }

  // Find insertion point
  const insertionPoint = findInsertionPoint(targetContent, deltaContent);

  // Perform the merge
  const mergedContent = performMerge(targetContent, deltaContent, insertionPoint);

  // Write the result (unless dry-run)
  if (!options.dryRun) {
    try {
      await atomicWrite(targetPath, mergedContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return deepFreeze({
        success: false,
        merged: false,
        error: `Write failed: ${errorMessage}`,
      });
    }
  }

  return deepFreeze({
    success: true,
    merged: true,
    insertedAt: {
      section: insertionPoint.section,
      line: insertionPoint.line,
    },
  });
}
