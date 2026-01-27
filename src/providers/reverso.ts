import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class ReversoProvider implements AIProvider {
  public name = 'Reverso';
  private available = true;

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    try {
      const source = options.sourceLanguage || 'eng';
      const target = this.mapLanguageCode(options.targetLanguage);
      const sourceCode = this.mapLanguageCode(source);
      
      const response = await axios.post(
        'https://api.reverso.net/translate/v1/translation',
        {
          input: text,
          from: sourceCode,
          to: target,
          format: 'text',
          options: {
            origin: 'translation.web',
            sentenceSplitter: true,
            contextResults: false
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        }
      );

      if (response.data && response.data.translation && response.data.translation[0]) {
        return response.data.translation[0];
      }

      throw new TranslationError('Invalid response from Reverso', ErrorType.API_ERROR, this.name);
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

  private mapLanguageCode(code: string): string {
    const map: { [key: string]: string } = {
      'en': 'eng',
      'es': 'spa',
      'fr': 'fra',
      'de': 'ger',
      'it': 'ita',
      'pt': 'por',
      'pt-BR': 'por',
      'ru': 'rus',
      'zh': 'chi',
      'ja': 'jpn',
      'ar': 'ara',
      'nl': 'dut',
      'pl': 'pol',
      'tr': 'tur',
      'he': 'heb'
    };
    return map[code] || code;
  }
}
