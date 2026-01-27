import { AIProvider, TranslationOptions, TranslationResult, TranslationError, ErrorType } from './types';
import { chunkText } from './utils/chunker';
import { HuggingFaceProvider } from './providers/huggingface';
import { LibreTranslateProvider } from './providers/libretranslate';
import { MyMemoryProvider } from './providers/mymemory';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GroqProvider } from './providers/groq';
import { DeepLProvider } from './providers/deepl';
import { LingvaProvider } from './providers/lingva';
import { GoogleTranslateProvider } from './providers/googletranslate';
import { YandexProvider } from './providers/yandex';
import { ReversoProvider } from './providers/reverso';
import { PapagoProvider } from './providers/papago';

export class AutomaticTranslator {
  private providers: AIProvider[];
  private currentProviderIndex = 0;

  constructor(providers?: AIProvider[]) {
    this.providers = providers || [
      new GoogleTranslateProvider(),
      new ReversoProvider(),
      new PapagoProvider(),
      new MyMemoryProvider(),
      new LibreTranslateProvider(),
      new LingvaProvider(),
      new HuggingFaceProvider(),
      new YandexProvider()
      // Note: AI model providers (Gemini, OpenAI, Anthropic, Groq, DeepL) require API keys
      // Add them manually: new GeminiProvider(apiKey), new OpenAIProvider(apiKey), etc.
    ];
  }

  /**
   * Add a custom AI provider to the translator
   * @param provider - The AI provider to add
   */
  addProvider(provider: AIProvider): void {
    this.providers.push(provider);
  }

  /**
   * Translate a text string using available AI providers with automatic fallback
   * @param text - The text to translate
   * @param options - Translation options (target language, source language, chunk size, specific provider)
   * @returns Translation result with translated text, provider used, and chunk count
   */
  async translate(text: string, options: TranslationOptions): Promise<TranslationResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text to translate cannot be empty');
    }

    if (!options.targetLanguage) {
      throw new Error('Target language must be specified');
    }

    const chunkSize = options.chunkSize || 300;
    const chunks = chunkText(text, chunkSize);

    console.log(`    \u2192 Chunking: Split into ${chunks.length} chunk(s)`);
    chunks.forEach((chunk, i) => {
      console.log(`      [Chunk ${i + 1}] ${chunk.length} chars: "${chunk.substring(0, 40)}${chunk.length > 40 ? '...' : ''}"`);
    });

    let translatedChunks: string[] = [];
    let usedProvider: string = '';

    // If specific provider is requested, use only that provider
    if (options.specificProvider) {
      console.log(`    \u2192 Using specific provider: ${options.specificProvider}`);
      const provider = this.providers.find(
        p => p.name.toLowerCase() === options.specificProvider!.toLowerCase()
      );

      if (!provider) {
        throw new Error(`Provider "${options.specificProvider}" not found. Available providers: ${this.providers.map(p => p.name).join(', ')}`);
      }

      if (!provider.isAvailable()) {
        throw new Error(`Provider "${options.specificProvider}" is currently unavailable (rate limit may have been reached)`);
      }

      // Translate all chunks with the specific provider
      for (const chunk of chunks) {
        try {
          console.log(`    \u2192 Translating chunk with ${provider.name}...`);
          const result = await provider.translate(chunk, options);
          translatedChunks.push(result);
          usedProvider = provider.name;
          console.log(`    \u2713 Chunk translated successfully`);
        } catch (error) {
          if (error instanceof TranslationError && error.type === ErrorType.RATE_LIMIT) {
            console.log(`    \u2717 ${provider.name} rate limit exceeded`);
            throw new Error(`Provider "${options.specificProvider}" rate limit exceeded`);
          }
          throw error;
        }
      }

      return {
        translatedText: translatedChunks.join(' '),
        provider: usedProvider,
        chunks: chunks.length
      };
    }

    // Original fallback logic for automatic provider switching
    console.log(`    📋 Available providers: ${this.providers.filter(p => p.isAvailable()).map(p => p.name).join(', ')}`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let translated = false;
      let attemptedProviders: string[] = [];
      let errorDetails: string[] = [];

      console.log(`    \u2192 Processing chunk ${i + 1}/${chunks.length}...`);

      // Try each provider in order until one succeeds
      for (let providerAttempt = 0; providerAttempt < this.providers.length; providerAttempt++) {
        const provider = this.providers[this.currentProviderIndex];
        attemptedProviders.push(provider.name);

        if (!provider.isAvailable()) {
          console.log(`      \u21BB Skipping ${provider.name} (marked as unavailable)`);
          errorDetails.push(`${provider.name}: unavailable`);
          this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
          continue;
        }

        try {
          console.log(`      \u2192 Trying ${provider.name}...`);
          const result = await provider.translate(chunk, options);
          translatedChunks.push(result);
          usedProvider = provider.name;
          translated = true;
          console.log(`      \u2713 Success with ${provider.name}`);
          break;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          
          if (error instanceof TranslationError && error.type === ErrorType.RATE_LIMIT) {
            // Rate limit hit, move to next provider
            console.log(`      \u2717 ${provider.name} rate limit hit, trying next provider...`);
            errorDetails.push(`${provider.name}: rate limit`);
            this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
            continue;
          }
          
          // Other errors, try next provider
          console.log(`      \u2717 ${provider.name} failed: ${errorMsg}`);
          errorDetails.push(`${provider.name}: ${errorMsg}`);
          this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
        }
      }

      if (!translated) {
        console.log(`    \u2717 All ${attemptedProviders.length} providers failed for chunk ${i + 1}`);
        console.log(`    \uD83D\uDCDD Error details: ${errorDetails.join(' | ')}`);
        throw new Error(`All AI providers failed or are unavailable. Attempted: ${attemptedProviders.join(', ')}. Details: ${errorDetails.join('; ')}`);
      }
    }

    return {
      translatedText: translatedChunks.join(' '),
      provider: usedProvider,
      chunks: chunks.length
    };
  }

  /**
   * Reset all providers to available state
   */
  resetProviders(): void {
    this.currentProviderIndex = 0;
    // Note: Individual providers maintain their own availability state
    // This just resets the index to start from the beginning
  }

  /**
   * Get the list of available providers
   * @returns Array of provider names that are currently available
   */
  getAvailableProviders(): string[] {
    return this.providers
      .filter(p => p.isAvailable())
      .map(p => p.name);
  }

  /**
   * Get detailed information about all providers
   * @returns Array of provider objects with name and availability status
   */
  getAllProvidersInfo(): Array<{ name: string; available: boolean }> {
    return this.providers.map(p => ({
      name: p.name,
      available: p.isAvailable()
    }));
  }
}
