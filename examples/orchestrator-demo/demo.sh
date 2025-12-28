#!/bin/bash
# MBEL Orchestrator Demo Script
# Demonstrates the full multi-agent workflow using MBEL CLI

set -e

# Configuration
CLI="node packages/mbel-cli/dist/cli.js"
DEMO_DIR="examples/orchestrator-demo"

echo "========================================"
echo " MBEL Multi-Agent Orchestrator Demo"
echo "========================================"
echo ""

# Step 1: Validate TaskAssignment
echo "Step 1: Validating TaskAssignment..."
echo "Command: $CLI task-validate @$DEMO_DIR/sample-task.json"
echo ""
$CLI task-validate "@$DEMO_DIR/sample-task.json"
echo ""
echo "✓ TaskAssignment is valid"
echo ""

# Step 2: Show the task being assigned
echo "Step 2: Task to be assigned to subagent:"
echo "----------------------------------------"
cat "$DEMO_DIR/sample-task.json"
echo ""
echo ""

# Step 3: (Simulated) Subagent executes task and returns result
echo "Step 3: Subagent completes task and returns result..."
echo ""

# Step 4: Validate TaskResult
echo "Step 4: Validating TaskResult from subagent..."
echo "Command: $CLI result-validate @$DEMO_DIR/sample-result.json"
echo ""
$CLI result-validate "@$DEMO_DIR/sample-result.json"
echo ""
echo "✓ TaskResult is valid"
echo ""

# Step 5: Show the result
echo "Step 5: Result returned by subagent:"
echo "----------------------------------------"
cat "$DEMO_DIR/sample-result.json"
echo ""
echo ""

# Step 6: Merge delta into Memory Bank (dry-run)
echo "Step 6: Merging mbDelta into Memory Bank (dry-run)..."
echo "Command: $CLI merge memory-bank/systemPatterns.mbel.md --delta '[FeatureX] @status=implemented' --dry-run"
echo ""
$CLI merge memory-bank/systemPatterns.mbel.md --delta "[FeatureX] @status=implemented" --dry-run 2>/dev/null || echo "(Memory Bank file not found - this is expected in demo)"
echo ""

echo "========================================"
echo " Demo Complete!"
echo "========================================"
echo ""
echo "Workflow Summary:"
echo "  1. Orchestrator creates TaskAssignment JSON"
echo "  2. CLI validates task before sending to subagent"
echo "  3. Subagent executes task and returns TaskResult JSON"
echo "  4. CLI validates result from subagent"
echo "  5. Orchestrator merges mbDelta into Memory Bank"
echo ""
echo "For more info, see: $DEMO_DIR/README.md"
