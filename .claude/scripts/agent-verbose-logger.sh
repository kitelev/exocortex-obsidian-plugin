#!/bin/bash

# Enhanced Agent Execution Logger for Claude Code
# Provides detailed, real-time visibility into agent execution

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# Icons for different phases
ICON_START="🚀"
ICON_PARALLEL="🔀"
ICON_SEQUENTIAL="➡️"
ICON_PROGRESS="⚡"
ICON_DECISION="🤔"
ICON_OUTPUT="📝"
ICON_COMPLETE="✅"
ICON_ERROR="❌"
ICON_INFO="ℹ️"
ICON_TIMING="⏱️"

# Configuration
VERBOSE_MODE="${CLAUDE_VERBOSE:-verbose}"
SHOW_TIMING="${CLAUDE_SHOW_TIMING:-true}"
SHOW_PARALLEL="${CLAUDE_SHOW_PARALLEL:-true}"
SHOW_DECISIONS="${CLAUDE_SHOW_DECISIONS:-true}"
SHOW_PROGRESS="${CLAUDE_SHOW_PROGRESS:-true}"
LOG_FILE="${CLAUDE_LOG_FILE:-.claude/logs/agent-execution.log}"

# Create log directory if needed
mkdir -p "$(dirname "$LOG_FILE")"

# Session tracking
SESSION_ID="session-$(date +%Y%m%d-%H%M%S)"
SESSION_START=$(date +%s)
ACTIVE_AGENTS=()
PARALLEL_GROUPS=()
COMPLETED_COUNT=0
ERROR_COUNT=0

# Function to log with timestamp
log_entry() {
    local level=$1
    local phase=$2
    local agent=$3
    local message=$4
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Log to file
    echo "[$timestamp] [$level] [$phase] $agent: $message" >> "$LOG_FILE"
    
    # Display based on verbosity
    case "$VERBOSE_MODE" in
        silent)
            # No output
            ;;
        basic)
            if [[ "$phase" == "start" || "$phase" == "complete" || "$phase" == "error" ]]; then
                display_entry "$level" "$phase" "$agent" "$message"
            fi
            ;;
        verbose)
            if [[ "$phase" != "debug" ]]; then
                display_entry "$level" "$phase" "$agent" "$message"
            fi
            ;;
        debug)
            display_entry "$level" "$phase" "$agent" "$message"
            ;;
    esac
}

# Function to display formatted entry
display_entry() {
    local level=$1
    local phase=$2
    local agent=$3
    local message=$4
    local output=""
    
    case "$phase" in
        start)
            output="${GREEN}${ICON_START} Starting ${BOLD}$agent${RESET}${GREEN}: $message${RESET}"
            ;;
        parallel_start)
            output="${CYAN}${ICON_PARALLEL} Parallel execution:${RESET} ${BOLD}$agent${RESET}"
            ;;
        progress)
            if [[ "$SHOW_PROGRESS" == "true" ]]; then
                output="  ${YELLOW}${ICON_PROGRESS} $agent${RESET}: $message"
            fi
            ;;
        decision)
            if [[ "$SHOW_DECISIONS" == "true" ]]; then
                output="  ${CYAN}${ICON_DECISION} $agent decided${RESET}: $message"
            fi
            ;;
        output)
            output="  ${MAGENTA}${ICON_OUTPUT} $agent output${RESET}: $message"
            ;;
        complete)
            output="  ${GREEN}${ICON_COMPLETE} $agent completed${RESET}"
            if [[ "$SHOW_TIMING" == "true" && -n "$5" ]]; then
                output="$output ${DIM}($5)${RESET}"
            fi
            ;;
        error)
            output="  ${RED}${ICON_ERROR} $agent failed${RESET}: $message"
            ;;
        info)
            output="${BLUE}${ICON_INFO} $message${RESET}"
            ;;
    esac
    
    if [[ -n "$output" ]]; then
        echo -e "$output"
    fi
}

