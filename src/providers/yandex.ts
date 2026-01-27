import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class YandexProvider implements AIProvider {
  public name = 'Yandex';
  private available = true;

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    try {
      const source = options.sourceLanguage || '';
      const target = options.targetLanguage;
      const langPair = source ? `${source}-${target}` : target;
      
      // Using Yandex Translate unofficial endpoint (free)
      const response = await axios.post(
        'https://translate.yandex.net/api/v1/tr.json/translate',
        new URLSearchParams({
          text: text,
          lang: langPair
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.text && Array.isArray(response.data.text)) {
        return response.data.text.join(' ');
      }

      throw new TranslationError('Invalid response from Yandex', ErrorType.API_ERROR, this.name);
    } catch (error: any) {
      if (error.response?.status === 429) {
        this.available = false;
        throw new TranslationError('Rate limit exceeded', ErrorType.RATE_LIMIT, this.name);
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new TranslationError('Request timeout', ErrorType.NETWORK_ERROR, this.name);
      }
      throw new TranslationError(
        error.message || 'Translation failed',
        ErrorType.API_ERROR,
        this.name
      );
    }
  }
}
