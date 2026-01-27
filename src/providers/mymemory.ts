import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class MyMemoryProvider implements AIProvider {
  public name = 'MyMemory';
  private available = true;

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    try {
      const langPair = `${options.sourceLanguage || 'en'}|${options.targetLanguage}`;
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair: langPair
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      // Check for rate limit in response status
      if (response.data?.responseStatus === 429) {
        this.available = false;
        throw new TranslationError('Rate limit exceeded', ErrorType.RATE_LIMIT, this.name);
      }

      if (response.data && response.data.responseData && response.data.responseData.translatedText) {
        const translated = response.data.responseData.translatedText;
        // Check for error responses in the translated text
        if (translated && translated.includes('MYMEMORY WARNING')) {
          this.available = false;
          throw new TranslationError('Rate limit exceeded', ErrorType.RATE_LIMIT, this.name);
        }
        if (translated) {
          return translated;
        }
      }

      throw new TranslationError('Invalid response from MyMemory', ErrorType.API_ERROR, this.name);
    } catch (error: any) {
      if (error instanceof TranslationError) {
        throw error;
      }
      if (error.response?.status === 429 || error.response?.data?.responseStatus === 429) {
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
