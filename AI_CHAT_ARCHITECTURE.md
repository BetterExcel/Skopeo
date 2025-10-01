# AI Chat Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Nextcloud Interface                        │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         Collabora Online (Spreadsheet)           │  │ │
│  │  │                                                   │  │ │
│  │  │  ┌─────────────────────────────────────────┐    │  │ │
│  │  │  │     AI Chat Interface (Floating)        │    │  │ │
│  │  │  │  ┌───────────────────────────────────┐  │    │  │ │
│  │  │  │  │  🤖 AI Chat Button                │  │    │  │ │
│  │  │  │  └───────────────────────────────────┘  │    │  │ │
│  │  │  │                                          │    │  │ │
│  │  │  │  ┌───────────────────────────────────┐  │    │  │ │
│  │  │  │  │  Chat Panel (Right Side)          │  │    │  │ │
│  │  │  │  │  • Header with actions            │  │    │  │ │
│  │  │  │  │  • Message history                │  │    │  │ │
│  │  │  │  │  • Quick action buttons           │  │    │  │ │
│  │  │  │  │  • Input area                     │  │    │  │ │
│  │  │  │  └───────────────────────────────────┘  │    │  │ │
│  │  │  └─────────────────────────────────────────┘    │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Request
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Future)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Python Flask / Node.js Express                        │ │
│  │  • /api/chat - Main chat endpoint                      │ │
│  │  • /api/chat/stream - Streaming responses             │ │
│  │  • /api/health - Health check                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ OpenAI API Call
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      OpenAI API                              │
│  • GPT-4 / GPT-3.5-turbo                                    │
│  • Chat completions                                          │
│  • Streaming responses                                       │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
Skopeo/
│
├── src/view/browser/                    # Frontend files
│   │
│   ├── ai-chat-improved.js              # ⭐ Main chat logic
│   │   ├── AIChatInterface class
│   │   ├── UI creation methods
│   │   ├── Event handlers
│   │   ├── Message management
│   │   └── LocalStorage persistence
│   │
│   ├── css/
│   │   └── ai-chat-improved.css         # ⭐ Styling
│   │       ├── Trigger button styles
│   │       ├── Chat panel styles
│   │       ├── Message bubbles
│   │       ├── Animations
│   │       └── Dark mode support
│   │
│   └── ai-chat-standalone-demo.html     # ⭐ Demo page
│       ├── Test interface
│       ├── Feature showcase
│       └── Documentation
│
├── scripts/
│   ├── hot-reload-frontend.sh           # ⭐ Hot reload script
│   │   ├── Find container
│   │   ├── Copy files
│   │   └── Verify injection
│   │
│   └── inject-ai-chat.sh                # ⭐ Auto-injection
│       ├── Backup HTML files
│       ├── Inject CSS/JS tags
│       └── Verify success
│
└── Documentation/
    ├── AI_CHAT_README.md                # Main README
    ├── AI_CHAT_QUICKSTART.md            # Quick start
    ├── AI_CHAT_DEVELOPMENT_GUIDE.md     # Dev workflow
    ├── OPENAI_INTEGRATION_GUIDE.md      # OpenAI setup
    ├── AI_CHAT_SUMMARY.md               # Summary
    └── AI_CHAT_ARCHITECTURE.md          # This file
```

## 🔄 Data Flow

### Current Implementation (Frontend Only)

```
User Input
    │
    ▼
┌─────────────────────┐
│  Input Textarea     │
│  (User types)       │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  sendMessage()      │
│  • Validate input   │
│  • Add to UI        │
│  • Clear input      │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  addMessage()       │
│  • Create bubble    │
│  • Add to DOM       │
│  • Save to history  │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Show Typing        │
│  Indicator          │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  generateResponse() │
│  • Mock AI logic    │
│  • Keyword matching │
│  • Return response  │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  addMessage()       │
│  • Display AI msg   │
│  • Hide typing      │
│  • Update status    │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  localStorage       │
│  • Save history     │
│  • Persist data     │
└─────────────────────┘
```

### Future Implementation (With OpenAI)

```
User Input
    │
    ▼
Frontend (Browser)
    │
    │ fetch('/api/chat', {
    │   message: "...",
    │   history: [...],
    │   context: {...}
    │ })
    │
    ▼
Backend API (Python/Node.js)
    │
    │ Build prompt with:
    │ • System message
    │ • Chat history
    │ • Spreadsheet context
    │
    ▼
OpenAI API
    │
    │ GPT-4 processes:
    │ • User question
    │ • Spreadsheet data
    │ • Chat history
    │
    ▼
Backend API
    │
    │ Response with:
    │ • AI message
    │ • Token usage
    │ • Metadata
    │
    ▼
Frontend
    │
    │ Display:
    │ • AI response
    │ • Update UI
    │ • Save to history
    │
    ▼
User sees response
```

## 🎨 Component Hierarchy

```
AIChatInterface (Main Class)
│
├── Trigger Button
│   ├── Floating button (bottom right)
│   ├── Click handler → toggle()
│   └── Badge (notification count)
│
├── Chat Container
│   │
│   ├── Header
│   │   ├── Icon + Title
│   │   ├── Subtitle
│   │   └── Action Buttons
│   │       ├── Clear button
│   │       ├── Minimize button
│   │       └── Close button
│   │
│   ├── Messages Area
│   │   ├── Welcome Screen (initial)
│   │   │   ├── Icon
│   │   │   ├── Title
│   │   │   ├── Feature list
│   │   │   └── Example prompt
│   │   │
│   │   └── Message Bubbles
│   │       ├── User Messages
│   │       │   ├── Avatar (👤)
│   │       │   ├── Content
│   │       │   └── Timestamp
│   │       │
│   │       ├── AI Messages
│   │       │   ├── Avatar (🤖)
│   │       │   ├── Content
│   │       │   └── Timestamp
│   │       │
│   │       ├── System Messages
│   │       │   ├── Avatar (ℹ️)
│   │       │   ├── Content
│   │       │   └── Timestamp
│   │       │
│   │       └── Typing Indicator
│   │           ├── Avatar (🤖)
│   │           └── Animated dots
│   │
│   └── Input Area
│       ├── Quick Actions
│       │   ├── Get Selection button
│       │   ├── Formula Help button
│       │   └── Analyze Data button
│       │
│       ├── Input Wrapper
│       │   ├── Textarea (auto-resize)
│       │   └── Send Button
│       │
│       └── Footer
│           ├── Status indicator
│           └── Keyboard hint
│
└── Event Handlers
    ├── Keyboard shortcuts
    ├── Click handlers
    ├── Input handlers
    └── Scroll handlers
