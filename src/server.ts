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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize providers based on available API keys
function initializeProviders(): AIProvider[] {
  const providers: AIProvider[] = [
    new MyMemoryProvider(),
    new LibreTranslateProvider(),
    new HuggingFaceProvider(process.env.HUGGINGFACE_API_KEY),
    new LingvaProvider(),
    new GoogleTranslateProvider(),
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
  res.json({ 
    status: 'ok', 
    providers: translator.getAvailableProviders(),
    timestamp: new Date().toISOString()
  });
});

// Get available providers
app.get('/providers', (req: Request, res: Response) => {
  res.json({ 
    providers: translator.getAvailableProviders()
  });
});

// Get all providers with status
app.get('/providers/all', (req: Request, res: Response) => {
  const allProviders = translator.getAllProvidersInfo();
  res.json({ 
    providers: allProviders,
    total: allProviders.length,
    available: allProviders.filter(p => p.available).length
  });
});

// Translation endpoint
app.post('/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage, sourceLanguage, chunkSize, provider } = req.body;

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Text is required and must be a string' 
      });
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
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

    const result = await translator.translate(text, options);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      error: error.message || 'Translation failed',
      success: false
    });
  }
});

// Batch translation endpoint
app.post('/translate/batch', async (req: Request, res: Response) => {
  try {
    const { texts, targetLanguage, sourceLanguage, chunkSize, provider } = req.body;

    // Validation
    if (!Array.isArray(texts)) {
      return res.status(400).json({ 
        error: 'texts must be an array of strings' 
      });
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
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

    const results = await Promise.all(
      texts.map(text => translator.translate(text, options))
    );

    res.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error('Batch translation error:', error);
    res.status(500).json({ 
      error: error.message || 'Batch translation failed',
      success: false
    });
  }
});

// Reset providers endpoint
app.post('/providers/reset', (req: Request, res: Response) => {
  translator.resetProviders();
  res.json({ 
    success: true,
    message: 'Providers reset successfully',
    providers: translator.getAvailableProviders()
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
