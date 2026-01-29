# AI Usage Guide - Automatic Translator API

This guide is designed to help AI models understand and use the Automatic Translator API effectively.

## Quick Start

### Server Information
- **Default URL**: `http://localhost:3008`
- **Protocol**: REST API (HTTP/JSON)
- **Authentication**: None required for local use
- **CORS**: Enabled for cross-origin requests

## API Endpoints

### 1. Health Check
```http
GET /health
```
Returns server status and available providers.

**Response Example:**
```json
{
  "status": "ok",
  "providers": ["GoogleTranslate", "Reverso", "Papago", "LibreTranslate", "Lingva"],
  "timestamp": "2026-01-27T18:05:08.123Z"
}
```

### 2. Get Available Providers
```http
GET /providers
```
Lists only currently available (not rate-limited) providers.

**Response Example:**
```json
{
  "providers": ["GoogleTranslate", "Reverso", "LibreTranslate", "Lingva"]
}
```

### 3. Get All Providers with Status
```http
GET /providers/all
```
Lists all providers with their availability status.

**Response Example:**
```json
{
  "providers": [
    {"name": "GoogleTranslate", "available": true},
    {"name": "Reverso", "available": true},
    {"name": "MyMemory", "available": false},
    {"name": "LibreTranslate", "available": true}
  ],
  "total": 8,
  "available": 5
}
```

### 4. Translate Text (Main Endpoint)
```http
POST /translate
Content-Type: application/json

{
  "text": "Hello world",
  "targetLanguage": "es",
  "sourceLanguage": "en",  // optional, defaults to "auto"
  "chunkSize": 300,        // optional, defaults to 300
  "provider": "Reverso"    // optional, for specific provider
}
```

**Response Example:**
```json
{
  "success": true,
  "translatedText": "Hola mundo",
  "provider": "Reverso",
  "chunks": 1
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "All providers failed or rate limited"
}
```

### 5. Batch Translation
```http
POST /translate/batch
Content-Type: application/json

{
  "texts": ["Hello", "Goodbye", "Thank you"],
  "targetLanguage": "fr",
  "sourceLanguage": "en"  // optional
}
```

**Response Example:**
```json
{
  "success": true,
  "translations": [
    {
      "original": "Hello",
      "translated": "Bonjour",
      "provider": "GoogleTranslate"
    },
    {
      "original": "Goodbye",
      "translated": "Au revoir",
      "provider": "Reverso"
    }
  ]
}
```

### 6. Reset Provider Status
```http
POST /providers/reset
```
Resets all providers to available state (useful after rate limits expire).

**Response Example:**
```json
{
  "success": true,
  "message": "All providers have been reset",
  "availableProviders": 8
}
```

## Language Codes

### Common Language Codes
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese (Simplified)
- `ar` - Arabic
- `hi` - Hindi
- `tr` - Turkish
- `nl` - Dutch
- `pl` - Polish
- `sv` - Swedish
- `vi` - Vietnamese
- `th` - Thai
- `id` - Indonesian

Use `"auto"` as `sourceLanguage` for automatic language detection.

## Provider Information

### Working Free Providers (No API Key Required)

1. **GoogleTranslate** ✅
   - 100+ languages
   - ~20,000 chars/day
   - Best overall quality

2. **Reverso** ✅
   - 15+ major languages
   - ~10,000 chars/day
   - Excellent context-aware translations

3. **Papago** ✅ (May be discontinued)
   - 13 languages (specializes in Asian languages)
   - Best for Korean, Japanese, Chinese translations

4. **LibreTranslate** ✅
   - 30+ languages
   - ~60,000 chars/day (multiple instances)
   - Open-source Argos Translate models

5. **Lingva** ✅
   - 100+ languages (Google Translate proxy)
   - ~50,000 chars/day
   - Multiple instance fallback

6. **MyMemory** ⚠️
   - 5,000 chars/day (anonymous)
   - 50,000 chars/day (with email parameter)
   - May be rate-limited

### Providers Requiring API Keys

7. **HuggingFace** (requires `HUGGINGFACE_API_KEY`)
8. **Yandex** (requires `YANDEX_API_KEY`)

## Usage Examples

### Example 1: Simple Translation
```bash
curl -X POST http://localhost:3008/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "targetLanguage": "es"
  }'
```

### Example 2: Specific Provider
```bash
curl -X POST http://localhost:3008/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Good morning",
    "targetLanguage": "ko",
    "provider": "Papago"
  }'
```

### Example 3: Long Text (Automatic Chunking)
```bash
curl -X POST http://localhost:3008/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Very long text that will be automatically split into 300-character chunks...",
    "targetLanguage": "fr",
    "sourceLanguage": "en"
  }'
```

### Example 4: Batch Translation
```bash
curl -X POST http://localhost:3008/translate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello", "Goodbye", "Thank you"],
    "targetLanguage": "de"
  }'
```

## Best Practices for AI Models

### 1. **Check Provider Availability First**
Always check `/providers/all` to see which providers are currently available before making translation requests.

### 2. **Handle Rate Limits Gracefully**
- The API automatically falls back to other providers when one is rate-limited
- If all providers fail, wait and retry after 1-24 hours
- Use `/providers/reset` endpoint after waiting

### 3. **Choose Right Provider for Language Pair**
- Use **Papago** for Asian languages (Korean, Japanese, Chinese)
- Use **Reverso** for European languages with context
- Use **GoogleTranslate** or **Lingva** for best coverage

