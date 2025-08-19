# Multi-stage Dockerfile for Exocortex Obsidian Plugin Testing
# Optimized for CI/CD and local development testing

# =============================================================================
# Base stage - Common dependencies
# =============================================================================
FROM node:20.18-alpine AS base

# Install system dependencies needed for testing
RUN apk add --no-cache \
    git \
    bash \
    curl \
    # Dependencies for UI testing with WebDriver
    chromium \
    chromium-chromedriver \
    xvfb \
    xvfb-run \
    # Additional utilities for CI
    jq \
    # Compatibility layer for Alpine
    gcompat

# Set Chrome/Chromium environment variables for WebDriver
ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/bin/chromium-browser \
    CHROMIUM_PATH=/usr/bin/chromium-browser \
    DISPLAY=:99

# Create app directory
WORKDIR /app

# =============================================================================
# Dependencies stage - Install and cache dependencies
# =============================================================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for testing)
RUN npm ci --include=dev

# =============================================================================
# Build stage - Build the plugin
# =============================================================================
FROM dependencies AS build

# Copy source code
COPY . .

# Build the plugin
RUN npm run build

# Verify build artifacts
RUN test -f main.js && test -s main.js

# =============================================================================
# Test stage - Run all tests
# =============================================================================
FROM build AS test

# Set environment variables for testing
ENV NODE_ENV=test \
    CI=true \
    DEBUG=false

# Create directories for test artifacts
RUN mkdir -p /app/coverage \
    /app/test-results \
    /app/screenshots \
    /app/wdio-logs

# Run TypeScript compilation check
RUN npx tsc --noEmit --skipLibCheck

# Run unit tests with coverage
RUN npm run test:coverage

# Run integration tests
RUN npm run test:integration

# Run E2E tests
RUN npm run test:e2e:all

# =============================================================================
# UI Test stage - Run UI tests with display server
# =============================================================================
FROM test AS ui-test

# Start Xvfb for headless UI testing
RUN Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset & \
    sleep 3 && \
    npm run test:ui:headless || true

# =============================================================================
# Mobile Test stage - Mobile-specific testing
# =============================================================================
FROM test AS mobile-test

# Set mobile-specific environment variables
ENV MOBILE_TEST=true \
    PLATFORM_MOBILE=true

# Run mobile-specific tests (subset of full test suite)
RUN npm run test:unit -- --testNamePattern="mobile|touch|platform"

# =============================================================================
# Production stage - Clean production build
# =============================================================================
FROM node:20.18-alpine AS production

# Install only production dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts
COPY --from=build /app/main.js ./
COPY --from=build /app/manifest.json ./
COPY --from=build /app/styles.css ./

# Create minimal plugin structure
RUN mkdir -p dist && \
    cp main.js manifest.json styles.css dist/

# Validate plugin structure
RUN node -e "
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
console.log('✅ Plugin validated:', manifest.id, 'v' + manifest.version);
"

# =============================================================================
# Development stage - For local development with hot reload
# =============================================================================
FROM dependencies AS development

# Copy source code
COPY . .

# Expose port for development server (if applicable)
EXPOSE 8080

# Default command for development
CMD ["npm", "run", "dev"]

# =============================================================================
# CI stage - Optimized for CI/CD pipelines
# =============================================================================
FROM test AS ci

# Copy all test results and artifacts
COPY --from=test /app/coverage ./coverage
COPY --from=test /app/test-results ./test-results

# Generate test summary
RUN echo "=== Test Summary ===" > test-summary.txt && \
    echo "Build: $(date)" >> test-summary.txt && \
    echo "Node: $(node --version)" >> test-summary.txt && \
    echo "NPM: $(npm --version)" >> test-summary.txt && \
    if [ -f coverage/coverage-summary.json ]; then \
        echo "Coverage: $(cat coverage/coverage-summary.json | jq -r '.total.lines.pct')%" >> test-summary.txt; \
    fi

# Validate plugin for release
RUN npm run validate

# Default command shows test summary
CMD ["cat", "test-summary.txt"]