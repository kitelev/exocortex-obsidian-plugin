# Docker UI Testing Environment

This document describes the containerized UI testing setup for the Exocortex Obsidian Plugin, allowing developers to run comprehensive UI tests without interrupting their development workflow.

## 🎯 Overview

The Docker UI testing environment provides:
- **Isolated Testing**: Tests run in containers, never interrupting your development
- **Consistent Environment**: Same test environment across all machines and CI/CD
- **Headless Operation**: No popups, window stealing, or visual disruptions
- **Background Execution**: Tests can run while you continue working
- **Comprehensive Coverage**: Full Obsidian simulation with Electron

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Run Tests Immediately
```bash
# Quick test run (basic validation)
./scripts/docker-test-quick.sh

# Full UI test suite
./scripts/docker-ui-test.sh run

# Run in background, continue working
./scripts/docker-test-quick.sh basic &
```

### Development Workflow
```bash
# Start development environment (with debugging capabilities)
./scripts/docker-ui-test.sh dev

# Run specific test suite
./scripts/docker-ui-test.sh run sparql

# Check test status
./scripts/docker-ui-test.sh status

# View test logs
./scripts/docker-ui-test.sh logs ui-test-runner
```

## 📁 Architecture

### Container Structure
```
Dockerfile.ui-test (Multi-stage build)
├── base          → Alpine Linux + system dependencies
├── dependencies  → Node.js dependencies
├── obsidian-setup → Obsidian application download
├── build         → Plugin compilation
├── test-env      → Test environment setup
├── ui-test       → Production test runner
├── ui-test-dev   → Development environment
└── ui-test-ci    → CI/CD optimized
```

### Service Architecture
```
docker-compose.ui-test.yml
├── ui-test-runner      → Complete test suite
├── ui-test-dev         → Interactive development
├── ui-test-basic       → Quick validation tests
├── ui-test-sparql      → SPARQL feature tests
├── ui-test-ci          → CI/CD optimized runner
├── test-aggregator     → Result compilation
└── performance-monitor → Resource tracking
```

## 🧪 Test Suites

### 1. Basic Tests (`basic`)
**Purpose**: Quick validation and smoke tests
**Duration**: ~2-5 minutes
**Coverage**:
- Plugin activation
- Workspace initialization
- SPARQL processor registration
- Basic UI element presence

```bash
# Run basic tests
./scripts/docker-ui-test.sh run basic

# Or use quick runner
./scripts/docker-test-quick.sh basic
```

### 2. SPARQL Tests (`sparql`)
**Purpose**: SPARQL functionality validation
**Duration**: ~5-10 minutes
**Coverage**:
- SPARQL query execution
- Results rendering
- Error handling
- Variable extraction
- Performance metrics

```bash
# Run SPARQL tests
./scripts/docker-ui-test.sh run sparql
```

### 3. UI Tests (`ui`)
**Purpose**: Complete UI interaction testing
**Duration**: ~10-15 minutes
**Coverage**:
- Modal interactions
- Button functionality
- Editor integration
- File navigation
- Asset creation

```bash
# Run UI tests
./scripts/docker-ui-test.sh run ui
```

### 4. Complete Suite (`all`)
**Purpose**: Comprehensive testing
**Duration**: ~15-25 minutes
**Coverage**: All of the above plus edge cases

```bash
# Run complete suite
./scripts/docker-ui-test.sh run all
```

## 🛠️ Development Features

### Interactive Development Environment
```bash
# Start interactive container
./scripts/docker-ui-test.sh dev

# Access container shell
docker exec -it $(docker-compose -f docker-compose.ui-test.yml ps -q ui-test-dev) /bin/bash

# Inside container - run individual tests
npx wdio run wdio.conf.ts --spec tests/ui/specs/activate.spec.ts
```

### Debug Mode
```bash
# Enable debug output
./scripts/docker-ui-test.sh -v run basic

# Start debug environment
./scripts/docker-ui-test.sh debug

# Debug port exposed on localhost:9229
```

### Live Code Testing
The development environment mounts your source code as a volume:
```bash
# Changes to these directories are reflected immediately:
# - src/
# - tests/ui/
# - wdio*.conf.ts
```

## 📊 Test Output

### Directory Structure
```
test-output/
├── ui-results/           → WebdriverIO JSON reports
├── screenshots/          → Failure screenshots
├── wdio-logs/           → Detailed WebdriverIO logs
├── coverage/            → Test coverage reports
├── performance/         → Performance metrics
├── basic/              → Basic test outputs
├── sparql/             → SPARQL test outputs
└── ci/                 → CI-specific outputs
```

### Accessing Results
```bash
# View latest test results
cat test-output/ui-results/wdio-0-0-json-reporter.json | jq '.stats'

# Check screenshots from failures
ls -la test-output/screenshots/

# Monitor performance metrics
tail -f test-output/performance/memory.log
```

## 🔧 Configuration

### Environment Variables
```bash
# Test behavior
export HEADLESS=true          # Run in headless mode
export CI=true               # Enable CI optimizations
export DEBUG=true            # Enable debug output
export TEST_TIMEOUT=300      # Test timeout in seconds

# Display settings
export DISPLAY=:99           # Virtual display
export ELECTRON_DISABLE_SANDBOX=1

# Performance tuning
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Docker Compose Profiles
```bash
# Available profiles:
--profile ui-tests           # Standard UI testing
--profile basic-tests        # Quick validation
--profile feature-tests      # Feature-specific tests
--profile development        # Interactive development
--profile ci                # CI/CD optimized
--profile debug             # Debug environment
--profile monitoring        # With performance monitoring
```

### Custom Configuration
```bash
# Custom output directory
./scripts/docker-ui-test.sh -o ./my-test-output run

