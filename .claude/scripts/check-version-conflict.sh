#!/bin/bash
# Check if version already exists in remote releases
# Skip check for feature branches in PR-based workflow

CURRENT_BRANCH=$(git branch --show-current)

# Skip version check for feature branches (PR-based workflow)
# Version bump happens automatically after PR merge via pr-auto-version.yml
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo "ℹ️  Skipping version check for feature branch: $CURRENT_BRANCH"
    echo "✅ Version will be bumped automatically after PR merge"
    exit 0
fi

PACKAGE_VERSION=$(node -p "require('./package.json').version")
REMOTE_TAG="v${PACKAGE_VERSION}"

# Check if tag exists on remote
if git ls-remote --tags origin | grep -q "refs/tags/${REMOTE_TAG}"; then
    echo "❌ ERROR: Version ${PACKAGE_VERSION} already exists as a release!"
    echo "Please bump the version again with: npm version patch --no-git-tag-version"
    exit 1
fi

echo "✅ Version ${PACKAGE_VERSION} is unique"
exit 0
