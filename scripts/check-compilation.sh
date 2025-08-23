#!/bin/bash

# TypeScript Compilation Checker
# Ensures all TypeScript code compiles without errors

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 TypeScript Compilation Check${NC}"
echo "=================================="

# Step 1: Check TypeScript compilation
echo -e "\n${YELLOW}1. Checking TypeScript compilation...${NC}"
if npx tsc --noEmit --skipLibCheck; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    echo -e "${RED}Fix the compilation errors before committing${NC}"
    exit 1
fi

# Step 2: Run ESLint
echo -e "\n${YELLOW}2. Running ESLint...${NC}"
if npx eslint src --ext .ts,.tsx --max-warnings 0; then
    echo -e "${GREEN}✅ ESLint passed${NC}"
else
    echo -e "${RED}❌ ESLint found issues${NC}"
    echo -e "${YELLOW}Run 'npm run lint:fix' to auto-fix some issues${NC}"
    exit 1
fi

# Step 3: Check imports
echo -e "\n${YELLOW}3. Checking import statements...${NC}"
if npx tsc --noEmit --listFiles | grep -q "Cannot find module"; then
    echo -e "${RED}❌ Missing imports detected${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All imports resolved${NC}"
fi

# Step 4: Check for unused exports
echo -e "\n${YELLOW}4. Checking for unused exports...${NC}"
if npx ts-unused-exports tsconfig.json --showLineNumber --excludePathsFromReport=tests; then
    echo -e "${GREEN}✅ No unused exports${NC}"
else
    echo -e "${YELLOW}⚠️  Unused exports detected (non-blocking)${NC}"
fi

# Step 5: Run Prettier check
echo -e "\n${YELLOW}5. Checking code formatting...${NC}"
if npx prettier --check 'src/**/*.{ts,tsx}'; then
    echo -e "${GREEN}✅ Code formatting is correct${NC}"
else
    echo -e "${YELLOW}⚠️  Code needs formatting${NC}"
    echo -e "${YELLOW}Run 'npm run format' to auto-format${NC}"
fi

echo -e "\n${GREEN}🎉 All compilation checks passed!${NC}"
echo "=================================="
echo -e "${GREEN}Your code is ready to commit${NC}"