# Custom timeout
./scripts/docker-ui-test.sh -t 600 run all

# Keep containers running after tests
./scripts/docker-ui-test.sh --keep run basic
```

## 🤖 CI/CD Integration

### GitHub Actions
The workflow `.github/workflows/docker-ui-tests.yml` provides:
- Automatic test execution on PRs and pushes
- Matrix testing across multiple Node.js versions
- Test result reporting in PR comments
- Artifact collection (screenshots, logs, reports)

### Manual Workflow Dispatch
```bash
# Trigger from GitHub UI or CLI
gh workflow run docker-ui-tests.yml \
  --field test_suite=all \
  --field debug_mode=true
```

### Local CI Simulation
```bash
# Run tests exactly as CI does
./scripts/docker-ui-test.sh ci

# With the same environment variables
export CI=true HEADLESS=true NO_SANDBOX=true
./scripts/docker-ui-test.sh run all
```

## 🔍 Troubleshooting

### Common Issues

#### "Virtual display server failed to start"
```bash
# Solution 1: Check X11 dependencies
docker-compose -f docker-compose.ui-test.yml build --no-cache

# Solution 2: Increase container privileges
# Add to docker-compose.yml:
privileged: true
```

#### "Obsidian workspace failed to become ready"
```bash
# Increase timeout
export WDIO_TIMEOUT=60000

# Check Obsidian download
./scripts/download-obsidian.sh

# Verify Obsidian path
docker-compose -f docker-compose.ui-test.yml run ui-test-dev ls -la /app/obsidian-app/
```

#### "Tests fail only in Docker"
```bash
# Compare environments
./scripts/docker-ui-test.sh -v run basic 2>&1 | tee docker-debug.log

# Run with headed browser for debugging
export HEADLESS=false
./scripts/docker-ui-test.sh dev
```

#### Container exits immediately
```bash
# Check container logs
docker-compose -f docker-compose.ui-test.yml logs ui-test-runner

# Run interactively
docker-compose -f docker-compose.ui-test.yml run ui-test-runner /bin/bash
```

### Debug Commands
```bash
# Container status
docker-compose -f docker-compose.ui-test.yml ps

# Resource usage
docker stats

# Container inspection
docker inspect $(docker-compose -f docker-compose.ui-test.yml ps -q ui-test-runner)

# Network debugging
docker network ls | grep ui-test
```

## 🎛️ Advanced Usage

### Custom Test Execution
```bash
# Run specific spec file
docker-compose -f docker-compose.ui-test.yml run ui-test-dev \
  npx wdio run wdio.conf.ts --spec tests/ui/specs/create-asset-modal.spec.ts

# Run with custom capabilities
docker-compose -f docker-compose.ui-test.yml run ui-test-dev \
  npx wdio run wdio.conf.ts --logLevel debug
```

### Performance Testing
```bash
# Start performance monitoring
./scripts/docker-ui-test.sh --profile monitoring run all

# Monitor resources during test
docker exec -it $(docker-compose -f docker-compose.ui-test.yml ps -q performance-monitor) \
  tail -f /app/performance/memory.log
```

### Parallel Test Execution
```bash
# Run multiple test suites in parallel
./scripts/docker-ui-test.sh run basic &
./scripts/docker-ui-test.sh run sparql &
wait  # Wait for all to complete
```

## 🔄 Maintenance

### Container Updates
```bash
# Force rebuild with latest dependencies
./scripts/docker-ui-test.sh --build run

# Update Obsidian version
export OBSIDIAN_VERSION=1.8.11
docker-compose -f docker-compose.ui-test.yml build --no-cache obsidian-setup
```

### Cleanup
```bash
# Clean up all containers and volumes
./scripts/docker-ui-test.sh clean --all

# Clean up Docker system
docker system prune -f
docker volume prune -f
```

### Resource Management
```bash
# Check Docker space usage
docker system df

# Remove unused test images
docker image prune --filter "label=com.docker.compose.project=exocortex-ui-test"
```

## 📚 Best Practices

### For Developers
1. **Use Quick Runner**: Start with `./scripts/docker-test-quick.sh` for rapid feedback
2. **Background Testing**: Run tests in background while developing
3. **Incremental Testing**: Use specific test suites (`basic`, `sparql`) during development
4. **Debug Mode**: Use interactive mode for test development and debugging

### For CI/CD
1. **Use CI Profile**: Always use `--profile ci` for optimized CI runs
2. **Artifact Collection**: Collect screenshots and logs for failed tests
3. **Timeout Management**: Set appropriate timeouts for CI environment
4. **Resource Limits**: Monitor container resource usage

### For Test Development
1. **Page Objects**: Follow existing page object patterns in `tests/ui/pageobjects/`
2. **Test Isolation**: Ensure tests don't depend on each other
3. **Error Handling**: Handle both success and failure scenarios
4. **Documentation**: Document complex test scenarios

## 🔗 Related Documentation

- [UI Testing README](tests/ui/README.md) - Detailed test documentation
- [WebdriverIO Configuration](wdio.conf.ts) - Test configuration details
- [GitHub Actions Workflow](.github/workflows/docker-ui-tests.yml) - CI/CD setup
- [Plugin Development](CLAUDE.md) - Main development guidelines

## 🆘 Support

### Getting Help
1. Check the troubleshooting section above
2. Review container logs: `./scripts/docker-ui-test.sh logs`
3. Run in debug mode: `./scripts/docker-ui-test.sh debug`
4. Create an issue with:
   - Docker version (`docker --version`)
   - Compose version (`docker-compose --version`)
   - Error logs and screenshots
   - Test command that failed

### Contributing
1. Test new features with Docker environment
2. Update documentation for any configuration changes
3. Ensure CI workflow still passes
4. Add new test suites to appropriate Docker profiles