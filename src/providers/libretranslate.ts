import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class LibreTranslateProvider implements AIProvider {
  public name = 'LibreTranslate';
  private apiUrls: string[];
  private currentUrlIndex = 0;
  private apiKey?: string;
  private available = true;

  constructor(apiUrl?: string, apiKey?: string) {
    // Use provided URL or fallback to free public instances
    this.apiUrls = apiUrl ? [apiUrl] : [
      'https://translate.fedilab.app/translate',
      'https://libretranslate.de/translate',
      'https://translate.argosopentech.com/translate'
    ];
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    // Try each LibreTranslate instance
    for (let i = 0; i < this.apiUrls.length; i++) {
      try {
        const apiUrl = this.apiUrls[(this.currentUrlIndex + i) % this.apiUrls.length];
        const response = await axios.post(
          apiUrl,
          {
            q: text,
            source: options.sourceLanguage || 'auto',
            target: options.targetLanguage,
            ...(this.apiKey && { api_key: this.apiKey })
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );

        if (response.data && response.data.translatedText) {
          this.currentUrlIndex = (this.currentUrlIndex + i) % this.apiUrls.length;
          return response.data.translatedText;
        }

        // Check for API key requirement error
        if (response.data && response.data.error) {
          if (response.data.error.includes('API key')) {
            // This instance requires API key, try next one
            continue;
          }
        }
      } catch (err: any) {
        // If it's the last instance, handle the error
        if (i === this.apiUrls.length - 1) {
          if (err instanceof TranslationError) {
            throw err;
          }
          // Check for API key requirement in error response
          if (err.response?.data?.error?.includes('API key')) {
            this.available = false;
            throw new TranslationError('All LibreTranslate instances require API key', ErrorType.API_ERROR, this.name);
          }
          if (err.response?.status === 429 || err.response?.data?.error?.includes('limit')) {
            this.available = false;
            throw new TranslationError('Rate limit exceeded', ErrorType.RATE_LIMIT, this.name);
          }
          throw new TranslationError(
            err.message || 'Translation failed',
            ErrorType.API_ERROR,
            this.name);
        }
        // Try next instance
        continue;
      }
    }

    throw new TranslationError('All LibreTranslate instances failed', ErrorType.API_ERROR, this.name);
  }
}
