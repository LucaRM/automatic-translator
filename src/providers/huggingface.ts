import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class HuggingFaceProvider implements AIProvider {
  public name = 'HuggingFace';
  private apiKey?: string;
  private available = true;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    try {
      const source = options.sourceLanguage || 'en';
      const target = options.targetLanguage;
      
      // Construct model name dynamically
      const model = `Helsinki-NLP/opus-mt-${source}-${target}`;
      
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        { inputs: text },
        {
          headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
          timeout: 10000
        }
      );

      if (response.data && response.data[0] && response.data[0].translation_text) {
        return response.data[0].translation_text;
      }

      throw new TranslationError('Invalid response from HuggingFace', ErrorType.API_ERROR, this.name);
    } catch (error: any) {
      if (error.response?.status === 410) {
        this.available = false;
        throw new TranslationError('Model endpoint no longer available (requires API key)', ErrorType.API_ERROR, this.name);
      }
      if (error.response?.status === 429) {
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
