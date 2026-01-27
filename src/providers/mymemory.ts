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
        timeout: 10000
      });

      if (response.data && response.data.responseData && response.data.responseData.translatedText) {
        return response.data.responseData.translatedText;
      }

      throw new TranslationError('Invalid response from MyMemory', ErrorType.API_ERROR, this.name);
    } catch (error: any) {
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
