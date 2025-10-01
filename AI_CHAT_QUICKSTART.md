# 🚀 AI Chat Quick Start Guide

## ✨ What You Have Now

Your AI chat interface is **ready to use**! Here's what's been built:

### 📦 Files Created

```
src/view/browser/
├── ai-chat-improved.js          # Modern AI chat implementation
├── ai-chat-standalone-demo.html # Standalone demo page
├── css/
│   └── ai-chat-improved.css     # Beautiful styling
└── [existing files...]
    ├── ai-chat.js               # Original implementation
    ├── ai-chat-test.html        # Original test page
    └── test-ai-chat.html        # Original full test

scripts/
└── hot-reload-frontend.sh       # Hot reload script (no rebuilds!)

Documentation/
├── AI_CHAT_DEVELOPMENT_GUIDE.md # Complete dev workflow
└── OPENAI_INTEGRATION_GUIDE.md  # OpenAI setup guide
```

## 🎯 Choose Your Path

### Path A: Test Standalone (Fastest - Start Here!)

**Perfect for:** Testing the UI, making design changes, rapid iteration

```bash
cd /Users/aryanpatel/Desktop/Skopeo/src/view/browser
python3 -m http.server 8000
```

Then open: **http://localhost:8000/ai-chat-standalone-demo.html**

**What you can do:**
- ✅ See the beautiful chat interface
- ✅ Test all UI interactions
- ✅ Try keyboard shortcuts (Ctrl+Shift+A)
- ✅ Send messages and see mock responses
- ✅ Test quick action buttons
- ✅ Verify responsive design

**What won't work yet:**
- ❌ Spreadsheet integration (no Collabora connection)
- ❌ Real AI responses (using mock data)

---

### Path B: Integrate with Collabora (Production)

**Perfect for:** Testing with real spreadsheets, full integration

#### Step 1: Hot Reload into Container

```bash
cd /Users/aryanpatel/Desktop/Skopeo

# Make sure containers are running
docker-compose up -d

# Inject your new AI chat files
./scripts/hot-reload-frontend.sh
```

#### Step 2: Verify Files Were Copied

```bash
# Check if files exist in container
docker exec collabora_online ls -la /usr/share/coolwsd/browser/dist/ai-chat-improved.js
docker exec collabora_online ls -la /usr/share/coolwsd/browser/dist/css/ai-chat-improved.css
```

#### Step 3: Load in Collabora

You need to add the chat to Collabora's main HTML file. First, find it:

```bash
docker exec collabora_online find /usr -name "cool.html" -o -name "framed.html" | head -5
```

Then inject the scripts. You have two options:

**Option 1: Manual Injection (Quick Test)**

```bash
# Get the main HTML file path (example: /usr/share/coolwsd/browser/dist/cool.html)
docker exec -it collabora_online bash

# Inside container:
cd /usr/share/coolwsd/browser/dist
vi cool.html  # or nano, or sed

# Add before </head>:
# <link rel="stylesheet" href="css/ai-chat-improved.css">

# Add before </body>:
# <script src="ai-chat-improved.js"></script>
```

**Option 2: Automated Injection (Recommended)**

Create a script to do this automatically. I'll create one for you below.

#### Step 4: Test in Nextcloud

1. Open Nextcloud: `http://192.168.0.206:8081` (or your IP)
2. Open a spreadsheet
3. Look for the floating AI chat button (bottom right)
4. Click it or press **Ctrl+Shift+A**

---

### Path C: Full Development Setup

**Perfect for:** Active development, making changes frequently

#### Step 1: Use Volume Mounts (Best for Development)

Update your `docker-compose.yml`:

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
    # Add these volume mounts for live editing
    - ./src/view/browser/ai-chat-improved.js:/usr/share/coolwsd/browser/dist/ai-chat-improved.js
    - ./src/view/browser/css/ai-chat-improved.css:/usr/share/coolwsd/browser/dist/css/ai-chat-improved.css
  environment:
    - extra_params=--o:ssl.enable=false --o:user_interface.use_integration_theme=false --o:storage.wopi.alias_groups.mode=groups
    - aliasgroups1=http://nextcloud:80,http://192.168.0.206:8081,http://localhost:8081
  depends_on:
    - nextcloud
```

#### Step 2: Restart Container

```bash
docker-compose down
docker-compose up -d
```

#### Step 3: Edit and Refresh

Now you can:
1. Edit `src/view/browser/ai-chat-improved.js` locally
2. Hard refresh browser (Ctrl+Shift+R)
3. See changes immediately!

**No rebuilds, no hot-reload script needed!**

---

## 🎨 Customization Guide

### Change Colors

Edit `src/view/browser/css/ai-chat-improved.css`:

```css
/* Change the gradient colors */
.ai-chat-trigger {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}

