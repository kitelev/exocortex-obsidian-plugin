#!/bin/bash
# Check if version already exists in remote releases

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
