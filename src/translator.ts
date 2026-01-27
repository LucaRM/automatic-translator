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

export class AutomaticTranslator {
  private providers: AIProvider[];
  private currentProviderIndex = 0;

  constructor(providers?: AIProvider[]) {
    this.providers = providers || [
      new MyMemoryProvider(),
      new LibreTranslateProvider(),
      new HuggingFaceProvider(),
      new LingvaProvider(),
      new GoogleTranslateProvider(),
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

    let translatedChunks: string[] = [];
    let usedProvider: string = '';

    // If specific provider is requested, use only that provider
    if (options.specificProvider) {
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
          const result = await provider.translate(chunk, options);
          translatedChunks.push(result);
          usedProvider = provider.name;
        } catch (error) {
          if (error instanceof TranslationError && error.type === ErrorType.RATE_LIMIT) {
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
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let translated = false;

      // Try each provider in order until one succeeds
      for (let providerAttempt = 0; providerAttempt < this.providers.length; providerAttempt++) {
        const provider = this.providers[this.currentProviderIndex];

        if (!provider.isAvailable()) {
          this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
          continue;
        }

        try {
          const result = await provider.translate(chunk, options);
          translatedChunks.push(result);
          usedProvider = provider.name;
          translated = true;
          break;
        } catch (error) {
          if (error instanceof TranslationError && error.type === ErrorType.RATE_LIMIT) {
            // Rate limit hit, move to next provider
            this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
            continue;
          }
          
          // Other errors, try next provider
          this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
        }
      }

      if (!translated) {
        throw new Error('All AI providers failed or are unavailable');
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
