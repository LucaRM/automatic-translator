import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AutomaticTranslator } from './translator';
import { 
  MyMemoryProvider, 
  LibreTranslateProvider, 
  HuggingFaceProvider,
  LingvaProvider,
  GoogleTranslateProvider,
  YandexProvider,
  ReversoProvider,
  PapagoProvider,
  GeminiProvider,
  OpenAIProvider,
  AnthropicProvider,
  GroqProvider,
  DeepLProvider
} from './index';
import { AIProvider, TranslationOptions } from './types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize providers based on available API keys
function initializeProviders(): AIProvider[] {
  const providers: AIProvider[] = [
    new GoogleTranslateProvider(),
    new ReversoProvider(),
    new PapagoProvider(),
    new MyMemoryProvider(),
    new LibreTranslateProvider(),
    new LingvaProvider(),
    new HuggingFaceProvider(process.env.HUGGINGFACE_API_KEY),
    new YandexProvider()
  ];

  // Add AI model providers if API keys are available
  if (process.env.GEMINI_API_KEY) {
    providers.push(new GeminiProvider(process.env.GEMINI_API_KEY));
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push(new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL));
  }
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push(new AnthropicProvider(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_MODEL));
  }
  if (process.env.GROQ_API_KEY) {
    providers.push(new GroqProvider(process.env.GROQ_API_KEY, process.env.GROQ_MODEL));
  }
  if (process.env.DEEPL_API_KEY) {
    const useFreeApi = process.env.DEEPL_USE_FREE_API !== 'false';
    providers.push(new DeepLProvider(process.env.DEEPL_API_KEY, useFreeApi));
  }

  return providers;
}

const translator = new AutomaticTranslator(initializeProviders());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  console.log(`[${new Date().toISOString()}] GET /health`);
  res.json({ 
    status: 'ok', 
    providers: translator.getAvailableProviders(),
    timestamp: new Date().toISOString()
  });
});

// Get available providers
app.get('/providers', (req: Request, res: Response) => {
  console.log(`[${new Date().toISOString()}] GET /providers`);
  const providers = translator.getAvailableProviders();
  console.log(`  → Available providers: ${providers.join(', ')}`);
  res.json({ 
    providers
  });
});

// Get all providers with status
app.get('/providers/all', (req: Request, res: Response) => {
  console.log(`[${new Date().toISOString()}] GET /providers/all`);
  const allProviders = translator.getAllProvidersInfo();
  const availableCount = allProviders.filter(p => p.available).length;
  console.log(`  → Total: ${allProviders.length}, Available: ${availableCount}`);
  allProviders.forEach(p => {
    console.log(`    - ${p.name}: ${p.available ? '✓' : '✗'}`);
  });
  res.json({ 
    providers: allProviders,
    total: allProviders.length,
    available: availableCount
  });
});

// Translation endpoint
app.post('/translate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { text, targetLanguage, sourceLanguage, chunkSize, provider } = req.body;

    console.log(`\n[${new Date().toISOString()}] POST /translate`);
    console.log(`  → Text length: ${text?.length || 0} characters`);
    console.log(`  → Target: ${targetLanguage}${sourceLanguage ? `, Source: ${sourceLanguage}` : ' (auto-detect)'}`);
    if (provider) console.log(`  → Specific provider: ${provider}`);

    // Validation
    if (!text || typeof text !== 'string') {
      console.log(`  ✗ Validation failed: Text is required`);
      return res.status(400).json({ 
        error: 'Text is required and must be a string' 
      });
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      console.log(`  ✗ Validation failed: targetLanguage is required`);
      return res.status(400).json({ 
        error: 'targetLanguage is required and must be a string' 
      });
    }

    const options: TranslationOptions = {
      targetLanguage,
      ...(sourceLanguage && { sourceLanguage }),
      ...(chunkSize && { chunkSize: parseInt(chunkSize) }),
      ...(provider && { specificProvider: provider })
    };

    console.log(`  → Starting translation...`);
    const result = await translator.translate(text, options);
    const duration = Date.now() - startTime;

    console.log(`  ✓ Translation completed in ${duration}ms`);
    console.log(`  → Provider used: ${result.provider}`);
    console.log(`  → Chunks processed: ${result.chunks}`);
    console.log(`  → Output length: ${result.translatedText.length} characters`);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`  ✗ Translation failed after ${duration}ms:`, error.message);
    res.status(500).json({ 
      error: error.message || 'Translation failed',
      success: false
    });
  }
});

// Batch translation endpoint
app.post('/translate/batch', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { texts, targetLanguage, sourceLanguage, chunkSize, provider } = req.body;

    console.log(`\n[${new Date().toISOString()}] POST /translate/batch`);
    console.log(`  → Batch size: ${texts?.length || 0} texts`);
    console.log(`  → Target: ${targetLanguage}${sourceLanguage ? `, Source: ${sourceLanguage}` : ' (auto-detect)'}`);
    if (provider) console.log(`  → Specific provider: ${provider}`);

    // Validation
    if (!Array.isArray(texts)) {
      console.log(`  ✗ Validation failed: texts must be an array`);
      return res.status(400).json({ 
        error: 'texts must be an array of strings' 
      });
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      console.log(`  ✗ Validation failed: targetLanguage is required`);
      return res.status(400).json({ 
        error: 'targetLanguage is required and must be a string' 
      });
    }

    const options: TranslationOptions = {
      targetLanguage,
      ...(sourceLanguage && { sourceLanguage }),
      ...(chunkSize && { chunkSize: parseInt(chunkSize) }),
      ...(provider && { specificProvider: provider })
    };

    console.log(`  → Starting batch translation...`);
    const results = await Promise.all(
      texts.map(async (text, index) => {
        console.log(`    [${index + 1}/${texts.length}] Translating: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        const result = await translator.translate(text, options);
        console.log(`    [${index + 1}/${texts.length}] ✓ Done with ${result.provider}`);
        return result;
      })
    );
    const duration = Date.now() - startTime;

    console.log(`  ✓ Batch translation completed in ${duration}ms`);
    console.log(`  → Total texts: ${results.length}`);
    console.log(`  → Total chunks: ${results.reduce((sum, r) => sum + r.chunks, 0)}`);

    res.json({
      success: true,
      results
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`  ✗ Batch translation failed after ${duration}ms:`, error.message);
    res.status(500).json({ 
      error: error.message || 'Batch translation failed',
      success: false
    });
  }
});

// Reset providers endpoint
app.post('/providers/reset', (req: Request, res: Response) => {
  console.log(`\n[${new Date().toISOString()}] POST /providers/reset`);
  translator.resetProviders();
  const providers = translator.getAvailableProviders();
  console.log(`  ✓ Providers reset successfully`);
  console.log(`  → Available providers: ${providers.join(', ')}`);
  res.json({ 
    success: true,
    message: 'Providers reset successfully',
    providers
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Translation API server running on http://localhost:${PORT}`);
  console.log(`📝 Available providers: ${translator.getAvailableProviders().join(', ')}`);
  console.log('\nEndpoints:');
  console.log(`  GET  /health           - Health check`);
  console.log(`  GET  /providers        - List available providers`);
  console.log(`  GET  /providers/all    - List all providers with status`);
  console.log(`  POST /translate        - Translate text`);
  console.log(`  POST /translate/batch  - Batch translate multiple texts`);
  console.log(`  POST /providers/reset  - Reset providers`);
});

export default app;
