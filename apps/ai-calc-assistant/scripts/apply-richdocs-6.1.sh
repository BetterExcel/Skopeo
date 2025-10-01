#!/usr/bin/env bash
set -euo pipefail

# Apply the Richdocuments 6.1 patch into a Nextcloud apps directory.
# Usage:
#   ./apply-richdocs-6.1.sh /path/to/nextcloud/apps/richdocuments

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /path/to/nextcloud/apps/richdocuments" >&2
  exit 1
fi

RICH_DOCS_DIR="$1"
PATCH_FILE="$(dirname "$0")/../patches/richdocuments-6.1.diff"

if [[ ! -d "$RICH_DOCS_DIR" ]]; then
  echo "Directory not found: $RICH_DOCS_DIR" >&2
  exit 1
fi
if [[ ! -f "$PATCH_FILE" ]]; then
  echo "Patch file not found: $PATCH_FILE" >&2
  exit 1
fi

pushd "$RICH_DOCS_DIR" >/dev/null

# Safety: create a backup
BACKUP="wopi-$(date +%Y%m%d%H%M%S).bak.tar.gz"
 tar -czf "$BACKUP" lib/Controller/WopiController.php || true
 echo "Backup created: $RICH_DOCS_DIR/$BACKUP"

# Apply patch
# Using ed-style patch here; if it fails, print guidance.
if command -v git >/dev/null 2>&1 && [[ -d .git ]]; then
  git apply "$PATCH_FILE" || {
    echo "git apply failed. Please patch manually by following docs/richdocuments-checkfileinfo-patch.md" >&2
    exit 2
  }
  echo "Patch applied via git apply."
else
  # Fallback: print instructions
  echo "git repository not detected. Please patch manually as per docs/richdocuments-checkfileinfo-patch.md" >&2
  exit 3
fi

popd >/dev/null

echo "Done. Remember to set app config richdocuments:post_message_origin to your Nextcloud origin."
