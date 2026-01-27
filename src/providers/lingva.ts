import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class LingvaProvider implements AIProvider {
  public name = 'Lingva';
  private apiUrl: string;
  private available = true;

  constructor(apiUrl: string = 'https://lingva.ml/api/v1') {
    this.apiUrl = apiUrl;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    try {
      const source = options.sourceLanguage || 'auto';
      const target = options.targetLanguage;
      
      const response = await axios.get(
        `${this.apiUrl}/${source}/${target}/${encodeURIComponent(text)}`,
        {
          timeout: 10000
        }
      );

      if (response.data && response.data.translation) {
        return response.data.translation;
      }

      throw new TranslationError('Invalid response from Lingva', ErrorType.API_ERROR, this.name);
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
