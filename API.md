# API Server Usage

This guide covers running the automatic translator as a local REST API server.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment (optional):**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Build and start the server:**
   ```bash
   npm run build
   npm start
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "providers": ["MyMemory", "LibreTranslate", "HuggingFace"],
  "timestamp": "2026-01-27T10:00:00.000Z"
}
```

### List Available Providers
```bash
GET /providers
```

**Response:**
```json
{
  "providers": ["MyMemory", "LibreTranslate", "HuggingFace", "Gemini"]
}
```

### List All Providers with Status
```bash
GET /providers/all
```

**Response:**
```json
{
  "providers": [
    { "name": "MyMemory", "available": true },
    { "name": "LibreTranslate", "available": true },
    { "name": "HuggingFace", "available": true },
    { "name": "Lingva", "available": true },
    { "name": "GoogleTranslate", "available": true },
    { "name": "Yandex", "available": true },
    { "name": "Gemini", "available": true },
    { "name": "OpenAI", "available": true },
    { "name": "Anthropic", "available": true },
    { "name": "Groq", "available": true },
    { "name": "DeepL", "available": true }
  ],
  "total": 11,
  "available": 11
}
```

**Note:** 
- All providers start as `available: true` by default
- A provider becomes `available: false` only after hitting a rate limit during actual translation requests
- Providers without API keys configured won't appear in the list (e.g., if you don't set `GEMINI_API_KEY`, Gemini won't be in the array)
- Free providers (MyMemory, LibreTranslate, HuggingFace, Lingva, GoogleTranslate, Yandex) always appear as they don't require API keys

### Translate Text
```bash
POST /translate
Content-Type: application/json

{
  "text": "Hello world",
  "targetLanguage": "es",
  "sourceLanguage": "en",
  "chunkSize": 300,
  "provider": "Gemini"
}
```

**Response:**
```json
{
  "success": true,
  "translatedText": "Hola mundo",
  "provider": "Gemini",
  "chunks": 1
}
```

**Note:** 
- `sourceLanguage` is optional (auto-detect if omitted)
- `provider` is optional. If specified, only that provider will be used (no fallback). If it fails or hits rate limit, the request will fail.
- `targetLanguage` is **required**

### Batch Translation
```bash
POST /translate/batch
Content-Type: application/json

{
  "texts": ["Hello", "Good morning", "Thank you"],
  "targetLanguage": "es",
  "sourceLanguage": "en",
  "provider": "OpenAI"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "translatedText": "Hola",
      "provider": "MyMemory",
      "chunks": 1
    },
    {
      "translatedText": "Buenos días",
      "provider": "MyMemory",
      "chunks": 1
    },
    {
      "translatedText": "Gracias",
      "provider": "MyMemory",
      "chunks": 1
    }
  ]
}
```

### Reset Providers
```bash
POST /providers/reset
```

**Response:**
```json
{
  "success": true,
  "message": "Providers reset successfully",
  "providers": ["MyMemory", "LibreTranslate", "HuggingFace"]
}
```

## Request Parameters

### Translation Options

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text to translate |
| `targetLanguage` | string | Yes | Target language code (e.g., 'es', 'fr') - **Required** |
| `sourceLanguage` | string | No | Source language code (auto-detect if omitted) |
| `chunkSize` | number | No | Maximum characters per chunk (default: 300) |
| `provider` | string | No | Specific provider to use. Options: 'MyMemory', 'LibreTranslate', 'HuggingFace', 'Lingva', 'GoogleTranslate', 'Yandex', 'Gemini', 'OpenAI', 'Anthropic', 'Groq', 'DeepL'. If specified, no fallback occurs - request fails if this provider fails. |

## Environment Variables

Configure API keys in `.env` file:

```bash
# Server Configuration
PORT=3000

# Free API Providers (Optional)
HUGGINGFACE_API_KEY=your_key_here

# AI Model Providers (Optional)
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-3.5-turbo

ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-3-haiku-20240307

GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.1-70b-versatile

DEEPL_API_KEY=your_key_here
DEEPL_USE_FREE_API=true
```

## Example Usage

### Using curl

```bash
# Simple translation
curl -X POST http://localhost:3000/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "targetLanguage": "es"
  }'

# With source language
curl -X POST http://localhost:3000/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "targetLanguage": "fr",
    "sourceLanguage": "en"
  }'

# With specific provider (no fallback)
curl -X POST http://localhost:3000/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "targetLanguage": "es",
    "provider": "Gemini"
  }'

# Batch translation
curl -X POST http://localhost:3000/translate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello", "Good morning"],
    "targetLanguage": "es"
  }'
```

### Using JavaScript/Fetch

```javascript
// Simple translation
const response = await fetch('http://localhost:3000/translate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Hello world',
    targetLanguage: 'es'
  })
});

const result = await response.json();
console.log(result.translatedText);
```

### Using Python

```python
import requests

# Simple translation
response = requests.post('http://localhost:3000/translate', json={
    'text': 'Hello world',
    'targetLanguage': 'es'
})

result = response.json()
print(result['translatedText'])
```

## Docker Support (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t automatic-translator .
docker run -p 3000:3000 --env-file .env automatic-translator
```

## Development Mode

For development with auto-rebuild:

```bash
npm run dev
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error (translation failed)

Error response format:
```json
{
  "error": "Error message",
  "success": false
}
```

## Rate Limiting

The translator automatically handles rate limits by switching to alternative providers. If all providers are exhausted, you'll receive a 500 error. Use the `/providers/reset` endpoint to reset provider availability.

## Security Notes

- Never commit `.env` file to version control
- Use environment variables for API keys
- Consider implementing API authentication for production
- Add rate limiting middleware for public deployments
- Use HTTPS in production environments
