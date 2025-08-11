#!/usr/bin/env python3
"""
Agent Detection Script for Claude Code
Extracts available agents from Claude's function definitions
"""

import sys
import re
import json
import os

def extract_agents_from_claude_output(text):
    """Extract agent definitions from Claude's function descriptions"""
    agents = []
    
    # Pattern to match agent descriptions in Claude's context
    patterns = [
        r'- (\w+[-\w]*): ([^(\n]+)',  # Format: - agent-name: description
        r'"(\w+[-\w]*)"\s*:\s*"([^"]+)"',  # Format: "agent-name": "description"
        r'(\w+[-\w]*)\s+agent[:\s]+([^\n]+)',  # Format: agent-name agent: description
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.MULTILINE | re.IGNORECASE)
        for match in matches:
            agent_name = match[0].strip()
            description = match[1].strip()
            
            # Filter out non-agent matches
            if 'agent' in agent_name.lower() or agent_name in known_agents():
                agents.append(f"{agent_name}:{description}")
    
    return agents

def known_agents():
    """Return list of known agent names"""
    return [
        'general-purpose', 'code-searcher', 'swebok-engineer', 'qa-engineer',
        'error-handler', 'orchestrator', 'architect-agent', 'performance-agent',
        'security-agent', 'product-manager', 'devops-engineer', 'test-fixer-agent',
        'code-review-agent', 'release-agent', 'scrum-master-agent', 'babok-agent',
        'pmbok-agent', 'integration-agent', 'compliance-agent', 'ux-design-expert',
        'ux-researcher-agent', 'technical-writer-agent', 'community-manager-agent',
        'data-analyst-agent', 'memory-bank-synchronizer', 'meta-agent',
        'statusline-setup', 'get-current-datetime', 'agent-factory'
    ]

def scan_claude_context():
    """Scan various sources for agent definitions"""
    agents = set()
    
    # Check environment variable
    if 'CLAUDE_AGENTS' in os.environ:
        for agent in os.environ['CLAUDE_AGENTS'].split(','):
            agents.add(agent.strip())
    
    # Check local project files
    project_files = [
        '.claude/agents/available-agents.txt',
        '.claude/PROJECT.md',
        'CLAUDE.md',
        '.claude/config.json'
    ]
    
    for file_path in project_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    extracted = extract_agents_from_claude_output(content)
                    agents.update(extracted)
            except:
                pass
    
    # If no agents found, use defaults
    if not agents:
        defaults = [
            "general-purpose:General research and multi-step tasks",
            "code-searcher:Locate functions and code in codebase",
            "swebok-engineer:Software engineering best practices",
            "qa-engineer:Quality assurance and testing",
            "error-handler:Error diagnosis and debugging",
            "orchestrator:Coordinate complex multi-domain tasks",
            "architect-agent:System architecture decisions",
            "performance-agent:Performance optimization",
            "security-agent:Security analysis and compliance",
            "product-manager:Product planning and requirements",
            "devops-engineer:CI/CD and deployment",
            "test-fixer-agent:Fix failing tests",
            "code-review-agent:Code quality review"
        ]
        agents.update(defaults)
    
    return sorted(list(agents))

def main():
    """Main function to output available agents"""
    agents = scan_claude_context()
    
    # Output to file for hook to read
    output_dir = '.claude/agents'
    os.makedirs(output_dir, exist_ok=True)
    
    with open(os.path.join(output_dir, 'available-agents.txt'), 'w') as f:
        for agent in agents:
            f.write(f"{agent}\n")
    
    # Also output to stdout
    for agent in agents:
        print(agent)

if __name__ == '__main__':
    main()