# 📊 Enhanced Agent Output Display Documentation

## Overview
The Enhanced Agent Output Display system provides detailed, real-time visibility into agent execution within the Exocortex plugin development workflow. This system addresses the need for better transparency and debugging capabilities when working with multiple parallel agents.

## Quick Start

### Basic Usage
```bash
# Set verbosity level
export CLAUDE_VERBOSE=verbose

# Run with enhanced output
/execute --verbose "Your task here"
```

### Testing the System
```bash
# Run test demonstration
.claude/scripts/agent-verbose-logger.sh test
```

## Configuration

### Environment Variables
```bash
export CLAUDE_VERBOSE=verbose        # Verbosity level: silent|basic|verbose|debug
export CLAUDE_SHOW_TIMING=true       # Show execution timing
export CLAUDE_SHOW_PARALLEL=true     # Highlight parallel execution
export CLAUDE_SHOW_DECISIONS=true    # Show agent decision reasoning
export CLAUDE_SHOW_PROGRESS=true     # Display progress bars
export CLAUDE_LOG_FILE=.claude/logs/execution.log  # Log file location
```

### Verbosity Levels

#### Silent Mode
- Only critical errors and final results
- Minimal output for production runs
```
✅ Task completed
```

#### Basic Mode (Default)
- Agent start/complete/error messages
- Essential information only
```
🚀 orchestrator: Starting task
✅ orchestrator completed (3.2s)
```

#### Verbose Mode
- All agent activities
- Progress updates and decisions
- Timing information
```
🚀 orchestrator: Decompose and coordinate task
  🔀 Starting parallel group (3 agents):
    • code-searcher
    • architect-agent
    • qa-engineer
  ⚡ code-searcher [33%]: Searching codebase...
  🤔 code-searcher decided: Focus on domain layer
  📝 code-searcher output: Found 5 relevant files
  ✅ code-searcher completed (1.2s)
```

#### Debug Mode
- Full trace including internal reasoning
- All intermediate outputs
- Detailed error stacks
```
🚀 orchestrator (0ms): Starting with context {...}
  Internal state: { queue: [...], dependencies: {...} }
  ⚡ Progress [10%]: Analyzing requirements
    Details: { complexity: 'high', domains: ['ui', 'backend'] }
  🤔 Decision: Use parallel pattern
    Reasoning: Multiple independent subtasks identified
    Alternatives: ['sequential', 'pipeline']
    Confidence: 0.92
```

## Visual Indicators

### Icons and Their Meanings
- 🚀 **Starting agent** - Agent initialization
- 🔀 **Parallel execution** - Multiple agents running simultaneously
- ➡️ **Sequential execution** - Single agent running
- ⚡ **Progress update** - Agent working on subtask
- 🤔 **Decision point** - Agent making strategic decision
- 📝 **Output generated** - Agent produced deliverable
- ✅ **Task completed** - Agent finished successfully
- ❌ **Error occurred** - Agent encountered problem
- ⏱️ **Timing information** - Execution duration metrics
- ℹ️ **Information** - General status update
- ⚠️ **Warning** - Non-critical issue
- 🔧 **Optimization** - Performance improvement
- 🔍 **Analysis** - Investigation in progress
- 🤝 **Collaboration** - Agents working together

### Progress Bars
Progress bars show real-time task completion:
```
[██████████████████░░░░░░░░░░░] 60% (6/10)
```

### Parallel Group Visualization
```
🔀 Parallel execution group (3 agents):
  • agent-1: Task 1
  • agent-2: Task 2
  • agent-3: Task 3

[Live Progress]
agent-1: ████████████████████ 100% ✅
agent-2: ████████████░░░░░░░  65% ⚡
agent-3: ████████████████████ 100% ✅
```

## Usage Examples

### Example 1: Feature Development with Verbose Output
```bash
# Set verbose mode
export CLAUDE_VERBOSE=verbose
export CLAUDE_SHOW_TIMING=true

# Execute task
/execute --verbose "Add CSV export feature"
```

**Output:**
```
🚀 orchestrator: Decompose CSV export feature
  🔀 Starting parallel group (4 agents):
    • swebok-engineer
    • qa-engineer
    • ux-design-expert
    • technical-writer-agent
  
  ⚡ swebok-engineer [25%]: Analyzing export patterns
  ⚡ swebok-engineer [50%]: Designing CSVExporter class
  🤔 swebok-engineer decided: Use Factory pattern
    Reasoning: Multiple export formats expected
  ⚡ swebok-engineer [75%]: Implementing exporter
  📝 swebok-engineer output: CSVExporter.ts created
  ✅ swebok-engineer completed (45.2s)
  
  ⚡ qa-engineer [33%]: Creating test scenarios
  ⚡ qa-engineer [66%]: Writing unit tests
  📝 qa-engineer output: 15 tests created
  ✅ qa-engineer completed (38.7s)
  
  ✅ All agents completed
  
📊 Session Summary:
  • Total execution: 1m 23s
  • Parallel efficiency: 87%
  • Success rate: 100%
```

### Example 2: Bug Investigation with Debug Mode
```bash
# Set debug mode for detailed investigation
export CLAUDE_VERBOSE=debug
export CLAUDE_SHOW_DECISIONS=true

# Execute with timing
/execute --debug --timing "Fix memory leak in query cache"
```

