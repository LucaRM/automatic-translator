import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class GoogleTranslateProvider implements AIProvider {
  public name = 'GoogleTranslate';
  private available = true;

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    try {
      const source = options.sourceLanguage || 'auto';
      const target = options.targetLanguage;
      
      // Using Google Translate web scraping endpoint
      const url = `https://translate.google.com/m?tl=${target}&sl=${source}&q=${encodeURIComponent(text)}`;
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // Parse HTML response
      const match = response.data.match(/<div class="result-container">([^<]+)<\/div>/);
      if (match && match[1]) {
        return match[1].trim();
      }

      // Fallback: Try JSON API
      const jsonResponse = await axios.get(
        'https://translate.googleapis.com/translate_a/single',
        {
          params: {
            client: 'gtx',
            sl: source,
            tl: target,
            dt: 't',
            q: text
          },
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          validateStatus: () => true
        }
      );

      if (jsonResponse.data && Array.isArray(jsonResponse.data) && jsonResponse.data[0]) {
        const translations = jsonResponse.data[0]
          .filter((item: any) => item && item[0])
          .map((item: any) => item[0]);
        
        if (translations.length > 0) {
          return translations.join('');
        }
      }

      throw new TranslationError('Invalid response from Google Translate', ErrorType.API_ERROR, this.name);
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
