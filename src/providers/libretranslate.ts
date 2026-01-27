import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class LibreTranslateProvider implements AIProvider {
  public name = 'LibreTranslate';
  private apiUrl: string;
  private apiKey?: string;
  private available = true;

  constructor(apiUrl: string = 'https://libretranslate.de/translate', apiKey?: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          q: text,
          source: options.sourceLanguage || 'auto',
          target: options.targetLanguage,
          api_key: this.apiKey
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      if (response.data && response.data.translatedText) {
        return response.data.translatedText;
      }

      throw new TranslationError('Invalid response from LibreTranslate', ErrorType.API_ERROR, this.name);
    } catch (error: any) {
      if (error.response?.status === 429 || error.response?.data?.error?.includes('limit')) {
        this.available = false;
        throw new TranslationError('Rate limit exceeded', ErrorType.RATE_LIMIT, this.name);
      }
      throw new TranslationError(
        error.message || 'Translation failed',
        ErrorType.API_ERROR,
        this.name
      );
    }
  }
}
