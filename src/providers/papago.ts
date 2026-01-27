import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class PapagoProvider implements AIProvider {
  public name = 'Papago';
  private available = true;

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    try {
      const source = options.sourceLanguage || 'auto';
      const target = options.targetLanguage;
      
      // Using Papago via web endpoint
      const response = await axios.post(
        'https://papago.naver.com/apis/n2mt/translate',
        new URLSearchParams({
          source: source === 'auto' ? 'auto' : this.mapLanguageCode(source),
          target: this.mapLanguageCode(target),
          text: text
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://papago.naver.com/'
          },
          timeout: 15000
        }
      );

      if (response.data && response.data.translatedText) {
        return response.data.translatedText;
      }

      throw new TranslationError('Invalid response from Papago', ErrorType.API_ERROR, this.name);
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
      'en': 'en',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'pt': 'pt',
      'pt-BR': 'pt',
      'ru': 'ru',
      'zh': 'zh-CN',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'ja': 'ja',
      'ko': 'ko',
      'vi': 'vi',
      'th': 'th',
      'id': 'id'
    };
    return map[code] || code;
  }
}
