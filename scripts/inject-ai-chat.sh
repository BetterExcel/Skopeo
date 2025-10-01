#!/bin/bash

# Inject AI Chat into Collabora's Main HTML
# This script automatically adds the AI chat scripts to Collabora's HTML files

set -e

CONTAINER_NAME="collabora_online"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 AI Chat Injection Script${NC}"
echo "=================================="

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Error: Container '$CONTAINER_NAME' is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Container is running${NC}"

# First, copy the files
echo -e "${BLUE}📦 Copying AI chat files...${NC}"
bash "$PROJECT_ROOT/scripts/hot-reload-frontend.sh"

# Find the main HTML files
echo -e "${BLUE}🔍 Finding Collabora HTML files...${NC}"

HTML_FILES=$(docker exec "$CONTAINER_NAME" find /usr -name "cool.html" -o -name "framed.html" 2>/dev/null | head -5)

if [ -z "$HTML_FILES" ]; then
    echo -e "${RED}❌ Error: Could not find Collabora HTML files${NC}"
    exit 1
fi

echo -e "${GREEN}Found HTML files:${NC}"
echo "$HTML_FILES"

# Process each HTML file
while IFS= read -r html_file; do
    if [ -z "$html_file" ]; then
        continue
    fi
    
    echo ""
    echo -e "${BLUE}Processing: $html_file${NC}"
    
    # Check if already injected
    if docker exec "$CONTAINER_NAME" grep -q "ai-chat-improved.js" "$html_file" 2>/dev/null; then
        echo -e "${YELLOW}  ⚠ Already injected, skipping${NC}"
        continue
    fi
    
    # Backup the file
    echo -e "${BLUE}  Creating backup...${NC}"
    docker exec "$CONTAINER_NAME" cp "$html_file" "${html_file}.backup" 2>/dev/null || true
    
    # Create injection script
    INJECT_SCRIPT=$(cat <<'EOF'
import sys

html_file = sys.argv[1]

with open(html_file, 'r') as f:
    content = f.read()

# Check if already injected
if 'ai-chat-improved.js' in content:
    print('Already injected')
    sys.exit(0)

# Inject CSS before </head>
css_tag = '<link rel="stylesheet" href="css/ai-chat-improved.css">'
if '</head>' in content:
    content = content.replace('</head>', f'    {css_tag}\n</head>')
    print('Injected CSS')

# Inject JS before </body>
js_tag = '<script src="ai-chat-improved.js"></script>'
if '</body>' in content:
    content = content.replace('</body>', f'    {js_tag}\n</body>')
    print('Injected JS')

# Write back
with open(html_file, 'w') as f:
    f.write(content)

print('Injection complete')
EOF
)
    
    # Execute injection
    echo -e "${BLUE}  Injecting AI chat scripts...${NC}"
    docker exec "$CONTAINER_NAME" python3 -c "$INJECT_SCRIPT" "$html_file" 2>/dev/null || {
        echo -e "${YELLOW}  ⚠ Python injection failed, trying sed...${NC}"
        
        # Fallback to sed
        docker exec "$CONTAINER_NAME" sed -i 's|</head>|    <link rel="stylesheet" href="css/ai-chat-improved.css">\n</head>|' "$html_file" 2>/dev/null || true
        docker exec "$CONTAINER_NAME" sed -i 's|</body>|    <script src="ai-chat-improved.js"></script>\n</body>|' "$html_file" 2>/dev/null || true
    }
    
    echo -e "${GREEN}  ✓ Injected successfully${NC}"
    
done <<< "$HTML_FILES"

echo ""
echo -e "${GREEN}✅ Injection complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Open a spreadsheet in Nextcloud"
echo "3. Look for the AI chat button (bottom right)"
echo "4. Press Ctrl+Shift+A to toggle chat"
echo ""
echo -e "${YELLOW}💡 Tip: If you don't see changes, restart the container:${NC}"
echo "   docker restart $CONTAINER_NAME"
echo ""

# Show what was injected
echo -e "${BLUE}📄 Verifying injection:${NC}"
FIRST_FILE=$(echo "$HTML_FILES" | head -1)
if docker exec "$CONTAINER_NAME" grep -A 2 "ai-chat-improved" "$FIRST_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Scripts found in HTML${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify injection${NC}"
fi
