# Exocortex Plugin - Docker UI Testing Makefile
# Convenient commands for containerized UI testing

# Default settings
DOCKER_COMPOSE_FILE ?= docker-compose.ui-test.yml
TEST_SUITE ?= basic
SERVICE_NAME ?= ui-test-runner
OUTPUT_DIR ?= test-output

# Colors for output
GREEN := \033[0;32m
BLUE := \033[0;34m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

# Default target
.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)🐳 Exocortex Plugin - Docker UI Testing$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(GREEN)%s$(NC)\n", substr($$0, 5) }' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Examples:$(NC)"
	@echo "  make test-quick          # Quick UI test (basic suite)"
	@echo "  make test TEST_SUITE=all # Complete UI test suite"
	@echo "  make dev                 # Interactive development"
	@echo "  make logs                # View test runner logs"
	@echo ""

##@ Quick Testing
.PHONY: test-quick
test-quick: ## Run quick UI tests in background (basic suite)
	@echo "$(BLUE)🚀 Running quick UI tests...$(NC)"
	@./scripts/docker-test-quick.sh basic
	@echo "$(GREEN)✅ Quick tests started in background$(NC)"

.PHONY: test-quick-wait
test-quick-wait: ## Run quick UI tests and wait for completion
	@echo "$(BLUE)🚀 Running quick UI tests (waiting for completion)...$(NC)"
	@./scripts/docker-test-quick.sh basic --wait

##@ Test Execution
.PHONY: test
test: ## Run UI test suite (specify TEST_SUITE=basic|sparql|ui|all)
	@echo "$(BLUE)🧪 Running $(TEST_SUITE) UI test suite...$(NC)"
	@./scripts/docker-ui-test.sh run $(TEST_SUITE)

.PHONY: test-basic
test-basic: ## Run basic UI tests (quick validation)
	@$(MAKE) test TEST_SUITE=basic

.PHONY: test-sparql
test-sparql: ## Run SPARQL functionality tests
	@$(MAKE) test TEST_SUITE=sparql

.PHONY: test-ui
test-ui: ## Run UI interaction tests
	@$(MAKE) test TEST_SUITE=ui

.PHONY: test-all
test-all: ## Run complete UI test suite
	@$(MAKE) test TEST_SUITE=all

.PHONY: test-ci
test-ci: ## Run tests in CI mode (optimized)
	@echo "$(BLUE)🤖 Running UI tests in CI mode...$(NC)"
	@./scripts/docker-ui-test.sh ci

##@ Development
.PHONY: dev
dev: ## Start interactive development environment
	@echo "$(BLUE)🛠️  Starting interactive development environment...$(NC)"
	@echo "$(YELLOW)Tip: Access container with 'make shell' in another terminal$(NC)"
	@./scripts/docker-ui-test.sh dev

.PHONY: debug
debug: ## Start debug environment with enhanced logging
	@echo "$(BLUE)🐛 Starting debug environment...$(NC)"
	@echo "$(YELLOW)Debug port available on localhost:9229$(NC)"
	@./scripts/docker-ui-test.sh debug

.PHONY: shell
shell: ## Access running development container shell
	@echo "$(BLUE)💻 Accessing container shell...$(NC)"
	@docker exec -it $$(docker-compose -f $(DOCKER_COMPOSE_FILE) ps -q ui-test-dev) /bin/bash || echo "$(RED)❌ Development container not running. Start with 'make dev' first.$(NC)"

##@ Monitoring
.PHONY: status
status: ## Check status of running containers
	@echo "$(BLUE)📊 Container status:$(NC)"
	@./scripts/docker-ui-test.sh status

.PHONY: logs
logs: ## View logs from test runner (specify SERVICE_NAME=service)
	@echo "$(BLUE)📄 Viewing logs for $(SERVICE_NAME)...$(NC)"
	@./scripts/docker-ui-test.sh logs $(SERVICE_NAME)

.PHONY: logs-follow
logs-follow: ## Follow logs from test runner
	@echo "$(BLUE)📄 Following logs for $(SERVICE_NAME)...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f $(SERVICE_NAME)

.PHONY: results
results: ## Show test results summary
	@echo "$(BLUE)📋 Test Results Summary:$(NC)"
	@if [ -f $(OUTPUT_DIR)/ui-results/wdio-0-0-json-reporter.json ]; then \
		echo "$(GREEN)✅ Test results found$(NC)"; \
		if command -v jq >/dev/null 2>&1; then \
			echo "Tests: $$(jq -r '.stats.tests // 0' $(OUTPUT_DIR)/ui-results/wdio-0-0-json-reporter.json)"; \
			echo "Passes: $$(jq -r '.stats.passes // 0' $(OUTPUT_DIR)/ui-results/wdio-0-0-json-reporter.json)"; \
			echo "Failures: $$(jq -r '.stats.failures // 0' $(OUTPUT_DIR)/ui-results/wdio-0-0-json-reporter.json)"; \
			echo "Duration: $$(jq -r '(.stats.end - .stats.start) / 1000 // 0' $(OUTPUT_DIR)/ui-results/wdio-0-0-json-reporter.json)s"; \
		else \
			echo "$(YELLOW)Install jq for detailed results parsing$(NC)"; \
		fi; \
	else \
		echo "$(RED)❌ No test results found$(NC)"; \
	fi
	@if ls $(OUTPUT_DIR)/screenshots/*.png >/dev/null 2>&1; then \
		echo "Screenshots: $$(ls $(OUTPUT_DIR)/screenshots/*.png | wc -l) captured"; \
	fi

.PHONY: screenshots
screenshots: ## View captured screenshots
	@echo "$(BLUE)📸 Captured screenshots:$(NC)"
	@if ls $(OUTPUT_DIR)/screenshots/*.png >/dev/null 2>&1; then \
		ls -la $(OUTPUT_DIR)/screenshots/; \
	else \
		echo "$(YELLOW)No screenshots found$(NC)"; \
	fi

##@ Container Management
.PHONY: build
build: ## Build UI test containers
	@echo "$(BLUE)🏗️  Building UI test containers...$(NC)"
	@./scripts/docker-ui-test.sh build

.PHONY: rebuild
rebuild: ## Rebuild UI test containers from scratch
	@echo "$(BLUE)🏗️  Rebuilding UI test containers from scratch...$(NC)"
	@./scripts/docker-ui-test.sh build --build

.PHONY: pull
pull: ## Pull latest base images
	@echo "$(BLUE)⬇️  Pulling latest base images...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) pull

.PHONY: up
up: ## Start all UI test services
	@echo "$(BLUE)🚀 Starting UI test services...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) --profile ui-tests up -d

.PHONY: down
down: ## Stop all UI test services
	@echo "$(BLUE)⏹️  Stopping UI test services...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) down --remove-orphans

##@ Cleanup
.PHONY: clean
clean: ## Clean up containers and test artifacts
	@echo "$(BLUE)🧹 Cleaning up containers and artifacts...$(NC)"
	@./scripts/docker-ui-test.sh clean

.PHONY: clean-all
clean-all: ## Clean up everything including volumes and images
	@echo "$(BLUE)🧹 Deep cleaning everything...$(NC)"
	@./scripts/docker-ui-test.sh clean --all
	@docker system prune -f
	@docker volume prune -f

.PHONY: clean-results
clean-results: ## Clean up test result artifacts only
	@echo "$(BLUE)🧹 Cleaning test results...$(NC)"
	@rm -rf $(OUTPUT_DIR)
	@echo "$(GREEN)✅ Test results cleaned$(NC)"

##@ Utilities
.PHONY: setup
setup: ## Setup test environment and dependencies
	@echo "$(BLUE)⚙️  Setting up test environment...$(NC)"
	@mkdir -p $(OUTPUT_DIR)/{ui-results,screenshots,wdio-logs,coverage,performance}
	@chmod -R 755 $(OUTPUT_DIR) || true
	@echo "$(GREEN)✅ Test environment ready$(NC)"

.PHONY: check-deps
check-deps: ## Check required dependencies
	@echo "$(BLUE)🔍 Checking dependencies...$(NC)"
	@command -v docker >/dev/null 2>&1 || (echo "$(RED)❌ Docker not found$(NC)" && exit 1)
	@command -v docker-compose >/dev/null 2>&1 || (echo "$(RED)❌ docker-compose not found$(NC)" && exit 1)
	@test -f $(DOCKER_COMPOSE_FILE) || (echo "$(RED)❌ Docker compose file not found$(NC)" && exit 1)
	@test -x scripts/docker-ui-test.sh || (echo "$(RED)❌ Test runner script not executable$(NC)" && exit 1)
	@echo "$(GREEN)✅ All dependencies available$(NC)"

.PHONY: validate
validate: check-deps setup ## Validate environment setup
	@echo "$(BLUE)✅ Environment validation complete$(NC)"

##@ Performance
.PHONY: perf
perf: ## Run tests with performance monitoring
	@echo "$(BLUE)📈 Running tests with performance monitoring...$(NC)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) --profile ui-tests --profile monitoring up --build --exit-code-from ui-test-runner

.PHONY: perf-report
perf-report: ## Show performance metrics
	@echo "$(BLUE)📊 Performance Metrics:$(NC)"
	@if [ -f $(OUTPUT_DIR)/performance/memory.log ]; then \
		echo "$(GREEN)Memory Usage (last 5 entries):$(NC)"; \
		tail -5 $(OUTPUT_DIR)/performance/memory.log; \
	else \
		echo "$(YELLOW)No performance data found$(NC)"; \
	fi

##@ Parallel Testing
.PHONY: test-parallel
test-parallel: ## Run multiple test suites in parallel
	@echo "$(BLUE)⚡ Running test suites in parallel...$(NC)"
	@$(MAKE) test-basic &
	@$(MAKE) test-sparql &
	@wait
	@echo "$(GREEN)✅ Parallel tests completed$(NC)"

##@ Integration
.PHONY: ci-local
ci-local: validate clean ## Simulate CI environment locally
	@echo "$(BLUE)🤖 Simulating CI environment...$(NC)"
	@export CI=true HEADLESS=true NO_SANDBOX=true && $(MAKE) test-ci

.PHONY: pre-commit
pre-commit: validate test-quick ## Pre-commit hook for UI tests
	@echo "$(GREEN)✅ Pre-commit UI tests passed$(NC)"

# Advanced targets for power users
##@ Advanced
.PHONY: inspect
inspect: ## Inspect running test container
	@docker inspect $$(docker-compose -f $(DOCKER_COMPOSE_FILE) ps -q $(SERVICE_NAME)) 2>/dev/null | jq '.[] | {Image, State, Config}' || echo "$(RED)Container not running or jq not available$(NC)"

.PHONY: exec
exec: ## Execute command in running container (use CMD variable)
	@docker exec -it $$(docker-compose -f $(DOCKER_COMPOSE_FILE) ps -q $(SERVICE_NAME)) $(CMD)

.PHONY: network
network: ## Show Docker network information
	@echo "$(BLUE)🌐 Network Information:$(NC)"
	@docker network ls | grep ui-test || echo "No UI test networks found"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) config --services

# Convenience aliases
.PHONY: t tb ts tu ta td tc tq
t: test ## Alias for 'test'
tb: test-basic ## Alias for 'test-basic'
ts: test-sparql ## Alias for 'test-sparql'
tu: test-ui ## Alias for 'test-ui'
ta: test-all ## Alias for 'test-all'
td: dev ## Alias for 'dev'
tc: clean ## Alias for 'clean'
tq: test-quick ## Alias for 'test-quick'