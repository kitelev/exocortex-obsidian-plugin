# Hook Setup Instructions

## Agent Enforcement Hook Configuration

This hook ensures that all significant tasks in the Exocortex plugin are executed using specialized agents, following the project's AI-first development approach.

## Installation

### 1. Add to Claude Code Settings

Add the following to your Claude Code settings JSON:

```json
{
  "hooks": {
    "tool_use": ".claude/hooks/agent-enforcement-hook.sh",
    "prompt_submit": ".claude/hooks/agent-enforcement-hook.sh"
  }
}
```

### 2. Location of Settings File

The settings file location depends on your OS:

- **macOS**: `~/Library/Application Support/Claude Code/settings.json`
- **Linux**: `~/.config/Claude Code/settings.json`
- **Windows**: `%APPDATA%\Claude Code\settings.json`

### 3. Alternative: Using Environment Variables

You can also set hooks via environment variables:

```bash
export CLAUDE_HOOK_TOOL_USE=".claude/hooks/agent-enforcement-hook.sh"
export CLAUDE_HOOK_PROMPT_SUBMIT=".claude/hooks/agent-enforcement-hook.sh"
```

## Features

### Tool Use Monitoring

- Tracks when significant tools (Write, Edit, Bash) are used
- Warns if agents aren't being used for complex operations
- Allows basic operations (Read, LS, Grep) without agents

### Prompt Analysis

- Analyzes user prompts for task complexity
- Suggests appropriate specialized agents based on keywords
- Reminds about parallel agent usage for complex tasks

### Agent Recommendations

The hook suggests agents based on task type:

| Task Type      | Recommended Agents               |
| -------------- | -------------------------------- |
| Testing        | qa-engineer, test-fixer-agent    |
| Architecture   | architect-agent, swebok-engineer |
| Implementation | orchestrator, swebok-engineer    |
| Debugging      | error-handler, code-review-agent |
| Performance    | performance-agent                |

## Customization

Edit `.claude/hooks/agent-enforcement-hook.sh` to:

- Add more keywords for task detection
- Modify agent recommendations
- Change warning thresholds
- Add project-specific rules

## Testing the Hook

After setup, test with:

```bash
# Test tool use hook
echo "Testing Write tool without agent"

# Test prompt analysis
echo "I need to implement a new feature"
```

You should see warnings and agent recommendations.

## Troubleshooting

1. **Hook not executing**: Check file permissions (`chmod +x`)
2. **No output**: Verify settings.json path and format
3. **Errors**: Check hook script syntax with `bash -n agent-enforcement-hook.sh`

## Benefits

- ✅ Enforces best practices automatically
- ✅ Reduces forgotten agent usage
- ✅ Improves code quality through specialized expertise
- ✅ Maintains project standards consistently
