# OpenAI Integration Guide for AI Chat

## 🎯 Overview

This guide explains how to integrate OpenAI's API with your AI chat interface once the frontend is ready. We'll create a simple backend API that the frontend can call.

## 📋 Prerequisites

1. ✅ Frontend AI chat interface (already built!)
2. ⬜ OpenAI API key (get from https://platform.openai.com/api-keys)
3. ⬜ Backend API server (Python Flask or Node.js Express)

## 🏗️ Architecture

```
Frontend (Browser)
    ↓ HTTP Request
Backend API (Python/Node.js)
    ↓ OpenAI API Call
OpenAI GPT Model
    ↓ Response
Backend API
    ↓ HTTP Response
Frontend (Display to user)
```

## 🔧 Option 1: Python Backend (Recommended)

### Step 1: Install Dependencies

```bash
cd /Users/aryanpatel/Desktop/Skopeo
source .venv/bin/activate  # Use your existing venv

pip install openai flask flask-cors python-dotenv
```

### Step 2: Create Backend API

Create `src/controller/ai_chat_api.py`:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow requests from browser

# Set your OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Handle chat requests from the frontend
    """
    try:
        data = request.json
        user_message = data.get('message', '')
        chat_history = data.get('history', [])
        spreadsheet_context = data.get('context', {})
        
        # Build messages for OpenAI
        messages = [
            {
                "role": "system",
                "content": """You are an AI assistant specialized in helping users with spreadsheet operations. 
                You can help with:
                - Creating and explaining formulas (SUM, AVERAGE, VLOOKUP, IF, etc.)
                - Data analysis and insights
                - Chart and visualization recommendations
                - Cell formatting and organization
                - Spreadsheet best practices
                
                Always provide clear, concise answers with examples when relevant.
                When suggesting formulas, use Excel/LibreOffice Calc syntax."""
            }
        ]
        
        # Add spreadsheet context if available
        if spreadsheet_context:
            context_msg = f"Current spreadsheet context: {spreadsheet_context}"
            messages.append({"role": "system", "content": context_msg})
        
        # Add chat history (last 10 messages to save tokens)
        for msg in chat_history[-10:]:
            messages.append({
                "role": msg.get('role', 'user'),
                "content": msg.get('content', '')
            })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-4",  # or "gpt-3.5-turbo" for faster/cheaper
            messages=messages,
            temperature=0.7,
            max_tokens=500,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )
        
        assistant_message = response.choices[0].message.content
        
        return jsonify({
            'success': True,
            'message': assistant_message,
            'usage': {
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    """
    Handle streaming chat requests for real-time responses
    """
    try:
        data = request.json
        user_message = data.get('message', '')
        
        def generate():
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a spreadsheet AI assistant."},
                    {"role": "user", "content": user_message}
                ],
                stream=True
            )
            
            for chunk in response:
                if chunk.choices[0].delta.get('content'):
                    yield f"data: {chunk.choices[0].delta.content}\n\n"
        
        return app.response_class(generate(), mimetype='text/event-stream')
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'ai-chat-api'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### Step 3: Create Environment File

Create `.env` in project root:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

**⚠️ IMPORTANT:** Add `.env` to `.gitignore` to keep your API key secure!

### Step 4: Run the Backend

```bash
python src/controller/ai_chat_api.py
```

The API will be available at `http://localhost:5000`

## 🌐 Option 2: Node.js Backend

### Step 1: Install Dependencies

```bash
npm init -y
npm install express cors openai dotenv
```

### Step 2: Create Backend API

Create `src/controller/ai-chat-api.js`:

```javascript
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history, context } = req.body;
        
        const messages = [
            {
                role: 'system',
                content: 'You are an AI assistant specialized in spreadsheet operations.'
            }
        ];
        
        // Add history
        if (history) {
            messages.push(...history.slice(-10));
        }
        
        // Add current message
        messages.push({ role: 'user', content: message });
        
        const completion = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
        });
        
        res.json({
            success: true,
            message: completion.data.choices[0].message.content,
            usage: completion.data.usage
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', service: 'ai-chat-api' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`AI Chat API running on port ${PORT}`);
});
```

### Step 3: Run the Backend

```bash
node src/controller/ai-chat-api.js
```

## 🔌 Frontend Integration

Update `ai-chat-improved.js` to call your backend:

```javascript
// Replace the generateResponse method in ai-chat-improved.js

async generateResponse(userMessage) {
    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                history: this.messages,
                context: this.getSpreadsheetContext()
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.message;
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        console.error('AI API Error:', error);
        return `Sorry, I encountered an error: ${error.message}. Please try again.`;
    }
}

getSpreadsheetContext() {
    // TODO: Get actual spreadsheet data from Collabora
    return {
        selectedCells: 'A1:A10',
        currentSheet: 'Sheet1',
        // Add more context as needed
    };
}
```

## 🐳 Docker Integration

To run the backend in Docker alongside your existing containers:

### Update `docker-compose.yml`:

```yaml
services:
  nextcloud:
    # ... existing config ...

  collabora_online:
    # ... existing config ...

  ai_chat_api:
    build:
      context: .
      dockerfile: Dockerfile.ai-api
    container_name: ai_chat_api
    restart: always
    ports:
      - "5000:5000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./src:/app/src
```

### Create `Dockerfile.ai-api`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

EXPOSE 5000

CMD ["python", "src/controller/ai_chat_api.py"]
```

### Update `requirements.txt`:

```
openai>=1.0.0
flask>=3.0.0
flask-cors>=4.0.0
python-dotenv>=1.0.0
```

## 💰 Cost Estimation

OpenAI API pricing (as of 2024):

- **GPT-4**: ~$0.03 per 1K prompt tokens, ~$0.06 per 1K completion tokens
- **GPT-3.5-turbo**: ~$0.0015 per 1K prompt tokens, ~$0.002 per 1K completion tokens

**Recommendation:** Start with GPT-3.5-turbo for development, upgrade to GPT-4 for production.

## 🔒 Security Best Practices

1. **Never expose API key in frontend code**
2. **Use environment variables** for sensitive data
3. **Add rate limiting** to prevent abuse
4. **Implement authentication** for production
5. **Validate and sanitize** all user inputs
6. **Use HTTPS** in production

### Example Rate Limiting (Python):

```bash
pip install flask-limiter
```

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/chat', methods=['POST'])
@limiter.limit("10 per minute")
def chat():
    # ... existing code ...
```

## 🧪 Testing

### Test the Backend API:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a SUM formula for column A",
    "history": [],
    "context": {}
  }'
```

### Expected Response:

```json
{
  "success": true,
  "message": "To create a SUM formula for column A, use: =SUM(A:A) ...",
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 67,
    "total_tokens": 112
  }
}
```

## 📊 Monitoring & Logging

Add logging to track usage and errors:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ai_chat_api.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

@app.route('/api/chat', methods=['POST'])
def chat():
    logger.info(f"Chat request received: {request.json.get('message', '')[:50]}...")
    # ... rest of code ...
    logger.info(f"Response sent. Tokens used: {response.usage.total_tokens}")
```

## 🚀 Deployment Checklist

- [ ] Set up OpenAI API key securely
- [ ] Test API locally
- [ ] Add rate limiting
- [ ] Implement error handling
- [ ] Add logging and monitoring
- [ ] Set up HTTPS
- [ ] Configure CORS properly
- [ ] Add authentication (if needed)
- [ ] Test with frontend
- [ ] Deploy backend
- [ ] Update frontend API endpoint
- [ ] Monitor costs and usage

## 🎓 Advanced Features

### 1. Streaming Responses

For real-time typing effect:

```javascript
async function streamChat(message) {
    const response = await fetch('http://localhost:5000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // Update UI with chunk
        console.log(chunk);
    }
}
```

### 2. Function Calling

Let AI execute spreadsheet operations:

```python
functions = [
    {
        "name": "insert_formula",
        "description": "Insert a formula into a cell",
        "parameters": {
            "type": "object",
            "properties": {
                "cell": {"type": "string", "description": "Cell reference (e.g., A1)"},
                "formula": {"type": "string", "description": "The formula to insert"}
            },
            "required": ["cell", "formula"]
        }
    }
]

response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=messages,
    functions=functions,
    function_call="auto"
)
```

### 3. Context-Aware Responses

Include spreadsheet data in prompts:

```python
context = f"""
Current spreadsheet:
- Sheet: {sheet_name}
- Selected cells: {selected_range}
- Cell values: {cell_values}
- Active formulas: {formulas}
"""
```

## 📚 Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/pricing)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Express.js Documentation](https://expressjs.com/)

## 🆘 Troubleshooting

### Issue: CORS errors
**Solution**: Ensure `flask-cors` is installed and configured properly

### Issue: API key not working
**Solution**: Check that `.env` file is in the correct location and loaded

### Issue: Slow responses
**Solution**: Use GPT-3.5-turbo instead of GPT-4, or implement caching

### Issue: High costs
**Solution**: Add rate limiting, use shorter prompts, cache common responses

---

**Next Steps:**
1. Get your OpenAI API key
2. Choose Python or Node.js backend
3. Set up the backend API
4. Update frontend to call the API
5. Test end-to-end
6. Deploy!