# Function to show progress bar
show_progress() {
    local current=$1
    local total=$2
    local width=30
    local percentage=$((current * 100 / total))
    local filled=$((width * current / total))
    local empty=$((width - filled))
    
    printf "\r["
    printf "%${filled}s" | tr ' ' '█'
    printf "%${empty}s" | tr ' ' '░'
    printf "] %d%% (%d/%d)" "$percentage" "$current" "$total"
}

# Function to track parallel execution
track_parallel_group() {
    local parent=$1
    shift
    local agents=("$@")
    
    if [[ "$SHOW_PARALLEL" == "true" ]]; then
        echo -e "${CYAN}${ICON_PARALLEL} Starting parallel group (${#agents[@]} agents):${RESET}"
        for agent in "${agents[@]}"; do
            echo -e "  ${DIM}• $agent${RESET}"
        done
    fi
    
    PARALLEL_GROUPS+=("$parent:${agents[*]}")
}

# Function to show session summary
show_session_summary() {
    local session_end=$(date +%s)
    local duration=$((session_end - SESSION_START))
    local success_rate=0
    
    if [[ $((COMPLETED_COUNT + ERROR_COUNT)) -gt 0 ]]; then
        success_rate=$((COMPLETED_COUNT * 100 / (COMPLETED_COUNT + ERROR_COUNT)))
    fi
    
    echo -e "\n${BOLD}═══════════════════════════════════════════════════════${RESET}"
    echo -e "${BOLD}Session Summary: $SESSION_ID${RESET}"
    echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
    echo -e "${ICON_TIMING} Duration: $(format_duration $duration)"
    echo -e "${ICON_COMPLETE} Completed: $COMPLETED_COUNT agents"
    echo -e "${ICON_ERROR} Errors: $ERROR_COUNT"
    echo -e "📊 Success Rate: ${success_rate}%"
    
    if [[ ${#PARALLEL_GROUPS[@]} -gt 0 ]]; then
        echo -e "${ICON_PARALLEL} Parallel Groups: ${#PARALLEL_GROUPS[@]}"
    fi
    
    echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
}

# Function to format duration
format_duration() {
    local seconds=$1
    local hours=$((seconds / 3600))
    local minutes=$(((seconds % 3600) / 60))
    local secs=$((seconds % 60))
    
    if [[ $hours -gt 0 ]]; then
        printf "%dh %dm %ds" $hours $minutes $secs
    elif [[ $minutes -gt 0 ]]; then
        printf "%dm %ds" $minutes $secs
    else
        printf "%ds" $secs
    fi
}

# Function to monitor agent execution (called by Claude Code)
monitor_agent_execution() {
    local agent_name=$1
    local task=$2
    local is_parallel=${3:-false}
    local parent_agent=${4:-""}
    
    # Start tracking
    log_entry "INFO" "start" "$agent_name" "$task"
    ACTIVE_AGENTS+=("$agent_name")
    
    # Simulate progress updates (in real usage, this would be fed by actual agent output)
    if [[ "$SHOW_PROGRESS" == "true" && "$VERBOSE_MODE" != "silent" ]]; then
        for i in {1..10}; do
            show_progress $i 10
            sleep 0.1
        done
        echo # New line after progress bar
    fi
}

# Function to parse and enhance Claude Code agent output
enhance_agent_output() {
    local input_line=$1
    
    # Pattern matching for agent execution
    if [[ "$input_line" =~ ^[[:space:]]*([a-z-]+)\((.*)\)$ ]]; then
        local agent_name="${BASH_REMATCH[1]}"
        local task="${BASH_REMATCH[2]}"
        monitor_agent_execution "$agent_name" "$task"
    elif [[ "$input_line" =~ ^[[:space:]]*⎿[[:space:]]*(.*)$ ]]; then
        local subtask="${BASH_REMATCH[1]}"
        log_entry "INFO" "progress" "subtask" "$subtask"
    elif [[ "$input_line" =~ ^[[:space:]]*☒[[:space:]]*(.*)$ ]]; then
        local completed="${BASH_REMATCH[1]}"
        log_entry "INFO" "complete" "task" "$completed"
        ((COMPLETED_COUNT++))
    elif [[ "$input_line" =~ ^[[:space:]]*\.\.\.[[:space:]]*([0-9]+)[[:space:]]*more ]]; then
        local more_count="${BASH_REMATCH[1]}"
        log_entry "INFO" "info" "system" "$more_count more items in progress"
    elif [[ "$input_line" =~ ^\+([0-9]+)[[:space:]]*more[[:space:]]*tool ]]; then
        local tool_count="${BASH_REMATCH[1]}"
        log_entry "INFO" "info" "system" "$tool_count additional tool uses"
    fi
}

# Export functions for use by Claude Code
export -f log_entry
export -f display_entry
export -f show_progress
export -f track_parallel_group
export -f monitor_agent_execution
export -f enhance_agent_output
export -f show_session_summary

# Main execution
case "${1:-}" in
    start)
        echo -e "${BOLD}${GREEN}Agent Execution Monitor Started${RESET}"
        echo -e "Session ID: ${CYAN}$SESSION_ID${RESET}"
        echo -e "Verbosity: ${YELLOW}$VERBOSE_MODE${RESET}"
        echo -e "Log File: ${DIM}$LOG_FILE${RESET}\n"
        ;;
    monitor)
        # Monitor mode - enhance real-time output
        while IFS= read -r line; do
            echo "$line" # Pass through original
            enhance_agent_output "$line"
        done
        show_session_summary
        ;;
    summary)
        show_session_summary
        ;;
    test)
        # Test mode to demonstrate capabilities
        echo -e "${BOLD}Testing Enhanced Agent Output Display${RESET}\n"
        
        # Simulate orchestrator with parallel agents
        track_parallel_group "orchestrator" "code-searcher" "architect-agent" "swebok-engineer"
        
        monitor_agent_execution "orchestrator" "Implement Instances block for exo__Class" false
        sleep 0.5
        
        monitor_agent_execution "code-searcher" "Finding layout files and query implementations" true "orchestrator"
        log_entry "INFO" "decision" "code-searcher" "Found 5 relevant files to analyze"
        log_entry "INFO" "complete" "code-searcher" "Analysis complete"
        ((COMPLETED_COUNT++))
        
        monitor_agent_execution "architect-agent" "Designing Instances block technical solution" true "orchestrator"
        log_entry "INFO" "progress" "architect-agent" "Analyzing existing patterns"
        log_entry "INFO" "decision" "architect-agent" "Using Factory pattern with Repository abstraction"
        log_entry "INFO" "output" "architect-agent" "Generated architecture specification"
        log_entry "INFO" "complete" "architect-agent" "Design complete"
        ((COMPLETED_COUNT++))
        
        monitor_agent_execution "swebok-engineer" "Implementing the feature" true "orchestrator"
        log_entry "INFO" "progress" "swebok-engineer" "Creating InstancesBlockRenderer.ts"
        log_entry "INFO" "progress" "swebok-engineer" "Implementing query logic"
        log_entry "INFO" "progress" "swebok-engineer" "Adding tests"
        log_entry "INFO" "complete" "swebok-engineer" "Implementation complete"
        ((COMPLETED_COUNT++))
        
        log_entry "INFO" "complete" "orchestrator" "All subtasks completed"
        ((COMPLETED_COUNT++))
        
        show_session_summary
        ;;
    *)
        echo "Usage: $0 {start|monitor|summary|test}"
        echo ""
        echo "Environment variables:"
        echo "  CLAUDE_VERBOSE    - Verbosity level (silent|basic|verbose|debug)"
        echo "  CLAUDE_SHOW_TIMING - Show execution timing (true|false)"
        echo "  CLAUDE_SHOW_PARALLEL - Show parallel execution (true|false)"
        echo "  CLAUDE_SHOW_DECISIONS - Show agent decisions (true|false)"
        echo "  CLAUDE_SHOW_PROGRESS - Show progress bars (true|false)"
        echo "  CLAUDE_LOG_FILE - Log file path"
        ;;
esac