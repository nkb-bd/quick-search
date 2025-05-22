#!/bin/bash

# Cleanup script for Quick Search extension
# This script removes unnecessary files and folders while preserving essential components

echo "Starting cleanup process..."

# Directories to keep
KEEP_DIRS=(
  "src/assets"
  "src/background"
  "src/components"
  "src/composables"
  "src/devtools"
  "src/locales"
  "src/stores"
  "src/types"
  "src/ui/action-popup"
  "src/ui/devtools-panel"
  "src/utils"
)

# Directories to remove
REMOVE_DIRS=(
  "src/content-script"
  "src/offscreen"
  "src/ui/common"
  "src/ui/content-script-iframe"
  "src/ui/options-page"
  "src/ui/setup"
  "src/ui/side-panel"
)

# Create backup directory
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Move directories to backup instead of deleting them
for dir in "${REMOVE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "Moving $dir to backup..."
    mkdir -p "$BACKUP_DIR/$(dirname $dir)"
    mv "$dir" "$BACKUP_DIR/$dir"
  fi
done

echo "Cleanup complete! Unnecessary directories have been moved to $BACKUP_DIR"
echo "You can delete the backup directory when you're sure everything works correctly."
echo ""
echo "✅ Current project structure:"
echo "   - Search functionality with auto-suggestions"
echo "   - Light/dark theme toggle"
echo "   - About and Settings pages"
echo "   - DevTools panel support"
echo "   - Internationalization support"