**Output:**
```
🚀 orchestrator (0ms): Starting bug investigation
  Internal context: { severity: 'high', domain: 'performance' }
  
  🔀 Parallel execution batch 1:
    🚀 error-handler (12ms): Analyzing error patterns
      State: { errors_analyzed: 0, patterns: [] }
      ⚡ Progress [25%]: Collecting error logs
        Found: 23 error entries
      ⚡ Progress [50%]: Identifying patterns
        Patterns detected: ['memory_growth', 'cache_overflow']
      🤔 Decision: Memory leak in IndexedGraph cache
        Reasoning: Unfreed references detected
        Alternatives: ['DOM leak', 'Event handler leak']
        Confidence: 0.89
      ⚡ Progress [75%]: Validating hypothesis
        Validation: CONFIRMED
      📝 Output: Root cause analysis
        {
          "cause": "WeakMap not used for cache",
          "impact": "10MB/hour memory growth",
          "solution": "Implement WeakMap caching"
        }
      ✅ Completed (1245ms)
    
    🚀 code-searcher (12ms): Locating relevant code
      ⚡ Progress [50%]: Found 5 cache implementations
      📝 Output: File list with line numbers
      ✅ Completed (892ms)
  
  🔀 Parallel execution batch 2:
    🚀 swebok-engineer (1260ms): Implementing fix
      🤔 Decision: Use WeakMap for cache
      ⚡ Progress [100%]: Fix implemented
      ✅ Completed (2150ms)

⏱️ Total execution: 3.4s
📊 Parallelization rate: 87%
✅ Success rate: 100%
```

### Example 3: Monitoring Long-Running Tasks
```bash
# Start monitoring in background
.claude/scripts/agent-verbose-logger.sh start

# Execute long task
/execute "Refactor entire domain layer"

# Check progress periodically
.claude/scripts/agent-verbose-logger.sh summary
```

## Integration with Claude Code

### Slash Commands
Enhanced slash commands with verbose flags:
```
/execute --verbose [task]     # Detailed logging
/execute --debug [task]       # Full debug output
/execute --silent [task]      # Minimal output
/execute --progress [task]    # Show progress bars
/execute --timing [task]      # Show timing metrics
```

### In CLAUDE.md Instructions
The system automatically activates when:
1. Task uses `EXECUTE-WITH-META-OPTIMIZATION`
2. `ВЫВОД: VERBOSE` is specified
3. Environment variable `CLAUDE_VERBOSE` is set

## Configuration Files

### Agent Monitoring Configuration
Location: `.claude/config/agent-monitoring.json`

Key settings:
- `defaultVerbosity`: Default output level
- `realTimeOutput`: Enable/disable real-time display
- `showProgress`: Show progress bars
- `showParallelExecution`: Highlight parallel groups
- `logFile`: Location for persistent logs

### Custom Agent Patterns
Define custom display patterns for specific agents:
```json
"customPatterns": {
  "orchestrator": {
    "icon": "🎯",
    "color": "bold",
    "showSubtasks": true
  },
  "meta-agent": {
    "icon": "🧠",
    "color": "purple",
    "showOptimizations": true
  }
}
```

## Troubleshooting

### Issue: No enhanced output visible
**Solution:** Check environment variables:
```bash
echo $CLAUDE_VERBOSE
# Should output: verbose, basic, or debug
```

### Issue: Colors not displaying
**Solution:** Ensure terminal supports ANSI colors:
```bash
export CLAUDE_COLOR_OUTPUT=true
```

### Issue: Log file not created
**Solution:** Check permissions and create directory:
```bash
mkdir -p .claude/logs
chmod 755 .claude/logs
```

### Issue: Progress bars not updating
**Solution:** Enable progress display:
```bash
export CLAUDE_SHOW_PROGRESS=true
```

## Performance Considerations

### Buffer Management
- Default buffer: 5000 log entries
- Auto-flush interval: 100ms
- Compression for old sessions

### Optimization Tips
1. Use `basic` mode for routine tasks
2. Enable `debug` only when investigating issues
3. Set `CLAUDE_LOG_FILE` for persistent logging
4. Use `silent` mode in CI/CD pipelines

## Future Enhancements

### Planned Features
1. **Web Dashboard**: Browser-based monitoring interface
2. **Metrics Export**: Export to Prometheus/Grafana
3. **Agent Replay**: Replay agent execution from logs
4. **Performance Profiling**: Detailed performance analysis
5. **Custom Themes**: User-defined color schemes

### Community Contributions
Contributions welcome at:
- Script improvements: `.claude/scripts/`
- Configuration templates: `.claude/config/`
- Documentation: `.claude/docs/`

## Summary

The Enhanced Agent Output Display system provides:
- **Transparency**: See exactly what agents are doing
- **Debugging**: Detailed logs for troubleshooting
- **Performance**: Track execution timing and parallelization
- **Flexibility**: Multiple verbosity levels for different needs
- **Integration**: Seamless Claude Code integration

Use this system to gain deeper insights into agent execution and improve development efficiency in the Exocortex plugin project.