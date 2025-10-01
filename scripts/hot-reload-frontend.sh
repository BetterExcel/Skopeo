#!/bin/bash

# Hot Reload Frontend Files to Collabora Container
# This script copies your local frontend files directly into the running container
# No rebuild needed!

set -e

CONTAINER_NAME="collabora_online"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BROWSER_SRC="$PROJECT_ROOT/src/view/browser"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Hot Reload Frontend to Collabora${NC}"
echo "=================================="

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Error: Container '$CONTAINER_NAME' is not running${NC}"
    echo "Start it with: docker-compose up -d"
    exit 1
fi

echo -e "${GREEN}✓ Container is running${NC}"

# Find the correct destination path in container
echo -e "${BLUE}🔍 Finding Collabora frontend directory...${NC}"

# Try common paths
DEST_PATHS=(
    "/usr/share/coolwsd/browser/dist"
    "/opt/cool/share/browser/dist"
    "/usr/share/collabora/browser/dist"
)

DEST_PATH=""
for path in "${DEST_PATHS[@]}"; do
    if docker exec "$CONTAINER_NAME" test -d "$path" 2>/dev/null; then
        DEST_PATH="$path"
        echo -e "${GREEN}✓ Found: $DEST_PATH${NC}"
        break
    fi
done

if [ -z "$DEST_PATH" ]; then
    echo -e "${YELLOW}⚠ Could not find standard path, searching...${NC}"
    DEST_PATH=$(docker exec "$CONTAINER_NAME" find /usr -type d -name "dist" -path "*/browser/*" 2>/dev/null | head -1)
    
    if [ -z "$DEST_PATH" ]; then
        echo -e "${RED}❌ Error: Could not find Collabora frontend directory${NC}"
        echo "Try manually with: docker exec $CONTAINER_NAME find /usr -name '*.html'"
        exit 1
    fi
    echo -e "${GREEN}✓ Found: $DEST_PATH${NC}"
fi

# Copy AI Chat files
echo -e "${BLUE}📦 Copying AI Chat files...${NC}"

FILES_TO_COPY=(
    "ai-chat.js:ai-chat.js"
    "css/ai-chat.css:css/ai-chat.css"
    "ai-chat-test.html:ai-chat-test.html"
    "test-ai-chat.html:test-ai-chat.html"
)

for file_mapping in "${FILES_TO_COPY[@]}"; do
    SRC_FILE="${file_mapping%%:*}"
    DEST_FILE="${file_mapping##*:}"
    
    SRC_PATH="$BROWSER_SRC/$SRC_FILE"
    
    if [ -f "$SRC_PATH" ]; then
        # Create directory if needed
        DEST_DIR=$(dirname "$DEST_PATH/$DEST_FILE")
        docker exec "$CONTAINER_NAME" mkdir -p "$DEST_DIR" 2>/dev/null || true
        
        # Copy file
        docker cp "$SRC_PATH" "$CONTAINER_NAME:$DEST_PATH/$DEST_FILE"
        echo -e "${GREEN}  ✓ Copied: $SRC_FILE${NC}"
    else
        echo -e "${YELLOW}  ⚠ Skipped (not found): $SRC_FILE${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Hot reload complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Check browser console (F12) for any errors"
echo "3. Test your changes in Nextcloud/Collabora"
echo ""
echo -e "${YELLOW}💡 Tip: Run this script after every change for instant updates!${NC}"
echo ""

# Optional: Show file timestamps
echo -e "${BLUE}📄 File timestamps in container:${NC}"
docker exec "$CONTAINER_NAME" ls -lh "$DEST_PATH/ai-chat.js" 2>/dev/null || echo "  ai-chat.js not found"
docker exec "$CONTAINER_NAME" ls -lh "$DEST_PATH/css/ai-chat.css" 2>/dev/null || echo "  css/ai-chat.css not found"
