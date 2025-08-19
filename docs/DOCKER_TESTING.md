# Docker Testing Guide

This guide provides comprehensive instructions for using Docker-based testing solutions for the Exocortex Obsidian plugin.

## Overview

The Docker testing infrastructure provides:

- **Consistent Environment**: Same testing environment across all platforms
- **Faster Execution**: Optimized container images with caching
- **Better Isolation**: Clean, reproducible test environments
- **Mobile Testing**: Specialized mobile environment simulation
- **CI/CD Integration**: Seamless GitHub Actions integration

## Quick Start

### Prerequisites

- Docker 20.10+ with Docker Compose
- 4GB+ available RAM
- 2GB+ free disk space

### Basic Usage

```bash
# Make the script executable (first time only)
chmod +x scripts/docker-test.sh

# Run all tests
./scripts/docker-test.sh test-all

# Run specific test suites
./scripts/docker-test.sh test-unit      # Unit & integration tests
./scripts/docker-test.sh test-ui        # UI tests with WebDriver
./scripts/docker-test.sh test-mobile    # Mobile-specific tests

# Development workflow
./scripts/docker-test.sh dev            # Start development environment
./scripts/docker-test.sh watch          # Continuous testing
./scripts/docker-test.sh coverage       # Generate coverage report
```

## Docker Images

### Base Image: `node:20.18-alpine`

- **Size**: ~200MB (optimized)
- **Features**: Node.js 20.18, npm, Alpine Linux
- **Security**: Regular security updates, minimal attack surface

### Test Images

| Image Target | Purpose | Size | Features |
|--------------|---------|------|----------|
| `test` | Unit/Integration tests | ~350MB | Jest, jsdom, coverage tools |
| `ui-test` | WebDriver UI tests | ~450MB | Chromium, Xvfb, WebDriverIO |
| `mobile-test` | Mobile environment | ~350MB | Mobile simulation, touch events |
| `ci` | Complete CI pipeline | ~400MB | All test suites + validation |

## Docker Compose Profiles

### Core Profiles

```bash
# Test profiles
docker-compose --profile test up           # Unit & integration tests
docker-compose --profile ui up             # UI tests
docker-compose --profile mobile up         # Mobile tests
docker-compose --profile ci up             # Full CI pipeline

# Development profiles
docker-compose --profile dev up            # Development server
docker-compose --profile watch up          # Test watch mode
docker-compose --profile coverage up       # Coverage server

# Specialized profiles
docker-compose --profile performance up    # Performance tests
docker-compose --profile security up       # Security tests
docker-compose --profile matrix up         # Multi-version tests
```

### Mobile Testing Profiles

```bash
# Mobile-specific compose file
docker-compose -f docker-compose.mobile.yml up mobile-all

# Individual mobile test suites
docker-compose -f docker-compose.mobile.yml up ios-test
docker-compose -f docker-compose.mobile.yml up android-test
docker-compose -f docker-compose.mobile.yml up touch-test
```

## GitHub Actions Integration

### Manual Workflow Triggers

The CI workflow supports manual execution with Docker:

1. Go to **Actions** tab in GitHub
2. Select **CI Tests** workflow
3. Click **Run workflow**
4. Choose **docker** as test environment
5. Click **Run workflow**

### Dedicated Docker CI

The `docker-ci.yml` workflow provides comprehensive Docker testing:

- **Unit Tests**: Jest with coverage
- **Mobile Tests**: iOS/Android simulation
- **UI Tests**: WebDriver with screenshots
- **Matrix Tests**: Node.js 18 & 20
- **Performance Tests**: Memory/CPU profiling
- **Security Tests**: Vulnerability scanning

## Testing Scenarios

### Local Development

```bash
# Start development environment
./scripts/docker-test.sh dev

# Watch tests during development
./scripts/docker-test.sh watch

# Quick unit test run
./scripts/docker-test.sh test-unit
```

### Pre-commit Testing

```bash
# Run all tests before commit
./scripts/docker-test.sh test-all

# Check coverage
./scripts/docker-test.sh coverage
# Open http://localhost:8080 for coverage report
```

### CI/CD Pipeline Testing

```bash
# Simulate CI environment
./scripts/docker-test.sh test-ci

# Matrix testing (multiple Node.js versions)
./scripts/docker-test.sh test-matrix
```

### Mobile-Specific Testing

```bash
# All mobile tests
docker-compose -f docker-compose.mobile.yml up mobile-all

# iOS simulation
docker-compose -f docker-compose.mobile.yml up ios-test

# Android simulation
docker-compose -f docker-compose.mobile.yml up android-test

# Touch interface testing
docker-compose -f docker-compose.mobile.yml up touch-test

# Mobile performance
docker-compose -f docker-compose.mobile.yml up mobile-performance
```

## Advanced Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CI` | `false` | Enable CI optimizations |
| `JEST_WORKERS` | `50%` | Jest worker processes |
| `NODE_ENV` | `test` | Node.js environment |
| `MOBILE_TEST` | `false` | Enable mobile testing mode |
| `PLATFORM_MOBILE` | `false` | Mobile platform detection |
| `DISPLAY` | `:99` | X11 display for UI tests |