```

## 🔌 Integration Points

### Current (Standalone)
```
┌──────────────────┐
│  AI Chat JS      │
│  (Self-contained)│
└──────────────────┘
```

### With Collabora (Next Step)
```
┌──────────────────┐     ┌──────────────────┐
│  AI Chat JS      │────▶│  Collabora API   │
│                  │     │  • getSelection()│
│  • Get cell data │◀────│  • getCellValue()│
│  • Insert formula│     │  • setFormula()  │
└──────────────────┘     └──────────────────┘
```

### With OpenAI (Future)
```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  AI Chat JS      │────▶│  Backend API     │────▶│  OpenAI API      │
│                  │     │  (Flask/Express) │     │  (GPT-4)         │
│  • Send message  │     │  • Process req   │     │  • Generate      │
│  • Display resp  │◀────│  • Call OpenAI   │◀────│  • Return resp   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

## 🚀 Deployment Flow

### Development (Current)
```
1. Edit files locally
   ↓
2. Test standalone
   (python -m http.server)
   ↓
3. Hot reload to container
   (./scripts/hot-reload-frontend.sh)
   ↓
4. Test in Collabora
   (Hard refresh browser)
```

### Production (Future)
```
1. Build frontend
   (minify, bundle)
   ↓
2. Build Docker image
   (docker-compose build)
   ↓
3. Deploy containers
   (docker-compose up -d)
   ↓
4. Configure reverse proxy
   (nginx/traefik)
   ↓
5. Enable HTTPS
   (Let's Encrypt)
```

## 📊 State Management

```
AIChatInterface State
│
├── isVisible: boolean
│   └── Controls panel visibility
│
├── messages: Array<Message>
│   ├── role: 'user' | 'assistant' | 'system'
│   ├── content: string
│   └── timestamp: ISO string
│
├── isTyping: boolean
│   └── Shows/hides typing indicator
│
├── config: Object
│   ├── maxMessages: 100
│   ├── typingDelay: 1000
│   ├── animationDuration: 300
│   ├── autoScroll: true
│   ├── persistHistory: true
│   └── keyboardShortcut: 'Ctrl+Shift+A'
│
└── DOM References
    ├── container: HTMLElement
    ├── messagesContainer: HTMLElement
    ├── inputElement: HTMLTextAreaElement
    └── sendButton: HTMLButtonElement
```

## 🔐 Security Layers

```
Frontend
│
├── Input Sanitization
│   └── escapeHtml() method
│
├── XSS Protection
│   └── textContent (not innerHTML)
│
└── CORS Headers
    └── Configured in backend

Backend (Future)
│
├── Rate Limiting
│   └── Max requests per minute
│
├── Authentication
│   └── API key validation
│
├── Input Validation
│   └── Schema validation
│
└── Environment Variables
    └── API keys in .env
```

## 📈 Performance Optimizations

```
Frontend
│
├── Lazy Loading
│   └── Load only when needed
│
├── Debouncing
│   └── Auto-resize input
│
├── RequestAnimationFrame
│   └── Smooth scrolling
│
├── LocalStorage
│   └── Persist history
│
└── CSS Animations
    └── GPU-accelerated

Backend (Future)
│
├── Caching
│   └── Common responses
│
├── Streaming
│   └── Real-time responses
│
└── Connection Pooling
    └── Reuse connections
```

## 🎯 Key Design Decisions

### Why Floating Button?
- ✅ Always accessible
- ✅ Doesn't block content
- ✅ Familiar UX pattern
- ✅ Easy to toggle

### Why Right Panel?
- ✅ Natural reading flow
- ✅ Doesn't cover spreadsheet
- ✅ Standard chat position
- ✅ Mobile-friendly

### Why LocalStorage?
- ✅ Persist across sessions
- ✅ No backend needed
- ✅ Fast access
- ✅ Privacy-friendly

### Why Hot Reload?
- ✅ Saves 10+ min per change
- ✅ Faster iteration
- ✅ Better DX
- ✅ No rebuild needed

## 🔄 Future Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐          ┌──────▼──────┐
         │  Frontend 1 │          │  Frontend 2 │
         │  (Nginx)    │          │  (Nginx)    │
         └──────┬──────┘          └──────┬──────┘
                │                         │
                └────────────┬────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐          ┌──────▼──────┐
         │  Backend 1  │          │  Backend 2  │
         │  (Flask)    │          │  (Flask)    │
         └──────┬──────┘          └──────┬──────┘
                │                         │
                └────────────┬────────────┘
                             │
                    ┌────────▼────────┐
                    │   OpenAI API    │
                    └─────────────────┘
```

---

This architecture is designed to be:
- ✅ **Scalable** - Easy to add features
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Performant** - Optimized for speed
- ✅ **Secure** - Multiple security layers
- ✅ **Developer-Friendly** - Fast iteration cycle
