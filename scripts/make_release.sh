#!/bin/bash
set -e

echo "Running tests..."
npm test

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

read -p "Enter new version: " VERSION

if [ -z "$VERSION" ]; then
    echo "Error: Version cannot be empty"
    exit 1
fi

echo "Bumping version to $VERSION..."
# Bump package.json
npm version $VERSION --no-git-tag-version

# Update tauri.conf.json
echo "Updating tauri.conf.json..."
node -e "
const fs = require('fs');
const path = 'src-tauri/tauri.conf.json';
const conf = JSON.parse(fs.readFileSync(path, 'utf8'));
conf.version = '$VERSION';
fs.writeFileSync(path, JSON.stringify(conf, null, 2));
"

echo "Updating RELEASE_NOTES.md..."

# Find the last release commit (looks for commits starting with "v" followed by version number)
LAST_RELEASE_COMMIT=$(git log --oneline --all | grep -E "^[a-f0-9]+ v[0-9]+\.[0-9]+\.[0-9]+" | head -n 1 | awk '{print $1}')

if [ -z "$LAST_RELEASE_COMMIT" ]; then
    echo "Warning: No previous release commit found. Getting last 10 commits."
    COMMITS=$(git log -10 --pretty=format:"- %s")
else
    echo "Found last release at commit: $LAST_RELEASE_COMMIT"
    # Get commits since that release (excluding the release commit itself)
    COMMITS=$(git log ${LAST_RELEASE_COMMIT}..HEAD --pretty=format:"- %s")
fi

if [ -z "$COMMITS" ]; then
    echo "Warning: No commits found since last release. Using placeholder."
    COMMITS="- Maintenance update"
fi

echo "Commits to include:"
echo "$COMMITS"
echo ""

# Prepend to RELEASE_NOTES.md
TEMP_NOTES=$(mktemp)
echo "# $VERSION" > "$TEMP_NOTES"
echo "" >> "$TEMP_NOTES"
echo "$COMMITS" >> "$TEMP_NOTES"
echo "" >> "$TEMP_NOTES"

if [ -f RELEASE_NOTES.md ]; then
    cat RELEASE_NOTES.md >> "$TEMP_NOTES"
fi

mv "$TEMP_NOTES" RELEASE_NOTES.md

echo "Running release build..."
npm run release:mac

echo "Committing release changes..."
git add package.json package-lock.json src-tauri/tauri.conf.json RELEASE_NOTES.md
git commit -m "v$VERSION"

echo "Release v$VERSION completed successfully."
echo "Don't forget to push: git push"
