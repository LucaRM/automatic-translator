import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class DeepLProvider implements AIProvider {
  public name = 'DeepL';
  private apiKey?: string;
  private useFreeApi: boolean;
  private available = true;

  constructor(apiKey?: string, useFreeApi: boolean = true) {
    this.apiKey = apiKey;
    this.useFreeApi = useFreeApi;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    if (!this.apiKey) {
      throw new TranslationError('DeepL API key is required', ErrorType.API_ERROR, this.name);
    }

    try {
      const baseUrl = this.useFreeApi 
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate';

      const response = await axios.post(
        baseUrl,
        new URLSearchParams({
          text: text,
          target_lang: options.targetLanguage.toUpperCase(),
          ...(options.sourceLanguage && { source_lang: options.sourceLanguage.toUpperCase() })
        }),
        {
          headers: {
            'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      if (response.data?.translations?.[0]?.text) {
        return response.data.translations[0].text;
      }

      throw new TranslationError('Invalid response from DeepL', ErrorType.API_ERROR, this.name);
    } catch (error: any) {
      if (error.response?.status === 429 || error.response?.status === 456) {
        this.available = false;
        throw new TranslationError('Rate limit exceeded', ErrorType.RATE_LIMIT, this.name);
      }
      if (error.response?.status === 403) {
        throw new TranslationError('Invalid API key', ErrorType.API_ERROR, this.name);
      }
      throw new TranslationError(
        error.message || 'Translation failed',
        ErrorType.API_ERROR,
        this.name
      );
    }
  }
}
