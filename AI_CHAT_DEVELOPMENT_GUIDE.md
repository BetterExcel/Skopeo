# AI Chat Interface Development Guide

## 🎯 Overview

This guide explains how to develop the AI chat interface **without rebuilding the entire Collabora container** every time you make changes. Your friend started a basic implementation in `/src/view/browser/`, and we'll improve it with a hot-reload workflow.

## 📁 Current Implementation

Your project already has these AI chat files:
- `/src/view/browser/ai-chat.js` - Main JavaScript logic
- `/src/view/browser/css/ai-chat.css` - Styling
- `/src/view/browser/ai-chat-test.html` - Test page
- `/src/view/browser/test-ai-chat.html` - Full featured test page

## 🚀 Fast Development Workflow (No Rebuilds!)

### Method 1: Volume Mount for Live Development (RECOMMENDED)

Instead of rebuilding, mount your frontend files directly into the running container:

#### Step 1: Update `docker-compose.yml`

Add volume mounts to the `collabora_online` service:

```yaml
collabora_online:
  build:
    context: ./src/view
    dockerfile: docker/from-packages/Dockerfile
  image: collabora/code
  container_name: collabora_online
  restart: always
  tty: true
  ports:
    - "9980:9980"
  volumes:
    # Mount your frontend files for live editing
    - ./src/view/browser/ai-chat.js:/usr/share/coolwsd/browser/dist/ai-chat.js
    - ./src/view/browser/css/ai-chat.css:/usr/share/coolwsd/browser/dist/css/ai-chat.css
    - ./src/view/browser/ai-chat-test.html:/usr/share/coolwsd/browser/dist/ai-chat-test.html
  environment:
    - extra_params=--o:ssl.enable=false --o:user_interface.use_integration_theme=false --o:storage.wopi.alias_groups.mode=groups
    - aliasgroups1=http://nextcloud:80,http://192.168.0.206:8081,http://localhost:8081
  depends_on:
    - nextcloud
```

#### Step 2: Restart Container with New Mounts

```bash
docker-compose down
docker-compose up -d
```

#### Step 3: Edit Files Locally

Now you can edit files in `/src/view/browser/` and they'll be **immediately available** in the container!

**Note:** Some changes may require a browser refresh (Ctrl+Shift+R for hard refresh).

### Method 2: Hot Injection Script

For even faster iteration without restarting containers:

```bash
# Copy files directly into running container
docker cp src/view/browser/ai-chat.js collabora_online:/usr/share/coolwsd/browser/dist/
docker cp src/view/browser/css/ai-chat.css collabora_online:/usr/share/coolwsd/browser/dist/css/
```

I'll create a helper script for this below.

## 🛠️ Development Setup

### 1. Test Your AI Chat Locally First

Before injecting into Collabora, test standalone:

```bash
# Serve the test page locally
cd src/view/browser
python3 -m http.server 8000
```

Then open: `http://localhost:8000/test-ai-chat.html`

This lets you iterate **super fast** without touching Docker at all!

### 2. Find Collabora's Frontend Directory

The Collabora frontend files are typically located at:
- `/usr/share/coolwsd/browser/dist/` (in the container)
- `/opt/cool/share/browser/dist/` (alternative location)

To verify:
```bash
docker exec collabora_online find /usr -name "*.html" -path "*/browser/*" | head -5
```

### 3. Integrate into Collabora

Once your standalone version works, you need to load it in Collabora's main interface.

#### Option A: Modify Collabora's Main HTML

Find the main HTML file (usually `cool.html` or `framed.html`):

```bash
docker exec collabora_online ls -la /usr/share/coolwsd/browser/dist/*.html
```

Then inject your CSS and JS:

```html
<!-- Add to the <head> section -->
<link rel="stylesheet" href="css/ai-chat.css">

<!-- Add before closing </body> -->
<script src="ai-chat.js"></script>
```

#### Option B: Use JavaScript Injection (Easier)

Create a loader script that injects your AI chat dynamically:

```javascript
// ai-chat-loader.js
(function() {
    // Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/browser/dist/css/ai-chat.css';
    document.head.appendChild(link);
    
    // Inject JS
    const script = document.createElement('script');
    script.src = '/browser/dist/ai-chat.js';
    document.body.appendChild(script);
})();
```

## 📝 Development Workflow Summary

### Daily Development Loop:

1. **Edit locally**: Modify files in `src/view/browser/`
2. **Test standalone**: Open `test-ai-chat.html` in browser
3. **Inject to container**: Use the hot-reload script (see below)
4. **Test in Collabora**: Open a spreadsheet in Nextcloud
5. **Repeat**: No container rebuilds needed!

### When to Rebuild:

You only need to rebuild the container if you:
- Change C++ backend code
- Modify Collabora configuration files
- Update system dependencies
- Change the Dockerfile itself

**Frontend-only changes = NO REBUILD NEEDED!**

## 🎨 Next Steps for Your AI Chat

### Phase 1: Frontend Polish (Current Phase)
- ✅ Basic chat interface (already done by your friend)
- ⬜ Improve UI/UX (modern design, better animations)
- ⬜ Add keyboard shortcuts
- ⬜ Add message history persistence
- ⬜ Add typing indicators
- ⬜ Make it responsive

### Phase 2: Spreadsheet Integration
- ⬜ Add button to get selected cell data
- ⬜ Add button to get current sheet info
- ⬜ Display spreadsheet context in chat
- ⬜ Add formula insertion capability

### Phase 3: OpenAI Integration
- ⬜ Set up backend API endpoint (Python/Node.js)
- ⬜ Add OpenAI API key management
- ⬜ Implement streaming responses
- ⬜ Add error handling

## 🔧 Useful Commands

```bash
# Check if files exist in container
docker exec collabora_online ls -la /usr/share/coolwsd/browser/dist/

# View container logs
docker logs -f collabora_online

# Restart just the Collabora container
docker restart collabora_online

# Execute commands in container
docker exec -it collabora_online bash

# Copy files to container
docker cp src/view/browser/ai-chat.js collabora_online:/usr/share/coolwsd/browser/dist/

# Find where Collabora serves files from
docker exec collabora_online find /usr -name "cool.html" -o -name "framed.html"
```

## 🎯 Pro Tips

1. **Use Browser DevTools**: Press F12 in Collabora to debug your JavaScript
2. **Check Console**: Look for errors in the browser console
3. **Network Tab**: Verify your files are loading correctly
4. **Hard Refresh**: Use Ctrl+Shift+R to bypass cache
5. **Source Maps**: Consider adding source maps for easier debugging

## 📚 File Structure

```
src/view/browser/
├── ai-chat.js              # Main AI chat logic
├── css/
│   └── ai-chat.css         # AI chat styles
├── ai-chat-test.html       # Simple test page
└── test-ai-chat.html       # Full-featured test page
```

## 🚨 Common Issues

### Issue: Changes not appearing
**Solution**: Hard refresh browser (Ctrl+Shift+R) or clear cache

### Issue: Files not found in container
**Solution**: Check the correct path with `docker exec` commands above

### Issue: JavaScript errors
**Solution**: Check browser console (F12) for detailed error messages

### Issue: Styles not applying
**Solution**: Verify CSS file is loaded in Network tab (F12)

## 🎉 Quick Start

1. Test standalone: `cd src/view/browser && python3 -m http.server 8000`
2. Open: `http://localhost:8000/test-ai-chat.html`
3. Make changes to `ai-chat.js` or `css/ai-chat.css`
4. Refresh browser to see changes
5. Once happy, use the hot-reload script to inject into Collabora

No rebuilds, no waiting, just pure development speed! 🚀
