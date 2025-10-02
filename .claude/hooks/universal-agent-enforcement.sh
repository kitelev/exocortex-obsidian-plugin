#!/bin/bash

# Universal Agent Enforcement Hook for Claude Code
# Dynamically detects available agents and enforces their usage

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to extract available agents from Claude's context
detect_available_agents() {
    # Try to get agent list from environment or Claude's response
    # This will be populated by Claude Code's agent discovery
    
    # Default agent list (common across most Claude Code instances)
    local default_agents=(
        "general-purpose:General research and multi-step tasks"
        "code-searcher:Locate functions and code in codebase"
        "swebok-engineer:Software engineering best practices"
        "qa-engineer:Quality assurance and testing"
        "error-handler:Error diagnosis and debugging"
        "orchestrator:Coordinate complex multi-domain tasks"
        "architect-agent:System architecture decisions"
        "performance-agent:Performance optimization"
        "security-agent:Security analysis and compliance"
        "product-manager:Product planning and requirements"
        "devops-engineer:CI/CD and deployment"
        "test-fixer-agent:Fix failing tests"
        "code-review-agent:Code quality review"
    )
    
    # Check if we have a custom agent list from Claude context
    if [ -f ".claude/agents/available-agents.txt" ]; then
        # Read custom agents if available
        while IFS= read -r line; do
            echo "$line"
        done < ".claude/agents/available-agents.txt"
    else
        # Return default agents
        for agent in "${default_agents[@]}"; do
            echo "$agent"
        done
    fi
}

# Function to determine task complexity
analyze_task_complexity() {
    local prompt="$1"
    local complexity=0
    
    # Complex task indicators
    local complex_patterns=(
        "implement.*feature"
        "create.*system"
        "refactor.*architecture"
        "optimize.*performance"
        "debug.*issue"
        "integrate.*service"
        "migrate.*database"
        "design.*interface"
        "build.*component"
        "fix.*multiple"
    )
    
    for pattern in "${complex_patterns[@]}"; do
        if echo "$prompt" | grep -qiE "$pattern"; then
            ((complexity++))
        fi
    done
    
    echo $complexity
}

# Function to recommend agents based on task
recommend_agents() {
    local prompt="$1"
    local prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')
    local recommendations=()
    
    # Get available agents
    local available_agents=()
    while IFS= read -r line; do
        available_agents+=("$line")
    done < <(detect_available_agents)
    
    # Task-to-agent mapping
    if echo "$prompt_lower" | grep -qE "test|qa|quality|coverage"; then
        for agent in "${available_agents[@]}"; do
            if [[ "$agent" == *"qa-engineer"* ]] || [[ "$agent" == *"test-fixer"* ]]; then
                recommendations+=("$agent")
            fi
        done
    fi
    
    if echo "$prompt_lower" | grep -qE "architect|design|structure|pattern"; then
        for agent in "${available_agents[@]}"; do
            if [[ "$agent" == *"architect"* ]] || [[ "$agent" == *"swebok"* ]]; then
                recommendations+=("$agent")
            fi
        done
    fi
    
    if echo "$prompt_lower" | grep -qE "implement|create|build|feature|develop"; then
        for agent in "${available_agents[@]}"; do
            if [[ "$agent" == *"orchestrator"* ]] || [[ "$agent" == *"swebok"* ]] || [[ "$agent" == *"general-purpose"* ]]; then
                recommendations+=("$agent")
            fi
        done
    fi
    
    if echo "$prompt_lower" | grep -qE "fix|debug|error|bug|issue|problem"; then
        for agent in "${available_agents[@]}"; do
            if [[ "$agent" == *"error-handler"* ]] || [[ "$agent" == *"code-review"* ]] || [[ "$agent" == *"test-fixer"* ]]; then
                recommendations+=("$agent")
            fi
        done
    fi
    
    if echo "$prompt_lower" | grep -qE "performance|optimize|speed|slow|memory"; then
        for agent in "${available_agents[@]}"; do
            if [[ "$agent" == *"performance"* ]]; then
                recommendations+=("$agent")
            fi
        done
    fi
    
    if echo "$prompt_lower" | grep -qE "security|vulnerability|auth|encrypt|compliance"; then
        for agent in "${available_agents[@]}"; do
            if [[ "$agent" == *"security"* ]] || [[ "$agent" == *"compliance"* ]]; then
                recommendations+=("$agent")
            fi
        done
    fi
    
    if echo "$prompt_lower" | grep -qE "deploy|ci|cd|pipeline|release|docker"; then
        for agent in "${available_agents[@]}"; do
            if [[ "$agent" == *"devops"* ]] || [[ "$agent" == *"release"* ]]; then
                recommendations+=("$agent")
            fi
        done
    fi
    
    if echo "$prompt_lower" | grep -qE "search|find|locate|where"; then
        for agent in "${available_agents[@]}"; do
            if [[ "$agent" == *"code-searcher"* ]] || [[ "$agent" == *"general-purpose"* ]]; then
                recommendations+=("$agent")
            fi
        done
    fi
    
    # Remove duplicates
    printf '%s\n' "${recommendations[@]}" | sort -u
}

