#!/bin/bash

# Hook Status Checker
# Shows indicators that the hook is working

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}          Claude Code Hook Status Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo

# 1. Check if hook files exist
echo -e "${YELLOW}1. Hook Files:${NC}"
if [ -f ".claude/hooks/universal-agent-enforcement.sh" ]; then
    echo -e "   ${GREEN}✓${NC} Universal hook exists"
else
    echo -e "   ${RED}✗${NC} Universal hook missing"
fi

if [ -f ".claude/agents/available-agents.txt" ]; then
    echo -e "   ${GREEN}✓${NC} Agent list exists"
    agent_count=$(wc -l < .claude/agents/available-agents.txt)
    echo -e "   ${GREEN}✓${NC} ${agent_count} agents detected"
else
    echo -e "   ${YELLOW}⚠${NC} No agent list (will use defaults)"
fi
echo

# 2. Check settings file
echo -e "${YELLOW}2. Claude Code Settings:${NC}"
settings_file="$HOME/Library/Application Support/Claude Code/settings.json"
if [ -f "$settings_file" ]; then
    echo -e "   ${GREEN}✓${NC} Settings file exists"
    if grep -q "universal-agent-enforcement" "$settings_file"; then
        echo -e "   ${GREEN}✓${NC} Universal hook configured"
    else
        echo -e "   ${YELLOW}⚠${NC} Old hook version configured"
    fi
else
    echo -e "   ${RED}✗${NC} Settings file not found"
fi
echo

# 3. Check environment variables
echo -e "${YELLOW}3. Environment Variables:${NC}"
if [ -n "$CLAUDE_HOOK_TOOL_USE" ]; then
    echo -e "   ${GREEN}✓${NC} CLAUDE_HOOK_TOOL_USE set"
else
    echo -e "   ${YELLOW}⚠${NC} CLAUDE_HOOK_TOOL_USE not set"
fi

if [ -n "$CLAUDE_HOOK_PROMPT_SUBMIT" ]; then
    echo -e "   ${GREEN}✓${NC} CLAUDE_HOOK_PROMPT_SUBMIT set"
else
    echo -e "   ${YELLOW}⚠${NC} CLAUDE_HOOK_PROMPT_SUBMIT not set"
fi
echo

# 4. Test hook execution
echo -e "${YELLOW}4. Hook Execution Test:${NC}"
export CLAUDE_HOOK_EVENT="tool_use"
export CLAUDE_TOOL_NAME="Write"
output=$(.claude/hooks/universal-agent-enforcement.sh 2>&1)
if echo "$output" | grep -q "Warning"; then
    echo -e "   ${GREEN}✓${NC} Hook executes and shows warnings"
else
    echo -e "   ${RED}✗${NC} Hook not showing warnings"
fi
echo

# 5. Show context tracking
echo -e "${YELLOW}5. Context Tracking:${NC}"
context_files=$(ls -la /tmp/claude_hook_context_* 2>/dev/null | wc -l)
if [ $context_files -gt 0 ]; then
    echo -e "   ${GREEN}✓${NC} ${context_files} context file(s) found"
    echo -e "   ${GREEN}✓${NC} Hook is tracking agent usage"
else
    echo -e "   ${YELLOW}⚠${NC} No context files (hook may not have run yet)"
fi
echo

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Summary:${NC}"
echo -e "If all indicators show ${GREEN}✓${NC}, the hook is working correctly."
echo -e "If you see ${YELLOW}⚠${NC} or ${RED}✗${NC}, check the installation."
echo
echo -e "${BLUE}To see hook in action:${NC}"
echo "1. Create/edit a file - should suggest agents"
echo "2. Submit complex prompt - should recommend agents"
echo "3. Check console output for colored warnings"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"