.ai-chat-header {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Change Position

```css
/* Move trigger button to left side */
.ai-chat-trigger {
    left: 24px;  /* instead of right: 24px */
}

/* Move chat panel to left side */
.ai-chat-container {
    left: 0;     /* instead of right: 0 */
}
```

### Change Keyboard Shortcut

Edit `src/view/browser/ai-chat-improved.js`:

```javascript
// Find this line (around line 265):
if (e.ctrlKey && e.shiftKey && e.key === 'A') {

// Change to whatever you want:
if (e.ctrlKey && e.key === 'K') {  // Ctrl+K
if (e.altKey && e.key === 'C') {   // Alt+C
```

---

## 🔧 Troubleshooting

### Issue: "Files not found in container"

**Solution:**
```bash
# Find the correct path
docker exec collabora_online find /usr -type d -name "dist" -path "*/browser/*"

# Update the hot-reload script with the correct path
```

### Issue: "Chat doesn't appear in Collabora"

**Checklist:**
- [ ] Files copied to container? (`docker exec collabora_online ls -la /usr/share/coolwsd/browser/dist/ai-chat-improved.js`)
- [ ] Scripts loaded in HTML? (Check browser DevTools → Sources tab)
- [ ] JavaScript errors? (Check browser Console - F12)
- [ ] Hard refresh? (Ctrl+Shift+R)

### Issue: "Changes not appearing"

**Solution:**
```bash
# Clear browser cache
Ctrl+Shift+R (hard refresh)

# Or clear all cache
# Chrome: DevTools → Network → Disable cache (while DevTools open)

# Re-inject files
./scripts/hot-reload-frontend.sh
```

### Issue: "Floating button not visible"

**Debug:**
```javascript
// Open browser console (F12) and type:
window.aiChat
// Should show the AIChatInterface object

window.aiChat.show()
// Should open the chat
```

---

## 📊 Feature Comparison

| Feature | Original (`ai-chat.js`) | Improved (`ai-chat-improved.js`) |
|---------|------------------------|----------------------------------|
| Chat Interface | ✅ Basic | ✅ Modern, gradient design |
| Floating Button | ❌ No | ✅ Yes |
| Quick Actions | ❌ No | ✅ Yes (3 buttons) |
| Message History | ❌ No | ✅ Yes (localStorage) |
| Timestamps | ❌ No | ✅ Yes |
| Typing Indicator | ✅ Basic | ✅ Animated dots |
| Dark Mode | ❌ No | ✅ Yes |
| Keyboard Shortcuts | ✅ Ctrl+Shift+A | ✅ Ctrl+Shift+A + more |
| Auto-resize Input | ❌ No | ✅ Yes |
| Animations | ❌ No | ✅ Smooth transitions |
| Mobile Responsive | ⚠️ Partial | ✅ Full support |

---

## 🎯 Next Steps Checklist

### Immediate (Frontend Only)

- [ ] Test standalone demo
- [ ] Customize colors/styling to your preference
- [ ] Test all UI interactions
- [ ] Verify keyboard shortcuts work
- [ ] Test on mobile/tablet

### Short Term (Integration)

- [ ] Inject into Collabora container
- [ ] Verify it loads in spreadsheet view
- [ ] Test with actual spreadsheet open
- [ ] Connect to spreadsheet selection API
- [ ] Get cell data from Collabora

### Long Term (Backend)

- [ ] Get OpenAI API key
- [ ] Set up Python/Node.js backend
- [ ] Implement API endpoint
- [ ] Connect frontend to backend
- [ ] Test real AI responses
- [ ] Add formula insertion capability
- [ ] Deploy to production

---

## 💡 Pro Tips

### 1. Use Browser DevTools

Press **F12** to open DevTools:
- **Console**: See JavaScript logs and errors
- **Network**: Verify files are loading
- **Elements**: Inspect and modify CSS live
- **Sources**: Debug JavaScript with breakpoints

### 2. Test Incrementally

Don't try to integrate everything at once:
1. ✅ Test standalone first
2. ✅ Then inject into container
3. ✅ Then add Collabora integration
4. ✅ Finally add OpenAI

### 3. Keep Backups

Before making major changes:
```bash
cp src/view/browser/ai-chat-improved.js src/view/browser/ai-chat-improved.js.backup
```

### 4. Use Git

Commit your working versions:
```bash
git add src/view/browser/ai-chat-improved.*
git commit -m "Add improved AI chat interface"
```

---

## 📚 Documentation Reference

- **Development Workflow**: See `AI_CHAT_DEVELOPMENT_GUIDE.md`
- **OpenAI Integration**: See `OPENAI_INTEGRATION_GUIDE.md`
- **Project Setup**: See `README.md` and `TEAMMATE_SETUP_GUIDE.md`

---

## 🆘 Getting Help

### Debug Commands

```bash
# Check container logs
docker logs -f collabora_online

# Check if files exist
docker exec collabora_online ls -la /usr/share/coolwsd/browser/dist/

# Test hot reload script
./scripts/hot-reload-frontend.sh

# Restart container
docker restart collabora_online
```

### Browser Console Commands

```javascript
// Check if chat is loaded
window.aiChat

// Show chat
window.aiChat.show()

// Hide chat
window.aiChat.hide()

// Send test message
window.aiChat.inputElement.value = "Test message"
window.aiChat.sendMessage()

// Clear chat
window.aiChat.clearChat()
```

---

## 🎉 You're Ready!

Start with **Path A** (standalone demo) to see your beautiful AI chat interface in action!

```bash
cd src/view/browser
python3 -m http.server 8000
# Open http://localhost:8000/ai-chat-standalone-demo.html
```

**Have fun building! 🚀**
