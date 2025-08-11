#!/bin/bash

# Universal Hook Installation Script for Claude Code
# Works across all instances and platforms

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Claude Code Universal Agent Hook Installer${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo

# Detect OS and set paths
detect_os_and_paths() {
    local settings_paths=()
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        settings_paths+=(
            "$HOME/Library/Application Support/Claude Code/settings.json"
            "$HOME/Library/Application Support/claude-code/settings.json"
            "$HOME/.claude-code/settings.json"
        )
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        settings_paths+=(
            "$HOME/.config/Claude Code/settings.json"
            "$HOME/.config/claude-code/settings.json"
            "$HOME/.claude-code/settings.json"
        )
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        settings_paths+=(
            "$APPDATA/Claude Code/settings.json"
            "$APPDATA/claude-code/settings.json"
            "$HOME/.claude-code/settings.json"
        )
    fi
    
    # Find existing settings file or create new one
    for path in "${settings_paths[@]}"; do
        if [ -f "$path" ]; then
            echo -e "${GREEN}Found existing settings at: $path${NC}"
            echo "$path"
            return 0
        fi
    done
    
    # No existing settings, use first path
    local default_path="${settings_paths[0]}"
    echo -e "${YELLOW}No existing settings found, will create at: $default_path${NC}"
    echo "$default_path"
}

# Install hook in current project
install_project_hook() {
    local project_dir="$1"
    
    echo -e "${GREEN}Installing project-specific hook...${NC}"
    
    # Create hooks directory
    mkdir -p "$project_dir/.claude/hooks"
    mkdir -p "$project_dir/.claude/agents"
    
    # Copy hook files
    cp "$(dirname "$0")/universal-agent-enforcement.sh" "$project_dir/.claude/hooks/" 2>/dev/null || true
    cp "$(dirname "$0")/detect-agents.py" "$project_dir/.claude/hooks/" 2>/dev/null || true
    
    # Make executable
    chmod +x "$project_dir/.claude/hooks/"*.sh 2>/dev/null || true
    chmod +x "$project_dir/.claude/hooks/"*.py 2>/dev/null || true
    
    echo -e "${GREEN}✓ Project hook installed${NC}"
}

# Install global settings
install_global_settings() {
    local settings_path="$1"
    local hook_path="$2"
    
    echo -e "${GREEN}Installing global settings...${NC}"
    
    # Create directory if needed
    mkdir -p "$(dirname "$settings_path")"
    
    # Create or update settings
    if [ -f "$settings_path" ]; then
        # Backup existing settings
        cp "$settings_path" "${settings_path}.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${YELLOW}Backed up existing settings${NC}"
        
        # Update with jq if available, otherwise use sed
        if command -v jq &> /dev/null; then
            jq --arg hook "$hook_path" '.hooks = {
                "tool_use": $hook,
                "prompt_submit": $hook
            }' "$settings_path" > "${settings_path}.tmp" && mv "${settings_path}.tmp" "$settings_path"
        else
            # Manual JSON update
            cat > "$settings_path" << EOF
{
  "hooks": {
    "tool_use": "$hook_path",
    "prompt_submit": "$hook_path"
  }
}
EOF
        fi
    else
        # Create new settings file
        cat > "$settings_path" << EOF
{
  "hooks": {
    "tool_use": "$hook_path",
    "prompt_submit": "$hook_path"
  }
}
EOF
    fi
    
    echo -e "${GREEN}✓ Global settings updated${NC}"
}

# Create standalone hook file in user home
create_standalone_hook() {
    local hook_dir="$HOME/.claude-code-hooks"
    
    echo -e "${GREEN}Creating standalone hook in home directory...${NC}"
    
    mkdir -p "$hook_dir"
    
    # Copy universal hook
    cp "$(dirname "$0")/universal-agent-enforcement.sh" "$hook_dir/agent-enforcement.sh"
    cp "$(dirname "$0")/detect-agents.py" "$hook_dir/detect-agents.py"
    
    chmod +x "$hook_dir/"*.sh
    chmod +x "$hook_dir/"*.py
    
    echo -e "${GREEN}✓ Standalone hook created at: $hook_dir${NC}"
    echo "$hook_dir/agent-enforcement.sh"
}

# Main installation
main() {
    # Get current directory
    local current_dir="$(pwd)"
    
    # Detect settings path
    local settings_path=$(detect_os_and_paths)
    
    # Install in current project if it's a git repo
    if [ -d ".git" ] || [ -f ".claude/PROJECT.md" ] || [ -f "CLAUDE.md" ]; then
        install_project_hook "$current_dir"
        local hook_path="$current_dir/.claude/hooks/universal-agent-enforcement.sh"
    else
        echo -e "${YELLOW}Not in a project directory, installing globally only${NC}"
    fi
    
    # Create standalone hook
    local standalone_hook=$(create_standalone_hook)
    
    # Use standalone hook for global settings if no project hook
    if [ -z "$hook_path" ]; then
        hook_path="$standalone_hook"
    fi
    
    # Install global settings
    install_global_settings "$settings_path" "$hook_path"
    
    # Generate agent list
    if command -v python3 &> /dev/null; then
        echo -e "${GREEN}Detecting available agents...${NC}"
        python3 "$(dirname "$hook_path")/detect-agents.py" 2>/dev/null || true
    fi
    
    # Set environment variables
    echo
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Installation Complete!${NC}"
    echo
    echo -e "${YELLOW}To make the hook permanent, add to your shell profile:${NC}"
    echo
    echo "export CLAUDE_HOOK_TOOL_USE=\"$hook_path\""
    echo "export CLAUDE_HOOK_PROMPT_SUBMIT=\"$hook_path\""
    echo
    echo -e "${GREEN}The hook will now:${NC}"
    echo "• Detect available agents in each Claude Code instance"
    echo "• Analyze task complexity automatically"
    echo "• Recommend appropriate agents for each task"
    echo "• Track agent usage across operations"
    echo
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
}

# Run main
main "$@"