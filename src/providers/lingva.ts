import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class LingvaProvider implements AIProvider {
  public name = 'Lingva';
  private apiUrls: string[];
  private currentUrlIndex = 0;
  private available = true;

  constructor(apiUrl?: string) {
    this.apiUrls = apiUrl ? [apiUrl] : [
      'https://lingva.ml/api/v1',
      'https://translate.igna.rocks/api/v1',
      'https://translate.plausibility.cloud/api/v1'
    ];
  }

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    const source = options.sourceLanguage || 'auto';
    const target = options.targetLanguage;
    
    try {
      // Try each Lingva instance
      for (let i = 0; i < this.apiUrls.length; i++) {
        try {
          const apiUrl = this.apiUrls[(this.currentUrlIndex + i) % this.apiUrls.length];
          const response = await axios.get(
            `${apiUrl}/${source}/${target}/${encodeURIComponent(text)}`,
            {
              timeout: 10000,
              headers: {
                'User-Agent': 'Mozilla/5.0'
              }
            }
          );

          if (response.data && response.data.translation) {
            this.currentUrlIndex = (this.currentUrlIndex + i) % this.apiUrls.length;
            return response.data.translation;
          }
        } catch (err) {
          // Try next instance
          if (i === this.apiUrls.length - 1) {
            throw err; // Last attempt, throw error
          }
        }
      }
      
      throw new TranslationError('All Lingva instances failed', ErrorType.API_ERROR, this.name);
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
