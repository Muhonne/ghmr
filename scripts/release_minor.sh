#!/bin/bash
set -e

echo "Running tests..."
npm test

echo "Bumping version..."
# Bump package.json
npm version minor --no-git-tag-version

# Get new version
VERSION=$(node -p "require('./package.json').version")
echo "New version: $VERSION"

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
# Comparing branch to main
COMMITS=$(git log main..HEAD --pretty=format:"- %s")

if [ -z "$COMMITS" ]; then
    echo "Warning: No commits found between main and HEAD. Using placeholder."
    COMMITS="- Maintenance update"
fi

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

echo "Release $VERSION completed successfully."
