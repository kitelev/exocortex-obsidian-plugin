# Makefile for Claude Turbo Mode
# Automated parallel execution with watch mode

# Configuration (can be overridden via environment or CLI)
TASK ?= Auto-fix recent changes
SHARDS ?= 6
LIMIT ?= 250
RECENT ?= 5
MODEL ?= sonnet
EXTRA ?= 
PARALLEL_JOBS ?= auto

# Paths
PROJECT_ROOT := $(shell pwd)
CACHE_DIR := .turbo-cache
TURBO_DIR := turbo
LAUNCHD_PLIST := $(TURBO_DIR)/launchd/com.exo.claude.turbo.plist
LAUNCHD_TARGET := $(HOME)/Library/LaunchAgents/com.exo.claude.turbo.plist

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
RESET := \033[0m

.PHONY: all turbo watch enable-launchd disable-launchd diag clean-cache help test-dry permissions

# Default target
all: turbo

# Main turbo execution
turbo:
	@echo "$(BLUE)═══ Claude Turbo Mode ═══$(RESET)"
	@echo "Task: $(YELLOW)$(TASK)$(RESET)"
	@echo "Configuration: $(SHARDS) shards, $(LIMIT) files limit, $(RECENT) days recent"
	@echo ""
	@echo "$(GREEN)▶ Phase 1: Context Selection$(RESET)"
	@bash $(TURBO_DIR)/select-context.sh "$(TASK)" "$(PROJECT_ROOT)" "$(LIMIT)" "$(RECENT)" false > $(CACHE_DIR)/context.txt
	@FILE_COUNT=$$(wc -l < $(CACHE_DIR)/context.txt | tr -d ' '); \
	echo "Selected $$FILE_COUNT files"
	@echo ""
	@echo "$(GREEN)▶ Phase 2: Sharding$(RESET)"
	@cat $(CACHE_DIR)/context.txt | bash $(TURBO_DIR)/shard-context.sh "$(SHARDS)" "$(CACHE_DIR)"
	@echo ""
	@echo "$(GREEN)▶ Phase 3: Parallel Execution$(RESET)"
	@START_TIME=$$(date +%s); \
	bash $(TURBO_DIR)/run-parallel.sh "$(TASK)" "$(PROJECT_ROOT)" "$(PARALLEL_JOBS)" "$(MODEL)" "$(EXTRA)"; \
	END_TIME=$$(date +%s); \
	DURATION=$$((END_TIME - START_TIME)); \
	echo ""; \
	echo "$(GREEN)✓ Completed in $$DURATION seconds$(RESET)"

# Watch mode (local, not daemonized)
watch:
	@echo "$(BLUE)Starting watch mode...$(RESET)"
	@echo "Press Ctrl+C to stop"
	@bash $(TURBO_DIR)/watch.sh "$(PROJECT_ROOT)" "$(TASK)" "$(SHARDS)" "$(LIMIT)" "$(RECENT)" "$(PARALLEL_JOBS)" "$(MODEL)"

# Enable LaunchD daemon
enable-launchd:
	@echo "$(BLUE)Enabling LaunchD daemon...$(RESET)"
	@cp $(LAUNCHD_PLIST) $(LAUNCHD_TARGET)
	@launchctl load -w $(LAUNCHD_TARGET)
	@echo "$(GREEN)✓ Daemon enabled$(RESET)"
	@echo "Logs: ~/Library/Logs/claude-turbo.{out,err}"
	@echo "To check status: launchctl list | grep com.exo.claude.turbo"

# Disable LaunchD daemon
disable-launchd:
	@echo "$(BLUE)Disabling LaunchD daemon...$(RESET)"
	@-launchctl unload -w $(LAUNCHD_TARGET) 2>/dev/null || true
	@rm -f $(LAUNCHD_TARGET)
	@echo "$(GREEN)✓ Daemon disabled$(RESET)"

# Diagnostic information
diag:
	@echo "$(BLUE)═══ System Diagnostics ═══$(RESET)"
	@echo ""
	@echo "$(YELLOW)System:$(RESET)"
	@echo "  OS: $$(sw_vers -productName) $$(sw_vers -productVersion)"
	@echo "  CPUs: $$(sysctl -n hw.logicalcpu) logical, $$(sysctl -n hw.physicalcpu) physical"
	@echo ""
	@echo "$(YELLOW)Dependencies:$(RESET)"
	@command -v claude >/dev/null 2>&1 && echo "  ✓ claude: $$(claude --version)" || echo "  ✗ claude: not found"
	@command -v git >/dev/null 2>&1 && echo "  ✓ git: $$(git --version | head -1)" || echo "  ✗ git: not found"
	@command -v rg >/dev/null 2>&1 && echo "  ✓ ripgrep: $$(rg --version | head -1)" || echo "  ✗ ripgrep: not found"
	@command -v jq >/dev/null 2>&1 && echo "  ✓ jq: $$(jq --version)" || echo "  ✗ jq: not found"
	@command -v fd >/dev/null 2>&1 && echo "  ✓ fd: $$(fd --version)" || echo "  ⚠ fd: not found (optional)"
	@command -v parallel >/dev/null 2>&1 && echo "  ✓ parallel: installed" || echo "  ⚠ parallel: not found (using xargs fallback)"
	@command -v fswatch >/dev/null 2>&1 && echo "  ✓ fswatch: installed" || echo "  ⚠ fswatch: not found (using polling fallback)"
	@echo ""
	@echo "$(YELLOW)Configuration:$(RESET)"
	@echo "  Project: $(PROJECT_ROOT)"
	@echo "  Cache: $(CACHE_DIR)"
	@echo "  Model: $(MODEL)"
	@echo "  Parallel Jobs: $(PARALLEL_JOBS)"
	@echo ""
	@echo "$(YELLOW)Performance Tuning Tips:$(RESET)"
	@echo "  • Reduce LIMIT for faster processing: make turbo LIMIT=100"
	@echo "  • Increase SHARDS for more parallelism: make turbo SHARDS=8"
	@echo "  • Use specific TASK for better context: make turbo TASK=\"fix TypeScript errors\""
	@echo "  • Install missing optional dependencies for better performance"

# Clean cache
clean-cache:
	@echo "$(BLUE)Cleaning cache...$(RESET)"
	@rm -rf $(CACHE_DIR)/*
	@mkdir -p $(CACHE_DIR)
	@echo "$(GREEN)✓ Cache cleaned$(RESET)"

# Test dry run (no actual changes)
test-dry:
	@echo "$(BLUE)Running dry test...$(RESET)"
	@echo "test.txt" > $(CACHE_DIR)/context.txt
	@cat $(CACHE_DIR)/context.txt | bash $(TURBO_DIR)/shard-context.sh 1 "$(CACHE_DIR)"
	@echo "$(GREEN)✓ Pipeline connectivity verified$(RESET)"

# Set executable permissions
permissions:
	@echo "$(BLUE)Setting executable permissions...$(RESET)"
	@chmod +x $(TURBO_DIR)/*.sh
	@echo "$(GREEN)✓ Permissions set$(RESET)"

# Help
help:
	@echo "$(BLUE)═══ Claude Turbo Mode - Help ═══$(RESET)"
	@echo ""
	@echo "$(YELLOW)Quick Start:$(RESET)"
	@echo "  make turbo                    # Run turbo mode with defaults"
	@echo "  make turbo TASK=\"fix tests\"   # Run with specific task"
	@echo "  make watch                    # Start watch mode (local)"
	@echo "  make enable-launchd           # Enable background daemon"
	@echo ""
	@echo "$(YELLOW)Main Commands:$(RESET)"
	@echo "  turbo           - Run turbo pipeline once"
	@echo "  watch           - Start watch mode (foreground)"
	@echo "  enable-launchd  - Enable background daemon"
	@echo "  disable-launchd - Disable background daemon"
	@echo "  diag            - Show system diagnostics"
	@echo "  clean-cache     - Clear cache directory"
	@echo "  test-dry        - Test pipeline connectivity"
	@echo "  permissions     - Set executable permissions"
	@echo ""
	@echo "$(YELLOW)Configuration:$(RESET)"
	@echo "  TASK     - Task description (default: \"$(TASK)\")"
	@echo "  SHARDS   - Number of parallel shards (default: $(SHARDS))"
	@echo "  LIMIT    - Max files to process (default: $(LIMIT))"
	@echo "  RECENT   - Days of recent changes (default: $(RECENT))"
	@echo "  MODEL    - Claude model to use (default: $(MODEL))"
	@echo "  PARALLEL_JOBS - Number of parallel jobs (default: auto)"
	@echo ""
	@echo "$(YELLOW)Examples:$(RESET)"
	@echo "  make turbo TASK=\"fix TypeScript errors\" LIMIT=100"
	@echo "  make turbo TASK=\"optimize performance\" SHARDS=8"
	@echo "  make turbo TASK=\"update tests\" MODEL=opus"
	@echo ""
	@echo "$(YELLOW)Logs:$(RESET)"
	@echo "  Watch mode: console output"
	@echo "  Daemon: ~/Library/Logs/claude-turbo.{out,err}"
	@echo "  Cache: $(CACHE_DIR)/logs/*.log"

# Initialize on first run
init: permissions clean-cache
	@echo "$(GREEN)✓ Turbo mode initialized$(RESET)"
	@echo "Run 'make help' for usage instructions"