# Function to check if agent is being used
is_agent_used() {
    [ "$CLAUDE_TOOL_NAME" = "Task" ] || [ "$CLAUDE_TOOL_NAME" = "Agent" ]
}

# Store context for tracking
CONTEXT_FILE="/tmp/claude_hook_context_$$"

# Main hook logic
main() {
    # Handle tool use events
    if [ "$CLAUDE_HOOK_EVENT" = "tool_use" ]; then
        # Skip for basic tools that don't need agents
        local basic_tools=("Read" "LS" "Grep" "Glob" "TodoWrite" "ExitPlanMode" "WebSearch" "WebFetch")
        
        for tool in "${basic_tools[@]}"; do
            if [ "$CLAUDE_TOOL_NAME" = "$tool" ]; then
                exit 0
            fi
        done
        
        # Check if Task/Agent tool is being used
        if is_agent_used; then
            echo -e "${GREEN}✓ Agent usage detected - excellent practice!${NC}"
            
            # Track agent usage
            echo "agent_used" >> "$CONTEXT_FILE"
            
            # Parse agent type if available
            if [ -n "$CLAUDE_TOOL_PARAMS" ]; then
                agent_type=$(echo "$CLAUDE_TOOL_PARAMS" | grep -oP '"subagent_type"\s*:\s*"\K[^"]+' || true)
                if [ -n "$agent_type" ]; then
                    echo -e "${CYAN}  Using agent: ${agent_type}${NC}"
                fi
            fi
            exit 0
        fi
        
        # For significant operations, check context
        local significant_tools=("Write" "Edit" "MultiEdit" "NotebookEdit" "Bash")
        
        for tool in "${significant_tools[@]}"; do
            if [ "$CLAUDE_TOOL_NAME" = "$tool" ]; then
                # Check if this is a simple operation
                if [ "$CLAUDE_TOOL_NAME" = "Bash" ]; then
                    # Allow simple commands without agents
                    if echo "$CLAUDE_TOOL_PARAMS" | grep -qE '"command"\s*:\s*"(npm test|npm run|git status|git diff|ls|pwd|echo|cat)"'; then
                        exit 0
                    fi
                fi
                
                # Check recent agent usage
                if [ -f "$CONTEXT_FILE" ] && [ "$(find "$CONTEXT_FILE" -mmin -5 2>/dev/null)" ]; then
                    if grep -q "agent_used" "$CONTEXT_FILE" 2>/dev/null; then
                        # Agent was recently used, allow operation
                        exit 0
                    fi
                fi
                
                echo -e "${YELLOW}⚠️  Warning: Consider using specialized agents for this task${NC}"
                echo -e "${YELLOW}   This helps ensure best practices and comprehensive solutions${NC}"
                
                # Show available agents
                echo -e "${BLUE}Available agents in this context:${NC}"
                detect_available_agents | head -5 | while IFS=: read -r agent description; do
                    echo -e "  • ${GREEN}${agent}${NC} - ${description}"
                done
                echo -e "${YELLOW}   Use 'Task' tool with appropriate subagent_type${NC}"
                
                exit 0
            fi
        done
    fi
    
    # Handle prompt submission events
    if [ "$CLAUDE_HOOK_EVENT" = "prompt_submit" ]; then
        local prompt="$CLAUDE_USER_PROMPT"
        
        # Skip if prompt is too short or simple
        if [ ${#prompt} -lt 20 ]; then
            exit 0
        fi
        
        # Analyze task complexity
        local complexity=$(analyze_task_complexity "$prompt")
        
        if [ $complexity -gt 0 ]; then
            echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${CYAN}📋 Task Analysis: Complex task detected (score: $complexity)${NC}"
            
            # Get recommendations
            local recommendations=()
            while IFS= read -r line; do
                recommendations+=("$line")
            done < <(recommend_agents "$prompt")
            
            if [ ${#recommendations[@]} -gt 0 ]; then
                echo -e "${GREEN}Recommended agents for this task:${NC}"
                for rec in "${recommendations[@]}"; do
                    IFS=: read -r agent description <<< "$rec"
                    echo -e "  • ${GREEN}${agent}${NC} - ${description}"
                done
            else
                echo -e "${GREEN}Consider using these general agents:${NC}"
                echo -e "  • ${GREEN}orchestrator${NC} - For coordinating complex tasks"
                echo -e "  • ${GREEN}general-purpose${NC} - For research and multi-step tasks"
            fi
            
            # Project-specific reminder
            if [ -f "CLAUDE.md" ] || [ -f ".claude/PROJECT.md" ]; then
                echo -e "${YELLOW}📌 Project requirement: Use 3-5 agents in parallel for best results${NC}"
            else
                echo -e "${CYAN}💡 Tip: Using multiple agents in parallel improves solution quality${NC}"
            fi
            
            echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        fi
    fi
    
    # Cleanup old context files
    find /tmp -name "claude_hook_context_*" -mmin +30 -delete 2>/dev/null || true
}

# Run main function
main

exit 0