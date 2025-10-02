#!/bin/bash

# Agent Enforcement Hook for Exocortex Plugin
# Ensures all significant tasks use specialized agents

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check if this is a tool use event
if [ "$CLAUDE_HOOK_EVENT" = "tool_use" ]; then
    # Skip for certain basic tools that don't need agents
    BASIC_TOOLS=("Read" "LS" "Grep" "Glob" "TodoWrite" "ExitPlanMode")
    
    for tool in "${BASIC_TOOLS[@]}"; do
        if [ "$CLAUDE_TOOL_NAME" = "$tool" ]; then
            exit 0
        fi
    done
    
    # Check if Task tool (agent) is being used
    if [ "$CLAUDE_TOOL_NAME" = "Task" ]; then
        echo -e "${GREEN}✓ Agent usage detected - good practice!${NC}"
        exit 0
    fi
    
    # For significant operations, warn if no agent is being used
    SIGNIFICANT_TOOLS=("Write" "Edit" "MultiEdit" "NotebookEdit" "Bash")
    
    for tool in "${SIGNIFICANT_TOOLS[@]}"; do
        if [ "$CLAUDE_TOOL_NAME" = "$tool" ]; then
            # Check if we're in a simple context (single file edit, simple command)
            if [ "$CLAUDE_TOOL_NAME" = "Bash" ]; then
                # Allow simple commands without agents
                if echo "$CLAUDE_TOOL_PARAMS" | grep -qE "npm test|npm run|git status|git diff|ls|pwd"; then
                    exit 0
                fi
            fi
            
            echo -e "${YELLOW}⚠️  Warning: Consider using specialized agents for this task${NC}"
            echo -e "${YELLOW}   Available agents: orchestrator, swebok-engineer, qa-engineer, architect-agent${NC}"
            echo -e "${YELLOW}   Use 'Task' tool with appropriate subagent_type${NC}"
            
            # Don't block, just warn
            exit 0
        fi
    done
fi

# Check for prompt submission to suggest agent usage
if [ "$CLAUDE_HOOK_EVENT" = "prompt_submit" ]; then
    # Keywords that indicate significant tasks
    SIGNIFICANT_KEYWORDS=("implement" "create" "build" "refactor" "optimize" "fix" "debug" "test" "deploy" "integrate" "architect" "design")
    
    PROMPT_LOWER=$(echo "$CLAUDE_USER_PROMPT" | tr '[:upper:]' '[:lower:]')
    
    for keyword in "${SIGNIFICANT_KEYWORDS[@]}"; do
        if echo "$PROMPT_LOWER" | grep -q "$keyword"; then
            echo -e "${YELLOW}📋 Task Analysis: This appears to be a significant task.${NC}"
            echo -e "${GREEN}Recommended agents for this type of work:${NC}"
            
            # Suggest appropriate agents based on keywords
            if echo "$PROMPT_LOWER" | grep -qE "test|qa|quality"; then
                echo -e "  • ${GREEN}qa-engineer${NC} - For test planning and execution"
                echo -e "  • ${GREEN}test-fixer-agent${NC} - For fixing failing tests"
            fi
            
            if echo "$PROMPT_LOWER" | grep -qE "architect|design|structure"; then
                echo -e "  • ${GREEN}architect-agent${NC} - For system architecture decisions"
                echo -e "  • ${GREEN}swebok-engineer${NC} - For software engineering best practices"
            fi
            
            if echo "$PROMPT_LOWER" | grep -qE "implement|create|build|feature"; then
                echo -e "  • ${GREEN}orchestrator${NC} - For coordinating complex features"
                echo -e "  • ${GREEN}swebok-engineer${NC} - For implementation following best practices"
            fi
            
            if echo "$PROMPT_LOWER" | grep -qE "fix|debug|error"; then
                echo -e "  • ${GREEN}error-handler${NC} - For error diagnosis and resolution"
                echo -e "  • ${GREEN}code-review-agent${NC} - For identifying issues"
            fi
            
            if echo "$PROMPT_LOWER" | grep -qE "performance|optimize"; then
                echo -e "  • ${GREEN}performance-agent${NC} - For performance optimization"
            fi
            
            echo -e "${YELLOW}Remember: Use 3-5 agents in parallel for complex tasks!${NC}"
            break
        fi
    done
fi

exit 0