### Custom Test Commands

```bash
# Run specific test patterns
docker run --rm -v $(pwd):/app exocortex-plugin:test \
  npm run test:unit -- --testNamePattern="GraphRenderer"

# Run with custom Jest options
docker run --rm -v $(pwd):/app exocortex-plugin:test \
  npm run test:unit -- --verbose --runInBand

# Mobile-specific test patterns
docker run --rm -v $(pwd):/app \
  -e MOBILE_TEST=true \
  exocortex-plugin:mobile-test \
  npm run test:unit -- --testNamePattern="mobile|touch"
```

### Volume Mounting

```bash
# Mount specific directories
docker run --rm \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/tests:/app/tests \
  -v $(pwd)/coverage:/app/coverage \
  exocortex-plugin:test npm run test:coverage
```

## Performance Optimization

### Build Caching

The Docker setup uses multi-stage builds and layer caching:

```dockerfile
# Dependencies are cached separately
COPY package*.json ./
RUN npm ci --include=dev

# Source code changes don't invalidate dependency cache
COPY . .
RUN npm run build
```

### Docker Compose Caching

Named volumes provide persistent caching:

```yaml
volumes:
  node_modules:      # Shared node_modules cache
  test_cache:        # Jest cache persistence
  build_cache:       # Build artifact cache
```

### GitHub Actions Caching

CI workflows use Docker layer caching:

```yaml
- name: Build with cache
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

## Troubleshooting

### Common Issues

#### Docker Build Fails

```bash
# Clean rebuild
./scripts/docker-test.sh cleanup
./scripts/docker-test.sh build
```

#### Tests Timeout

```bash
# Increase memory for containers
docker run --rm -m 2g exocortex-plugin:test npm run test:unit
```

#### UI Tests Fail

```bash
# Check display server
docker run --rm --privileged exocortex-plugin:ui-test xvfb-run --help

# Run with debug output
docker run --rm -e DEBUG=true exocortex-plugin:ui-test npm run test:ui:headless
```

#### Mobile Tests Fail

```bash
# Check mobile environment
docker run --rm -e MOBILE_TEST=true exocortex-plugin:mobile-test env | grep MOBILE
```

### Debug Commands

```bash
# Interactive container access
docker run --rm -it exocortex-plugin:test /bin/bash

# Check container resources
docker stats

# View container logs
docker-compose logs test

# Inspect image layers
docker history exocortex-plugin:test
```

### Performance Issues

```bash
# Monitor resource usage
docker run --rm --name test-monitor exocortex-plugin:test npm run test:unit &
docker stats test-monitor

# Profile memory usage
docker run --rm -e NODE_OPTIONS="--max-old-space-size=1024" \
  exocortex-plugin:test npm run test:unit
```

## Best Practices

### Development Workflow

1. **Start with Docker**: Use Docker for all testing
2. **Cache Dependencies**: Let Docker cache node_modules
3. **Watch Mode**: Use watch mode for active development
4. **Coverage Reports**: Generate coverage regularly

### CI/CD Integration

1. **Matrix Testing**: Test multiple Node.js versions
2. **Artifact Collection**: Save test results and screenshots
3. **Performance Monitoring**: Track test execution time
4. **Security Scanning**: Regular vulnerability checks

### Mobile Testing

1. **Device Simulation**: Test iOS and Android environments
2. **Touch Events**: Validate touch interaction patterns
3. **Performance Constraints**: Test with limited resources
4. **Responsive Design**: Verify mobile layouts

## Resource Requirements

### Minimum System Requirements

- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 5GB free space
- **Docker**: 20.10+

### Recommended Configuration

- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Disk**: 10GB+ free space
- **SSD**: For better I/O performance

### CI/CD Resource Usage

| Test Suite | Duration | Memory | CPU |
|------------|----------|--------|-----|
| Unit Tests | 2-3 min | 1GB | 1 core |
| UI Tests | 5-8 min | 2GB | 2 cores |
| Mobile Tests | 3-5 min | 1.5GB | 1 core |
| All Tests | 10-15 min | 2.5GB | 2 cores |

## Security Considerations

### Container Security

- **Non-root User**: Tests run as non-root user
- **Minimal Base**: Alpine Linux with minimal packages
- **Regular Updates**: Automated security updates
- **Isolated Network**: Docker bridge networking

### Data Protection

- **No Secrets**: No sensitive data in containers
- **Temporary Volumes**: Test data cleaned up
- **Local Only**: No external data transmission
- **Read-only Mounts**: Source code mounted read-only when possible

## Future Enhancements

### Planned Improvements

1. **Parallel Testing**: Faster test execution
2. **Visual Testing**: Screenshot comparison
3. **E2E Testing**: Full plugin integration tests
4. **Cloud Testing**: Remote Docker execution
5. **Performance Benchmarks**: Automated performance tracking

### Integration Roadmap

- **Kubernetes**: Pod-based testing
- **Cloud CI**: AWS/GCP Docker runners
- **Security Scanning**: Advanced vulnerability detection
- **Monitoring**: Real-time test metrics

---

For questions or issues, see the main project documentation or create an issue on GitHub.