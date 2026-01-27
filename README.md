# Automatic Translator

A TypeScript npm package for automatic translation with AI model fallback support. Handles large texts by chunking them and automatically switches between multiple free AI translation providers when rate limits are reached.

## Features

- 🔄 **Automatic Chunking**: Breaks large texts into 300-character chunks (configurable)
- 🤖 **11 AI Providers**: 6 Free APIs (MyMemory, LibreTranslate, HuggingFace, Lingva, Google Translate, Yandex) + 5 Premium models (Gemini, OpenAI, Anthropic Claude, Groq, DeepL)
- 🔁 **Smart Fallback**: Automatically switches providers when rate limits are hit
- 📦 **Batch Translation**: Translates chunks in sequence and reassembles results
- 🎯 **TypeScript**: Full type safety and IntelliSense support
- 🌍 **Multiple Languages**: Supports various language pairs
- 🌐 **REST API Server**: Run as a local API server with Express

## Installation

```bash
npm install automatic-translator
```

## Usage Options

### 1. As a Library (npm package)

Use in your Node.js/TypeScript projects:

```typescript
import { AutomaticTranslator } from 'automatic-translator';
const translator = new AutomaticTranslator();
```

### 2. As a REST API Server

Run locally as an API server:

```bash
npm install
npm run build
npm start
```

API available at `http://localhost:3000`. See [API.md](API.md) for complete API documentation.

## Library Usage

```typescript
import { AutomaticTranslator } from 'automatic-translator';

const translator = new AutomaticTranslator();

async function translate() {
  const result = await translator.translate(
    'Hello world! This is a long text that will be automatically chunked and translated.',
    {
      targetLanguage: 'es', // Spanish
      sourceLanguage: 'en'  // English (optional, auto-detect if omitted)
    }
  );

  console.log(result.translatedText);
  console.log(`Translated using: ${result.provider}`);
  console.log(`Number of chunks: ${result.chunks}`);
}

translate();
```

## Library Usage

### Basic Translation

```typescript
import { AutomaticTranslator } from 'automatic-translator';

const translator = new AutomaticTranslator();

const result = await translator.translate('Hello world', {
  targetLanguage: 'es'
});

console.log(result.translatedText); // "Hola mundo"
```

### Custom Chunk Size

```typescript
const result = await translator.translate('Your long text here...', {
  targetLanguage: 'fr',
  sourceLanguage: 'en',
  chunkSize: 500 // Custom chunk size (default: 300)
});
```

### Using a Specific Provider (No Fallback)

```typescript
// Use only Gemini - will fail if rate limit is hit (no fallback)
const result = await translator.translate('Hello world', {
  targetLanguage: 'es',
  sourceLanguage: 'en',
  specificProvider: 'Gemini' // Only use this provider
});

// Provider names: 'MyMemory', 'LibreTranslate', 'HuggingFace', 'Lingva',
//                'GoogleTranslate', 'Yandex', 'Gemini', 'OpenAI', 
//                'Anthropic', 'Groq', 'DeepL'
```

### Using Specific Providers

```typescript
import { 
  AutomaticTranslator, 
  LibreTranslateProvider,
  MyMemoryProvider,
  GeminiProvider,
  OpenAIProvider
} from 'automatic-translator';

// Use only specific providers (free APIs only)
const translator = new AutomaticTranslator([
  new MyMemoryProvider(),
  new LibreTranslateProvider('https://your-instance.com/translate')
]);

// Or use AI models with API keys
const translatorWithAI = new AutomaticTranslator([
  new MyMemoryProvider(),
  new GeminiProvider('your-gemini-api-key'),
  new OpenAIProvider('your-openai-api-key', 'gpt-4'),
  new GroqProvider('your-groq-api-key')
]);
```

### Adding Custom Providers

```typescript
import { AIProvider, TranslationOptions } from 'automatic-translator';

class MyCustomProvider implements AIProvider {
  name = 'MyCustom';
  
  isAvailable(): boolean {
    return true;
  }
  
  async translate(text: string, options: TranslationOptions): Promise<string> {
    // Your custom translation logic
    return translatedText;
  }
}

const translator = new AutomaticTranslator();
translator.addProvider(new MyCustomProvider());
```

### Managing Providers

```typescript
// Check available providers
const available = translator.getAvailableProviders();
console.log('Available providers:', available);

// Reset providers (clears rate limit flags)
translator.resetProviders();
```

## API Reference

### `AutomaticTranslator`

Main class for translation operations.

#### Constructor

```typescript
constructor(providers?: AIProvider[])
```

- `providers`: Optional array of AI providers (defaults to MyMemory, LibreTranslate, HuggingFace). Add AI model providers with API keys manually.

#### Methods

##### `translate(text: string, options: TranslationOptions): Promise<TranslationResult>`

Translates text with automatic chunking and provider fallback.

- **Parameters:**
  - `text`: The text to translate
  - `options`: Translation options
    - `targetLanguage` (required): Target language code (e.g., 'es', 'fr', 'de') - **Required**
    - `sourceLanguage` (optional): Source language code (auto-detect if omitted)
    - `chunkSize` (optional): Maximum characters per chunk (default: 300)
    - `specificProvider` (optional): Use only this provider (e.g., 'Gemini', 'OpenAI'). No fallback - fails if this provider fails.