### 4. **Optimize Request Size**
- API automatically chunks text at 300 characters
- Chunking preserves sentence boundaries
- For very large texts, consider splitting manually for better control

### 5. **Batch When Possible**
- Use `/translate/batch` for multiple short texts
- More efficient than individual requests
- Each text may use a different provider

### 6. **Error Handling**
```javascript
const response = await fetch('http://localhost:3008/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Hello world",
    targetLanguage: "es"
  })
});

const data = await response.json();

if (data.success) {
  console.log(`Translated: ${data.translatedText}`);
  console.log(`Provider used: ${data.provider}`);
  console.log(`Chunks processed: ${data.chunks}`);
} else {
  console.error(`Error: ${data.error}`);
  // Handle error: retry, use different provider, or wait
}
```

## Rate Limits Summary

**Total Free Capacity (No API Keys)**:
- **Conservative**: ~140,000 characters/day
- **With email in MyMemory**: ~190,000 characters/day
- **Monthly**: ~4.2M - 5.7M characters/month

**Individual Provider Limits**:
- MyMemory: 5,000-50,000 chars/day
- GoogleTranslate: ~20,000 chars/day
- Reverso: ~10,000 chars/day
- LibreTranslate: ~60,000 chars/day (combined instances)
- Lingva: ~50,000 chars/day (combined instances)

## Common Issues and Solutions

### Issue 1: All Providers Unavailable
**Symptom**: `error: "All providers failed or rate limited"`
**Solution**: 
- Wait 1-24 hours for rate limits to reset
- Call `/providers/reset` endpoint
- Add API keys for premium providers

### Issue 2: Specific Provider Not Working
**Symptom**: `error: "Provider 'X' rate limit exceeded"`
**Solution**:
- Don't specify provider, let API choose automatically
- Use different provider explicitly
- Check `/providers/all` for available alternatives

### Issue 3: Translation Quality Issues
**Solution**:
- Use `"provider": "Reverso"` for context-aware translations
- Use `"provider": "GoogleTranslate"` for best overall quality
- Use `"provider": "Papago"` for Asian languages

### Issue 4: Server Not Running
**Symptom**: Connection refused or timeout
**Solution**:
- Start server: `npm start`
- Check if running on correct port (default: 3008)
- Verify with: `curl http://localhost:3008/health`

## Advanced Usage

### Custom Chunk Size
For specific use cases where sentence boundaries matter:
```json
{
  "text": "Long text...",
  "targetLanguage": "fr",
  "chunkSize": 500  // Larger chunks, fewer requests
}
```

### Forcing Auto-Detection
```json
{
  "text": "Bonjour le monde",
  "sourceLanguage": "auto",  // Will detect as French
  "targetLanguage": "en"
}
```

### Using Specific Provider Without Fallback
```json
{
  "text": "Hello",
  "targetLanguage": "ko",
  "provider": "Papago"  // Will fail if Papago is unavailable
}
```

## Integration Examples

### Python
```python
import requests

def translate_text(text, target_lang, source_lang="auto"):
    response = requests.post(
        "http://localhost:3008/translate",
        json={
            "text": text,
            "targetLanguage": target_lang,
            "sourceLanguage": source_lang
        }
    )
    data = response.json()
    if data["success"]:
        return data["translatedText"]
    else:
        raise Exception(data["error"])

# Usage
result = translate_text("Hello world", "es")
print(result)  # "Hola mundo"
```

### JavaScript/Node.js
```javascript
async function translateText(text, targetLang, sourceLang = "auto") {
  const response = await fetch("http://localhost:3008/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      targetLanguage: targetLang,
      sourceLanguage: sourceLang
    })
  });
  
  const data = await response.json();
  if (data.success) {
    return data.translatedText;
  } else {
    throw new Error(data.error);
  }
}

// Usage
translateText("Hello world", "es")
  .then(result => console.log(result))  // "Hola mundo"
  .catch(error => console.error(error));
```

### cURL
```bash
# Simple translation
curl -X POST http://localhost:3008/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","targetLanguage":"es"}'

# Pretty print with jq
curl -s -X POST http://localhost:3008/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","targetLanguage":"es"}' | jq .
```

## Monitoring and Logging

The API provides detailed console logging:
- Request timestamps
- Text length and target language
- Provider attempts and failures
- Chunking information
- Translation results
- Error messages

Monitor the server console output for debugging and understanding translation flow.

## Support and Documentation

- **Full API Documentation**: See `API.md`
- **Contributing Guide**: See `CONTRIBUTING.md`
- **GitHub Repository**: https://github.com/LucaRM/automatic-translator
- **Example CLI Tool**: See `examples/translate-cli.js`

## Summary for AI Models

**Key Points**:
1. ✅ **5 working free providers** without API keys
2. 🔄 **Automatic fallback** when providers fail
3. 📦 **Automatic chunking** for long texts (300 char default)
4. 🌍 **100+ languages** supported
5. 💰 **~140k-190k chars/day** free capacity
6. 🚀 **Simple REST API** - just POST JSON
7. ⚡ **No authentication** required for local use
8. 🔧 **Self-hosted** - complete control

**Quick Translation**:
```bash
curl -X POST http://localhost:3008/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Your text","targetLanguage":"es"}'
```

That's all you need to know to start translating!