- **Returns:** `TranslationResult`
  - `translatedText`: The full translated text
  - `provider`: Name of the provider that completed the translation
  - `chunks`: Number of chunks the text was divided into

##### `addProvider(provider: AIProvider): void`

Adds a custom AI provider to the translator.

##### `getAvailableProviders(): string[]`

Returns array of currently available provider names.

##### `resetProviders(): void`

Resets the provider index to start from the beginning.

### Built-in Providers

#### Free Translation APIs (No API Key Required)

##### `MyMemoryProvider`

Free translation API with no API key required.

```typescript
new MyMemoryProvider()
```

##### `LibreTranslateProvider`

Open-source translation provider.

```typescript
new LibreTranslateProvider(apiUrl?: string, apiKey?: string)
```

- `apiUrl`: Custom API URL (default: 'https://libretranslate.de/translate')
- `apiKey`: Optional API key

##### `HuggingFaceProvider`

Translation using HuggingFace models.

```typescript
new HuggingFaceProvider(apiKey?: string)
```

- `apiKey`: Optional HuggingFace API key

##### `LingvaProvider`

Privacy-focused translation service (Google Translate alternative).

```typescript
new LingvaProvider(apiUrl?: string)
```

- `apiUrl`: Custom Lingva instance URL (default: 'https://lingva.ml/api/v1')

##### `GoogleTranslateProvider`

Google Translate unofficial free API.

```typescript
new GoogleTranslateProvider()
```

No API key required.

##### `YandexProvider`

Yandex Translate service.

```typescript
new YandexProvider()
```

No API key required.

#### AI Models (API Key Required)

##### `GeminiProvider`

Google's Gemini AI model for translation.

```typescript
new GeminiProvider(apiKey: string)
```

- `apiKey`: Google AI API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

##### `OpenAIProvider`

OpenAI GPT models for translation.

```typescript
new OpenAIProvider(apiKey: string, model?: string)
```

- `apiKey`: OpenAI API key
- `model`: Model to use (default: 'gpt-3.5-turbo', also supports 'gpt-4', etc.)

##### `AnthropicProvider`

Anthropic Claude for translation.

```typescript
new AnthropicProvider(apiKey: string, model?: string)
```

- `apiKey`: Anthropic API key
- `model`: Model to use (default: 'claude-3-haiku-20240307')

##### `GroqProvider`

Groq's ultra-fast LLM inference for translation.

```typescript
new GroqProvider(apiKey: string, model?: string)
```

- `apiKey`: Groq API key
- `model`: Model to use (default: 'llama-3.1-70b-versatile')

##### `DeepLProvider`

DeepL professional translation service.

```typescript
new DeepLProvider(apiKey: string, useFreeApi?: boolean)
```

- `apiKey`: DeepL API key
- `useFreeApi`: Use free API endpoint (default: true)

### Error Handling

```typescript
import { TranslationError, ErrorType } from 'automatic-translator';

try {
  const result = await translator.translate(text, options);
} catch (error) {
  if (error instanceof TranslationError) {
    console.error(`Error from ${error.provider}: ${error.message}`);
    console.error(`Error type: ${error.type}`);
  }
}
```

**Error Types:**
- `RATE_LIMIT`: Provider rate limit exceeded
- `API_ERROR`: API request failed
- `NETWORK_ERROR`: Network connection issue
- `UNKNOWN`: Unexpected error

## How It Works

1. **Chunking**: The input text is divided into chunks of ~300 characters, breaking at sentence or word boundaries when possible
2. **Translation**: Each chunk is sent to the current AI provider (free APIs by default, or premium AI models if configured)
3. **Fallback**: If a provider returns a rate limit error, the system automatically switches to the next provider
4. **Reassembly**: Translated chunks are joined back into a complete text

## Provider Strategy

The package includes **11 different providers** organized in two tiers:

**Free Tier (Default - No API Keys Required):**
- MyMemory - Free translation API
- LibreTranslate - Open-source translation
- HuggingFace - ML-based translation
- Lingva - Privacy-focused Google Translate alternative
- Google Translate - Unofficial free API
- Yandex Translate - Russian-based translation service

**AI Models Tier (Requires API Keys):**
- Google Gemini - Latest AI from Google
- OpenAI GPT - ChatGPT models
- Anthropic Claude - Powerful reasoning
- Groq - Ultra-fast inference
- DeepL - Professional translation

By default, the translator uses only free providers. You can add AI model providers by passing them to the constructor with your API keys.

## Language Codes

Common language codes:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run as API server
npm start

# Development mode (rebuild + start)
npm run dev

# Run tests (when available)
npm test
```

## API Server

The package can run as a REST API server. See [API.md](API.md) for complete documentation.

**Quick Start:**
```bash
cp .env.example .env  # Configure API keys (optional)
npm run build
npm start
```

**API Endpoints:**
- `GET /health` - Health check
- `GET /providers` - List available providers
- `GET /providers/all` - List all providers with availability status
- `POST /translate` - Translate text
- `POST /translate/batch` - Batch translation
- `POST /providers/reset` - Reset providers

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

If you find this project helpful, please give it a ⭐️ on GitHub!
